import React, { useState } from 'react';
import { Lexer } from '../core/Lexer';
import { Parser } from '../core/Parser';
import { Interpreter, type StepInfo } from '../core/Interpreter';
import { Renderer } from './Renderer';

export const Editor: React.FC = () => {
  const [code, setCode] = useState<string>([
    "arr = [3, 1, 2]",
    "for i in range(3):",
    "    for j in range(2):",
    "        if arr[j] > arr[j+1]:",
    "            arr[j], arr[j+1] = arr[j+1], arr[j]"
  ].join('\n'));

  const [mode, setMode] = useState<'edit' | 'play'>('edit');
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState('');

  const handleRun = () => {
    try {
      setError('');
      const lexer = new Lexer(code);
      const parsedTokens = lexer.tokenize();
      const parser = new Parser(parsedTokens);
      const parsedAst = parser.parse();
      const interpreter = new Interpreter(parsedAst);
      const execSteps = interpreter.run();
      setSteps(execSteps);
      setCurrentStepIndex(0);
      if (execSteps.length > 0) {
        setMode('play');
      } else {
        setError('No steps generated.');
      }
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'monospace', backgroundColor: '#121212', color: '#fff' }}>
      {error && <div style={{ color: '#f44336', padding: '1rem', backgroundColor: '#331111' }}>{error}</div>}
      
      {mode === 'edit' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
          <h2 style={{ fontFamily: 'sans-serif' }}>Dry-Runner Editor</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1, padding: '1rem', fontSize: '18px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
          />
          <button 
            onClick={handleRun}
            style={{ padding: '1rem', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Run Dry-Run
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => setMode('edit')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px' }}>← Back to Editor</button>
            <div style={{ flex: 1 }} />
            <button 
              disabled={currentStepIndex === 0} 
              onClick={() => setCurrentStepIndex(c => Math.max(0, c - 1))}
              style={{ padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '16px', backgroundColor: currentStepIndex === 0 ? '#333' : '#007bff', color: currentStepIndex === 0 ? '#666' : '#fff', border: 'none', borderRadius: '4px' }}
            >
              Prev Step
            </button>
            <span style={{ color: '#fff', fontSize: '1.2rem', fontFamily: 'sans-serif', margin: '0 1rem' }}>Step {currentStepIndex + 1} / {steps.length}</span>
            <button 
              disabled={currentStepIndex === steps.length - 1} 
              onClick={() => setCurrentStepIndex(c => Math.min(steps.length - 1, c + 1))}
              style={{ padding: '0.5rem 1.5rem', cursor: 'pointer', fontSize: '16px', backgroundColor: currentStepIndex === steps.length - 1 ? '#333' : '#007bff', color: currentStepIndex === steps.length - 1 ? '#666' : '#fff', border: 'none', borderRadius: '4px' }}
            >
              Next Step
            </button>
            <div style={{ flex: 1 }} />
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left side: Code Highlighting */}
            <div style={{ width: '40%', borderRight: '1px solid #333', padding: '1.5rem', overflowY: 'auto', backgroundColor: '#1e1e1e' }}>
              <h2 style={{marginTop: 0, fontFamily: 'sans-serif'}}>Code Viewer</h2>
              <div style={{ color: '#d4d4d4', fontSize: '18px', lineHeight: '1.6' }}>
                {code.split('\n').map((line, idx) => {
                  const isActive = currentStep?.line === idx + 1;
                  return (
                    <div key={idx} style={{ 
                      display: 'flex', 
                      backgroundColor: isActive ? '#062f4a' : 'transparent',
                      borderLeft: isActive ? '4px solid #61afef' : '4px solid transparent',
                      paddingLeft: '0.5rem',
                      transition: 'background-color 0.2s'
                    }}>
                      <span style={{ width: '2.5rem', color: '#858585', userSelect: 'none', borderRight: '1px solid #444', marginRight: '0.75rem', textAlign: 'right', paddingRight: '0.25rem' }}>{idx + 1}</span>
                      <span style={{ whiteSpace: 'pre' }}>{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Right side: Renderer Step Data */}
            <div style={{ width: '60%', padding: '1.5rem', overflowY: 'auto' }}>
              <Renderer step={currentStep} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
