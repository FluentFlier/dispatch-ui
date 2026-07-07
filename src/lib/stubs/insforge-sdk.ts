import { createMockInsforgeClient } from '@/lib/mock/db-client';

/** Minimal stub so UI kit builds without the real InsForge SDK. */
export function createClient(_opts?: unknown) {
  return createMockInsforgeClient();
}

export type InsforgeClient = ReturnType<typeof createClient>;
