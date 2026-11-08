'use client';

import type { FunnelState } from '@/lib/funnel-cta';
import { SiteHome } from '@/components/site/SiteHome';

interface Props {
  funnel: FunnelState;
}

export default function LandingPageContent({ funnel }: Props) {
  return <SiteHome funnel={funnel} />;
}
