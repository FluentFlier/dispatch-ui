import type { Metadata } from 'next';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { getOrCreateSubscription } from '@/lib/entitlements';
import { ForGrokBot } from '@/components/site/pages/ForGrokBot';
import type { FunnelState } from '@/lib/funnel-cta';

const TITLE = 'ContentOS for Grok Bot';
const DESCRIPTION =
  'Connect ContentOS to your Grok Bot as a custom connector. It drafts posts in your voice, and nothing publishes until you say so.';

// the page's own share card: its hero scene (animations/grok-hero.ts) without its title and line, at
// 1.3x, on the page's paper (animations/og-paper.ts), the settled lockup centred; the image is that lockup
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/for/grok-bot',
    siteName: 'ContentOS',
    type: 'website',
    images: [{ url: '/og/grok-bot.jpg', width: 1200, height: 630, alt: 'The ContentOS paper plane, an X, and the Grok Bot.' }],
    // crawlers need the video's URL absolute; Next leaves it as given
    videos: [{ url: new URL('/og/grok-bot.mp4', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), width: 1200, height: 630, type: 'video/mp4' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og/grok-bot.jpg'] },
};

export default async function ForGrokBotPage() {
  const user = await getAuthenticatedUser();
  const loggedIn = Boolean(user);

  let onboardingComplete = false;
  let sub: FunnelState['sub'] = null;

  if (user) {
    const client = getServerClient();
    const [profileRes, subscription] = await Promise.all([
      client.database.from('creator_profile').select('onboarding_complete').eq('user_id', user.id).maybeSingle(),
      getOrCreateSubscription(user.id),
    ]);
    onboardingComplete = Boolean(profileRes.data?.onboarding_complete);
    sub = subscription;
  }

  return <ForGrokBot funnel={{ loggedIn, onboardingComplete, sub }} />;
}
