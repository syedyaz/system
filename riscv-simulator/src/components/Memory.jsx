import React, { useMemo } from 'react';

export default function Memory({ memory, readWord }) {
  // Only show first few memory locations that have non-zero data or are low addresses
  const memoryRows = useMemo(() => {
    const rows = [];
    for (let addr = 0; addr < 100; addr += 4) {
      const val = readWord(addr);
      // To save space, let's just show the first 25 words (100 bytes)
      rows.push({ addr, val });
    }
    return rows;
  }, [memory, readWord]);

  return (
    <div className="panel" style={{ gridArea: '2 / 3 / 3 / 4' }}>
      <div className="panel-header">Memory Data (First 100 Bytes)</div>
      <div className="panel-content">
        <div className="memory-grid">
          {memoryRows.map((row) => (
            <div key={row.addr} className="memory-row">
              <span className="mem-addr">0x{row.addr.toString(16).padStart(4, '0')}</span>
              <span className="mem-val">{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
