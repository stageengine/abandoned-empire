/**
 * A small YAML writer, for output a person is going to edit for years.
 *
 * A general library would be shorter and would give back one long line per
 * paragraph, or quote everything, or reorder keys. These files are the game:
 * every one of them gets opened and changed by hand once the puzzles go in, so
 * they are worth emitting in the shape somebody would have typed - prose in
 * folded blocks wrapped at a readable width, short lists inline, and the keys
 * in the order they were written.
 */

const WIDTH = 96;

export type Value = string | number | boolean | null | Array<Value> | { [key: string]: Value };

/** Whether a scalar can be written bare, or needs quoting to survive a reader. */
const bare = (value: string): boolean =>
  value !== '' &&
  /^[A-Za-z0-9][A-Za-z0-9 '#.\-_/,!?()]*$/.test(value) &&
  !/: | #| $/.test(value) &&
  !['true', 'false', 'null', 'yes', 'no', 'on', 'off', 'y', 'n', '~'].includes(value.toLowerCase());

const scalar = (value: string): string => (bare(value) ? value : `'${value.replaceAll("'", "''")}'`);

/** Break a paragraph into lines that fit, without breaking a word. */
const wrapped = (text: string, room: number): Array<string> => {
  const out: Array<string> = [];
  let line = '';

  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line === '') {
      line = word;
      continue;
    }

    if (line.length + 1 + word.length <= room) {
      line = `${line} ${word}`;
      continue;
    }

    out.push(line);
    line = word;
  }

  if (line !== '') {
    out.push(line);
  }

  return out;
};

/** Prose long enough to be worth a block of its own rather than a quoted line. */
const isProse = (value: string): boolean => value.includes('\n') || value.length > 64;

/** A list of short scalars reads better on one line than as five. */
const flowed = (value: Array<Value>): string | null => {
  if (value.length === 0) {
    return '[]';
  }

  if (!value.every((one) => typeof one === 'string' || typeof one === 'number')) {
    return null;
  }

  const written = value.map((one) => (typeof one === 'string' ? scalar(one) : String(one)));
  const joined = `[${written.join(', ')}]`;

  return joined.length <= WIDTH - 24 ? joined : null;
};

/**
 * One value, as the part that fits after its key and the lines that follow.
 *
 * `indent` is where those following lines sit, which is one step in from
 * whatever is introducing them.
 */
const render = (value: Value, indent: string): { inline: string | null; block: Array<string> } => {
  if (value === null) {
    return { inline: 'null', block: [] };
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return { inline: String(value), block: [] };
  }

  if (typeof value === 'string') {
    if (!isProse(value)) {
      return { inline: scalar(value), block: [] };
    }

    const room = Math.max(32, WIDTH - indent.length);
    const paragraphs = value.split('\n');

    // `>-` folds its lines back into one paragraph, which is what nearly all of
    // it wants. Text carrying its own breaks keeps them with `|-`, where a line
    // stays as long as it was written because wrapping it would add a break.
    if (paragraphs.length === 1) {
      return { inline: '>-', block: wrapped(value, room).map((line) => `${indent}${line}`) };
    }

    return {
      inline: '|-',
      block: paragraphs.map((line) => (line.trim() === '' ? '' : `${indent}${line}`)),
    };
  }

  if (Array.isArray(value)) {
    const flow = flowed(value);

    if (flow !== null) {
      return { inline: flow, block: [] };
    }

    const block: Array<string> = [];

    for (const item of value) {
      const child = render(item, `${indent}  `);

      if (child.inline !== null) {
        block.push(`${indent}- ${child.inline}`);
        block.push(...child.block);
        continue;
      }

      // A map under a dash puts its first key on the dash's own line, so the
      // list reads as a list of things rather than a list of blanks.
      block.push(`${indent}- ${child.block[0].slice(indent.length + 2)}`);
      block.push(...child.block.slice(1));
    }

    return { inline: null, block };
  }

  const entries = Object.entries(value).filter(([, one]) => one !== undefined);

  if (entries.length === 0) {
    return { inline: '{}', block: [] };
  }

  const block: Array<string> = [];

  for (const [key, one] of entries) {
    const child = render(one as Value, `${indent}  `);

    block.push(`${indent}${key}:${child.inline === null ? '' : ` ${child.inline}`}`);
    block.push(...child.block);
  }

  return { inline: null, block };
};

/**
 * Write a document.
 *
 * @param {Object} value What to write.
 * @param {Array} spaced The top-level keys to leave a blank line before, so a
 *   long file has somewhere for the eye to rest.
 *
 * @returns {String} YAML, ending in a newline.
 */
export const writeYaml = (value: { [key: string]: Value }, spaced: Array<string> = []): string => {
  const out: Array<string> = [];

  for (const [key, one] of Object.entries(value)) {
    if (one === undefined) {
      continue;
    }

    if (out.length && spaced.includes(key)) {
      out.push('');
    }

    const child = render(one as Value, '  ');

    out.push(`${key}:${child.inline === null ? '' : ` ${child.inline}`}`);
    out.push(...child.block);
  }

  return `${out.join('\n')}\n`;
};

export default writeYaml;
