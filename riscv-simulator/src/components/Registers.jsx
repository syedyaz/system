import React from 'react';

export default function Registers({ registers, phase, currentInst }) {
  // Highlight the register being read or written based on phase
  const isReadReg = (idx) => {
    if (!currentInst) return false;
    if (phase === 'EXECUTE') {
      return idx === currentInst.rs1 || idx === currentInst.rs2;
    }
    return false;
  };

  const isWriteReg = (idx) => {
    if (!currentInst) return false;
    if (phase === 'WRITEBACK') {
      return idx === currentInst.rd && idx !== 0; // x0 is never written
    }
    return false;
  };

  return (
    <div className="panel" style={{ gridArea: '1 / 3 / 2 / 4' }}>
      <div className="panel-header">Registers</div>
      <div className="panel-content">
        <div className="registers-grid">
          {Array.from(registers).map((val, idx) => {
            const highlightClass = isReadReg(idx) || isWriteReg(idx) ? 'highlight' : '';
            return (
              <div key={idx} className={`register-item ${highlightClass}`}>
                <span className="reg-name">x{idx}</span>
                <span className="reg-val">{val}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
