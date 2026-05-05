// RISC-V Assembler and Decoder Logic
// Supports a subset of RV32I: ADD, SUB, AND, OR, ADDI, LW, SW, BEQ, JAL

export const REGISTERS = Array.from({ length: 32 }, (_, i) => `x${i}`);

const parseRegister = (regStr) => {
  if (!regStr) return 0;
  regStr = regStr.replace(',', '').trim();
  if (regStr.startsWith('x')) {
    return parseInt(regStr.substring(1), 10);
  }
  return 0; // fallback
};

export const assemble = (sourceCode) => {
  const lines = sourceCode.split('\n');
  const memory = new Uint8Array(4096); // 4KB memory
  let address = 0;
  const labels = {};
  
  // First pass: find labels
  lines.forEach((line) => {
    line = line.split('#')[0].trim(); // remove comments
    if (line.includes(':')) {
      const parts = line.split(':');
      labels[parts[0].trim()] = address;
      line = parts[1].trim();
    }
    if (line.length > 0) {
      address += 4;
    }
  });

  address = 0;
  const errors = [];

  // Second pass: assemble
  lines.forEach((line, lineIndex) => {
    line = line.split('#')[0].trim();
    if (line.includes(':')) {
      line = line.split(':')[1].trim();
    }
    if (line.length === 0) return;

    const parts = line.split(/\s+/);
    const inst = parts[0].toUpperCase();
    let rd = 0, rs1 = 0, rs2 = 0, imm = 0;
    let machineCode = 0;

    try {
      if (['ADD', 'SUB', 'AND', 'OR'].includes(inst)) {
        // R-type: opcode, rd, rs1, rs2
        const args = parts.slice(1).join('').split(',');
        rd = parseRegister(args[0]);
        rs1 = parseRegister(args[1]);
        rs2 = parseRegister(args[2]);
        let funct3 = 0, funct7 = 0;
        if (inst === 'ADD') { funct3 = 0; funct7 = 0; }
        if (inst === 'SUB') { funct3 = 0; funct7 = 32; }
        if (inst === 'AND') { funct3 = 7; funct7 = 0; }
        if (inst === 'OR') { funct3 = 6; funct7 = 0; }
        
        machineCode = 51 | (rd << 7) | (funct3 << 12) | (rs1 << 15) | (rs2 << 20) | (funct7 << 25);
      } 
      else if (inst === 'ADDI') {
        // I-type: opcode, rd, rs1, imm
        const args = parts.slice(1).join('').split(',');
        rd = parseRegister(args[0]);
        rs1 = parseRegister(args[1]);
        imm = parseInt(args[2], 10);
        machineCode = 19 | (rd << 7) | (0 << 12) | (rs1 << 15) | ((imm & 0xFFF) << 20);
      }
      else if (inst === 'LW') {
        // I-type: LW rd, imm(rs1)
        const args = parts.slice(1).join('').split(',');
        rd = parseRegister(args[0]);
        const memPart = args[1].split('(');
        imm = parseInt(memPart[0], 10);
        rs1 = parseRegister(memPart[1].replace(')', ''));
        machineCode = 3 | (rd << 7) | (2 << 12) | (rs1 << 15) | ((imm & 0xFFF) << 20);
      }
      else if (inst === 'SW') {
        // S-type: SW rs2, imm(rs1)
        const args = parts.slice(1).join('').split(',');
        rs2 = parseRegister(args[0]);
        const memPart = args[1].split('(');
        imm = parseInt(memPart[0], 10);
        rs1 = parseRegister(memPart[1].replace(')', ''));
        const imm5 = imm & 0x1F;
        const imm7 = (imm >> 5) & 0x7F;
        machineCode = 35 | (imm5 << 7) | (2 << 12) | (rs1 << 15) | (rs2 << 20) | (imm7 << 25);
      }
      else if (inst === 'BEQ') {
        // B-type: BEQ rs1, rs2, label/offset
        const args = parts.slice(1).join('').split(',');
        rs1 = parseRegister(args[0]);
        rs2 = parseRegister(args[1]);
        let offset = 0;
        if (labels[args[2]] !== undefined) {
          offset = labels[args[2]] - address;
        } else {
          offset = parseInt(args[2], 10);
        }
        const imm11 = (offset >> 11) & 1;
        const imm4_1 = (offset >> 1) & 0xF;
        const imm10_5 = (offset >> 5) & 0x3F;
        const imm12 = (offset >> 12) & 1;
        machineCode = 99 | (imm11 << 7) | (imm4_1 << 8) | (0 << 12) | (rs1 << 15) | (rs2 << 20) | (imm10_5 << 25) | (imm12 << 31);
      }
      else if (inst === 'JAL') {
        // J-type: JAL rd, label/offset
        const args = parts.slice(1).join('').split(',');
        rd = parseRegister(args[0]);
        let offset = 0;
        if (labels[args[1]] !== undefined) {
          offset = labels[args[1]] - address;
        } else {
          offset = parseInt(args[1], 10);
        }
        const imm19_12 = (offset >> 12) & 0xFF;
        const imm11 = (offset >> 11) & 1;
        const imm10_1 = (offset >> 1) & 0x3FF;
        const imm20 = (offset >> 20) & 1;
        machineCode = 111 | (rd << 7) | (imm19_12 << 12) | (imm11 << 20) | (imm10_1 << 21) | (imm20 << 31);
      } else {
        errors.push(`Line ${lineIndex + 1}: Unknown instruction '${inst}'`);
      }

      // Convert to unsigned 32-bit integer for memory storage
      machineCode = machineCode >>> 0; 
      
      memory[address] = machineCode & 0xFF;
      memory[address + 1] = (machineCode >> 8) & 0xFF;
      memory[address + 2] = (machineCode >> 16) & 0xFF;
      memory[address + 3] = (machineCode >> 24) & 0xFF;

    } catch (e) {
      errors.push(`Line ${lineIndex + 1}: Parsing error. Please check syntax.`);
    }

    address += 4;
  });

  return { memory, errors, instructionsCompiled: address / 4 };
};

