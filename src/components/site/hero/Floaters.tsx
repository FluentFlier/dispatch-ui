'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarCheck, Check, Heart, MessageCircle, Phone, ThumbsUp } from 'lucide-react';
import { LinkedInLogo, ThreadsLogo, XLogo } from '../brand/Logos';

/**
 * Pieces of the loop drifting in the sky around the hero: the networks, a
 * post going out, and what comes back. Each sits at its own depth and leans
 * with the cursor. The notification and the post chip are live: they cycle
 * through what ContentOS surfaces during a week. Sample people, fictional.
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

function useCycle(length: number, every: number, offset = 0) {
  const [i, setI] = useState(0);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let swap = 0;
    let timer = 0;
    const tick = () => {
      setLeaving(true);
      swap = window.setTimeout(() => {
        setI((v) => (v + 1) % length);
        setLeaving(false);
      }, 260);
      timer = window.setTimeout(tick, every);
    };
    timer = window.setTimeout(tick, every + offset);
    return () => {
      clearTimeout(timer);
      clearTimeout(swap);
    };
  }, [length, every, offset]);
  return [i, leaving] as const;
}

export function Floaters() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ev, evLeaving] = useCycle(EVENTS.length, 4200, 2400);
  const [post, postLeaving] = useCycle(POSTS.length, 5200);
  const event = EVENTS[ev];
  const p = POSTS[post];
  const EventIcon = event.icon;
  const PostIcon = p.icon;

  useEffect(() => {
    const root = rootRef.current;
    const hero = root?.parentElement;
    if (!root || !hero) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / Math.min(r.height, window.innerHeight) - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        root.style.setProperty('--px', x.toFixed(3));
        root.style.setProperty('--py', y.toFixed(3));
      });
    };
    const onLeave = () => {
      root.style.setProperty('--px', '0');
      root.style.setProperty('--py', '0');
    };
    hero.addEventListener('pointermove', onMove);
    hero.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      hero.removeEventListener('pointermove', onMove);
      hero.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div ref={rootRef} className="cos-floaters" aria-hidden="true">
      <Float k="li" depth={1} delay={0} bob={7.2}>
        <span className="cos-tile cos-tile-lg">
          <LinkedInLogo size={30} />
        </span>
      </Float>
      <Float k="heart" depth={0.35} delay={1} bob={8.4} far>
        <span className="cos-bubble cos-bubble-heart" data-pop={ev === 1 && !evLeaving}>
          <Heart size={17} strokeWidth={2.4} fill="currentColor" />
        </span>
      </Float>
      <Float k="post" depth={0.7} delay={2} bob={9.6}>
        <span className="cos-note" data-leaving={postLeaving} key={post}>
          <span className={`cos-note-icon cos-note-icon-${p.tone}`}>
            <PostIcon size={14} strokeWidth={2.3} />
          </span>
          {p.text}
        </span>
      </Float>

      <Float k="x" depth={0.85} delay={0.5} bob={8}>
        <span className="cos-tile cos-tile-lg cos-tile-ink">
          <XLogo size={24} />
        </span>
      </Float>
      <Float k="threads" depth={0.3} delay={1.5} bob={10} far>
        <span className="cos-tile cos-tile-sm">
          <ThreadsLogo size={18} />
        </span>
      </Float>
      <Float k="event" depth={1} delay={2.5} bob={7.8}>
        <span className="cos-note cos-note-reply" data-leaving={evLeaving} key={ev}>
          <img className="cos-note-avatar" src={event.photo} alt="" />
          <span className="cos-note-text">
            <strong>{event.name}</strong> {event.what}
          </span>
          <span className={`cos-note-icon cos-note-icon-${event.tone}`}>
            <EventIcon size={13} strokeWidth={2.4} />
          </span>
        </span>
      </Float>
    </div>
  );
}

function Float({
  k,
  depth,
  delay,
  bob,
  far,
  children,
}: {
  k: string;
  depth: number;
  delay: number;
  bob: number;
  far?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="cos-float"
      data-k={k}
      data-far={far}
      style={
        {
          '--depth': depth,
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
