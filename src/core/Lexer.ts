import { type Token, TokenType } from "./types";

const KEYWORDS = new Set(["if", "else", "for", "while", "in", "range"]);

export class Lexer {
  private input: string;
  private position: number = 0;
  private currentLine: number = 1;
  private tokens: Token[] = [];
  private indentStack: number[] = [0]; // Tracks indentation levels

  constructor(input: string) {
    this.input = input;
  }

  public tokenize(): Token[] {
    while (this.position < this.input.length) {
      const char = this.input[this.position];

      if (char === "\n") {
        this.tokens.push({ type: TokenType.NEWLINE, value: "\\n", line: this.currentLine });
        this.position++;
        this.currentLine++;
        this.handleIndentation();
        continue;
      }

      if (/\s/.test(char)) {
        this.position++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        this.tokens.push(this.readString(char));
        continue;
      }

      // Identifiers and Keywords
      if (/[a-zA-Z_]/.test(char)) {
        this.tokens.push(this.readIdentifierOrKeyword());
        continue;
      }

      // Operators and punctuation
      if (this.match("==") || this.match("!=") || this.match("<=") || this.match(">=")) {
        this.tokens.push({ type: TokenType.COMPARE, value: this.input.slice(this.position - 2, this.position), line: this.currentLine });
        continue;
      }

      if (this.match("=") || this.match("<") || this.match(">")) {
        const val = this.input[this.position - 1];
        this.tokens.push({ type: val === "=" ? TokenType.ASSIGN : TokenType.COMPARE, value: val, line: this.currentLine });
        continue;
      }

      if (this.match("//")) {
        this.tokens.push({ type: TokenType.ARITH, value: "//", line: this.currentLine });
        continue;
      }

      if ("+-*/%".includes(char)) {
        this.tokens.push({ type: TokenType.ARITH, value: char, line: this.currentLine });
        this.position++;
        continue;
      }

      switch (char) {
        case "(": this.tokens.push({ type: TokenType.LPAREN, value: char, line: this.currentLine }); this.position++; break;
        case ")": this.tokens.push({ type: TokenType.RPAREN, value: char, line: this.currentLine }); this.position++; break;
        case "[": this.tokens.push({ type: TokenType.LBRACKET, value: char, line: this.currentLine }); this.position++; break;
        case "]": this.tokens.push({ type: TokenType.RBRACKET, value: char, line: this.currentLine }); this.position++; break;
        case ",": this.tokens.push({ type: TokenType.COMMA, value: char, line: this.currentLine }); this.position++; break;
        case ":": this.tokens.push({ type: TokenType.COLON, value: char, line: this.currentLine }); this.position++; break;
        default:
          console.warn(`Unknown character: ${char} at line ${this.currentLine}`);
          this.position++;
      }
    }

    // Dedent to 0 at the end
    while (this.indentStack.length > 1) {
      this.indentStack.pop();
      this.tokens.push({ type: TokenType.DEDENT, value: "", line: this.currentLine });
    }

    this.tokens.push({ type: TokenType.EOF, value: "EOF", line: this.currentLine });
    return this.tokens;
  }

  private match(expected: string): boolean {
    if (this.position + expected.length > this.input.length) return false;
    if (this.input.substring(this.position, this.position + expected.length) === expected) {
      this.position += expected.length;
      return true;
    }
    return false;
  }

  private readNumber(): Token {
    let result = "";
    let isFloat = false;

    while (this.position < this.input.length) {
      const char = this.input[this.position];
      if (/[0-9]/.test(char)) {
        result += char;
      } else if (char === "." && !isFloat) {
        result += char;
        isFloat = true;
      } else {
        break;
      }
      this.position++;
    }
    return { type: TokenType.NUMBER, value: isFloat ? parseFloat(result) : parseInt(result, 10), line: this.currentLine };
  }

  private readString(quote: string): Token {
    this.position++; // Skip opening quote
    let result = "";

    while (this.position < this.input.length && this.input[this.position] !== quote) {
      result += this.input[this.position];
      this.position++;
    }
    
    if (this.position < this.input.length) {
      this.position++; // Skip closing quote
    }

    return { type: TokenType.STRING, value: result, line: this.currentLine };
  }

  private readIdentifierOrKeyword(): Token {
    let result = "";
    while (this.position < this.input.length && /[a-zA-Z_0-9]/.test(this.input[this.position])) {
      result += this.input[this.position];
      this.position++;
    }

    const type = KEYWORDS.has(result) ? TokenType.KEYWORD : TokenType.IDENT;
    return { type, value: result, line: this.currentLine };
  }

  private handleIndentation() {
    let indentLength = 0;
    while (this.position < this.input.length && (this.input[this.position] === " " || this.input[this.position] === "\t")) {
      indentLength += this.input[this.position] === "\\t" ? 4 : 1;
      this.position++;
    }

    if (this.position < this.input.length && (this.input[this.position] === "\n" || this.input[this.position] === "\r")) {
        return; // Blank line, ignore indentation
    }

    const currentIndent = this.indentStack[this.indentStack.length - 1];

    if (indentLength > currentIndent) {
      this.indentStack.push(indentLength);
      this.tokens.push({ type: TokenType.INDENT, value: indentLength, line: this.currentLine });
    } else if (indentLength < currentIndent) {
      while (this.indentStack.length > 1 && indentLength < this.indentStack[this.indentStack.length - 1]) {
        this.indentStack.pop();
        this.tokens.push({ type: TokenType.DEDENT, value: "", line: this.currentLine });
      }
    }
  }
}
