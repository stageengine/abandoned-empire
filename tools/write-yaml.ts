const WIDTH = 96;

export type Value = string | number | boolean | null | Array<Value> | { [key: string]: Value };

const bare = (value: string): boolean =>
  value !== '' &&
  /^[A-Za-z0-9][A-Za-z0-9 '#.\-_/,!?()]*$/.test(value) &&
  !/: | #| $/.test(value) &&
  !['true', 'false', 'null', 'yes', 'no', 'on', 'off', 'y', 'n', '~'].includes(value.toLowerCase());

const scalar = (value: string): string => (bare(value) ? value : `'${value.replaceAll("'", "''")}'`);

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

const isProse = (value: string): boolean => value.includes('\n') || value.length > 64;

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

/** A file that is a list, such as `every-turn.yaml`: Stage reads its name as what each entry is. */
export const writeYamlList = (value: Array<Value>): string => {
  const rendered = render(value, '');
  const lines = rendered.inline === null ? rendered.block : [rendered.inline];

  return `${lines.join('\n')}\n`;
};

export default writeYaml;
