import React, { useState } from 'react';
import { Lexer } from '../core/Lexer';
import { type Token } from '../core/types';

export const Editor: React.FC = () => {
  const [code, setCode] = useState<string>([
    "arr = [3, 1, 2]",
    "for i in range(3):",
    "    arr[i] = arr[i] + 5",
    "    if arr[i] > 6:",
    "        arr[i] = 0"
  ].join("\n"));
  
  const [tokens, setTokens] = useState<Token[]>([]);

  const handleRunLexer = () => {
    const lexer = new Lexer(code);
    setTokens(lexer.tokenize());
  };

  return (
    <div style={{ display: 'flex', gap: '2rem', padding: '2rem', height: '100vh', fontFamily: 'monospace' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Code Input</h2>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{ flex: 1, padding: '1rem', fontSize: '16px', fontFamily: 'monospace', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          onClick={handleRunLexer}
          style={{ padding: '0.75rem', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Run Lexer
        </button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h2>Lexer Output (Tokens)</h2>
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#d4d4d4', padding: '1rem', borderRadius: '4px' }}>
          {tokens.map((token, idx) => (
            <div key={idx} style={{ marginBottom: '0.25rem' }}>
              <span style={{ color: '#569cd6' }}>{`{ `}</span>
              type: <span style={{ color: '#ce9178' }}>'{token.type}'</span>, 
              value: <span style={{ color: '#b5cea8' }}>{typeof token.value === 'string' ? `'${token.value}'` : token.value}</span>, 
              line: <span style={{ color: '#b5cea8' }}>{token.line}</span>
              <span style={{ color: '#569cd6' }}>{` }`}</span>
            </div>
          ))}
          {tokens.length === 0 && <div style={{ color: '#888' }}>Run the lexer to see tokens...</div>}
        </div>
      </div>
    </div>
  );
};
