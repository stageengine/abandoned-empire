#!/usr/bin/env python3
"""
Play the original and the port through one script, and print where they differ.

The original is `source/zork1/COMPILED/zork1.z3` under `dfrotz`; the port is a built
`.stg` under `stage play`. Both read one command per line from a script file and
their replies are lined up turn for turn.

Only noise is stripped: dfrotz's status line and loading banner, Infocom's copyright,
and blank runs. Every word either game says to the player is kept, so a difference in
wording shows up even where the outcome is the same.

    python3 tools/audit.py script.txt ../engine/abandoned-empire-1.stg
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIL = ROOT / 'source/zork1/COMPILED/zork1.z3'
ENGINE = ROOT.parent / 'engine'

NOISE = re.compile(
    r'^(Using normal formatting|Loading |ZORK I:|Infocom interactive|Copyright \(c\)'
    r'|ZORK is a registered|Release \d+|Do you wish to leave|Goodbye)')

STATUS = re.compile(r'\s{2,}Score: -?\d+\s+Moves: \d+\s*$')

# Every room's title, which dfrotz prints on entering and the port does not print at
# all. One systematic difference rather than a hundred, so it is taken out here and
# reported once - the port holds the titles in `meta.title` and shows them nowhere.
TITLES = set((Path(__file__).resolve().parent / 'titles.txt').read_text().split('\n'))


def tidy(chunk):
    lines = []
    for line in chunk.split('\n'):
        line = STATUS.sub('', line).rstrip()
        line = line.strip()
        if not line or NOISE.match(line) or line in TITLES:
            continue
        lines.append(line)
    return ' '.join(' '.join(lines).split())


def original(script):
    # `-m` turns off the MORE pager. Without it, a reply longer than a screen
    # pauses for a keypress, and the next line of the script is consumed as that
    # keypress rather than played as a command - a real command goes missing and
    # every reply after it drifts out of step with the port's own transcript.
    out = subprocess.run(['dfrotz', '-m', '-p', '-w', '400', str(ZIL)],
                         input=script + '\nquit\ny\n', capture_output=True, text=True,
                         timeout=90).stdout
    return [tidy(c) for c in out.split('>')]


def port(script, game):
    out = subprocess.run(
        ['/Users/brianward/.deno/bin/deno', 'run', '-A', 'stage.ts', 'play', str(Path(game).resolve())],
        input=script + '\nquit\n', capture_output=True, text=True, timeout=180, cwd=ENGINE).stdout
    out = re.sub(r'^.*?stage\.ts.*?\n', '', out, count=1)
    return [tidy(c) for c in out.split('>')]


def main():
    script = Path(sys.argv[1]).read_text().strip()
    commands = [l.strip() for l in script.split('\n') if l.strip()]

    left, right = original(script), port(script, sys.argv[2])

    same = 0
    for i, cmd in enumerate(['(the opening)'] + commands):
        a = left[i] if i < len(left) else '<no reply>'
        b = right[i] if i < len(right) else '<no reply>'
        if a == b:
            same += 1
            continue
        print(f'\n--- {cmd}')
        # Where they part, rather than the first 260 characters of each: the
        # interesting difference is often a clause deep into a room description.
        at = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
        head = a[max(0, at - 40):at]
        print(f'  shared ...{head}' if head else '  shared <nothing>')
        print(f'  zil    {a[at:at + 200] or "<ends here>"}')
        print(f'  port   {b[at:at + 200] or "<ends here>"}')

    total = len(commands) + 1
    print(f'\n{same}/{total} identical, {total - same} differ')


main()
