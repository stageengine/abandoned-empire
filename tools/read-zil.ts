/**
 * A reader for ZIL, the language Infocom wrote Zork in.
 *
 * It reads the text into a tree and stops there. Nothing here knows what a room
 * is: working that out is `dungeon.ts`'s job, and keeping the two apart is what
 * lets the same reader be pointed at Zork II and Zork III without being taught
 * anything new.
 */

export type Node =
  | { kind: 'string'; value: string }
  | { kind: 'atom'; value: string }
  | { kind: 'number'; value: number }
  | { kind: 'form'; open: '<' | '(' | '['; items: Array<Node> }
  | { kind: 'marked'; mark: string; datum: Node };

const CLOSERS: Record<string, string> = { '<': '>', '(': ')', '[': ']' };
const SPACE = new Set([' ', '\t', '\n', '\r', '\f']);
const DELIMITERS = new Set(['<', '>', '(', ')', '[', ']', '"', ';', ...SPACE]);

/**
 * Read a whole file.
 *
 * @param {String} text The source.
 *
 * @returns {Array} Every top-level datum in it, in the order it was written.
 */
export const read = (text: string): Array<Node> => {
  let at = 0;

  /**
   * Step over anything that is not a datum: whitespace, a comment, and the lone
   * backslash Infocom used as a page break. A comment is a semicolon and the
   * whole of the datum after it, both of which are thrown away.
   */
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

    // `,GLOBAL`, `.LOCAL`, `'QUOTED`, `%<READ-TIME>`, `#TYPE`: the mark says how
    // the datum after it is meant rather than what it is, and the port reads
    // through all of them to the datum itself.
    if (char === ',' || char === '.' || char === "'" || char === '%' || char === '#') {
      at += 1;

      return { kind: 'marked', mark: char, datum: datum() };
    }

    const found = word();

    if (found === '') {
      // A closer with nothing open, or something else unexpected. Step over it
      // rather than looping forever on it.
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

/** Every node in the tree, depth first, so a form can be looked for anywhere. */
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

/** The word a node stands for, reading through any mark on it. */
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

/** The text a node holds, where it holds any. */
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
