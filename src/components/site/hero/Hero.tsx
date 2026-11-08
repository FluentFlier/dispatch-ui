import Link from 'next/link';
import { ProductDemo } from '../demo/ProductDemo';
import { PlatformIcon } from '../brand/Logos';
import { HeroLoop } from './HeroLoop';
import { SkyField } from './SkyField';

export function Hero({ cta }: { cta: { href: string; label: string } }) {
  return (
    <section className="cos-hero" aria-labelledby="cos-hero-title">
      <div className="cos-panel" aria-hidden="true">
        <SkyField />
      </div>
      <HeroLoop />

      <div className="cos-hero-copy">
        <h1 id="cos-hero-title" className="cos-hero-title">
          <span className="cos-line cos-rise" style={{ ['--d' as string]: 1 }}>
            Content and leads.
          </span>
          <span className="cos-line cos-rise" style={{ ['--d' as string]: 2 }}>
            One{' '}
            <span className="cos-loop">
              loop.
              <svg className="cos-loop-mark" viewBox="0 0 240 44" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength={1} d="M6 30 C 48 36, 92 36, 118 28 C 140 21, 146 6, 132 5 C 117 4, 117 24, 138 31 C 166 39, 204 35, 234 26" />
              </svg>
            </span>
          </span>
        </h1>

        <p className="cos-hero-sub cos-rise" style={{ ['--d' as string]: 3 }}>
          ContentOS drafts posts in your voice for{' '}
          <span className="cos-nowrap">
            <PlatformIcon name="linkedin" />,
          </span>{' '}
          <PlatformIcon name="x" /> and{' '}
          <span className="cos-nowrap">
            <PlatformIcon name="threads" />.
          </span>{' '}
          You approve. It publishes, works the replies, and shows you which conversations are turning into customers.
        </p>

        <div className="cos-hero-actions cos-rise" style={{ ['--d' as string]: 4 }}>
          <Link href={cta.href} className="cos-btn cos-btn-metal">
            <span>{cta.label}</span>
          </Link>
          <Link href="/book-demo" className="cos-btn cos-btn-silver">
            <span>Book a call</span>
          </Link>
        </div>
      </div>

      <div className="cos-hero-demo cos-rise" style={{ ['--d' as string]: 5 }}>
        <ProductDemo />
      </div>
    </section>
  );
}
