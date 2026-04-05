export enum TokenType {
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENT = "IDENT",
  KEYWORD = "KEYWORD",
  ASSIGN = "ASSIGN",
  COMPARE = "COMPARE",
  ARITH = "ARITH",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  COMMA = "COMMA",
  COLON = "COLON",
  NEWLINE = "NEWLINE",
  INDENT = "INDENT",
  DEDENT = "DEDENT",
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  value: string | number;
  line: number;
}
