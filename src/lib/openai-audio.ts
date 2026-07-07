import { OPENAI_DEFAULT_BASE_URL } from '@/lib/llm';

const DEFAULT_WHISPER_MODEL = 'whisper-1';

function llmApiKey(): string {
  const key = process.env.LLM_API_KEY?.trim();
  if (!key) {
    throw new Error('LLM_API_KEY is not configured. Set your OpenAI API key in .env.local.');
  }
  return key;
}

function llmBaseUrl(): string {
  return (process.env.LLM_BASE_URL?.trim() || OPENAI_DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/**
 * Transcribes audio via OpenAI Whisper (`/v1/audio/transcriptions`).
 * Uses the same LLM_API_KEY and LLM_BASE_URL as chat completions.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  filename = 'audio.webm',
): Promise<string> {
  const formData = new FormData();
  formData.append('file', audioBlob, filename);
  formData.append('model', process.env.WHISPER_MODEL?.trim() || DEFAULT_WHISPER_MODEL);

  const response = await fetch(`${llmBaseUrl()}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${llmApiKey()}` },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Transcription failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text?.trim()) {
    throw new Error('Empty transcription response from OpenAI');
  }
  return data.text.trim();
}
