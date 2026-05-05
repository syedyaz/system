import React from 'react';

export default function Datapath({ phase, pc, currentInst }) {
  const isPhase = (p) => phase === p;

  return (
    <div className="panel" style={{ gridArea: '1 / 2 / 2 / 3' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Datapath Visualization</span>
        {currentInst && (
          <span style={{ color: 'var(--accent)' }}>
            PC: 0x{pc.toString(16).padStart(4, '0')} | {currentInst.raw}
          </span>
        )}
      </div>
      <div className="panel-content datapath-container">
        
        <div className="phase-indicator">
          {['FETCH', 'DECODE', 'EXECUTE', 'MEMORY', 'WRITEBACK'].map((p) => (
            <div key={p} className={`phase-badge ${isPhase(p) ? 'active' : ''}`}>
              {p}
            </div>
          ))}
        </div>

        <div className="cpu-schematic">
          <div className={`cpu-component comp-pc ${isPhase('FETCH') ? 'active' : ''}`}>
            PC<br/>{pc}
          </div>
          <div className={`cpu-component comp-imem ${isPhase('FETCH') ? 'active' : ''}`}>
            Instr<br/>Memory
          </div>
          <div className={`cpu-component comp-control ${isPhase('DECODE') ? 'active' : ''}`}>
            Control Unit
          </div>
          <div className={`cpu-component comp-regs ${(isPhase('DECODE') || isPhase('WRITEBACK')) ? 'active' : ''}`}>
            Registers
          </div>
          <div className={`cpu-component comp-alu ${isPhase('EXECUTE') ? 'active' : ''}`}>
            ALU
          </div>
          <div className={`cpu-component comp-dmem ${isPhase('MEMORY') ? 'active' : ''}`}>
            Data<br/>Memory
          </div>

          {/* Simple connections (can be enhanced with SVG lines later) */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <line x1="15%" y1="50%" x2="20%" y2="50%" stroke="var(--border)" strokeWidth="2" />
            <line x1="36%" y1="50%" x2="40%" y2="50%" stroke="var(--border)" strokeWidth="2" />
            <line x1="56%" y1="50%" x2="65%" y2="50%" stroke="var(--border)" strokeWidth="2" />
            <line x1="78%" y1="50%" x2="85%" y2="50%" stroke="var(--border)" strokeWidth="2" />
            {/* Writeback line */}
            <path d="M 93% 90% L 93% 95% L 45% 95% L 45% 90%" fill="none" stroke="var(--border)" strokeWidth="2" />
          </svg>
        </div>

      </div>
    </div>
  );
}
