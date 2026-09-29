export type Node =
  | { kind: 'string'; value: string }
  | { kind: 'atom'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'form'; open: '<' | '(' | '['; items: Array<Node> }
  | { kind: 'marked'; mark: string; datum: Node };

const CLOSERS: Record<string, string> = { '<': '>', '(': ')', '[': ']' };
const SPACE = new Set([' ', '\t', '\n', '\r', '\f']);
const DELIMITERS = new Set(['<', '>', '(', ')', '[', ']', '"', ';', ...SPACE]);

export const read = (text: string): Array<Node> => {
  let at = 0;

  const skip = () => {
    while (at < text.length) {
      const char = text[at];

      if (SPACE.has(char)) {
        at += 1;
        continue;
      }

      if (char === '\\') {
        at += 1;
        continue;
      }

      if (char === ';') {
        at += 1;
        skip();
        datum();
        continue;
      }

      return;
    }
  };

  const string = (): Node => {
    at += 1;
    let out = '';

    while (at < text.length && text[at] !== '"') {
      if (text[at] === '\\') {
        at += 1;
      }

      out += text[at];
      at += 1;
    }

    at += 1;

    return { kind: 'string', value: out };
  };

  const word = (): string => {
    let out = '';

    while (at < text.length && !DELIMITERS.has(text[at])) {
      if (text[at] === '\\') {
        at += 1;
      }

      out += text[at];
      at += 1;
    }

    return out;
  };

  const grouped = (open: '<' | '(' | '['): Node => {
    at += 1;
    const items: Array<Node> = [];

    for (;;) {
      skip();

      if (at >= text.length) {
        return { kind: 'form', open, items };
      }

      if (text[at] === CLOSERS[open]) {
        at += 1;

        return { kind: 'form', open, items };
      }

      items.push(datum());
    }
  };

  const datum = (): Node => {
    skip();

    const char = text[at];

    if (char === '"') {
      return string();
    }

    if (char === '<' || char === '(' || char === '[') {
      return grouped(char);
    }

    if (char === ',' || char === '.' || char === "'" || char === '%' || char === '#') {
      at += 1;

      return { kind: 'marked', mark: char, datum: datum() };
    }

    const found = word();

    if (found === '') {
      at += 1;

      return { kind: 'atom', value: '' };
    }

    if (/^[+-]?\d+$/.test(found)) {
      return { kind: 'number', value: Number(found) };
    }

    return { kind: 'atom', value: found };
  };

  const out: Array<Node> = [];

  for (;;) {
    skip();

    if (at >= text.length) {
      return out;
    }

    out.push(datum());
  }
};

export const walk = function* (nodes: Array<Node>): Generator<Node> {
  for (const node of nodes) {
    yield node;

    if (node.kind === 'form') {
      yield* walk(node.items);
    }

    if (node.kind === 'marked') {
      yield* walk([node.datum]);
    }
  }
};

export const atom = (node: Node | undefined): string | null => {
  if (!node) {
    return null;
  }

  if (node.kind === 'atom') {
    return node.value;
  }

  if (node.kind === 'marked') {
    return atom(node.datum);
  }

  return null;
};

export const text = (node: Node | undefined): string | null => {
  if (!node) {
    return null;
  }

  if (node.kind === 'string') {
    return node.value;
  }

  if (node.kind === 'marked') {
    return text(node.datum);
  }

  return null;
};

export default read;
