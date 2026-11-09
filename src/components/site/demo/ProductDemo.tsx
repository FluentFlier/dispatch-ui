'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  FileText,
  House,
  Mic,
  Plus,
  Repeat2,
  Search,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { LinkedInLogo, XLogo } from '../brand/Logos';
import { Mark } from '../brand/Mark';

/**
 * The product, working: a brief becomes a post in your voice, the post gets
 * scheduled, a reply comes in and is approved, the commenter becomes a warm
 * lead. A cursor drives it; the step tabs jump to any stage.
 * Sample workspace: people and companies are fictional.
 */

type Scene = 'home' | 'draft' | 'calendar' | 'reply' | 'leads';
type Step = 0 | 1 | 2 | 3;

const PROMPT = 'Turn my call with Northwind into a LinkedIn post';
const POST = [
  'We almost lost Northwind in week two.',
  'Not because of the product. Because their team could not see where they fit in it.',
  'So we cut onboarding to one 20 minute call and let them bring their own mess.',
  'They went live in nine days.',
];
const POST_WORDS = POST.join(' \n ').split(' ');
const REPLY = 'It did. The deck was for us, not them. Happy to share the call outline if it helps.';

// One clock for everything: fixed speeds, so each step's progress bar matches the step exactly.
// Paced to be read, not skimmed.
const T = {
  swap: 420, // the crossfade between screens
  point: 950, // the cursor gliding to a target
  click: 160,
  type: 46, // per prompt character
  word: 68, // per post word
  reply: 30, // per two reply characters
  settle: 650, // a beat after a screen arrives, before anything happens on it
};
const HOLD = { drafted: 1100, scheduled: 3200, sent: 3000, moved: 3400 };
const STEP_MS = [
  T.swap + T.point + PROMPT.length * T.type + T.point + T.click + 520 + POST_WORDS.filter((w) => w !== '\n').length * T.word + HOLD.drafted + T.point + T.click,
  T.swap + T.settle + T.point + HOLD.scheduled,
  T.swap + T.settle + Math.ceil(REPLY.length / 2) * T.reply + T.point + T.click + HOLD.sent,
  T.swap + T.settle + T.point + T.click + T.point + HOLD.moved,
];
const STEPS = ['Write', 'Publish', 'Reply', 'Leads'].map((label, i) => ({ label, ms: STEP_MS[i] }));

const DESIGN_W = 1120;
const DESIGN_W_NARROW = 760;
const DESIGN_H = 640;

class Cancelled extends Error {}

