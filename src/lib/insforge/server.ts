import { cookies } from 'next/headers';
import { applyImpersonation, type EffectiveUser } from '@/lib/admin/impersonation';
import { MOCK_ADMIN, MOCK_USER } from '@/lib/mock/fixtures';
import { createMockInsforgeClient } from '@/lib/mock/db-client';

const UI_MOCK_LOGGED_IN = process.env.NEXT_PUBLIC_UI_MOCK_LOGGED_IN !== 'false';

export function getServiceClient() {
  return createMockInsforgeClient();
}

export function getServerClient() {
  return createMockInsforgeClient();
}

export async function getSessionUser(): Promise<{ id: string; email: string; name?: string } | null> {
  if (!UI_MOCK_LOGGED_IN) return null;
  const cookieStore = cookies();
  const isAdmin = cookieStore.get('ui-mock-admin')?.value === '1';
  return isAdmin ? MOCK_ADMIN : MOCK_USER;
}

export async function getAuthenticatedUser(): Promise<EffectiveUser | null> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;
  return applyImpersonation(sessionUser);
}
