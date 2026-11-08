import Link from 'next/link';
import { ProductDemo } from '../demo/ProductDemo';
import { DotField } from './DotField';

export function Hero({ cta }: { cta: { href: string; label: string } }) {
  return (
    <section className="cos-hero" aria-labelledby="cos-hero-title">
      <DotField />
      <div className="cos-hero-copy">
        <h1 id="cos-hero-title" className="cos-hero-title cos-rise" style={{ ['--d' as string]: 0 }}>
          Content and leads. One loop.
        </h1>
        <p className="cos-hero-sub cos-rise" style={{ ['--d' as string]: 1 }}>
          ContentOS drafts posts in your voice. You approve. It publishes to LinkedIn, X and Threads, works the
          replies, and shows you which conversations are turning into customers.
        </p>
        <div className="cos-hero-actions cos-rise" style={{ ['--d' as string]: 2 }}>
          <Link href={cta.href} className="cos-btn cos-btn-metal">
            <span>{cta.label}</span>
          </Link>
          <Link href="/book-demo" className="cos-btn cos-btn-silver">
            <span>Book a call</span>
          </Link>
        </div>
      </div>

      <div className="cos-hero-demo cos-rise" style={{ ['--d' as string]: 3 }}>
        <ProductDemo />
      </div>
    </section>
  );
}
