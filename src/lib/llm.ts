import { checkGlobalLlmBudget } from '@/lib/llm-budget';

/**
 * Provider-agnostic LLM client (OpenAI-compatible `/chat/completions`).
 *
 * Configure via env (see .env.example):
 *   LLM_BASE_URL  e.g. https://api.openai.com/v1
 *   LLM_API_KEY   provider key (OpenAI sk-...)
 *   LLM_MODEL     e.g. gpt-4o-mini
 */

export const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com/v1';
export const OPENAI_DEFAULT_CHAT_MODEL = 'gpt-4o-mini';

const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;

/** How many times to retry a 429 (rate limit) before giving up. */
const MAX_RATE_LIMIT_RETRIES = 4;
/** Cap any single backoff wait so a call never hangs too long. */
const MAX_BACKOFF_MS = 12_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * OpenAI reasoning models (o-series and the GPT-5 family, e.g. gpt-5.4-mini)
 * change the chat-completions contract: they reject the classic `max_tokens`
 * param (require `max_completion_tokens`) and only accept the default
 * temperature (sending 0 or 0.7 returns 400). Detect them so we build a
 * compatible request body. Classic chat models (gpt-4o) keep the old shape.
 */
function isReasoningModel(model: string): boolean {
  return /(^|\/)o\d/i.test(model) || /gpt-5/i.test(model);
}

/**
 * Determines how long to wait before retrying a rate-limited request.
 * Honors the provider's hint (Retry-After header or "try again in Xs" in the
 * body) when present, else falls back to exponential backoff. Capped.
 */
function backoffMs(attempt: number, retryAfterHeader: string | null, bodyText: string): number {
  const headerSecs = retryAfterHeader ? Number(retryAfterHeader) : NaN;
  if (Number.isFinite(headerSecs) && headerSecs >= 0) {
    return Math.min(headerSecs * 1000 + 250, MAX_BACKOFF_MS);
  }
  const match = bodyText.match(/try again in ([\d.]+)\s*s/i);
  if (match) {
    return Math.min(Number(match[1]) * 1000 + 250, MAX_BACKOFF_MS);
  }
  return Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
}

/** Options for a single chat completion. All optional. */
export interface ChatCompletionOptions {
  maxTokens?: number;
  temperature?: number;
  /** Override the env model for this call (rarely needed). */
  model?: string;
}

/**
 * Typed error for LLM failures. Carries the HTTP status so callers can decide
 * how to degrade (e.g. skip evaluation on quota exhaustion instead of 500ing).
 */
export class LlmError extends Error {
  readonly status: number;
  /** True when the failure is a quota/credit/rate-limit condition (402/429). */
  readonly isQuota: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'LlmError';
    this.status = status;
    this.isQuota = status === 402 || status === 429;
  }
}

/** Returns true when LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL are all set. */
export function isLlmConfigured(): boolean {
  return Boolean(
    process.env.LLM_BASE_URL?.trim() &&
      process.env.LLM_API_KEY?.trim() &&
      process.env.LLM_MODEL?.trim(),
  );
}

interface Provider {
  baseUrl: string;
  apiKey: string;
  model: string;
  label: string;
}

/** Primary provider from LLM_* env. */
function getPrimaryProvider(modelOverride?: string): Provider | null {
  const url = process.env.LLM_BASE_URL?.trim();
  const model = process.env.LLM_MODEL?.trim();
  const key = process.env.LLM_API_KEY?.trim();
  if (!url || !model || !key) return null;

  return {
    baseUrl: url.replace(/\/+$/, ''),
    apiKey: key,
    model: modelOverride ?? model,
    label: 'primary',
  };
}

/**
 * Optional secondary provider when the primary is quota/rate-limited (402/429).
 * Set LLM_FALLBACK_BASE_URL, LLM_FALLBACK_API_KEY, and LLM_FALLBACK_MODEL.
 */
function getFallbackProvider(): Provider | null {
  const url = process.env.LLM_FALLBACK_BASE_URL?.trim();
  const key = process.env.LLM_FALLBACK_API_KEY?.trim();
  const model = process.env.LLM_FALLBACK_MODEL?.trim();
  if (!url || !key || !model) return null;

  return {
    baseUrl: url.replace(/\/+$/, ''),
    apiKey: key,
    model,
    label: 'fallback',
  };
}

/**
 * Run one chat completion against a specific provider. `retryRateLimit` controls
 * whether a 429 is retried in place with backoff — we disable it when a fallback
 * provider exists so we fail over immediately instead of waiting out a long
 * daily-limit backoff on the primary.
 */
async function callProvider(
  provider: Provider,
  systemPrompt: string,
  userPrompt: string,
  options: ChatCompletionOptions,
  retryRateLimit = true,
): Promise<string> {
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const body: Record<string, unknown> = {
    model: provider.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };
  if (isReasoningModel(provider.model)) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.max_tokens = maxTokens;
    body.temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  }
  const requestBody = JSON.stringify(body);

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });
    } catch (err) {
      throw new LlmError(
        `LLM request failed: ${err instanceof Error ? err.message : String(err)}`,
        503,
      );
    }

    if (response.ok) {
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new LlmError('Empty response from LLM provider', 502);
      return content;
    }

    const bodyText = await response.text().catch(() => '');

    if (retryRateLimit && response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      await sleep(backoffMs(attempt, response.headers.get('retry-after'), bodyText));
      continue;
    }

    let detail = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      detail = parsed?.error?.message ?? parsed?.error ?? bodyText.slice(0, 200);
    } catch {
      detail = bodyText.slice(0, 200);
    }
    throw new LlmError(`LLM provider returned ${response.status}: ${detail}`, response.status);
  }
}

/**
 * Runs a chat completion against the configured OpenAI-compatible provider,
 * failing over to LLM_FALLBACK_* when the primary is quota/rate-limited.
 */
export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: ChatCompletionOptions = {},
): Promise<string> {
  if ((await checkGlobalLlmBudget()) === 'blocked') {
    throw new LlmError('Global daily AI budget reached. Generation paused to protect credits.', 429);
  }

  const primary = getPrimaryProvider(options.model);
  if (!primary) {
    throw new LlmError(
      'LLM is not configured. Set LLM_BASE_URL, LLM_API_KEY, and LLM_MODEL (see .env.example).',
      503,
    );
  }

  const fallback = getFallbackProvider();
  try {
    return await callProvider(primary, systemPrompt, userPrompt, options, !fallback);
  } catch (err) {
    if (err instanceof LlmError && err.isQuota && fallback) {
      return callProvider(fallback, systemPrompt, userPrompt, { ...options, model: undefined });
    }
    throw err;
  }
}
