'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Check, Heart, MessageCircle, Phone, ThumbsUp } from 'lucide-react';
import { LinkedInLogo, ThreadsLogo, XLogo } from '../brand/Logos';

/**
 * Pieces of the loop resting in the sky around the hero: the networks, a
 * post going out, and what comes back. The tiles are glass that catches the
 * light now and then; the notifications arrive as a stacked feed, the way
 * they would on a phone. Sample people, fictional.
 */

const EVENTS = [
  { photo: '/people/priya.webp', name: 'Priya Shah', what: 'replied to your post', icon: MessageCircle, tone: 'apricot' },
  { photo: '/people/diego.webp', name: 'Diego Alvarez', what: 'liked your post', icon: ThumbsUp, tone: 'blue' },
  { photo: '/people/lena.webp', name: 'Lena Park', what: 'booked a call with you', icon: Phone, tone: 'green' },
] as const;

const POSTS = [
  { text: 'Scheduled for Thu, 9:00 AM', icon: CalendarCheck, tone: 'blue' },
  { text: 'Published to LinkedIn and X', icon: Check, tone: 'green' },
] as const;

/** A counter that ticks every `every` ms (after `offset`), paused under reduced motion. */
function useTicker(every: number, offset = 0) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = window.setTimeout(function tick() {
      setN((v) => v + 1);
      timer = window.setTimeout(tick, every);
    }, every + offset);
    return () => clearTimeout(timer);
  }, [every, offset]);
  return n;
}

export function Floaters() {
  const n = useTicker(4200, 1600);
  const post = useTicker(5200) % POSTS.length;
  const stack = [n, n - 1, n - 2].filter((k) => k >= 0);
  const liked = n % EVENTS.length === 1;

  return (
    <div className="cos-floaters" aria-hidden="true">
      <Float k="li" delay={0} bob={9}>
        <span className="cos-tile cos-tile-lg cos-tile-li" style={{ '--sweep': '0s' } as React.CSSProperties}>
          <LinkedInLogo size={30} />
        </span>
      </Float>
      <Float k="heart" delay={1} bob={10.5}>
        <span className="cos-bubble cos-bubble-heart" data-pop={liked}>
          <Heart size={17} strokeWidth={2.4} fill="currentColor" />
          {liked && <span className="cos-burst" key={n} />}
        </span>
      </Float>
      <Float k="post" delay={2} bob={11}>
        <span className="cos-note cos-note-post">
          {POSTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <span className="cos-note-state" data-on={i === post} key={p.text}>
                <span className={`cos-note-icon cos-note-icon-${p.tone}`}>
                  <Icon size={14} strokeWidth={2.3} />
                </span>
                {p.text}
              </span>
            );
          })}
        </span>
      </Float>

      <Float k="x" delay={0.5} bob={10}>
        <span className="cos-tile cos-tile-lg cos-tile-ink" style={{ '--sweep': '2.4s' } as React.CSSProperties}>
          <XLogo size={24} />
        </span>
      </Float>
      <Float k="threads" delay={1.5} bob={12}>
        <span className="cos-tile cos-tile-sm" style={{ '--sweep': '4.8s' } as React.CSSProperties}>
          <ThreadsLogo size={18} />
        </span>
      </Float>
      <Float k="event" delay={2.5} bob={9.6}>
        <span className="cos-stack">
          {stack.map((k) => {
            const event = EVENTS[k % EVENTS.length];
            const Icon = event.icon;
            return (
              <span className="cos-note cos-note-reply" data-depth={n - k} key={k}>
                <img className="cos-note-avatar" src={event.photo} alt="" />
                <span className="cos-note-text">
                  <strong>{event.name}</strong> {event.what}
                </span>
                <span className={`cos-note-icon cos-note-icon-${event.tone}`}>
                  <Icon size={13} strokeWidth={2.4} />
                </span>
              </span>
            );
          })}
        </span>
      </Float>
    </div>
  );
}

function Float({ k, delay, bob, children }: { k: string; delay: number; bob: number; children: React.ReactNode }) {
  return (
    <div
      className="cos-float"
      data-k={k}
      style={
        {
          '--in': `${600 + delay * 140}ms`,
          '--bob': `${bob}s`,
          '--bob-delay': `${-delay * 1.7}s`,
        } as React.CSSProperties
      }
    >
      <div className="cos-float-bob">{children}</div>
    </div>
  );
}
