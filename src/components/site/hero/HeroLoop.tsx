'use client';

import { useEffect, useState } from 'react';
import { Check, MessageCircle, PenLine, Phone, ThumbsUp } from 'lucide-react';

/**
 * The loop, told in the hero.
 *
 * Desktop: a post on the left goes Drafting, Approved, Published. When it
 * publishes, a light travels the arc over the headline and lands in the feed
 * on the right, where the response arrives.
 *
 * Phone: the same beats in one compact island that changes shape as it goes.
 *
 * Sample people and posts, fictional.
 */

const POSTS = [
  'We almost lost Northwind in week two. Here is what saved it.',
  'What our first AE taught us about discovery calls.',
  'Ship notes, week 44: replies got twice as fast.',
];

const EVENTS = [
  { photo: '/people/priya.webp', name: 'Priya Shah', what: 'replied to your post', icon: MessageCircle, tone: 'apricot' },
  { photo: '/people/diego.webp', name: 'Diego Alvarez', what: 'liked your post', icon: ThumbsUp, tone: 'blue' },
  { photo: '/people/lena.webp', name: 'Lena Park', what: 'booked a call with you', icon: Phone, tone: 'green' },
] as const;

// one cycle, in ms
const CYCLE = 6800;
const APPROVE = 1500;
const PUBLISH = 2700;
const TRAVEL = 1500; // the light along the arc
const LAND = PUBLISH + TRAVEL;

type Phase = 'drafting' | 'approved' | 'published' | 'landed';

function useLoop() {
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>('landed');
  const [landed, setLanded] = useState(1); // responses so far (one is already there)
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
      at(LAND, () => {
        setPhase('landed');
        setLanded((v) => v + 1);
      });
      at(CYCLE, () => {
        c += 1;
        run();
      });
    };
    at(900, run);
    return () => timers.forEach(clearTimeout);
  }, []);

  return { cycle, phase, landed, still };
}

export function HeroLoop() {
  const { cycle, phase, landed, still } = useLoop();
  const post = POSTS[cycle % POSTS.length];
  const n = landed - 1;
  const stack = [n, n - 1, n - 2].filter((k) => k >= 0);
  const event = EVENTS[n % EVENTS.length];
  const status = phase === 'drafting' ? 'drafting' : phase === 'approved' ? 'approved' : 'published';
  const live = phase === 'published' || phase === 'landed';

  return (
    <div className="cos-hloop" aria-hidden="true">
      {/* ------------------------------------------------ desktop and tablet */}
      <svg className="cos-arc" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <path className="cos-arc-track" pathLength={1} d={ARC} />
        {!still && live && (
          <g key={cycle} className="cos-arc-light">
            <path className="cos-arc-glow" pathLength={1} d={ARC} />
            <path className="cos-arc-tail" pathLength={1} d={ARC} />
            <path className="cos-arc-head" pathLength={1} d={ARC} />
          </g>
        )}
      </svg>

      <div className="cos-hloop-card" data-k="post">
        <span className="cos-post" data-status={status}>
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
            {post}
          </span>
          <span className="cos-post-status">
            <Pill on={status === 'drafting'} tone="ink" icon={<PenLine size={12} strokeWidth={2.4} />}>
              Drafting in your voice
            </Pill>
            <Pill on={status === 'approved'} tone="blue" icon={<Check size={12} strokeWidth={2.8} />}>
              Approved by you
            </Pill>
            <Pill on={status === 'published'} tone="green" icon={<Check size={12} strokeWidth={2.8} />}>
              Published to LinkedIn and X
            </Pill>
          </span>
        </span>
      </div>

      <div className="cos-hloop-card" data-k="feed">
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
      </div>

      {/* ------------------------------------------------------------ phone */}
      <div className="cos-island" data-phase={phase}>
        <span className="cos-island-inner">
          <IslandState on={status === 'drafting'}>
            <span className="cos-island-icon" data-tone="ink">
              <PenLine size={13} strokeWidth={2.4} />
            </span>
            Drafting a post in your voice
          </IslandState>
          <IslandState on={status === 'approved'}>
            <span className="cos-island-icon" data-tone="blue">
              <Check size={13} strokeWidth={2.8} />
            </span>
            You approved it
          </IslandState>
          <IslandState on={phase === 'published'}>
            <span className="cos-island-icon" data-tone="green">
              <Check size={13} strokeWidth={2.8} />
            </span>
            Published to
            <img src="/images/brands/linkedin.png" alt="" width={18} height={18} />
            <img src="/images/brands/x.png" alt="" width={18} height={18} />
          </IslandState>
          <IslandState on={phase === 'landed'} k={n}>
            <img className="cos-island-avatar" src={event.photo} alt="" />
            <span className="cos-note-text">
              <strong>{event.name.split(' ')[0]}</strong> {event.what}
            </span>
          </IslandState>
        </span>
      </div>
    </div>
  );
}

// from the top of the post card, over the headline, down to the feed
const ARC = 'M 150 300 C 225 0, 775 0, 850 330';

function Pill({ on, tone, icon, children }: { on: boolean; tone: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="cos-pill" data-on={on} data-tone={tone}>
      <span className="cos-pill-icon">{icon}</span>
      {children}
    </span>
  );
}

function IslandState({ on, k, children }: { on: boolean; k?: number; children: React.ReactNode }) {
  return (
    <span className="cos-island-state" data-on={on} key={k}>
      {children}
    </span>
  );
}