export const decode = (machineCode) => {
  machineCode = machineCode >>> 0;
  if (machineCode === 0) return { name: 'NOP', raw: 'NOP' };

  const opcode = machineCode & 0x7F;
  const rd = (machineCode >> 7) & 0x1F;
  const funct3 = (machineCode >> 12) & 0x7;
  const rs1 = (machineCode >> 15) & 0x1F;
  const rs2 = (machineCode >> 20) & 0x1F;
  const funct7 = (machineCode >> 25) & 0x7F;

  let name = 'UNKNOWN';
  let raw = '';
  let imm = 0;

  if (opcode === 51) {
    if (funct3 === 0 && funct7 === 0) name = 'ADD';
    else if (funct3 === 0 && funct7 === 32) name = 'SUB';
    else if (funct3 === 7 && funct7 === 0) name = 'AND';
    else if (funct3 === 6 && funct7 === 0) name = 'OR';
    raw = `${name} x${rd}, x${rs1}, x${rs2}`;
  } 
  else if (opcode === 19 && funct3 === 0) {
    name = 'ADDI';
    imm = (machineCode >> 20); // sign extend automatically in JS bitwise ops? Actually right shift preserves sign if using >>.
    imm = machineCode >> 20; // Correct sign extension
    raw = `${name} x${rd}, x${rs1}, ${imm}`;
  }
  else if (opcode === 3 && funct3 === 2) {
    name = 'LW';
    imm = machineCode >> 20;
    raw = `${name} x${rd}, ${imm}(x${rs1})`;
  }
  else if (opcode === 35 && funct3 === 2) {
    name = 'SW';
    const imm5 = (machineCode >> 7) & 0x1F;
    const imm7 = machineCode >> 25; // sign extended
    imm = (imm7 << 5) | imm5;
    raw = `${name} x${rs2}, ${imm}(x${rs1})`;
  }
  else if (opcode === 99 && funct3 === 0) {
    name = 'BEQ';
    const imm11 = (machineCode >> 7) & 1;
    const imm4_1 = (machineCode >> 8) & 0xF;
    const imm10_5 = (machineCode >> 25) & 0x3F;
    const imm12 = machineCode >> 31; // sign extended
    imm = (imm12 << 12) | (imm11 << 11) | (imm10_5 << 5) | (imm4_1 << 1);
    raw = `${name} x${rs1}, x${rs2}, ${imm}`;
  }
  else if (opcode === 111) {
    name = 'JAL';
    const imm19_12 = (machineCode >> 12) & 0xFF;
    const imm11 = (machineCode >> 20) & 1;
    const imm10_1 = (machineCode >> 21) & 0x3FF;
    const imm20 = machineCode >> 31; // sign extended
    imm = (imm20 << 20) | (imm19_12 << 12) | (imm11 << 11) | (imm10_1 << 1);
    raw = `${name} x${rd}, ${imm}`;
  }

  return { opcode, name, rd, rs1, rs2, funct3, funct7, imm, raw };
};
