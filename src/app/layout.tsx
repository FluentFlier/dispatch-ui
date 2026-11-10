import type { Metadata } from 'next';
import { DM_Sans, Fraunces, Hanken_Grotesk, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';
import { PRODUCT_NAME, SITE_TITLE } from '@/lib/brand';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const SITE_DESC =
  'Create in your voice, publish to LinkedIn and X, reply faster, and turn the response into what you do next.';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: SITE_TITLE,
  description: SITE_DESC,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: '/',
    siteName: PRODUCT_NAME,
    type: 'website',
    // the share card, in the closing band's world: the plane races into the painted riverside, hits
    // the sun, paint blooms back across the scene, and it lands as the lockup's mark over the promise
    // (animations/og-card.ts); the image is the video's last frame
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'The ContentOS mark and name over a painted riverside of stone steps at sunset, its edges breaking into halftone dots, above the line Grow beyond word of mouth.',
      },
    ],
    // Next leaves video URLs as given, and crawlers need them absolute
    videos: [{ url: new URL('/og.mp4', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), width: 1200, height: 630, type: 'video/mp4' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESC,
    images: ['/og.jpg'],
  },
};

// Mona Sans (OFL, GitHub), the marketing site's face; latin, weight 200-900 and width 75-125%
const mona = localFont({
  src: './fonts/mona-sans-latin.woff2',
  variable: '--font-mona',
  weight: '200 900',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 125%' }],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`scroll-smooth ${dmSans.variable} ${fraunces.variable} ${hanken.variable} ${jetbrains.variable} ${instrument.variable} ${GeistSans.variable} ${GeistMono.variable} ${mona.variable}`}
    >
      <body className={dmSans.className}>{children}</body>
    </html>
  );
}
