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
            Grow beyond
          </span>
          <span className="cos-line cos-rise" style={{ ['--d' as string]: 2 }}>
            word of mouth.
          </span>
        </h1>

        <p className="cos-hero-sub cos-rise" style={{ ['--d' as string]: 3 }}>
          Create and publish content in your voice, find potential customers, and start conversations across{' '}
          <span className="cos-nowrap">
            <PlatformIcon name="linkedin" />,
          </span>{' '}
          <PlatformIcon name="x" /> and{' '}
          <span className="cos-nowrap">
            <PlatformIcon name="threads" />.
          </span>
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
