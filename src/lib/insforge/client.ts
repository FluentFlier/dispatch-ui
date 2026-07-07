'use client';

import { createMockInsforgeClient } from '@/lib/mock/db-client';

let client: ReturnType<typeof createMockInsforgeClient> | null = null;

export function getInsforgeClient() {
  if (!client) client = createMockInsforgeClient();
  return client;
}

/** Alias used by several client pages. */
export const getInsforge = getInsforgeClient;
