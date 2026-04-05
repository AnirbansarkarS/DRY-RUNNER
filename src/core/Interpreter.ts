import * as AST from "./ast";

export interface StepInfo {
  line: number;
  description: string;
  variables: Record<string, any>;
  arrays: Record<string, any[]>;
  highlights: Record<string, any>;
}

export class Interpreter {
  private ast: AST.ProgramNode;
  private env: Record<string, any> = {};
  public steps: StepInfo[] = [];

  constructor(ast: AST.ProgramNode) {
    this.ast = ast;
  }

  public run() {
    this.steps = [];
    this.env = {};
    for (const stmt of this.ast.body) {
      this.execute(stmt);
    }
    return this.steps;
  }

  private recordStep(description: string, line: number, highlights: Record<string, any> = {}) {
    const variables: Record<string, any> = {};
    const arrays: Record<string, any[]> = {};

    for (const [key, value] of Object.entries(this.env)) {
      if (Array.isArray(value)) {
        arrays[key] = [...value];
      } else {
        variables[key] = value;
      }
    }

    this.steps.push({ line, description, variables, arrays, highlights });
  }

  private execute(node: AST.ASTNode): any {
    if (!node) return;

    switch (node.type) {
      case "Assign": return this.execAssign(node as AST.AssignNode);
      case "MultiAssign": return this.execMultiAssign(node as AST.MultiAssignNode);
      case "If": return this.execIf(node as AST.IfNode);
      case "While": return this.execWhile(node as AST.WhileNode);
      case "ForRange": return this.execForRange(node as AST.ForRangeNode);
      case "FuncCall": {
          const call = node as AST.FuncCallNode;
          if (call.name === "print") {
             const args = call.args.map(a => this.evaluate(a));
             this.recordStep(`print(${args.join(", ")})`, node.line);
          }
          return;
      }
      default: return this.evaluate(node);
    }
  }

  private execAssign(node: AST.AssignNode) {
    const val = this.evaluate(node.value);
    if (node.target.type === "Ident") {
      this.env[node.target.name] = val;
      this.recordStep(`${node.target.name} = ${JSON.stringify(val)}`, node.line);
    } else if (node.target.type === "Index") {
      const arrName = (node.target.obj as AST.IdentNode).name;
      const idx = this.evaluate(node.target.index);
      if (Array.isArray(this.env[arrName])) {
        this.env[arrName][idx] = val;
        this.recordStep(`${arrName}[${idx}] = ${JSON.stringify(val)}`, node.line, {
          arr: { target: [idx] }
        });
      }
    }
  }

  private execMultiAssign(node: AST.MultiAssignNode) {
    const newValues = node.values.map(v => this.evaluate(v));
    const swaps: number[] = [];
    let arrName = "";

    node.targets.forEach((t, i) => {
      if (t.type === "Ident") {
        this.env[t.name] = newValues[i];
      } else if (t.type === "Index") {
        arrName = (t.obj as AST.IdentNode).name;
        const idx = this.evaluate(t.index);
        this.env[arrName][idx] = newValues[i];
        swaps.push(idx);
      }
    });

    const isSwap = swaps.length >= 2;
    this.recordStep(`Multiple assignment`, node.line, 
      isSwap ? { arr: { swap: swaps } } : {}
    );
  }

  private execIf(node: AST.IfNode) {
    const conditionVal = this.evaluate(node.condition);
    // highlight comparisons?
    let compareIndices: number[] = [];
    if (node.condition.type === "Compare") {
       const cmp = node.condition as AST.CompareNode;
       if (cmp.left.type === "Index") compareIndices.push(this.evaluate((cmp.left as AST.IndexNode).index));
       if (cmp.right.type === "Index") compareIndices.push(this.evaluate((cmp.right as AST.IndexNode).index));
    }

    this.recordStep(`if condition -> ${conditionVal}`, node.line, 
      compareIndices.length > 0 ? { arr: { compare: compareIndices } } : {}
    );

    if (conditionVal) {
      node.body.forEach(stmt => this.execute(stmt));
    } else if (node.elseBody) {
      node.elseBody.forEach(stmt => this.execute(stmt));
    }
  }

  private execWhile(node: AST.WhileNode) {
    while (this.evaluate(node.condition)) {
      this.recordStep(`check while condition -> true`, node.line);
      for (const stmt of node.body) this.execute(stmt);
    }
    this.recordStep(`check while condition -> false`, node.line);
  }

  private execForRange(node: AST.ForRangeNode) {
    const start = this.evaluate(node.start);
    const end = this.evaluate(node.end);
    
    for (let i = start; i < end; i++) {
       this.env[node.var] = i;
       this.recordStep(`for ${node.var} = ${i}`, node.line);
       for (const stmt of node.body) this.execute(stmt);
    }
  }

  private evaluate(node: AST.ASTNode): any {
    switch (node.type) {
      case "Number": return (node as AST.NumberNode).value;
      case "String": return (node as AST.StringNode).value;
      case "Ident": return this.env[(node as AST.IdentNode).name];
      case "Array": return (node as AST.ArrayNode).elements.map(e => this.evaluate(e));
      case "Index": {
        const idx = node as AST.IndexNode;
        const arr = this.evaluate(idx.obj);
        const index = this.evaluate(idx.index);
        return arr[index];
      }
      case "BinOp": {
        const b = node as AST.BinOpNode;
        const left = this.evaluate(b.left);
        const right = this.evaluate(b.right);
        switch (b.op) {
          case "+": return left + right;
          case "-": return left - right;
          case "*": return left * right;
          case "/": return left / right;
          case "//": return Math.floor(left / right);
          case "%": return left % right;
        }
        break;
      }
      case "Compare": {
        const c = node as AST.CompareNode;
        const left = this.evaluate(c.left);
        const right = this.evaluate(c.right);
        switch (c.op) {
          case "==": return left === right;
          case "!=": return left !== right;
          case ">": return left > right;
          case "<": return left < right;
          case ">=": return left >= right;
          case "<=": return left <= right;
        }
        break;
      }
    }
    throw new Error(`Cannot evaluate unhandled node type: ${node.type}`);
  }
}
