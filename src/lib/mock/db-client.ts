import { MOCK_TABLES } from '@/lib/mock/fixtures';

type Row = Record<string, unknown>;

function cloneRows(table: string): Row[] {
  return (MOCK_TABLES[table] ?? []).map((row) => ({ ...row }));
}

function compare(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

class MockQuery {
  private rows: Row[];
  private filters: Array<(row: Row) => boolean> = [];
  private orderSpec: { key: string; ascending: boolean } | null = null;
  private limitN: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private singleMode: 'none' | 'maybe' | 'one' = 'none';

  constructor(rows: Row[]) {
    this.rows = rows;
  }

  select(_cols?: string, _opts?: unknown) {
    return this;
  }

  eq(key: string, value: unknown) {
    this.filters.push((row) => row[key] === value);
    return this;
  }

  neq(key: string, value: unknown) {
    this.filters.push((row) => row[key] !== value);
    return this;
  }

  gte(key: string, value: unknown) {
    this.filters.push((row) => compare(row[key], value) >= 0);
    return this;
  }

  lte(key: string, value: unknown) {
    this.filters.push((row) => compare(row[key], value) <= 0);
    return this;
  }

  not(key: string, _op: string, value: unknown) {
    this.filters.push((row) => row[key] !== value);
    return this;
  }

  in(key: string, values: unknown[]) {
    const set = new Set(values);
    this.filters.push((row) => set.has(row[key]));
    return this;
  }

  ilike(key: string, pattern: string) {
    const needle = pattern.replace(/%/g, '').toLowerCase();
    this.filters.push((row) => String(row[key] ?? '').toLowerCase().includes(needle));
    return this;
  }

  order(key: string, opts?: { ascending?: boolean }) {
    this.orderSpec = { key, ascending: opts?.ascending !== false };
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  update(_values: Record<string, unknown>) {
    return this;
  }

  insert(_values: Record<string, unknown> | Record<string, unknown>[]) {
    return this;
  }

  upsert(_values: Record<string, unknown> | Record<string, unknown>[], _opts?: unknown) {
    return this;
  }

  delete() {
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybe';
    return this;
  }

  single() {
    this.singleMode = 'one';
    return this;
  }

  private run(): Row[] {
    let out = this.rows.filter((row) => this.filters.every((fn) => fn(row)));
    if (this.orderSpec) {
      const { key, ascending } = this.orderSpec;
      out = [...out].sort((a, b) => {
        const c = compare(a[key], b[key]);
        return ascending ? c : -c;
      });
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);
    if (this.rangeFrom != null && this.rangeTo != null) {
      out = out.slice(this.rangeFrom, this.rangeTo + 1);
    }
    return out;
  }

  then<TResult1 = { data: any; error: { message: string } | null; count?: number }, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: { message: string } | null; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const rows = this.run();
    let data: any = rows;
    if (this.singleMode === 'maybe') data = rows[0] ?? null;
    if (this.singleMode === 'one') data = rows[0] ?? null;
    return Promise.resolve({ data, error: null as { message: string } | null, count: rows.length }).then(onfulfilled, onrejected);
  }
}

export function createMockDatabase() {
  return {
    from(table: string) {
      return new MockQuery(cloneRows(table));
    },
    async upsert() {
      return { data: null, error: null };
    },
    async rpc() {
      return { data: null, error: null };
    },
  };
}

export function createMockStorage() {
  return {
    from(_bucket: string) {
      return {
        getPublicUrl: (key: string) =>
          `/images/landing/${key.split('/').pop() ?? 'placeholder.png'}`,
        remove: async (_path?: string) => ({ data: null, error: null as { message: string } | null }),
        upload: async (path?: string, _file?: unknown) => ({
          data: { path: path ?? 'mock/path', key: path ?? 'mock/path', url: '/images/landing/hero.png' },
          error: null as { message: string } | null,
        }),
        list: async (_opts?: unknown) => ({
          data: {
            objects: [
              {
                name: 'demo-reel.mp4',
                key: 'ui-demo-user/demo-reel.mp4',
                url: '/images/landing/hero.png',
                uploadedAt: new Date().toISOString(),
              },
            ],
          },
          error: null as { message: string } | null,
        }),
      };
    },
  };
}

export function createMockInsforgeClient() {
  return {
    database: createMockDatabase(),
    storage: createMockStorage(),
    auth: {
      getCurrentUser: async () => ({
        data: { user: { id: 'ui-demo-user', email: 'alex@example.com' } },
        error: null as { message: string } | null,
      }),
      refreshSession: async () => ({
        data: { accessToken: 'mock-access', refreshToken: 'mock-refresh' },
        error: null as { message: string } | null,
      }),
      signInWithOAuth: async (_opts?: unknown) => ({
        data: { url: '/dashboard' },
        error: null as { message: string } | null,
      }),
      signOut: async () => ({ error: null as { message: string } | null }),
    },
  };
}
