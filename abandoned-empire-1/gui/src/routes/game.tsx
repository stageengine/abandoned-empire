import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

import GameMenu from '../menu';
import { useCrt } from '../crt';
import { type Measure, reason, stage, type Turn } from '../stage';

const PARAGRAPHS = /\n[ \t]*\n/;

interface Paragraph {
  key: string;
  voice: string;
  text: string;
}

interface Echo {
  at: number;
  text: string;
}

const woven = (turn: Turn | null, echoes: ReadonlyArray<Echo>): Array<{ voice: string; text: string }> => {
  const lines = turn?.lines ?? [];

  const result: Array<{ voice: string; text: string }> = [];

  let next = 0;

  lines.forEach((line, at) => {
    while (next < echoes.length && echoes[next].at === at) {
      result.push({ voice: 'player', text: echoes[next].text });

      next += 1;
    }

    result.push(line);
  });

  while (next < echoes.length) {
    result.push({ voice: 'player', text: echoes[next].text });

    next += 1;
  }

  return result;
};

const measureValue = (measures: ReadonlyArray<Measure>, id: string): number =>
  measures.find((one) => one.id === id)?.value ?? 0;

const paragraphsOf = (lines: ReadonlyArray<{ voice: string; text: string }>): Array<Paragraph> => {
  const paragraphs: Array<Paragraph> = [];

  lines.forEach((line, lineAt) => {
    line.text
      .split(PARAGRAPHS)
      .filter((part) => part.trim())
      .forEach((part, partAt) => {
        paragraphs.push({ key: `${lineAt}-${partAt}`, voice: line.voice, text: part });
      });
  });

  return paragraphs;
};

const Game = () => {
  const navigate = useNavigate();
  const { crt } = useCrt();

  const [turn, setTurn] = useState<Turn | null>(null);
  const [echoes, setEchoes] = useState<Array<Echo>>([]);
  const [typed, setTyped] = useState('');
  const [menu, setMenu] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const scrollbackRef = useRef<HTMLPreElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const typedRef = useRef<HTMLInputElement>(null);
  const endedRef = useRef(false);

  const sessionRef = useRef<string | null>(null);

  const paragraphs = useMemo(() => paragraphsOf(woven(turn, echoes)), [turn, echoes]);

  const ended = Boolean(turn?.reply?.finished);

  endedRef.current = ended;

  useEffect(() => {
    setTurn(stage.turn);
    sessionRef.current = stage.turn?.reply?.session.id ?? null;

    const stops = [
      stage.on('turnChanged', (next) => {
        const sessionId = next.reply?.session.id ?? null;

        if (sessionId !== sessionRef.current) {
          sessionRef.current = sessionId;

          setEchoes([]);
        }

        setTurn(next);
      }),

      stage.on('traced', (trace) => {
        console.log('stage:trace', trace);
      }),
    ];

    typedRef.current?.focus();

    return () => stops.forEach((stop) => stop());
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (endedRef.current) {
        return;
      }

      if (promptRef.current?.contains(event.target as Node)) {
        typedRef.current?.focus();

        stage.focus();

        return;
      }

      typedRef.current?.blur();

      stage.blur();
    };

    document.addEventListener('click', onClick);

    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const pin = () => {
      const el = scrollbackRef.current;

      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };

    pin();

    addEventListener('resize', pin);

    return () => removeEventListener('resize', pin);
  }, [paragraphs]);

  const location = turn?.reply ? turn.reply.scene.title ?? turn.reply.scene.id : '';
  const score = turn?.reply ? `Score: ${measureValue(turn.reply.measures, 'score')}` : '';
  const moves = turn?.reply ? `Moves: ${measureValue(turn.reply.measures, 'moves')}` : '';

  const send = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    const said = typed.trim();

    if (said === '') {
      return;
    }

    setEchoes((already) => [...already, { at: turn?.lines.length ?? 0, text: said }]);

    stage.submit(said);

    setTyped('');
  };

  const startAgain = () => {
    setProblem(null);

    stage.restart().catch((error) => setProblem(reason(error)));
  };

  return (
    <div id="screen" className={crt ? 'crt' : undefined}>
      <div id="bar">
        <div id="bar-inner">
          <span id="bar-location">{location}</span>
          <span id="bar-stats">
            <span id="bar-score">{score}</span>
            <span id="bar-moves">{moves}</span>

            <button id="bar-menu" type="button" onClick={() => setMenu(true)}>
              MENU
            </button>
          </span>
        </div>
      </div>

      {crt && <div id="crt"></div>}

      <pre id="scrollback" ref={scrollbackRef}>
        {paragraphs.map((paragraph) => (
          <div key={paragraph.key} className={`line-${paragraph.voice}`}>
            {paragraph.text}
          </div>
        ))}
      </pre>

      {ended && (
        <div id="ended">
          <button type="button" className="btn" onClick={startAgain}>
            START AGAIN
          </button>

          <button type="button" className="btn" onClick={() => navigate('/load')}>
            LOAD GAME
          </button>

          <button type="button" className="btn btn-quiet" onClick={() => stage.quit()}>
            QUIT
          </button>

          {problem && <p className="problem">{problem}</p>}
        </div>
      )}

      <div id="prompt" ref={promptRef} className={ended ? 'ended' : undefined}>
        <span id="prompt-caret">&gt;</span>

        <input
          id="typed"
          ref={typedRef}
          type="text"
          value={typed}
          disabled={ended}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={send}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="What you do next"
        />
      </div>

      {menu && <GameMenu onClose={() => setMenu(false)} />}
    </div>
  );
};

export default Game;
