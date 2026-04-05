import React, { useState } from 'react';
import { Lexer } from '../core/Lexer';
import { Parser } from '../core/Parser';
import { Interpreter, type StepInfo } from '../core/Interpreter';
import { type Token } from '../core/types';
import * as AST from '../core/ast';

export const Editor: React.FC = () => {
  const [code, setCode] = useState<string>([
    "arr = [3, 1, 2]",
    "for i in range(3):",
    "    arr[i] = arr[i] + 5",
    "    if arr[i] > 6:",
    "        arr[i] = 0"
  ].join("\n"));
  
  const [tokens, setTokens] = useState<Token[]>([]);
  const [ast, setAst] = useState<AST.ProgramNode | null>(null);
  const [steps, setSteps] = useState<StepInfo[]>([]);

  const handleRun = () => {
    try {
      const lexer = new Lexer(code);
      const parsedTokens = lexer.tokenize();
      setTokens(parsedTokens);

      const parser = new Parser(parsedTokens);
      const parsedAst = parser.parse();
      setAst(parsedAst);

      const interpreter = new Interpreter(parsedAst);
      interpreter.run();
      setSteps(interpreter.steps);
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', height: '100vh', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', gap: '2rem', height: '50%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>Code Input</h2>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1, padding: '1rem', fontSize: '16px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <button 
            onClick={handleRun}
            style={{ padding: '0.75rem', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Run Engine
          </button>
        </div>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2>AST Output</h2>
          <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
            {ast ? JSON.stringify(ast, null, 2) : <div style={{ color: '#888' }}>Run the engine to see AST...</div>}
          </div>
        </div>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Interpreter Trace (Steps)</h2>
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px' }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
              <div style={{ color: '#569cd6' }}>Step {idx + 1} (Line {step.line}): <span style={{ color: '#ce9178' }}>{step.description}</span></div>
              {Object.keys(step.variables).length > 0 && <div>Variables: <span style={{ color: '#b5cea8' }}>{JSON.stringify(step.variables)}</span></div>}
              {Object.keys(step.arrays).length > 0 && <div>Arrays: <span style={{ color: '#b5cea8' }}>{JSON.stringify(step.arrays)}</span></div>}
              {Object.keys(step.highlights).length > 0 && <div>Highlights: <span style={{ color: '#dcdcaa' }}>{JSON.stringify(step.highlights)}</span></div>}
            </div>
          ))}
          {steps.length === 0 && <div style={{ color: '#888' }}>Run the engine to see the trace...</div>}
        </div>
      </div>
    </div>
  );
};
