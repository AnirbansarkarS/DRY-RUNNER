export interface BaseNode {
  type: string;
  line: number;
}

export interface NumberNode extends BaseNode {
  type: "Number";
  value: number;
}

export interface StringNode extends BaseNode {
  type: "String";
  value: string;
}

export interface IdentNode extends BaseNode {
  type: "Ident";
  name: string;
}

export interface ArrayNode extends BaseNode {
  type: "Array";
  elements: ASTNode[];
}

export interface IndexNode extends BaseNode {
  type: "Index";
  obj: ASTNode;
  index: ASTNode;
}

export interface BinOpNode extends BaseNode {
  type: "BinOp";
  op: string;
  left: ASTNode;
  right: ASTNode;
}

export interface CompareNode extends BaseNode {
  type: "Compare";
  op: string;
  left: ASTNode;
  right: ASTNode;
}

export interface AssignNode extends BaseNode {
  type: "Assign";
  target: IdentNode | IndexNode;
  value: ASTNode;
}

export interface MultiAssignNode extends BaseNode {
  type: "MultiAssign";
  targets: (IdentNode | IndexNode)[];
  values: ASTNode[];
}

export interface IfNode extends BaseNode {
  type: "If";
  condition: ASTNode;
  body: ASTNode[];
  elseBody?: ASTNode[];
}

export interface WhileNode extends BaseNode {
  type: "While";
  condition: ASTNode;
  body: ASTNode[];
}

export interface ForRangeNode extends BaseNode {
  type: "ForRange";
  var: string;
  start: ASTNode;
  end: ASTNode;
  body: ASTNode[];
}

export interface FuncDefNode extends BaseNode {
  type: "FuncDef";
  name: string;
  params: string[];
  body: ASTNode[];
}

export interface FuncCallNode extends BaseNode {
  type: "FuncCall";
  name: string;
  args: ASTNode[];
}

export interface ReturnNode extends BaseNode {
  type: "Return";
  value: ASTNode;
}

export interface ProgramNode extends BaseNode {
  type: "Program";
  body: ASTNode[];
}

export type ASTNode =
  | NumberNode
  | StringNode
  | IdentNode
  | ArrayNode
  | IndexNode
  | BinOpNode
  | CompareNode
  | AssignNode
  | MultiAssignNode
  | IfNode
  | WhileNode
  | ForRangeNode
  | FuncDefNode
  | FuncCallNode
  | ReturnNode
  | ProgramNode;
