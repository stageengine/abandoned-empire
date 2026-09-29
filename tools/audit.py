#!/usr/bin/env python3
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ZIL = ROOT / 'source/zork1/COMPILED/zork1.z3'
ENGINE = ROOT.parent / 'engine'
CHECKPOINTS = ROOT / 'tools' / 'checkpoints'
DENO = '/Users/brianward/.deno/bin/deno'

NOISE = re.compile(
    r'^(Using normal formatting|Loading |ZORK I:|Infocom interactive|Copyright \(c\)'
    r'|ZORK is a registered|Release \d+|Do you wish to leave|Goodbye)')

STATUS = re.compile(r'\s{2,}Score: -?\d+\s+Moves: \d+\s*$')

CHECKPOINT_LINE = re.compile(r'^@checkpoint\s+(\S+)$')

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


def segments(script):
    held = []
    resume_from = None
    for line in script.strip().split('\n'):
        line = line.strip()
        if not line:
            continue
        marker = CHECKPOINT_LINE.match(line)
        if not marker:
            held.append(line)
            continue
        yield (held, resume_from, marker.group(1))
        held = []
        resume_from = marker.group(1)
    if held or resume_from:
        yield (held, resume_from, None)


def qzl(name):
    return CHECKPOINTS / f'{name}.qzl'


def port_save(name, game):
    return Path(game).resolve().parent / f'{Path(game).stem}.saves' / f'{name}.save.json'


def captured(name, game):
    return qzl(name).exists() and port_save(name, game).exists()


def forget(name, game):
    qzl(name).unlink(missing_ok=True)
    port_save(name, game).unlink(missing_ok=True)


def original(commands, resume_from, capture_as):
    lines = list(commands)
    if capture_as:
        lines += ['save', str(qzl(capture_as))]
    script = '\n'.join(lines)
    args = ['dfrotz', '-m', '-p', '-w', '400']
    if resume_from:
        args += ['-L', str(qzl(resume_from))]
    args.append(str(ZIL))
    out = subprocess.run(args, input=script + '\nquit\ny\n', capture_output=True,
                         text=True, timeout=90).stdout
    replies = [tidy(c) for c in out.split('>')]
    return replies[1:] if resume_from else replies


def port(commands, resume_from, capture_as, game):
    lines = list(commands)
    if capture_as:
        lines += [f'save {capture_as}']
    if resume_from:
        lines = [f'load {resume_from}'] + lines
    script = '\n'.join(lines)
    out = subprocess.run(
        [DENO, 'run', '-A', 'stage.ts', 'play', str(Path(game).resolve())],
        input=script + '\nquit\n', capture_output=True, text=True, timeout=180, cwd=ENGINE).stdout
    out = re.sub(r'^.*?stage\.ts.*?\n', '', out, count=1)
    replies = [tidy(c) for c in out.split('>')]
    return replies[2:] if resume_from else replies


def report(commands, resume_from, left, right):
    labels = commands if resume_from else ['(the opening)'] + commands

    same = 0
    for i, cmd in enumerate(labels):
        a = left[i] if i < len(left) else '<no reply>'
        b = right[i] if i < len(right) else '<no reply>'
        if a == b:
            same += 1
            continue
        print(f'\n--- {cmd}')
        at = next((i for i, (x, y) in enumerate(zip(a, b)) if x != y), min(len(a), len(b)))
        head = a[max(0, at - 40):at]
        print(f'  shared ...{head}' if head else '  shared <nothing>')
        print(f'  zil    {a[at:at + 200] or "<ends here>"}')
        print(f'  port   {b[at:at + 200] or "<ends here>"}')

    return same, len(labels)


def main():
    script = Path(sys.argv[1]).read_text()
    game = sys.argv[2]

    CHECKPOINTS.mkdir(parents=True, exist_ok=True)

    same_total = 0
    labels_total = 0
    resume_from = None

    for commands, segment_resume, capture_as in segments(script):
        resume_from = resume_from or segment_resume

        if capture_as and captured(capture_as, game):
            print(f'\n(skipping {len(commands)} commands, already banked at "{capture_as}")')
            resume_from = capture_as
            continue

        if capture_as:
            forget(capture_as, game)

        left = original(commands, resume_from, capture_as)
        right = port(commands, resume_from, capture_as, game)

        same, total = report(commands, resume_from, left, right)
        same_total += same
        labels_total += total

        if capture_as:
            resume_from = capture_as

    print(f'\n{same_total}/{labels_total} identical, {labels_total - same_total} differ')


main()
