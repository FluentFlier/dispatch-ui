import { getUnipileApiBase, getUnipileApiKey, isUnipileConfigured, pingUnipileApi } from '@/lib/unipile/config';
import { getSocialProviderMode } from '@/lib/env';

export interface UnipileHealthReport {
  status: 'ok' | 'missing' | 'degraded' | 'error';
  timestamp: string;
  provider: string;
  config: {
    api_key: 'ok' | 'missing';
    dsn: 'ok' | 'missing';
    webhook_secret: 'ok' | 'missing';
    app_url: 'ok' | 'missing';
  };
  api: 'ok' | 'error' | 'skipped';
  connect_route: string;
  sync_route: string;
  webhook_route: string;
  message: string;
}

export async function buildUnipileHealthReport(opts?: { live?: boolean }): Promise<UnipileHealthReport> {
  const live = opts?.live ?? false;
  const apiKey = getUnipileApiKey();
  const apiBase = getUnipileApiBase();
  const webhookSecret = process.env.UNIPILE_WEBHOOK_SECRET?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  const config = {
    api_key: apiKey ? ('ok' as const) : ('missing' as const),
    dsn: apiBase ? ('ok' as const) : ('missing' as const),
    webhook_secret: webhookSecret ? ('ok' as const) : ('missing' as const),
    app_url: appUrl ? ('ok' as const) : ('missing' as const),
  };

  if (getSocialProviderMode() !== 'unipile' || !isUnipileConfigured()) {
    return {
      status: 'missing',
      timestamp: new Date().toISOString(),
      provider: getSocialProviderMode(),
      config,
      api: 'skipped',
      connect_route: '/api/social-accounts/connect/unipile',
      sync_route: '/api/social-accounts/sync',
      webhook_route: '/api/webhooks/unipile',
      message: 'Unipile not configured. Set UNIPILE_API_KEY and UNIPILE_DSN.',
    };
  }

  let api: UnipileHealthReport['api'] = 'skipped';
  if (live) {
    api = await pingUnipileApi();
  }

  const webhookMissingInProd =
    process.env.NODE_ENV === 'production' && !webhookSecret;

  let status: UnipileHealthReport['status'] = 'ok';
  if (api === 'error') status = 'error';
  else if (webhookMissingInProd) status = 'degraded';

  const message = webhookMissingInProd
    ? 'Unipile API configured. Webhook secret missing — connect still works via success-redirect sync, but set UNIPILE_WEBHOOK_SECRET for automatic account storage.'
    : api === 'error'
      ? 'Unipile credentials set but API ping failed — check UNIPILE_DSN and API key.'
      : live
        ? 'Unipile API reachable. Users connect LinkedIn via Settings → Connect accounts.'
        : 'Unipile configured. Add ?live=true (cron auth) to ping the API.';

  return {
    status,
    timestamp: new Date().toISOString(),
    provider: 'unipile',
    config,
    api,
    connect_route: '/api/social-accounts/connect/unipile',
    sync_route: '/api/social-accounts/sync',
    webhook_route: '/api/webhooks/unipile',
    message,
  };
}
