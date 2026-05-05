import React, { useEffect, useState } from 'react';
import { StepForward, FastForward, Play, Pause } from 'lucide-react';

export default function ControlPanel({ step, cycle, phase, logs }) {
  const [autoRun, setAutoRun] = useState(false);

  useEffect(() => {
    let interval;
    if (autoRun) {
      interval = setInterval(() => {
        step();
      }, 500); // 500ms per step
    }
    return () => clearInterval(interval);
  }, [autoRun, step]);

  const handleRunPause = () => setAutoRun(!autoRun);

  return (
    <div className="panel" style={{ gridArea: '2 / 1 / 3 / 3', display: 'flex', flexDirection: 'row' }}>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>
        <div className="panel-header">Controls (Cycle: {cycle})</div>
        <div className="panel-content" style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={step} disabled={autoRun || phase === 'HALTED'}>
            <StepForward size={16} /> Step Phase
          </button>
          <button onClick={() => { step(); step(); step(); step(); step(); }} disabled={autoRun || phase === 'HALTED'}>
            <FastForward size={16} /> Step Cycle
          </button>
          <button className={autoRun ? 'primary' : ''} onClick={handleRunPause} disabled={phase === 'HALTED'}>
            {autoRun ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Auto Run</>}
          </button>
        </div>
      </div>

      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header">Execution Logs</div>
        <div className="panel-content" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column-reverse' }}>
          <div>
            {logs.slice(-20).map((log, i) => (
              <div key={i} className="log-entry">{log}</div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
