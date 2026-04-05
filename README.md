# Dry-Runner

An interactive, step-by-step algorithm visualizer and custom interpreter. Write Python-like code, compile it into an Abstract Syntax Tree (AST), and watch the engine execute your code line-by-line while visualizing updates!

## 🚀 What's Done (Phases 1-6)

- **Phase 1: Target Language Subset**
  - Custom subset of Python-like syntax (indentation-based blocks).
  - Supports numbers, strings, variable assignments, arrays, arithmetic (`+`, `-`, `*`, `/`, `//`, `%`), comparisons (`<`, `>`, `==`, `!=`), `if / else`, `while`, and `for ... in range(...)`.
  - Multi-assignment / swap support.

- **Phase 2: Lexer (src/core/Lexer.ts)**
  - Tokenizes raw string inputs into structured formats.
  - Handles indentation-based scoping (INDENT and DEDENT tokens).

- **Phase 3: Parser (src/core/Parser.ts)**
  - Recursive descent parser that consumes tokens to build an Abstract Syntax Tree (AST).
  - Enforces correct mathematical operator precedence.

- **Phase 4: Interpreter (src/core/Interpreter.ts)**
  - Evaluates the AST node by node and manages local variable scope.
  - Records individual state snapshots dynamically.

- **Phase 5: Highlights Engine**
  - Hooks directly into the interpreter's assignment parsing.
  - Tracking array mutations, multi-assignment swaps, and comparisons.
  - Generates coordinate highlight metadata to push into snapshot blocks.

- **Phase 6: The UI Renderer**
  - Built completely in React + Vite + TypeScript.
  - **Code Viewer**: Syncs internal interpreter line tracker visibly.
  - **Variables Table** & **Array Visualizer**.
  - **Execution History**: Move forwards/backwards through time.

## 🚧 What's Next

- **Animations & Transitions**
- **Auto-Play/Playback Controls**
- **Function Calls & Call Stack Visualization**
- **Algorithm Snippet Library**
- **Robust Error Contexts**

## 🛠️ How to run locally

```bash
npm install
npm run dev
```
