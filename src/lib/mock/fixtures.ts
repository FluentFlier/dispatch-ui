import type { PlanId } from '@/lib/entitlements';

export const MOCK_USER = {
  id: 'ui-demo-user',
  email: 'alex@example.com',
  name: 'Alex Rivera',
};

export const MOCK_ADMIN = {
  id: 'ui-admin-user',
  email: 'admin@example.com',
  name: 'Admin User',
};

export const MOCK_WORKSPACE = {
  id: 'ws-demo-1',
  name: 'Alex Rivera',
  type: 'solo' as const,
  owner_user_id: MOCK_USER.id,
  role: 'owner',
};

const today = new Date();
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysAhead = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d).slice(0, 10);
};

export const MOCK_CREATOR_PROFILE = {
  user_id: MOCK_USER.id,
  display_name: 'Alex Rivera',
  bio_facts:
    'Founder at a B2B fintech startup. Writes about GTM, YC batches, and founder-led sales. Based in SF.',
  voice_description:
    'Direct, warm, founder-to-founder. Short sentences. Specific details over hype.',
  voice_rules: 'No em dashes. Reference the signal specifically. 2-4 sentences max.',
  content_pillars: [
    { name: 'GTM', color: '#E07A5F', description: 'Founder-led outreach and signals' },
    { name: 'Fintech', color: '#81B29A', description: 'Banking and treasury for startups' },
  ],
  onboarding_complete: true,
};

export const MOCK_SUBSCRIPTION = {
  user_id: MOCK_USER.id,
  plan: 'growth' as PlanId,
  status: 'active',
  trial_ends_at: daysAhead(14),
  stripe_subscription_id: null,
};

export const MOCK_POSTS = [
  {
    id: 'post-1',
    user_id: MOCK_USER.id,
    title: 'Why founder-led GTM beats spray-and-pray outbound',
    body: 'After 200 conversations with seed-stage founders, the pattern is clear...',
    pillar: 'GTM',
    status: 'scheduled',
    scheduled_date: daysAhead(2),
    platform: 'linkedin',
    updated_at: daysAgo(1),
    posted_date: null,
  },
  {
    id: 'post-2',
    user_id: MOCK_USER.id,
    title: 'Treasury ops for Series A teams',
    body: 'Most finance stacks break at $5M ARR. Here is what we changed...',
    pillar: 'Fintech',
    status: 'draft',
    scheduled_date: null,
    platform: 'linkedin',
    updated_at: daysAgo(0),
    posted_date: null,
  },
  {
    id: 'post-3',
    user_id: MOCK_USER.id,
    title: 'YC W26 fintech batch observations',
    body: 'Three trends from this batch that matter for B2B founders...',
    pillar: 'GTM',
    status: 'posted',
    scheduled_date: daysAgo(3).slice(0, 10),
    platform: 'linkedin',
    updated_at: daysAgo(3),
    posted_date: daysAgo(3).slice(0, 10),
  },
];

export const MOCK_IDEAS = [
  {
    id: 'idea-1',
    user_id: MOCK_USER.id,
    title: 'Thread: signal-based outreach playbook',
    pillar: 'GTM',
    priority: 1,
    converted: false,
  },
  {
    id: 'idea-2',
    user_id: MOCK_USER.id,
    title: 'Carousel: treasury checklist for seed stage',
    pillar: 'Fintech',
    priority: 2,
    converted: false,
  },
];

export const MOCK_SOCIAL_ACCOUNTS = [
  {
    user_id: MOCK_USER.id,
    platform: 'linkedin',
    connection_method: 'unipile',
    health_status: 'healthy',
  },
];

export const MOCK_LEADS = [
  {
    id: 'lead-1',
    company_name: 'Nova Finance',
    signal_summary: 'Joined Techstars fintech batch',
    status: 'new',
    score: 92,
    platform: 'linkedin',
    created_at: daysAgo(0),
  },
  {
    id: 'lead-2',
    company_name: 'Payflow',
    signal_summary: 'Raised $6M seed round',
    status: 'approved',
    score: 88,
    platform: 'x',
    created_at: daysAgo(1),
  },
];

export const MOCK_SIGNALS = [
  {
    id: 'sig-1',
    platform: 'linkedin',
    author_name: 'Nova Finance',
    author_handle: 'novafinance',
    content: 'Thrilled to share that Nova Finance is joining the Techstars fintech batch.',
    created_at: daysAgo(0),
  },
];

export const MOCK_TABLES: Record<string, Record<string, unknown>[]> = {
  creator_profile: [MOCK_CREATOR_PROFILE],
  subscriptions: [MOCK_SUBSCRIPTION],
  posts: MOCK_POSTS,
  content_ideas: MOCK_IDEAS,
  social_accounts: MOCK_SOCIAL_ACCOUNTS,
  workspace_members: [
    { user_id: MOCK_USER.id, workspace_id: MOCK_WORKSPACE.id, role: 'owner' },
  ],
  workspaces: [MOCK_WORKSPACE],
  publish_jobs: [],
  detected_trends: [],
  series: [],
  videos: [],
  leads: MOCK_LEADS,
  signals: MOCK_SIGNALS,
};
