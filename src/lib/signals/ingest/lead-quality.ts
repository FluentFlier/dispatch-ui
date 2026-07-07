import type { IngestedLead } from '@/lib/signals/types';
import { isProduction } from '@/lib/env';

/** Demo-only leads (Flux Labs, Northwind, …) — never show in production. */
export function isDemoSeedExternalId(externalId: string | null | undefined): boolean {
  const id = (externalId ?? '').trim();
  return id.startsWith('seed-');
}

/** True when deterministic seed leads are allowed (local dev / explicit opt-in / vitest). */
export function allowDemoSeedLeads(): boolean {
  if (process.env.SIGNALS_ALLOW_SEED_LEADS === 'true') return true;
  if (process.env.NODE_ENV === 'test') return true;
  if (isProduction()) return false;
  return process.env.SIGNALS_ALLOW_SEED_LEADS !== 'false';
}

export function isDemoSeedIngestedLead(lead: Pick<IngestedLead, 'externalId'>): boolean {
  return isDemoSeedExternalId(lead.externalId);
}

export function isDemoSeedLeadRow(lead: { external_id?: string | null }): boolean {
  return isDemoSeedExternalId(lead.external_id);
}

/**
 * Drops demo seeds and rows missing required anchors before upsert/display.
 */
export function filterRealIngestedLeads(leads: IngestedLead[]): IngestedLead[] {
  return leads.filter((lead) => {
    if (!lead.companyName?.trim() || !lead.externalId?.trim()) return false;
    if (isDemoSeedIngestedLead(lead) && !allowDemoSeedLeads()) return false;
    return true;
  });
}

export function filterRealLeadRows<T extends { external_id?: string | null }>(rows: T[]): T[] {
  if (allowDemoSeedLeads()) return rows;
  return rows.filter((row) => !isDemoSeedLeadRow(row));
}
