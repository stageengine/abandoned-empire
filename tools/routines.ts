import read, { atom, type Node, text, walk } from './read-zil.ts';

type Form = Extract<Node, { kind: 'form' }>;

const routines = new Map<string, Form>();

const index = (source: string) => {
  if (routines.size) {
    return;
  }

  for (const node of walk(read(source))) {
    if (node.kind !== 'form' || node.open !== '<') {
      continue;
    }

    if (atom(node.items[0]) !== 'ROUTINE') {
      continue;
    }

    const name = atom(node.items[1]);

    if (name) {
      routines.set(name, node);
    }
  }
};

const lookingBranch = (form: Form): Form | null => {
  for (const node of walk([form])) {
    if (node.kind !== 'form' || node.open !== '(') {
      continue;
    }

    const guard = node.items[0];

    if (guard?.kind !== 'form') {
      continue;
    }

    const mentions = [...walk([guard])].some((one) => atom(one) === 'M-LOOK');

    if (mentions) {
      return node;
    }
  }

  return null;
};

export const lookingProse = (source: string, name: string | null): string | null => {
  if (!name) {
    return null;
  }

  index(source);

  const routine = routines.get(name);

  if (!routine) {
    return null;
  }

  const branch = lookingBranch(routine);

  if (!branch) {
    return null;
  }

  return spoken(branch)[0] ?? null;
};

const spoken = (branch: Form): Array<string> =>
  [...walk(branch.items.slice(1))]
    .map(text)
    .filter((one): one is string => one !== null && one.trim() !== '');

export const lookingParts = (source: string, name: string | null): number => {
  if (!name) {
    return 0;
  }

  index(source);

  const routine = routines.get(name);

  if (!routine) {
    return 0;
  }

  const branch = lookingBranch(routine);

  return branch ? spoken(branch).length : 0;
};

export default lookingProse;
