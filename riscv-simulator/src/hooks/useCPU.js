import { useState, useCallback } from 'react';
import { assemble, decode } from '../utils/riscv';

export const PHASES = {
  FETCH: 'FETCH',
  DECODE: 'DECODE',
  EXECUTE: 'EXECUTE',
  MEMORY: 'MEMORY',
  WRITEBACK: 'WRITEBACK',
  HALTED: 'HALTED'
};

const MEMORY_SIZE = 4096;

export function useCPU() {
  const [registers, setRegisters] = useState(new Int32Array(32));
  const [memory, setMemory] = useState(new Uint8Array(MEMORY_SIZE));
  const [pc, setPc] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState(PHASES.FETCH);
  const [currentInst, setCurrentInst] = useState(null);
  const [aluResult, setAluResult] = useState(0);
  const [memData, setMemData] = useState(0);
  const [logs, setLogs] = useState([]);

  const log = (msg) => {
    setLogs(prev => [...prev, msg]);
  };

  const reset = useCallback(() => {
    setRegisters(new Int32Array(32));
    setMemory(new Uint8Array(MEMORY_SIZE));
    setPc(0);
    setCycle(0);
    setPhase(PHASES.FETCH);
    setCurrentInst(null);
    setAluResult(0);
    setMemData(0);
    setLogs([]);
  }, []);

  const loadCode = useCallback((code) => {
    reset();
    const result = assemble(code);
    if (result.errors.length > 0) {
      log(`Assembly Errors:\n${result.errors.join('\n')}`);
      return false;
    }
    setMemory(result.memory);
    log(`Loaded ${result.instructionsCompiled} instructions.`);
    return true;
  }, [reset]);

  const readWord = (addr) => {
    return (memory[addr] | (memory[addr+1] << 8) | (memory[addr+2] << 16) | (memory[addr+3] << 24));
  };

  const writeWord = (addr, val) => {
    const newMem = new Uint8Array(memory);
    newMem[addr] = val & 0xFF;
    newMem[addr+1] = (val >> 8) & 0xFF;
    newMem[addr+2] = (val >> 16) & 0xFF;
    newMem[addr+3] = (val >> 24) & 0xFF;
    setMemory(newMem);
  };

  const step = useCallback(() => {
    if (phase === PHASES.HALTED) return;

    if (phase === PHASES.FETCH) {
      // FETCH
      const machineCode = readWord(pc);
      if (machineCode === 0 && pc > 0) {
        setPhase(PHASES.HALTED);
        log("Halted: Reached empty memory.");
        return;
      }
      const decoded = decode(machineCode);
      setCurrentInst(decoded);
      log(`Cycle ${cycle}: Fetched [${decoded.raw}] at PC=${pc}`);
      setPc(pc + 4);
      setPhase(PHASES.DECODE);
    } 
    else if (phase === PHASES.DECODE) {
      // DECODE
      // In a real CPU, we read registers here. We'll do it functionally in execute.
      setPhase(PHASES.EXECUTE);
    }
    else if (phase === PHASES.EXECUTE) {
      // EXECUTE
      const { name, rs1, rs2, imm } = currentInst;
      const val1 = registers[rs1];
      const val2 = registers[rs2];
      let res = 0;

      switch(name) {
        case 'ADD': res = val1 + val2; break;
        case 'SUB': res = val1 - val2; break;
        case 'AND': res = val1 & val2; break;
        case 'OR': res = val1 | val2; break;
        case 'ADDI': res = val1 + imm; break;
        case 'LW':
        case 'SW': res = val1 + imm; break; // Calculate address
        case 'BEQ': 
          if (val1 === val2) {
            setPc(pc - 4 + imm); // -4 because PC already incremented in FETCH
            log(`Branch taken to PC=${pc - 4 + imm}`);
          }
          break;
        case 'JAL':
          res = pc; // Return address (PC is already PC+4)
          setPc(pc - 4 + imm);
          log(`Jumped to PC=${pc - 4 + imm}`);
          break;
        case 'NOP':
        case 'UNKNOWN':
          break;
      }
      setAluResult(res);
      setPhase(PHASES.MEMORY);
    }
    else if (phase === PHASES.MEMORY) {
      // MEMORY
      const { name, rs2 } = currentInst;
      let readData = 0;
      if (name === 'LW') {
        readData = readWord(aluResult);
        setMemData(readData);
        log(`Memory Read: ${readData} from address ${aluResult}`);
      } else if (name === 'SW') {
        writeWord(aluResult, registers[rs2]);
        log(`Memory Write: ${registers[rs2]} to address ${aluResult}`);
      }
      setPhase(PHASES.WRITEBACK);
    }
    else if (phase === PHASES.WRITEBACK) {
      // WRITEBACK
      const { name, rd } = currentInst;
      if (rd !== 0) { // x0 is hardwired to 0
        const newRegs = new Int32Array(registers);
        if (['ADD', 'SUB', 'AND', 'OR', 'ADDI', 'JAL'].includes(name)) {
          newRegs[rd] = aluResult;
          setRegisters(newRegs);
          log(`Writeback: Register x${rd} = ${aluResult}`);
        } else if (name === 'LW') {
          newRegs[rd] = memData;
          setRegisters(newRegs);
          log(`Writeback: Register x${rd} = ${memData}`);
        }
      }
      setCycle(cycle + 1);
      setPhase(PHASES.FETCH);
    }
  }, [phase, pc, memory, registers, currentInst, aluResult, memData, cycle, readWord, writeWord]);

  return {
    registers,
    memory,
    pc,
    cycle,
    phase,
    currentInst,
    logs,
    step,
    loadCode,
    reset,
    readWord // export for UI viewing
  };
}
