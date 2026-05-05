import React, { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';

export default function CodeEditor({ onLoad, onReset }) {
  const [code, setCode] = useState(`# Simple RISC-V Program
# Adds 5 and 10, stores in memory

ADDI x1, x0, 5    # Load 5 into x1
ADDI x2, x0, 10   # Load 10 into x2
ADD x3, x1, x2    # x3 = x1 + x2 (15)
SW x3, 0(x0)      # Store result at mem[0]
LW x4, 0(x0)      # Load from mem[0] to x4
BEQ x3, x4, end   # If x3 == x4 jump to end
ADDI x5, x0, 99   # Won't execute
end:
ADDI x5, x0, 1    # End indicator
`);

  const handleLoad = () => {
    onLoad(code);
  };

  return (
    <div className="panel" style={{ gridArea: '1 / 1 / 2 / 2' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Assembly Editor</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onReset} title="Reset CPU">
            <RotateCcw size={14} />
          </button>
          <button className="primary" onClick={handleLoad} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
            <Play size={14} /> Assemble
          </button>
        </div>
      </div>
      <div className="panel-content" style={{ padding: 0 }}>
        <textarea 
          className="editor" 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          spellCheck="false"
          style={{ padding: '1rem' }}
        />
      </div>
    </div>
  );
}
