import { type Token, TokenType } from "./types";
import * as AST from "./ast";

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): AST.ProgramNode {
    const body: AST.ASTNode[] = [];
    while (!this.isAtEnd()) {
      if (this.match(TokenType.NEWLINE, TokenType.EOF)) continue;
      body.push(this.parseStatement());
    }
    return { type: "Program", body, line: 1 };
  }

  private parseStatement(): AST.ASTNode {
    if (this.matchKeyword("if")) return this.parseIf();
    if (this.matchKeyword("while")) return this.parseWhile();
    if (this.matchKeyword("for")) return this.parseForRange();

    return this.parseAssignmentOrExpression();
  }

  private parseBlock(): AST.ASTNode[] {
    this.consume(TokenType.COLON, "Expected ':' after condition");
    this.consume(TokenType.NEWLINE, "Expected newline after ':'");
    this.consume(TokenType.INDENT, "Expected indentation for block");

    const body: AST.ASTNode[] = [];
    while (!this.check(TokenType.DEDENT) && !this.isAtEnd()) {
      if (this.match(TokenType.NEWLINE)) continue;
      body.push(this.parseStatement());
    }

    this.consume(TokenType.DEDENT, "Expected dedent after block");
    return body;
  }

  private parseIf(): AST.IfNode {
    const line = this.previous().line;
    const condition = this.parseExpression();
    const body = this.parseBlock();

    let elseBody: AST.ASTNode[] | undefined;
    if (this.matchKeyword("else")) {
      elseBody = this.parseBlock();
    }

    return { type: "If", condition, body, elseBody, line };
  }

  private parseWhile(): AST.WhileNode {
    const line = this.previous().line;
    const condition = this.parseExpression();
    const body = this.parseBlock();
    return { type: "While", condition, body, line };
  }

  private parseForRange(): AST.ForRangeNode {
    const line = this.previous().line;
    const varName = this.consume(TokenType.IDENT, "Expected variable name in for loop").value as string;
    this.consumeKeyword("in", "Expected 'in' after for loop variable");
    this.consumeKeyword("range", "Expected 'range' in for loop");
    this.consume(TokenType.LPAREN, "Expected '(' after range");
    
    let start: AST.ASTNode = { type: "Number", value: 0, line };
    let end: AST.ASTNode;

    const arg1 = this.parseExpression();
    if (this.match(TokenType.COMMA)) {
      start = arg1;
      end = this.parseExpression();
    } else {
      end = arg1;
    }
    
    this.consume(TokenType.RPAREN, "Expected ')' after range arguments");
    const body = this.parseBlock();

    return { type: "ForRange", var: varName, start, end, body, line };
  }

  private parseAssignmentOrExpression(): AST.ASTNode {
    const exprs = [this.parseExpression()];
    
    while (this.match(TokenType.COMMA)) {
      exprs.push(this.parseExpression());
    }

    if (this.match(TokenType.ASSIGN)) {
      const line = this.previous().line;
      const values = [this.parseExpression()];
      while (this.match(TokenType.COMMA)) {
        values.push(this.parseExpression());
      }
      
      // Multi-assignment
      if (exprs.length > 1 || values.length > 1) {
        return {
          type: "MultiAssign",
          targets: exprs as (AST.IdentNode | AST.IndexNode)[],
          values,
          line
        };
      }

      // Single assignment
      return { type: "Assign", target: exprs[0] as (AST.IdentNode | AST.IndexNode), value: values[0], line };
    }

    return exprs[0];
  }

  // Precedence: Compare > Add/Sub > Mul/Div > Unary > Primary
  private parseExpression(): AST.ASTNode {
    return this.parseComparison();
  }

  private parseComparison(): AST.ASTNode {
    let expr = this.parseAddition();
    while (this.match(TokenType.COMPARE)) {
      const op = this.previous().value as string;
      const right = this.parseAddition();
      expr = { type: "Compare", op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private parseAddition(): AST.ASTNode {
    let expr = this.parseMultiplication();
    while (this.match(TokenType.ARITH)) {
      const op = this.previous().value as string;
      if (op !== "+" && op !== "-") {
        this.pos--; // backtracking if it's * or /
        break;
      }
      const right = this.parseMultiplication();
      expr = { type: "BinOp", op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private parseMultiplication(): AST.ASTNode {
    let expr = this.parsePrimary();
    while (this.match(TokenType.ARITH)) {
      const op = this.previous().value as string;
      if (op !== "*" && op !== "/" && op !== "%" && op !== "//") {
        this.pos--;
        break;
      }
      const right = this.parsePrimary();
      expr = { type: "BinOp", op, left: expr, right, line: expr.line };
    }
    return expr;
  }

  private parsePrimary(): AST.ASTNode {
    if (this.match(TokenType.NUMBER)) {
      return { type: "Number", value: this.previous().value as number, line: this.previous().line };
    }
    if (this.match(TokenType.STRING)) {
      return { type: "String", value: this.previous().value as string, line: this.previous().line };
    }
    if (this.match(TokenType.IDENT)) {
      const ident: AST.IdentNode = { type: "Ident", name: this.previous().value as string, line: this.previous().line };
      
      // Index access or Func call
      if (this.match(TokenType.LBRACKET)) {
        const index = this.parseExpression();
        this.consume(TokenType.RBRACKET, "Expected ']' after index");
        return { type: "Index", obj: ident, index, line: ident.line };
      } else if (this.match(TokenType.LPAREN)) {
        const args: AST.ASTNode[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expected ')' after arguments");
        return { type: "FuncCall", name: ident.name, args, line: ident.line };
      }
      return ident;
    }
    
    if (this.match(TokenType.LBRACKET)) {
      const line = this.previous().line;
      const elements: AST.ASTNode[] = [];
      if (!this.check(TokenType.RBRACKET)) {
         do {
           elements.push(this.parseExpression());
         } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array elements");
      return { type: "Array", elements, line };
    }
    
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().type} (${this.peek().value}) at line ${this.peek().line}`);
  }

  // Helpers
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchKeyword(keyword: string): boolean {
    if (this.check(TokenType.KEYWORD) && this.peek().value === keyword) {
      this.advance();
      return true;
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} at line ${this.peek().line}`);
  }

  private consumeKeyword(keyword: string, message: string): Token {
    if (this.check(TokenType.KEYWORD) && this.peek().value === keyword) return this.advance();
    throw new Error(`${message} at line ${this.peek().line}`);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.pos++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private previous(): Token {
    return this.tokens[this.pos - 1];
  }
}
