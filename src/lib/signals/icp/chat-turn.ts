import { chatCompletion } from '@/lib/llm';
import type { ParsedIcp } from '@/lib/signals/icp/parse-description';

export interface IcpChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IcpChatTurnResult {
  assistantMessage: string;
  /** Full revised ICP paragraph when the user set or changed their ICP. */
  updatedDescription: string | null;
  /** True when the user asked to search / refresh leads now. */
  runDiscovery: boolean;
}

const SYSTEM = [
  'You help founders define and refine their ideal customer profile (ICP) for B2B lead discovery.',
  'Reply with ONLY valid JSON:',
  '{',
  '  "assistant_message": string,',
  '  "updated_description": string | null,',
  '  "run_discovery": boolean',
  '}',
  'assistant_message: friendly, concise (2-4 sentences). Confirm what changed or ask a clarifying question.',
  'updated_description: when the user describes their ICP OR asks to add/remove/narrow/focus criteria,',
  'return the COMPLETE revised ICP as one paragraph (not a diff). Otherwise null.',
  'run_discovery: true only when the user explicitly wants to find/search/refresh/discover leads now.',
  'If they only refine the ICP without asking to search, run_discovery stays false.',
  'Never invent company names. Keep descriptions specific: stage, vertical, geography, signals (funding, hiring, YC batch, etc.).',
].join(' ');

function formatHistory(history: IcpChatMessage[], latestUser: string): string {
  const lines = history
    .slice(-12)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.trim()}`);
  lines.push(`User: ${latestUser.trim()}`);
  return lines.join('\n\n');
}

function extractTurnJson(raw: string): IcpChatTurnResult | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  try {
    const parsed = JSON.parse(candidate) as {
      assistant_message?: string;
      updated_description?: string | null;
      run_discovery?: boolean;
    };
    const assistantMessage = String(parsed.assistant_message ?? '').trim();
    if (!assistantMessage) return null;
    const updated =
      typeof parsed.updated_description === 'string' && parsed.updated_description.trim().length >= 10
        ? parsed.updated_description.trim()
        : null;
    return {
      assistantMessage,
      updatedDescription: updated,
      runDiscovery: Boolean(parsed.run_discovery),
    };
  } catch {
    return null;
  }
}

/**
 * One conversational turn: refine ICP prose, optionally flag lead discovery.
 */
export async function runIcpChatTurn(
  userMessage: string,
  history: IcpChatMessage[],
  current: {
    description: string | null;
    verticals: string[];
    keywords: string[];
  },
): Promise<IcpChatTurnResult> {
  const prose = userMessage.trim();
  if (!prose) throw new Error('Message is required.');

  const context = [
    'CURRENT ICP STATE:',
    current.description?.trim()
      ? `Description: ${current.description.trim()}`
      : 'Description: (not set yet)',
    current.verticals.length ? `Verticals: ${current.verticals.join(', ')}` : 'Verticals: (none)',
    current.keywords.length ? `Keywords: ${current.keywords.join(', ')}` : 'Keywords: (none)',
    '',
    'CONVERSATION:',
    formatHistory(history, prose),
  ].join('\n');

  const raw = await chatCompletion(SYSTEM, context, { temperature: 0.35, maxTokens: 900 });
  const parsed = extractTurnJson(raw);
  if (parsed) return parsed;

  return {
    assistantMessage:
      'Got it. Tell me more about who you sell to — stage, industry, and any signals like funding or hiring — and I will turn it into a searchable ICP.',
    updatedDescription: prose.length >= 20 ? prose : null,
    runDiscovery: /\b(find|search|discover|refresh)\b.*\bleads?\b/i.test(prose),
  };
}

export type { ParsedIcp };
