import { useId } from 'react';
import { IconBrandThreads } from '@tabler/icons-react';

/** Platform marks in brand color. LinkedIn and X are the official glyphs; Threads is Tabler's. */

export function LinkedInLogo({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}

export function XLogo({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}

export function ThreadsLogo({ size = 16, className }: { size?: number; className?: string }) {
  return <IconBrandThreads size={size} stroke={2} aria-hidden="true" className={className} />;
}

export function InstagramLogo({ size = 16, className }: { size?: number; className?: string }) {
  const id = `ig${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={id} x1="0.1" y1="1" x2="0.9" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.3" stopColor="#FA7E1E" />
          <stop offset="0.6" stopColor="#D62976" />
          <stop offset="0.85" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.5" fill="none" stroke={`url(#${id})`} strokeWidth="2.1" />
      <circle cx="12" cy="12" r="4.3" fill="none" stroke={`url(#${id})`} strokeWidth="2.1" />
      <circle cx="17.4" cy="6.6" r="1.25" fill={`url(#${id})`} />
    </svg>
  );
}

const TIKTOK =
  'M21 7.917v4.034a9.948 9.948 0 0 1 -5 -1.951v4.5a6.5 6.5 0 1 1 -8 -6.326v4.326a2.5 2.5 0 1 0 4 2v-11.5h4.083a6.005 6.005 0 0 0 4.917 4.917z';

export function TikTokLogo({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={TIKTOK} fill="#25F4EE" transform="translate(-0.9 -0.7)" />
      <path d={TIKTOK} fill="#FE2C55" transform="translate(0.9 0.7)" />
      <path d={TIKTOK} fill="#111111" />
    </svg>
  );
}

const PLATFORMS = {
  linkedin: { label: 'LinkedIn' },
  x: { label: 'X' },
  threads: { label: 'Threads' },
} as const;

/**
 * A platform as its app icon, inline in copy. LinkedIn and X use the brand
 * images from /images/brands (as on the current site); Threads is drawn to
 * match the X tile.
 */
export function PlatformIcon({ name }: { name: keyof typeof PLATFORMS }) {
  const label = PLATFORMS[name].label;
  return (
    <span className="cos-app-icon" data-p={name}>
      {name === 'linkedin' && <img src="/images/brands/linkedin.png" alt={label} width={24} height={24} />}
      {name === 'x' && <img src="/images/brands/x.png" alt={label} width={20} height={20} />}
      {name === 'threads' && (
        <span className="cos-app-icon-tile" role="img" aria-label={label}>
          <ThreadsLogo size={14} />
        </span>
      )}
    </span>
  );
}
