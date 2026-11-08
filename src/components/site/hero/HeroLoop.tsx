'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Heart, MessageCircle, PenLine, Phone, ThumbsUp } from 'lucide-react';
import { ThreadsLogo } from '../brand/Logos';

/**
 * The hero scene: the loop's two halves, either side of the headline.
 *
 * Left, what goes out: a post drafts itself, gets approved, publishes to
 * LinkedIn and X, and its likes and comments roll up into the thousands.
 * Right, what comes back: the feed of people responding. Sample people and posts, fictional.
 */

const POSTS = [
  { text: 'We almost lost Northwind in week two. Here is what saved it.', likes: 2481, comments: 316 },
  { text: 'What our first AE taught us about discovery calls.', likes: 1874, comments: 243 },
  { text: 'Ship notes, week 44: replies got twice as fast.', likes: 3162, comments: 408 },
];

const EVENTS = [
  { photo: '/people/priya.webp', name: 'Priya Shah', what: 'replied to your post', icon: MessageCircle, tone: 'apricot' },
  { photo: '/people/diego.webp', name: 'Diego Alvarez', what: 'liked your post', icon: ThumbsUp, tone: 'blue' },
  { photo: '/people/lena.webp', name: 'Lena Park', what: 'booked a call with you', icon: Phone, tone: 'green' },
] as const;

// one cycle, in ms
const CYCLE = 7600;
const APPROVE = 1500;
const PUBLISH = 2700;
const FEED_EVERY = 2800; // the feed keeps its own, quicker pace

type Phase = 'drafting' | 'approved' | 'published';

function useScene() {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>('published');
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStill(true);
      return;
    }
    const timers: number[] = [];
    let c = 0;
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));
    const run = () => {
      setCycle(c);
      setPhase('drafting');
      at(APPROVE, () => setPhase('approved'));
      at(PUBLISH, () => setPhase('published'));
      at(CYCLE, () => {
        c += 1;
        run();
      });
    };
    at(900, run);
    return () => timers.forEach(clearTimeout);
  }, []);

  return { cycle, phase, still };
}

/** Counts responses arriving in the feed. */
function useResponses(still: boolean) {
  const [n, setN] = useState(1);
  useEffect(() => {
    if (still) return;
    const id = window.setInterval(() => setN((v) => v + 1), FEED_EVERY);
    return () => clearInterval(id);
  }, [still]);
  return n;
}

/** Eases a number toward `to`; jumps straight there under reduced motion. */
function useTween(to: number, ms: number, still: boolean) {
  const [v, setV] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    if (still) {
      setV(to);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      const next = Math.round(start + (to - start) * e);
      from.current = next;
      setV(next);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, ms, still]);
  return v;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Digits on little drums: each one rolls to its new value. */
function Roll({ value }: { value: number }) {
  const text = value.toLocaleString('en-US');
  const chars = text.split('');
  return (
    <span className="cos-roll" aria-label={text}>
      {chars.map((ch, i) => {
        const fromRight = chars.length - i; // stable keys as numbers grow
        if (ch < '0' || ch > '9') {
          return (
            <span className="cos-roll-sep" key={`s${fromRight}`}>
              {ch}
            </span>
          );
        }
        return (
          <span className="cos-roll-digit" key={`d${fromRight}`}>
            <span className="cos-roll-drum" style={{ transform: `translateY(${-Number(ch) * 10}%)` }}>
              {DIGITS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function HeroLoop() {
  const { cycle, phase, still } = useScene();
  const responses = useResponses(still);
  const post = POSTS[cycle % POSTS.length];
  const live = phase === 'published';
  const likes = useTween(live ? post.likes : 0, live ? 2600 : 1, still);
  const comments = useTween(live ? post.comments : 0, live ? 2600 : 1, still);
  const n = responses - 1;
  const stack = [n, n - 1, n - 2].filter((k) => k >= 0);

  return (
    <div className="cos-scene" aria-hidden="true">
      {/* ------------------------------------------------ left: what goes out */}
      <Piece k="li" delay={0}>
        <span className="cos-tile cos-tile-lg">
          <img src="/images/brands/linkedin.png" alt="" width={34} height={34} />
        </span>
      </Piece>
      <Piece k="x" delay={1}>
        <span className="cos-tile cos-tile-md">
          <img src="/images/brands/x.png" alt="" width={26} height={26} />
        </span>
      </Piece>
      <Piece k="post" delay={2}>
        <span className="cos-post" data-status={phase}>
          <span className="cos-post-head">
            <img className="cos-post-avatar" src="/people/maya.webp" alt="" />
            <span className="cos-post-who">
              <strong>Maya Chen</strong>
              <span>Founder, Relay</span>
            </span>
            <span className="cos-post-nets">
              <img src="/images/brands/linkedin.png" alt="" width={16} height={16} />
              <img src="/images/brands/x.png" alt="" width={16} height={16} />
            </span>
          </span>
          <span className="cos-post-body" key={cycle}>
            {post.text}
          </span>
          <span className="cos-post-foot">
            <span className="cos-post-status">
              <Pill on={phase === 'drafting'} tone="ink" icon={<PenLine size={12} strokeWidth={2.4} />}>
                Drafting in your voice
              </Pill>
              <Pill on={phase === 'approved'} tone="blue" icon={<Check size={12} strokeWidth={2.8} />}>
                Approved by you
              </Pill>
              <Pill on={phase === 'published'} tone="green" icon={<Check size={12} strokeWidth={2.8} />}>
                Published
              </Pill>
            </span>
            <span className="cos-post-stats" data-on={live}>
              <span>
                <Heart size={12} strokeWidth={2.4} />
                <Roll value={likes} />
              </span>
              <span>
                <MessageCircle size={12} strokeWidth={2.4} />
                <Roll value={comments} />
              </span>
            </span>
          </span>
        </span>
      </Piece>

      {/* --------------------------------------------- right: what comes back */}
      <Piece k="threads" delay={1.5}>
        <span className="cos-tile cos-tile-md cos-tile-ink">
          <ThreadsLogo size={22} />
        </span>
      </Piece>
      <Piece k="feed" delay={3}>
        <span className="cos-stack">
          {stack.map((k) => {
            const e = EVENTS[k % EVENTS.length];
            const Icon = e.icon;
            return (
              <span className="cos-note cos-note-reply" data-depth={n - k} key={k}>
                <img className="cos-note-avatar" src={e.photo} alt="" />
                <span className="cos-note-text">
                  <strong>{e.name}</strong> {e.what}
                </span>
                <span className={`cos-note-icon cos-note-icon-${e.tone}`}>
                  <Icon size={13} strokeWidth={2.4} />
                </span>
              </span>
            );
          })}
        </span>
      </Piece>
    </div>
  );
}

function Piece({ k, delay, children }: { k: string; delay: number; children: React.ReactNode }) {
  return (
    <div className="cos-piece" data-k={k} style={{ '--in': `${500 + delay * 120}ms`, '--bob-delay': `${-delay * 1.9}s` } as React.CSSProperties}>
      <div className="cos-piece-bob">{children}</div>
    </div>
  );
}

function Pill({ on, tone, icon, children }: { on: boolean; tone: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="cos-pill" data-on={on} data-tone={tone}>
      <span className="cos-pill-icon">{icon}</span>
      {children}
    </span>
  );
}
