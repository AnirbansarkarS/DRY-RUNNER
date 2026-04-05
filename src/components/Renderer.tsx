import React from 'react';
import { type StepInfo } from '../core/Interpreter';

interface RendererProps {
  step: StepInfo | null;
}

export const Renderer: React.FC<RendererProps> = ({ step }) => {
  if (!step) {
    return <div style={{ padding: '1rem', color: '#888' }}>No step to render. Run the engine first.</div>;
  }

  // Determine highlight color based on Interpreter output
  const getHighlightColor = (arrName: string, idx: number) => {
    if (!step.highlights.arr) return '';
    const { target, swap, compare } = step.highlights.arr;
    if (target && target.includes(idx)) return '#4caf50';    // Green for assignment target
    if (swap && swap.includes(idx)) return '#f44336';        // Red for swapping items
    if (compare && compare.includes(idx)) return '#2196f3';  // Blue for comparison check
    return '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: 'sans-serif' }}>
      
      {/* 1. Description Bar */}
      <div style={{ padding: '1rem', backgroundColor: '#3c3c3c', borderRadius: '4px', fontSize: '1.2rem', color: '#fff', borderLeft: '4px solid #4caf50' }}>
        <strong>Step {step.line}:</strong> {step.description}
      </div>

      <div style={{ display: 'flex', gap: '2rem' }}>
        
        {/* 2. Variables Table */}
        <div style={{ flex: 1, backgroundColor: '#1e1e1e', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#f8f8f2' }}>Variables</h3>
          {Object.keys(step.variables).length === 0 ? <p style={{color: '#888'}}>No variables</p> : (
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: '1.1rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #555' }}>
                  <th style={{ padding: '0.5rem', color: '#aaa' }}>Name</th>
                  <th style={{ padding: '0.5rem', color: '#aaa' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(step.variables).map(([key, val]) => (
                  <tr key={key} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '0.5rem', color: '#9cdcfe' }}>{key}</td>
                    <td style={{ padding: '0.5rem', color: '#b5cea8' }}>{JSON.stringify(val)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 3. Array Grids with Colored Cells */}
        <div style={{ flex: 2, backgroundColor: '#1e1e1e', padding: '1.5rem', borderRadius: '8px' }}>
          <h3 style={{ marginTop: 0, color: '#f8f8f2' }}>Arrays</h3>
          {Object.keys(step.arrays).length === 0 ? <p style={{color: '#888'}}>No arrays</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {Object.entries(step.arrays).map(([key, arr]) => (
                <div key={key}>
                  <div style={{ marginBottom: '0.5rem', color: '#9cdcfe', fontWeight: 'bold', fontFamily: 'monospace' }}>{key} = </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {arr.map((val, idx) => (
                      <div 
                        key={idx}
                        style={{
                          width: '50px', height: '50px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: getHighlightColor(key, idx) || '#2d2d2d',
                          border: '2px solid #555',
                          borderRadius: '6px',
                          color: '#dcdcaa',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          transition: 'background-color 0.3s ease'
                        }}
                      >
                        {JSON.stringify(val)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 4. Call Stack Frames */}
      <div style={{ backgroundColor: '#1e1e1e', padding: '1.5rem', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, color: '#f8f8f2' }}>Call Stack</h3>
        {!step.stack || step.stack.length === 0 ? <p style={{color: '#888'}}>Empty</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'monospace' }}>
            {step.stack.map((frame, i) => (
              <div key={i} style={{ padding: '0.75rem', backgroundColor: '#333', borderRadius: '4px', borderLeft: '3px solid #ce9178', color: '#ce9178' }}>
                {JSON.stringify(frame)}
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};
