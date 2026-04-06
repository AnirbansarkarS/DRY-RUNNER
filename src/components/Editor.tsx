import React, { useState } from 'react';
import { Lexer } from '../core/Lexer';
import { Parser } from '../core/Parser';
import { Interpreter, type StepInfo } from '../core/Interpreter';
import { Renderer } from './Renderer';

export type Language = 'pseudocode' | 'c' | 'cpp' | 'java' | 'python';

const DEFAULT_CODE: Record<Language, string> = {
  pseudocode: [
    "arr = [3, 1, 2]",
    "for i in range(3):",
    "    for j in range(2):",
    "        if arr[j] > arr[j+1]:",
    "            arr[j], arr[j+1] = arr[j+1], arr[j]"
  ].join('\n'),
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello, World from C!\\n");\n    return 0;\n}',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World from C++!\\n";\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World from Java!");\n    }\n}',
  python: 'print("Hello, World from Python!")'
};

export const Editor: React.FC = () => {
  const [language, setLanguage] = useState<Language>('pseudocode');
  const [code, setCode] = useState<string>(DEFAULT_CODE.pseudocode);

  const [mode, setMode] = useState<'edit' | 'play' | 'output'>('edit');
  const [steps, setSteps] = useState<StepInfo[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState('');
  
  const [executionOutput, setExecutionOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const compilerMap: Record<Language, string> = {
    pseudocode: 'pseudocode',
    c: 'gcc-15',
    cpp: 'g++-15',
    java: 'openjdk-25',
    python: 'python-3.14'
  };

  const handleRun = async () => {
    if (language === 'pseudocode') {
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
    } else {
      // Execute via OnlineCompiler API for real languages
      setIsRunning(true);
      setError('');
      setExecutionOutput('');
      try {
        const response = await fetch('/api/onlinecompiler/api/run-code-sync/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': '7c16e05759557dae364c54c425b9fd3f'
          },
          body: JSON.stringify({
            compiler: compilerMap[language],
            code: code,
            input: ''
          })
        });
        
        const data = await response.json();
        
        if (data.output !== undefined || data.error !== undefined) {
          const combined = [data.output, data.error].filter(Boolean).join('\n');
          setExecutionOutput(combined || 'No output');
          setMode('output');
        } else {
          setError('Failed to execute code: ' + (data.message || JSON.stringify(data) || 'Unknown error'));
        }
      } catch (err: any) {
        setError('Execution Request Failed: ' + err.message);
      } finally {
        setIsRunning(false);
      }
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Language;
    setLanguage(newLang);
    setCode(DEFAULT_CODE[newLang]);
    setError('');
  };

  const currentStep = steps[currentStepIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'monospace', backgroundColor: '#121212', color: '#fff' }}>
      {error && <div style={{ color: '#f44336', padding: '1rem', backgroundColor: '#331111' }}>{error}</div>}
      
      {mode === 'edit' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'sans-serif', margin: 0 }}>Dry-Runner Editor</h2>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ fontFamily: 'sans-serif', fontSize: '1.1rem' }}>Language: </label>
              <select 
                value={language} 
                onChange={handleLanguageChange}
                style={{ padding: '0.5rem', fontSize: '1.1rem', borderRadius: '4px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' }}
              >
                <option value="pseudocode">Pseudocode (Dry-Run)</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
              </select>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ flex: 1, padding: '1rem', fontSize: '18px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#1e1e1e', color: '#d4d4d4' }}
          />
          <button 
            onClick={handleRun}
            disabled={isRunning}
            style={{ padding: '1rem', fontSize: '18px', cursor: isRunning ? 'not-allowed' : 'pointer', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', opacity: isRunning ? 0.7 : 1 }}
          >
            {isRunning ? 'Running...' : language === 'pseudocode' ? 'Run Dry-Run' : 'Execute Code'}
          </button>
        </div>
      ) : mode === 'output' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1rem', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={() => setMode('edit')} style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#555', color: '#fff', border: 'none', borderRadius: '4px' }}>← Back to Editor</button>
            <h2 style={{ fontFamily: 'sans-serif', margin: '0 0 0 1rem', fontSize: '1.5rem' }}>Execution Output</h2>
          </div>
          <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', backgroundColor: '#121212' }}>
            <div style={{ 
              padding: '1.5rem', 
              fontSize: '18px', 
              fontFamily: 'monospace', 
              borderRadius: '8px', 
              border: '1px solid #555', 
              backgroundColor: '#1e1e1e', 
              color: '#d4d4d4', 
              whiteSpace: 'pre-wrap', 
              minHeight: '200px' 
            }}>
              {executionOutput || <span style={{ color: '#888' }}>No output produced...</span>}
            </div>
          </div>
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

