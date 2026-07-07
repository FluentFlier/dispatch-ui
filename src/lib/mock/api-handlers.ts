import { NextRequest, NextResponse } from 'next/server';
import {
  MOCK_CREATOR_PROFILE,
  MOCK_IDEAS,
  MOCK_LEADS,
  MOCK_POSTS,
  MOCK_SIGNALS,
  MOCK_SOCIAL_ACCOUNTS,
  MOCK_SUBSCRIPTION,
  MOCK_USER,
  MOCK_WORKSPACE,
} from '@/lib/mock/fixtures';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleMockApi(req: NextRequest, path: string[], method: string): NextResponse {
  const route = path.join('/');

  if (route === 'auth/session' && method === 'GET') {
    return json({
      authenticated: true,
      hasRefreshToken: true,
      accessExpiresAt: Math.floor(Date.now() / 1000) + 3600,
      user: MOCK_USER,
      profile: {
        displayName: MOCK_CREATOR_PROFILE.display_name,
        contentPillars: MOCK_CREATOR_PROFILE.content_pillars,
        onboardingComplete: true,
        headline: 'Founder at a B2B fintech startup',
      },
      entitlements: {
        plan: 'growth',
        status: 'active',
        limits: { connectedAccounts: 10, publishesPerMonth: 300, scheduledPerMonth: 300, aiGenerationsPerMonth: 1000, canPublish: true, canSchedule: true },
        usage: { publishes: 12, scheduled: 4, aiGenerations: 38 },
        isPaid: true,
      },
      preferredPostLength: 'standard',
      trial: { active: true, expired: false, daysLeft: 14, endsAt: MOCK_SUBSCRIPTION.trial_ends_at },
    });
  }

  if (route === 'auth' && method === 'DELETE') {
    return json({ ok: true });
  }

  if (route === 'auth/refresh' && method === 'POST') {
    return json({ ok: true });
  }

  if (route === 'health' && method === 'GET') {
    return json({ ok: true, deploymentId: 'ui-mock', mode: 'design' });
  }

  if (route === 'entitlements' && method === 'GET') {
    return json({
      plan: 'growth',
      status: 'active',
      limits: { connectedAccounts: 10, publishesPerMonth: 300, scheduledPerMonth: 300, aiGenerationsPerMonth: 1000, canPublish: true, canSchedule: true },
      usage: { publishes: 12, scheduled: 4, aiGenerations: 38 },
      isPaid: true,
    });
  }

  if (route === 'preferences' && method === 'GET') {
    return json({ preferred_post_length: 'standard', default_platform: 'linkedin' });
  }

  if (route === 'preferences' && method === 'PUT') {
    return json({ ok: true });
  }

  if (route === 'posts' && method === 'GET') {
    return json({ posts: MOCK_POSTS, total: MOCK_POSTS.length, page: 1, limit: 20 });
  }

  if (route === 'posts' && method === 'POST') {
    return json({ id: 'post-new', status: 'draft' }, 201);
  }

  if (route.startsWith('posts/') && method === 'GET') {
    const id = route.split('/')[1];
    const post = MOCK_POSTS.find((p) => p.id === id) ?? MOCK_POSTS[0];
    return json(post);
  }

  if (route.startsWith('posts/') && (method === 'DELETE' || method === 'PATCH' || method === 'PUT')) {
    return json({ ok: true });
  }

  if (route.endsWith('/unschedule') && method === 'POST') {
    return json({ ok: true });
  }

  if (route === 'social-accounts' && method === 'GET') {
    return json({ accounts: MOCK_SOCIAL_ACCOUNTS });
  }

  if (route === 'social-accounts/sync' && method === 'POST') {
    return json({ ok: true });
  }

  if (route.startsWith('social-accounts/') && method === 'DELETE') {
    return json({ ok: true });
  }

  if (route === 'workspaces' && method === 'GET') {
    return json({ workspaces: [MOCK_WORKSPACE], activeWorkspaceId: MOCK_WORKSPACE.id });
  }

  if (route === 'workspaces' && method === 'POST') {
    return json({ workspace: MOCK_WORKSPACE });
  }

  if (route === 'leads/feed' && method === 'GET') {
    return json({ items: MOCK_LEADS, nextCursor: null });
  }

  if (route === 'leads/bootstrap' && method === 'GET') {
    return json({ counts: { new: 1, approved: 1, sent: 0, dismissed: 0 }, settings: { timezone: 'America/Los_Angeles' } });
  }

  if (route === 'leads' && method === 'GET') {
    return json({ leads: MOCK_LEADS });
  }

  if (route === 'leads/settings' && method === 'PUT') {
    return json({ ok: true });
  }

  if (route === 'leads/icp/chat' && method === 'POST') {
    return json({
      reply: 'Mock ICP assistant: targeting seed-stage fintech founders raising or joining accelerators.',
      suggestions: ['YC / Techstars batch joins', 'Seed round announcements', 'Treasury pain posts'],
    });
  }

  if (route === 'signals/sources' && method === 'GET') {
    return json({ sources: [{ id: 'src-1', platform: 'linkedin', label: 'LinkedIn keywords', enabled: true }] });
  }

  if (route === 'signals/safety' && method === 'GET') {
    return json({ requireApproval: true, dailyCap: 25, quietHours: { start: '21:00', end: '08:00' } });
  }

  if (route === 'signals/safety' && method === 'PUT') {
    return json({ ok: true });
  }

  if (route === 'signals/linkedin' && method === 'GET') {
    return json({ connected: true, accountLabel: 'Alex Rivera' });
  }

  if (route === 'signals/integrations' && method === 'GET') {
    return json({ composio: { gmail: false, calendar: false } });
  }

  if (route === 'signals/rules' && method === 'GET') {
    return json({ rules: [{ id: 'rule-1', name: 'YC / accelerator joins', enabled: true, priority: 1 }] });
  }

  if (route === 'signals/rules' && method === 'POST') {
    return json({ id: 'rule-new' }, 201);
  }

  if (route.startsWith('signals/rules/') && (method === 'PATCH' || method === 'DELETE')) {
    return json({ ok: true });
  }

  if (route === 'onboarding/status' && method === 'GET') {
    return json({ complete: true, step: 'done' });
  }

  if (route === 'onboarding/ingest' && method === 'POST') {
    return json({ ok: true });
  }

  if (route === 'upload' && method === 'POST') {
    return json({ url: '/images/landing/hero.png', key: 'mock-upload' });
  }

  if (route === 'voice-drift' && method === 'GET') {
    return json({ score: 0.86, drifted: false, samples: 12 });
  }

  if (route === 'billing/portal' && method === 'POST') {
    return json({ url: 'https://example.com/billing' });
  }

  if (route === 'publish' && method === 'POST') {
    return json({ ok: true, jobIds: ['job-1'] });
  }

  if (route === 'brain/sync' && method === 'POST') {
    return json({ ok: true });
  }

  if (route === 'trends/detect' && method === 'POST') {
    return json({ trends: [{ title: 'Founder-led GTM', score: 0.91 }] });
  }

  if (route.startsWith('integrations/composio/link') && method === 'GET') {
    return json({ url: '/settings' });
  }

  if (route.startsWith('admin/')) {
    return json({ ok: true, mode: 'design-mock' });
  }

  if (route.includes('generate') || route.includes('humanize') || route.includes('optimize')) {
    return json({
      output: 'Mock generated copy for design preview. Replace styling without touching production backend.',
      variants: ['Variant A', 'Variant B'],
    });
  }

  return json({ ok: true, route, method, data: [], message: 'UI mock API — no backend attached' });
}
