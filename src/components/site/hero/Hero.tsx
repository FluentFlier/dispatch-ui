import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ProductDemo } from '../demo/ProductDemo';
import { InstagramLogo, LinkedInLogo, ThreadsLogo, TikTokLogo, XLogo } from '../brand/Logos';
import { Floaters } from './Floaters';
import { SkyField } from './SkyField';

export function Hero({ cta }: { cta: { href: string; label: string } }) {
  return (
    <section className="cos-hero" aria-labelledby="cos-hero-title">
      <div className="cos-panel" aria-hidden="true">
        <SkyField />
      </div>
      <Floaters />

      <div className="cos-hero-copy">
        <Link href="/roadmap" className="cos-news cos-rise" style={{ ['--d' as string]: 0 }}>
          <span className="cos-news-logos">
            <InstagramLogo size={14} />
            <TikTokLogo size={14} />
          </span>
          Instagram and TikTok are coming soon
          <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" />
        </Link>

        <h1 id="cos-hero-title" className="cos-hero-title">
          <span className="cos-line cos-rise" style={{ ['--d' as string]: 1 }}>
            Content and leads.
          </span>
          <span className="cos-line cos-rise" style={{ ['--d' as string]: 2 }}>
            One{' '}
            <span className="cos-loop">
              loop.
              <svg className="cos-loop-mark" viewBox="0 0 220 110" preserveAspectRatio="none" aria-hidden="true">
                <path
                  pathLength={1}
                  d="M16 66 C 10 28, 74 10, 128 14 C 186 18, 214 44, 204 70 C 194 96, 120 104, 70 98 C 26 92, 4 74, 22 52 C 34 38, 60 32, 92 30"
                />
              </svg>
            </span>
          </span>
        </h1>

        <p className="cos-hero-sub cos-rise" style={{ ['--d' as string]: 3 }}>
          ContentOS drafts posts in your voice for{' '}
          <span className="cos-plat">
            <span className="cos-plat-mark">
              <LinkedInLogo size={13} />
            </span>
            LinkedIn<span className="cos-plat-punct">,</span>
          </span>{' '}
          <span className="cos-plat">
            <span className="cos-plat-mark">
              <XLogo size={11} />
            </span>
            X
          </span>{' '}
          and{' '}
          <span className="cos-plat">
            <span className="cos-plat-mark">
              <ThreadsLogo size={13} />
            </span>
            Threads<span className="cos-plat-punct">.</span>
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
