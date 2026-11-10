import type { Metadata } from 'next';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { getOrCreateSubscription } from '@/lib/entitlements';
import { ForGrokBot } from '@/components/site/pages/ForGrokBot';
import type { FunnelState } from '@/lib/funnel-cta';

export const metadata: Metadata = {
  title: 'ContentOS for Grok Bot',
  description:
    'Connect ContentOS to your Grok Bot as a custom connector. It drafts posts in your voice, and nothing publishes until you say so.',
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
