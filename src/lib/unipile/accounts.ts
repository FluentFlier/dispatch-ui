import { getServerClient, getServiceClient } from '@/lib/insforge/server';
import { ensureSoloWorkspace } from '@/lib/workspace';
import { fetchUnipileAccountDetails, mapPlatform } from '@/lib/social/unipile';
import { unipoleFetch } from '@/lib/social/unipile';

export interface UnipileListedAccount {
  id: string;
  type?: string;
  provider?: string;
  username?: string;
  name?: string;
  created_at?: string;
  connection_params?: {
    im?: { username?: string; publicIdentifier?: string };
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUnipileHostedUserId(name: string | null | undefined): boolean {
  return Boolean(name && UUID_RE.test(name.trim()));
}

export async function listUnipileAccounts(): Promise<UnipileListedAccount[]> {
  const res = await unipoleFetch('/accounts', { method: 'GET' });
  if (!res.ok) return [];

  const rawData = (await res.json()) as Record<string, unknown>;
  return (
    (rawData.items as UnipileListedAccount[] | undefined) ??
    (rawData.accounts as UnipileListedAccount[] | undefined) ??
    (rawData.data as UnipileListedAccount[] | undefined) ??
    []
  );
}

export async function deleteUnipileAccount(unipileAccountId: string): Promise<boolean> {
  try {
    const res = await unipoleFetch(`/accounts/${encodeURIComponent(unipileAccountId)}`, {
      method: 'DELETE',
    });
    return res.ok || res.status === 404;
  } catch {
    return false;
  }
}

function platformFromUnipileAccount(account: UnipileListedAccount): string | null {
  const providerRaw = (account.type ?? account.provider ?? '').toLowerCase();
  return mapPlatform(providerRaw);
}

/**
 * Upserts one social_accounts row for a user from a Unipile account id.
 * Shared by hosted-auth notify (CREATION_SUCCESS) and account.connected webhooks.
 */
export async function storeUnipileAccountForUser(
  userId: string,
  unipileAccountId: string,
  hint?: { platform?: string; accountName?: string | null; accountId?: string | null },
): Promise<void> {
  const serviceClient = getServiceClient();
  const workspaceId = (await ensureSoloWorkspace(userId)).id;

  let platform = hint?.platform ?? null;
  let accountName = hint?.accountName ?? null;
  let accountId = hint?.accountId ?? null;

  const full = await fetchUnipileAccountDetails(unipileAccountId);
  if (full) {
    if (!platform) {
      const providerRaw = (full as { type?: string; provider?: string }).type
        ?? (full as { provider?: string }).provider
        ?? '';
      platform = mapPlatform(String(providerRaw).toLowerCase()) ?? platform;
    }
    accountName =
      accountName ??
      full.name ??
      full.connection_params?.im?.username ??
      full.username ??
      null;
    accountId =
      accountId ??
      full.connection_params?.im?.publicIdentifier ??
      full.username ??
      null;
  }

  if (!platform) return;

  await serviceClient.database.from('social_accounts').upsert(
    {
      workspace_id: workspaceId,
      user_id: userId,
      platform,
      unipile_account_id: unipileAccountId,
      account_name: accountName,
      account_id: accountId,
      access_token: '',
      connection_method: 'unipile',
      connected_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,platform' },
  );
}

export async function getUserUnipileLinks(userId: string): Promise<
  Array<{ platform: string; unipile_account_id: string }>
> {
  const client = getServerClient();
  const { data } = await client.database
    .from('social_accounts')
    .select('platform, unipile_account_id')
    .eq('user_id', userId)
    .not('unipile_account_id', 'is', null);

  return (data ?? []).filter(
    (row): row is { platform: string; unipile_account_id: string } =>
      Boolean((row as { unipile_account_id?: string }).unipile_account_id),
  );
}

/** Prefer reconnect when every supported platform is already linked. */
export function resolveHostedAuthMode(
  links: Array<{ platform: string; unipile_account_id: string }>,
):
  | { type: 'create'; providers: Array<'LINKEDIN' | 'TWITTER'> }
  | { type: 'reconnect'; reconnect_account: string } {
  const hasLinkedin = links.some((l) => l.platform === 'linkedin');
  const hasTwitter = links.some((l) => l.platform === 'twitter');

  if (!hasLinkedin || !hasTwitter) {
    const providers: Array<'LINKEDIN' | 'TWITTER'> = [];
    if (!hasLinkedin) providers.push('LINKEDIN');
    if (!hasTwitter) providers.push('TWITTER');
    return { type: 'create', providers };
  }

  const reconnectRow =
    links.find((l) => l.platform === 'linkedin') ??
    links.find((l) => l.platform === 'twitter');
  return {
    type: 'reconnect',
    reconnect_account: reconnectRow!.unipile_account_id,
  };
}

export function pickRecentUnclaimedAccounts(
  accounts: UnipileListedAccount[],
  claimedByOthers: Set<string>,
  sinceMs: number,
  maxAgeMs = 20 * 60 * 1000,
): UnipileListedAccount[] {
  const now = Date.now();
  return accounts.filter((account) => {
    if (claimedByOthers.has(account.id)) return false;
    if (!account.created_at) return false;
    const created = new Date(account.created_at).getTime();
    if (Number.isNaN(created)) return false;
    return created >= sinceMs && now - created <= maxAgeMs;
  });
}

export function platformFromListedAccount(account: UnipileListedAccount): string | null {
  return platformFromUnipileAccount(account);
}