/** `wideFrom`: the column width at which the window shows its sidebar (wide layout); below it the narrow one. */
export function ProductDemo({ wideFrom = 720 }: { wideFrom?: number } = {}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const runId = useRef(0);
  const [scale, setScale] = useState(1);
  const [narrow, setNarrow] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  const [step, setStep] = useState<Step>(0);
  const [stepStart, setStepStart] = useState(0);
  const [scene, setScene] = useState<Scene>('home');
  const [leaving, setLeaving] = useState<{ scene: Scene; n: number } | null>(null);
  const lastScene = useRef<Scene>('home');
  const [typed, setTyped] = useState('');
  const [words, setWords] = useState(0);
  const [scheduled, setScheduled] = useState(false);
  const [replyChars, setReplyChars] = useState(0);
  const [approved, setApproved] = useState(false);
  const [leadMoved, setLeadMoved] = useState(false);
  const [cursor, setCursor] = useState({ x: 560, y: 520, on: false, down: false, instant: false });
  const firstRun = useRef(true);
  const sideRef = useRef<HTMLElement>(null);
  const [pill, setPill] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // fit the fixed-size window to its column
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const n = w < wideFrom;
      setNarrow(n);
      setScale(Math.min(1, w / (n ? DESIGN_W_NARROW : DESIGN_W)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [wideFrom]);

  // crossfade: when the screen changes, keep the old one for a moment while it fades out
  useLayoutEffect(() => {
    if (lastScene.current === scene) return;
    const from = lastScene.current;
    lastScene.current = scene;
    if (reduced) return;
    const n = performance.now();
    setLeaving({ scene: from, n });
    const t = window.setTimeout(() => setLeaving((l) => (l && l.n === n ? null : l)), T.swap);
    return () => window.clearTimeout(t);
  }, [scene, reduced]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    // play once the demo is (essentially) fully on screen; pause when it has mostly left.
    // If the demo is taller than the viewport, "fully" means it fills most of the screen.
    // Measured on height only, so a window placed partly off to the side still plays.
    const io = new IntersectionObserver(
      ([e]) => {
        const shown = e.intersectionRect.height;
        const ratio = e.isIntersecting ? shown / Math.max(1, e.boundingClientRect.height) : 0;
        const full = ratio >= 0.92 || shown >= window.innerHeight * 0.85;
        setVisible((v) => (full ? true : ratio < 0.3 ? false : v));
      },
      { threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.85, 0.92, 1] },
    );
    if (frameRef.current) io.observe(frameRef.current);
    return () => io.disconnect();
  }, []);

  const settle = useCallback((s: Step) => {
    // the finished state of each step, for reduced motion and tab jumps
    setStep(s);
    setScene((['draft', 'calendar', 'reply', 'leads'] as Scene[])[s]);
    setTyped(PROMPT);
    setWords(POST_WORDS.length);
    setScheduled(s >= 1);
    setReplyChars(s >= 2 ? REPLY.length : 0);
    setApproved(s >= 2);
    setLeadMoved(s >= 3);
    setCursor((c) => ({ ...c, on: false }));
  }, []);

  const run = useCallback(
    async (from: Step) => {
      const id = ++runId.current;
      const alive = () => {
        if (runId.current !== id) throw new Cancelled();
      };
      const wait = (ms: number) =>
        new Promise<void>((res) => window.setTimeout(res, ms)).then(alive);
      const nextFrame = () => new Promise<void>((res) => requestAnimationFrame(() => res())).then(alive);
      // where a target sits, in the window's own (unscaled) pixels; skips the screen that is fading out
      const measure = (target: string, dx = 0, dy = 0) => {
        const win = winRef.current;
        const el = win?.querySelector<HTMLElement>(`.dm-scene:not([data-leaving]) [data-demo="${target}"]`);
        if (!win || !el) return null;
        const w = win.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        const s = w.width / win.offsetWidth;
        return { x: (r.left - w.left + r.width * 0.62) / s + dx, y: (r.top - w.top + r.height * 0.58) / s + dy };
      };
      const point = async (target: string, dx = 0, dy = 0) => {
        await nextFrame();
        const at = measure(target, dx, dy);
        if (at) setCursor((c) => ({ ...c, on: true, ...at }));
        await wait(T.point);
      };
      const click = async () => {
        setCursor((c) => ({ ...c, down: true }));
        await wait(T.click);
        setCursor((c) => ({ ...c, down: false }));
      };
      const begin = (s: Step) => {
        setStep(s);
        setStepStart(performance.now());
      };

      try {
        let s = from;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          if (s === 0) {
            begin(0);
            // the new screen's state first, then the old screen's once it has faded out
            setTyped('');
            setWords(0);
            setScene('home');
            await wait(T.swap);
            setScheduled(false);
            setReplyChars(0);
            setApproved(false);
            setLeadMoved(false);
            if (firstRun.current) {
              // first play: the cursor fades in already resting on the prompt box, no glide from below
              firstRun.current = false;
              await nextFrame();
              const at = measure('composer', -120);
              if (at) setCursor((c) => ({ ...c, ...at, on: true, instant: true }));
              await nextFrame();
              setCursor((c) => ({ ...c, instant: false }));
              await wait(T.point);
            } else {
              await point('composer', -120);
            }
            for (let i = 1; i <= PROMPT.length; i += 1) {
              setTyped(PROMPT.slice(0, i));
              await wait(T.type);
            }
            await point('send');
            await click();
            setScene('draft');
            await wait(520);
            for (let i = 1; i <= POST_WORDS.length; i += 1) {
              setWords(i);
              if (POST_WORDS[i - 1] !== '\n') await wait(T.word);
            }
            await wait(HOLD.drafted);
            await point('schedule');
            await click();
            s = 1;
          } else if (s === 1) {
            begin(1);
            setScheduled(false);
            setScene('calendar');
            await wait(T.swap + T.settle);
            // the cursor follows the post to its slot, and it lands as the cursor arrives
            await point('cal-new');
            setScheduled(true);
            await wait(HOLD.scheduled);
            s = 2;
          } else if (s === 2) {
            begin(2);
            setReplyChars(0);
            setApproved(false);
            setScene('reply');
            await wait(T.swap + T.settle);
            for (let i = 1; i <= REPLY.length; i += 2) {
              setReplyChars(i + 1);
              await wait(T.reply);
            }
            await point('approve');
            await click();
            setApproved(true);
            await wait(HOLD.sent);
            s = 3;
          } else {
            begin(3);
            setLeadMoved(false);
            setScene('leads');
            await wait(T.swap + T.settle);
            // pick Priya up and carry her card into Warm
            await point('lead-priya');
            const drop = measure('lead-drop');
            setCursor((c) => ({ ...c, down: true }));
            await wait(T.click);
            setLeadMoved(true);
            if (drop) setCursor((c) => ({ ...c, ...drop }));
            await wait(T.point);
            setCursor((c) => ({ ...c, down: false }));
            await wait(HOLD.moved);
            s = 0;
          }
        }
      } catch (e) {
        if (!(e instanceof Cancelled)) throw e;
      }
    },
    [],
  );

  // start, pause offscreen, resume
  useEffect(() => {
    if (reduced) {
      settle(step);
      return;
    }
    if (visible) run(step);
    else runId.current += 1;
    return () => {
      runId.current += 1;
    };
    // step is read only to resume where we were
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduced, run, settle]);

  const jump = (s: Step) => {
    runId.current += 1;
    if (reduced) {
      settle(s);
      return;
    }
    if (s === 0) run(0);
    else {
      settle((s - 1) as Step);
      run(s);
    }
  };

  const renderScene = (sc: Scene) => {
    if (sc === 'home') return <HomeScene typed={typed} />;
    if (sc === 'draft') return <DraftScene words={words} />;
    if (sc === 'calendar') return <CalendarScene scheduled={scheduled} />;
    if (sc === 'reply') return <ReplyScene chars={replyChars} approved={approved} />;
    return <LeadsScene moved={leadMoved} />;
  };

  const designW = narrow ? DESIGN_W_NARROW : DESIGN_W;
  const nav = scene === 'calendar' ? 'calendar' : scene === 'reply' ? 'autopilot' : scene === 'leads' ? 'leads' : 'home';

  // the sidebar's highlight slides to the active item instead of jumping
  useLayoutEffect(() => {
    const side = sideRef.current;
    const item = side?.querySelector<HTMLElement>('.dm-nav-item[data-on="true"]');
    if (item) setPill({ x: item.offsetLeft, y: item.offsetTop, w: item.offsetWidth, h: item.offsetHeight });
  }, [nav, narrow]);

  return (
    <div className="dm" ref={frameRef}>
      <div className="dm-frame" style={{ height: DESIGN_H * scale }}>
        <div
          ref={winRef}
          className="dm-win"
          data-narrow={narrow}
          style={{ width: designW, height: DESIGN_H, transform: `scale(${scale})` }}
          aria-hidden="true"
        >
          {!narrow && (
            <aside className="dm-side" ref={sideRef}>
              {pill && (
                <span
                  className="dm-nav-pill"
                  style={{ width: pill.w, height: pill.h, transform: `translate(${pill.x}px, ${pill.y}px)` }}
                />
              )}
              <div className="dm-brand">
                <Mark size={16} />
                <span>ContentOS</span>
              </div>
              <div className="dm-search">
                <Search size={13} strokeWidth={2} />
                Search
              </div>
              <nav className="dm-nav">
                <NavItem icon={House} label="Home" on={nav === 'home'} />
                <NavItem icon={CalendarDays} label="Calendar" on={nav === 'calendar'} />
                <NavItem icon={Repeat2} label="Autopilot" on={nav === 'autopilot'} badge={scene === 'reply' && !approved ? '1' : undefined} />
                <NavItem icon={BarChart3} label="Analytics" />
                <NavItem icon={FileText} label="All posts" />
              </nav>
              <p className="dm-side-label">Pipeline</p>
              <nav className="dm-nav">
                <NavItem icon={Users} label="Network" />
                <NavItem icon={Target} label="Leads" on={nav === 'leads'} />
              </nav>
              <div className="dm-me">
                <img className="dm-avatar dm-avatar-sm" src="/people/maya.webp" alt="" />
                Maya Chen
              </div>
            </aside>
          )}

          <main className="dm-main">
            {leaving && leaving.scene !== scene && (
              <div className="dm-scene" data-leaving="true" key={`out-${leaving.scene}-${leaving.n}`}>
                {renderScene(leaving.scene)}
              </div>
            )}
            <div className="dm-scene" key={scene}>
              {renderScene(scene)}
            </div>
          </main>

          <div
            className="dm-cursor"
            data-on={cursor.on}
            data-down={cursor.down}
            data-instant={cursor.instant}
            style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22">
              {/* shadow drawn in the SVG (no CSS filter, which made the nav's glass flicker) */}
              <path d="M4 2.5 L4 17.5 L8 13.8 L10.8 19.6 L13.4 18.4 L10.7 12.7 L16.2 12.4 Z" fill="rgba(16,17,24,0.22)" transform="translate(0.8 1.6)" />
              <path d="M4 2.5 L4 17.5 L8 13.8 L10.8 19.6 L13.4 18.4 L10.7 12.7 L16.2 12.4 Z" fill="#fff" stroke="#0b0b0d" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      <div className="dm-steps" role="tablist" aria-label="Product walkthrough">
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            role="tab"
            aria-selected={step === i}
            className="dm-step"
            onClick={() => jump(i as Step)}
          >
            <span className="dm-step-label">{s.label}</span>
            <span className="dm-step-track">
              <span
                key={`${i}-${step === i ? stepStart : 'idle'}`}
                className="dm-step-fill"
                data-state={step === i ? (reduced ? 'full' : 'run') : i < step ? 'full' : 'empty'}
                style={{ animationDuration: `${s.ms}ms` }}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  on,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  on?: boolean;
  badge?: string;
}) {
  return (
    <div className="dm-nav-item" data-on={on}>
      <Icon size={15} strokeWidth={1.8} />
      <span>{label}</span>
      {badge && <span className="dm-badge">{badge}</span>}
    </div>
  );
}

