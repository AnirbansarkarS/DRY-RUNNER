export function roughTranslateToPseudocode(code: string, fromLang: string): string {
  if (fromLang === 'pseudocode') return code;

  let translated = code;

  // 1. Remove common boilerplate
  translated = translated.replace(/#include\s*<.*?>\n?/g, '');
  translated = translated.replace(/using\s+namespace\s+std;\n?/g, '');
  translated = translated.replace(/public\s+class\s+\w+\s*\{/g, '');
  translated = translated.replace(/public\s+static\s+void\s+main\s*\(\s*String\[\]\s+args\s*\)\s*\{/g, '');
  translated = translated.replace(/int\s+main\s*\(\s*\)\s*\{/g, '');

  if (fromLang === 'java') {
      let lines = translated.split('\n');
      let braceCount = 0;
      for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].includes('}')) {
              lines[i] = lines[i].replace('}', '');
              braceCount++;
              if (braceCount === 2) break;
          }
      }
      translated = lines.join('\n');
  }
  
  if (fromLang === 'c' || fromLang === 'cpp') {
      translated = translated.replace(/return\s+0\s*;/g, '');
      let lines = translated.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].includes('}')) {
              lines[i] = lines[i].replace('}', '');
              break;
          }
      }
      translated = lines.join('\n');
  }

  // 2. Flatten newlines inside parentheses and map semicolons properly.
  // Splitting statements natively but keeping arguments together inside for(...), func(...)
  let tempTrans = '';
  let parenCount = 0;
  
  for (let i = 0; i < translated.length; i++) {
      let char = translated[i];
      if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      
      if (parenCount > 0 && (char === '\n' || char === '\r')) {
          tempTrans += ' '; // flatten newlines inside parens
      } else if (char === ';' && parenCount === 0) {
          tempTrans += '\n'; // split inline statement outside of parens
      } else {
          tempTrans += char;
      }
  }
  translated = tempTrans.replace(/;[\t ]*$/gm, ''); // remove remaining trailing semicolons

  // 3. Remove type declarations (int, float, let, var, double) for assignments
  translated = translated.replace(/\b(int|float|double|long|short|let|var|const|Integer)\s+([a-zA-Z_]\w*)\s*(?:=|;|$)/g, (match, p1, p2) => match.includes('=') ? `${p2} =` : `${p2} = 0`);
  translated = translated.replace(/\b(?:int|float|double|long|short|String)\[\]\s+([a-zA-Z_]\w*)\s*=\s*\{/g, '$1 = [');
  translated = translated.replace(/\b(?:int|float|double|long|short|String)\s+([a-zA-Z_]\w*)\[\]\s*=\s*\{/g, '$1 = [');
  translated = translated.replace(/\b(?:vector|list|ArrayList)<\w+>\s+([a-zA-Z_]\w*)\s*=\s*\{/g, '$1 = [');
  
  // Replace array closing braces to python list closing brackets 
  // (only if they look like array data, but simplest is replacing all } that are followed by newline or EOF or comma with ])
  // We'll handle overall `{` and `}` during the indentation pass.
  
  // 4. Print statements
  translated = translated.replace(/System\.out\.println/g, 'print');
  translated = translated.replace(/System\.out\.print/g, 'print');
  translated = translated.replace(/console\.log/g, 'print');
  translated = translated.replace(/printf/g, 'print');
  translated = translated.replace(/std::cout\s*<<\s*(.+?)\s*(?:<<\s*std::endl|<<\s*"\\n")?/g, 'print($1)');

  // 5. Control Flow translation and Indentation inference
  let rawLines = translated.split('\n');
  let cleanedLines: string[] = [];
  let currentIndent = 0;

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i].trim();
    if (!line) continue;

    // Track braces for indentation BEFORE modifying them out
    let decreaseIndentNext = false;
    if (line.startsWith('}')) {
        currentIndent = Math.max(0, currentIndent - 1);
        line = line.substring(1).trim();
    }
    if (line.includes('}')) {
        // inline closing brace
        line = line.replace(/\}/g, ']'); // convert any remaining } to ] assuming it's array block end originally
        currentIndent = Math.max(0, currentIndent - 1);
    }
    
    let increaseIndentNext = false;
    if (line.endsWith('{')) {
        increaseIndentNext = true;
        line = line.slice(0, -1).trim();
    } else if (line.includes('{')) {
        // Assume array initializer open
        line = line.replace(/\{/g, '[');
    }

    // if (cond) -> if cond:
    line = line.replace(/if\s*\((.*)\)\s*:?/, 'if $1:');
    
    // else if (cond) -> elif cond:
    line = line.replace(/else\s*if\s*\((.*)\)\s*:?/, 'elif $1:');
    
    // else -> else:
    line = line.replace(/else\s*:?/, 'else:');
    
    // while (cond) -> while cond:
    line = line.replace(/while\s*\((.*)\)\s*:?/, 'while $1:');
    
    // for loops
    const cForMatch = line.match(/for\s*\(\s*(?:int\s+|let\s+|var\s+|auto\s+|long\s+|short\s+|size_t\s+)?(\w+)\s*=\s*([^;]+)\s*;\s*\w+\s*(?:<|<=|>|>=|!=)\s*([^;]+)\s*;\s*[^)]+\s*\)\s*:?/);
    if (cForMatch) {
        let start = cForMatch[2].trim();
        let end = cForMatch[3].trim();
        if (start === '0') {
            line = line.replace(cForMatch[0], `for ${cForMatch[1]} in range(${end}):`);
        } else {
            line = line.replace(cForMatch[0], `for ${cForMatch[1]} in range(${start}, ${end}):`);
        }
    } else {
        const forEachMatch = line.match(/for\s*\(\s*(?:auto\s+|int\s+|float\s+|double\s+|String\s+)?\s*(\w+)\s*(?::|of|in)\s*([^)]+)\)\s*:?/);
        if (forEachMatch) {
            line = line.replace(forEachMatch[0], `for ${forEachMatch[1]} in ${forEachMatch[2]}:`);
        } else {
            // General cleanup fallback if it already had 'in' (python)
            line = line.replace(/for\s*\((.*)\)\s*:?/, 'for $1:');
        }
    }

    // Ensure control flow ends with colon
    line = line.trim();
    if ((line.startsWith('if ') || line.startsWith('elif ') || line.startsWith('else') || line.startsWith('while ') || line.startsWith('for ')) && !line.endsWith(':')) {
        line += ':';
    }

    // Remove any trailing or leading cleanups
    line = line.replace(/\{/g, '[').replace(/\}/g, ']');

    if (line.length > 0 && line !== '[' && line !== ']') {
        const indentStr = '    '.repeat(currentIndent);
        cleanedLines.push(indentStr + line);
    }
    
    if (increaseIndentNext) {
        currentIndent++;
    }
  }

  // Final trim pass for empty lines
  return cleanedLines.filter(l => l.trim().length > 0).join('\n');
}
