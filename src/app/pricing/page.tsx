import type { Metadata } from 'next';
import { getAuthenticatedUser, getServerClient } from '@/lib/insforge/server';
import { getOrCreateSubscription } from '@/lib/entitlements';
import { Pricing } from '@/components/site/pages/Pricing';
import type { FunnelState } from '@/lib/funnel-cta';

export const metadata: Metadata = {
  title: 'ContentOS pricing',
  description:
    '$1,000 per account per month. One LinkedIn, one X and one Threads profile per account, every feature included.',
};

export default async function PricingPage() {
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

  return <Pricing funnel={{ loggedIn, onboardingComplete, sub }} />;
}
