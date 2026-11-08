'use client';

import { useEffect, useRef } from 'react';
import { CalendarCheck, Heart, MessageCircle } from 'lucide-react';
import { LinkedInLogo, ThreadsLogo, XLogo } from '../brand/Logos';

/**
 * Pieces of the loop drifting in the sky at the edges of the hero: the
 * networks, a scheduled post, a reaction, a reply. Each sits at its own depth
 * and leans with the cursor, nearer pieces further.
 */
export function Floaters() {
  const rootRef = useRef<HTMLDivElement>(null);

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
      <Float x="6%" y="25%" depth={1} delay={0} bob={7.2}>
        <span className="cos-tile cos-tile-lg">
          <LinkedInLogo size={30} />
        </span>
      </Float>
      <Float x="15.5%" y="15%" depth={0.35} delay={1} bob={8.4} far>
        <span className="cos-bubble cos-bubble-heart">
          <Heart size={17} strokeWidth={2.4} fill="currentColor" />
        </span>
      </Float>
      <Float x="12.5%" y="47%" depth={0.7} delay={2} bob={9.6}>
        <span className="cos-note">
          <span className="cos-note-icon cos-note-icon-blue">
            <CalendarCheck size={14} strokeWidth={2.2} />
          </span>
          Scheduled for Thu, 9:00 AM
        </span>
      </Float>

      <Float x="88%" y="24%" depth={0.85} delay={0.5} bob={8}>
        <span className="cos-tile cos-tile-lg cos-tile-ink">
          <XLogo size={24} />
        </span>
      </Float>
      <Float x="94%" y="38%" depth={0.3} delay={1.5} bob={10} far>
        <span className="cos-tile cos-tile-sm">
          <ThreadsLogo size={18} />
        </span>
      </Float>
      <Float x="86.5%" y="56%" depth={1} delay={2.5} bob={7.8}>
        <span className="cos-note cos-note-reply">
          <span className="cos-note-avatar">PS</span>
          <span className="cos-note-text">
            <strong>Priya Shah</strong> replied to your post
          </span>
          <span className="cos-note-icon cos-note-icon-apricot">
            <MessageCircle size={13} strokeWidth={2.4} />
          </span>
        </span>
      </Float>
    </div>
  );
}

function Float({
  x,
  y,
  depth,
  delay,
  bob,
  far,
  children,
}: {
  x: string;
  y: string;
  depth: number;
  delay: number;
  bob: number;
  far?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="cos-float"
      data-far={far}
      style={
        {
          left: x,
          top: y,
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