function Composer({ value, active }: { value: string; active: boolean }) {
  return (
    <div className="dm-composer" data-demo="composer">
      <Plus size={16} strokeWidth={1.8} className="dm-dim" />
      <div className="dm-composer-text">
        {value ? (
          <>
            {value}
            {active && <i className="dm-caret" />}
          </>
        ) : (
          <span className="dm-dim">Ask for a post, an idea, or a reply to a comment</span>
        )}
      </div>
      <span className="dm-plat" data-on="true">
        <XLogo size={12} />
      </span>
      <span className="dm-plat" data-on="true">
        <LinkedInLogo size={13} />
      </span>
      <Mic size={15} strokeWidth={1.8} className="dm-dim" />
      <span className="dm-send" data-ready={value.length > 0} data-demo="send">
        <ArrowUp size={15} strokeWidth={2.4} />
      </span>
    </div>
  );
}

function HomeScene({ typed }: { typed: string }) {
  return (
    <div className="dm-home">
      <p className="dm-greet">Ready when you are, Maya.</p>
      <Composer value={typed} active />
      <div className="dm-chips">
        {['Find trends', 'Explore ideas', 'How am I doing', 'Check my voice'].map((c) => (
          <span key={c} className="dm-chip">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function DraftScene({ words }: { words: number }) {
  // paragraphs of word spans; each new word fades in as it arrives
  const paras: { w: string; i: number }[][] = [[]];
  POST_WORDS.slice(0, words).forEach((w, i) => {
    if (w === '\n') paras.push([]);
    else paras[paras.length - 1].push({ w, i });
  });
  const done = words >= POST_WORDS.length;
  return (
    <div className="dm-session">
      <div className="dm-bubble-me">{PROMPT}</div>
      <p className="dm-note">Drafted from your call notes, in your voice.</p>
      <article className="dm-post">
        <header className="dm-post-head">
          <img className="dm-avatar" src="/people/maya.webp" alt="" />
          <div>
            <p className="dm-name">Maya Chen</p>
            <p className="dm-sub">Founder, Relay</p>
          </div>
          <LinkedInLogo size={16} className="dm-push" />
        </header>
        <div className="dm-post-body">
          {paras.map((p, k) => (
            <p key={k}>
              {p.map(({ w, i }) => (
                <span key={i} className="dm-word">
                  {w}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </article>
      <div className="dm-post-actions" data-done={done}>
        <span className="dm-pill">
          <Check size={12} strokeWidth={2.6} />
          Sounds like you
        </span>
        <span className="dm-pill">
          <XLogo size={10} />
          X version ready
        </span>
        <span className="dm-push" />
        <span className="dm-btn dm-btn-ghost">Edit</span>
        <span className="dm-btn dm-btn-light" data-demo="schedule">
          Schedule
        </span>
      </div>
    </div>
  );
}

const DAYS = ['Mon 3', 'Tue 4', 'Wed 5', 'Thu 6', 'Fri 7', 'Sat 8', 'Sun 9'];
const TIMES = ['9:00', '12:00', '15:00'];
const EXISTING: Record<string, { t: string; x?: boolean }> = {
  '0-0': { t: 'Hiring our first AE' },
  '1-1': { t: 'Pricing, explained', x: true },
  '2-2': { t: 'What churn taught us' },
  '4-1': { t: 'Ship notes, week 44', x: true },
  '5-0': { t: 'Weekend reading', x: true },
};

function CalendarScene({ scheduled }: { scheduled: boolean }) {
  return (
    <div className="dm-cal">
      <header className="dm-cal-head">
        <p className="dm-title">This week</p>
        <span className="dm-sub">Times in Los Angeles</span>
        <span className="dm-push" />
        <span className="dm-seg">
          <span>Month</span>
          <span data-on="true">Week</span>
          <span>Day</span>
        </span>
      </header>
      <div className="dm-cal-grid">
        <span />
        {DAYS.map((d) => (
          <span key={d} className="dm-cal-day">
            {d}
          </span>
        ))}
        {TIMES.map((t, r) => (
          <Row key={t} time={t} r={r} scheduled={scheduled} />
        ))}
      </div>
      <div className="dm-toast" data-on={scheduled}>
        <Check size={13} strokeWidth={2.6} />
        Scheduled for Thu, 9:00 AM. LinkedIn and X.
      </div>
    </div>
  );
}

function Row({ time, r, scheduled }: { time: string; r: number; scheduled: boolean }) {
  return (
    <>
      <span className="dm-cal-time">{time}</span>
      {DAYS.map((_, c) => {
        const e = EXISTING[`${c}-${r}`];
        const isNew = c === 3 && r === 0;
        return (
          <div key={c} className="dm-cal-cell" data-target={isNew && scheduled} data-demo={isNew ? 'cal-new' : undefined}>
            {e && (
              <span className="dm-cal-post">
                {e.x ? <XLogo size={10} /> : <LinkedInLogo size={11} />}
                {e.t}
              </span>
            )}
            {isNew && (
              <span className="dm-cal-post dm-cal-new" data-on={scheduled}>
                <LinkedInLogo size={11} />
                We almost lost Northwind
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}

function ReplyScene({ chars, approved }: { chars: number; approved: boolean }) {
  return (
    <div className="dm-replies">
      <header className="dm-cal-head">
        <p className="dm-title">Reply queue</p>
        <span className="dm-push" />
        <span className="dm-seg">
          <span data-on="true">Needs you {approved ? '0' : '1'}</span>
          <span>Sent</span>
        </span>
      </header>
      <p className="dm-context">On your post: We almost lost Northwind in week two.</p>
      <article className="dm-comment" data-done={approved}>
        <header className="dm-post-head">
          <img className="dm-avatar" src="/people/priya.webp" alt="" />
          <div>
            <p className="dm-name">Priya Shah</p>
            <p className="dm-sub">Head of Operations, Lumen Health</p>
          </div>
          <span className="dm-sub dm-push">2m</span>
        </header>
        <p className="dm-comment-text">
          We hit the same wall rolling out to our clinics. Did the 20 minute call replace your kickoff deck entirely?
        </p>
        <div className="dm-draft">
          <p className="dm-draft-label">Your reply</p>
          <p className="dm-draft-text">
            {REPLY.slice(0, chars)}
            {chars > 0 && chars < REPLY.length && <i className="dm-caret" />}
          </p>
        </div>
        <footer className="dm-comment-foot">
          <span className="dm-sub">Nothing posts until you approve it.</span>
          <span className="dm-push" />
          <span className="dm-btn dm-btn-ghost">Edit</span>
          <span className="dm-btn dm-btn-light" data-demo="approve" data-done={approved}>
            {approved ? (
              <>
                <Check size={13} strokeWidth={2.6} /> Sent
              </>
            ) : (
              'Approve and send'
            )}
          </span>
        </footer>
      </article>
    </div>
  );
}

const COLS = ['Engaged', 'Warm', 'Meeting booked'];
type LeadCard = { id: string; name: string; org: string; photo?: string };
const BOARD: LeadCard[][] = [
  [
    { id: 'diego', name: 'Diego Alvarez', org: 'Fieldwork', photo: '/people/diego.webp' },
    { id: 'hana', name: 'Hana Ito', org: 'Kettle' },
  ],
  [{ id: 'sam', name: 'Sam Okafor', org: 'Brightline' }],
  [{ id: 'lena', name: 'Lena Park', org: 'Harbor AI', photo: '/people/lena.webp' }],
];
const MOVE_EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * Priya warms up: her card sits in Engaged with everyone else, then lifts and
 * glides to the top of Warm while both columns close up and make room (FLIP:
 * measure, re-render in the new column, animate from the old spot).
 */
function LeadsScene({ moved }: { moved: boolean }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const rects = useRef(new Map<string, { left: number; top: number }>());

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    // the whole demo is scaled to fit, so convert screen pixels back to layout pixels
    const scale = board.getBoundingClientRect().width / board.offsetWidth || 1;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // positions relative to the board, in layout pixels: the screen sliding in, or the demo
    // being scaled, moves the board and every card together, so it never reads as a move
    const b = board.getBoundingClientRect();
    board.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const key = el.dataset.flip as string;
      const prev = rects.current.get(key);
      const r = el.getBoundingClientRect();
      const now = { left: (r.left - b.left) / scale, top: (r.top - b.top) / scale };
      rects.current.set(key, now);
      if (still || !prev || (Math.abs(prev.left - now.left) < 1 && Math.abs(prev.top - now.top) < 1)) return;
      const dx = prev.left - now.left;
      const dy = prev.top - now.top;
      if (key === 'priya') {
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, boxShadow: '0 0 0 1.5px rgba(47, 91, 234, 0.55), 0 8px 20px -12px rgba(30, 40, 80, 0.3)' },
            {
              transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 8}px) scale(1.03)`,
              boxShadow: '0 0 0 1.5px rgba(47, 91, 234, 0.7), 0 26px 44px -16px rgba(30, 40, 80, 0.45)',
              offset: 0.5,
            },
            { transform: 'none', boxShadow: '0 0 0 1.5px rgba(47, 91, 234, 0.55), 0 8px 20px -12px rgba(30, 40, 80, 0.3)' },
          ],
          { duration: 950, easing: MOVE_EASE },
        );
      } else {
        // fill backwards: hold the old spot through the delay, or the card blinks to its new place first
        el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 760, easing: MOVE_EASE, delay: 90, fill: 'backwards' });
      }
    });
  });

  const priyaCol = moved ? 1 : 0;
  return (
    <div className="dm-leads">
      <header className="dm-cal-head">
        <p className="dm-title">Leads</p>
        <span className="dm-sub">From people who engaged with your posts</span>
      </header>
      <div className="dm-board" ref={boardRef}>
        {COLS.map((c, i) => (
          <section key={c} className="dm-col">
            <p className="dm-col-head">
              {c}
              <span>{BOARD[i].length + (i === priyaCol ? 1 : 0)}</span>
            </p>
            <div className="dm-col-cards">
              {i === priyaCol && (
                <div className="dm-lead dm-lead-hot" data-flip="priya" data-moved={moved} data-demo="lead-priya">
                  <div className="dm-post-head">
                    <img className="dm-avatar dm-avatar-sm" src="/people/priya.webp" alt="" />
                    <div>
                      <p className="dm-name">Priya Shah</p>
                      <p className="dm-sub">Lumen Health</p>
                    </div>
                  </div>
                  <p className="dm-signal">Replied to your post and asked for the call outline</p>
                  <p className="dm-next">Next: send the outline</p>
                </div>
              )}
              {BOARD[i].map((o, k) => (
                <div
                  key={o.id}
                  className="dm-lead dm-post-head"
                  data-flip={o.id}
                  data-demo={i === 1 && k === 0 && !moved ? 'lead-drop' : undefined}
                >
                  {o.photo ? (
                    <img className="dm-avatar dm-avatar-sm" src={o.photo} alt="" />
                  ) : (
                    <span className="dm-avatar dm-avatar-sm dm-avatar-initials">
                      {o.name
                        .split(' ')
                        .map((w) => w[0])
                        .join('')}
                    </span>
                  )}
                  <div>
                    <p className="dm-name">{o.name}</p>
                    <p className="dm-sub">{o.org}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
