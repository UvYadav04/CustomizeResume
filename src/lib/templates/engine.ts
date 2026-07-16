// A tiny, safe, no-eval "mustache-lite" template engine so the resume HTML
// markup can be edited live in Settings without letting arbitrary JS run.
// Supported syntax:
//   {{field}}        - HTML-escaped text
//   {{{field}}}      - HTML-escaped text, with **bold** markers converted to <strong>
//   {{&field}}       - raw HTML, no escaping at all (for pre-built HTML snippets
//                       like a joined links list - see context.ts's *Html fields)
//   {{#each list}}...{{/each}}   - iterate an array field, exposing its items as the new scope
//   {{#if field}}...{{/if}}      - render children only if field is truthy
// Field paths are dot-separated (e.g. "contact.email") and resolved against
// the innermost matching scope first, walking outward (so a loop body can
// still reach outer fields). Unknown/malformed tags render as empty rather
// than throwing, so a typo in a hand-edited template degrades gracefully
// instead of breaking the whole preview.
import { escapeHtml, formatTextWithBoldMarkers } from "../utils";

type Token =
  | { type: "text"; text: string }
  | { type: "var"; value: string }
  | { type: "rawvar"; value: string }
  | { type: "rawhtml"; value: string }
  | { type: "open-each"; value: string }
  | { type: "close-each" }
  | { type: "open-if"; value: string }
  | { type: "close-if" };

type Node =
  | { type: "text"; text: string }
  | { type: "var"; value: string }
  | { type: "rawvar"; value: string }
  | { type: "rawhtml"; value: string }
  | { type: "each"; value: string; children: Node[] }
  | { type: "if"; value: string; children: Node[] };

const TOKEN_RE = /\{\{\{\s*([\w.]+)\s*\}\}\}|\{\{&\s*([\w.]+)\s*\}\}|\{\{\s*([^{}]+?)\s*\}\}/g;

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;

  while ((match = TOKEN_RE.exec(source))) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: source.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      tokens.push({ type: "rawvar", value: match[1].trim() });
    } else if (match[2] !== undefined) {
      tokens.push({ type: "rawhtml", value: match[2].trim() });
    } else {
      const inner = (match[3] || "").trim();
      if (inner.startsWith("#each ")) {
        tokens.push({ type: "open-each", value: inner.slice(6).trim() });
      } else if (inner === "/each") {
        tokens.push({ type: "close-each" });
      } else if (inner.startsWith("#if ")) {
        tokens.push({ type: "open-if", value: inner.slice(4).trim() });
      } else if (inner === "/if") {
        tokens.push({ type: "close-if" });
      } else if (inner) {
        tokens.push({ type: "var", value: inner });
      }
    }

    lastIndex = TOKEN_RE.lastIndex;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: "text", text: source.slice(lastIndex) });
  }

  return tokens;
}

function parse(tokens: Token[]): Node[] {
  const root: Node[] = [];
  const stack: Node[][] = [root];

  for (const token of tokens) {
    const top = stack[stack.length - 1];
    switch (token.type) {
      case "text":
        top.push({ type: "text", text: token.text });
        break;
      case "var":
        top.push({ type: "var", value: token.value });
        break;
      case "rawvar":
        top.push({ type: "rawvar", value: token.value });
        break;
      case "rawhtml":
        top.push({ type: "rawhtml", value: token.value });
        break;
      case "open-each": {
        const node: Node = { type: "each", value: token.value, children: [] };
        top.push(node);
        stack.push(node.children);
        break;
      }
      case "close-each":
        if (stack.length > 1) stack.pop();
        break;
      case "open-if": {
        const node: Node = { type: "if", value: token.value, children: [] };
        top.push(node);
        stack.push(node.children);
        break;
      }
      case "close-if":
        if (stack.length > 1) stack.pop();
        break;
    }
  }

  return root;
}

function resolve(path: string, scopeStack: unknown[]): unknown {
  const parts = path.split(".");
  for (let i = scopeStack.length - 1; i >= 0; i--) {
    let current: any = scopeStack[i];
    let found = true;
    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        found = false;
        break;
      }
    }
    if (found) return current;
  }
  return undefined;
}

function renderNodes(nodes: Node[], scopeStack: unknown[]): string {
  let out = "";
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        out += node.text;
        break;
      case "var": {
        const value = resolve(node.value, scopeStack);
        out += escapeHtml(value == null ? "" : String(value));
        break;
      }
      case "rawvar": {
        const value = resolve(node.value, scopeStack);
        out += formatTextWithBoldMarkers(value == null ? "" : String(value));
        break;
      }
      case "rawhtml": {
        const value = resolve(node.value, scopeStack);
        out += value == null ? "" : String(value);
        break;
      }
      case "if": {
        const value = resolve(node.value, scopeStack);
        if (value) {
          out += renderNodes(node.children, scopeStack);
        }
        break;
      }
      case "each": {
        const list = resolve(node.value, scopeStack);
        if (Array.isArray(list)) {
          for (const item of list) {
            out += renderNodes(node.children, [...scopeStack, item]);
          }
        }
        break;
      }
    }
  }
  return out;
}

export function renderMiniTemplate(source: string, context: Record<string, unknown>): string {
  try {
    const ast = parse(tokenize(source || ""));
    return renderNodes(ast, [context]);
  } catch {
    // Never let a malformed hand-edited template crash the preview.
    return "";
  }
}
