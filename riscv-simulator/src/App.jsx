import React from 'react';
import { Cpu } from 'lucide-react';
import { useCPU } from './hooks/useCPU';
import CodeEditor from './components/CodeEditor';
import Registers from './components/Registers';
import Memory from './components/Memory';
import Datapath from './components/Datapath';
import ControlPanel from './components/ControlPanel';
import './index.css';

export default function App() {
  const {
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
    readWord
  } = useCPU();

  return (
    <div id="root">
      <header className="header">
        <h1><Cpu size={24} color="var(--accent)" /> System Simulation</h1>
        <div className="controls">
          <span style={{ color: 'var(--text-muted)' }}>Status: {phase}</span>
        </div>
      </header>

      <main className="main-layout">
        <CodeEditor onLoad={loadCode} onReset={reset} />
        <Datapath phase={phase} pc={pc} currentInst={currentInst} />
        <Registers registers={registers} phase={phase} currentInst={currentInst} />
        <ControlPanel step={step} cycle={cycle} phase={phase} logs={logs} />
        <Memory memory={memory} readWord={readWord} />
      </main>
    </div>
  );
}
