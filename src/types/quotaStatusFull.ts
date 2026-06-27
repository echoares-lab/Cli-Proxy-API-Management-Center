export interface QuotaWindow {
  utilization_pct: number;
  resets_at?: string | null;
  limit_dollars?: number | null;
  used_dollars?: number | null;
}

export interface AntigravityModelEntry {
  id: string;
  display_name?: string;
  remaining_fraction: number;
  reset_time?: string | null;
}

export interface QuotaFullEntry {
  id: string;
  provider: string;
  label?: string;
  fetched_at?: string | null;
  error?: string;
  plan_type?: string;
  windows?: Record<string, QuotaWindow | null>;
  models?: AntigravityModelEntry[];
}

export interface QuotaFullResponse {
  credentials: QuotaFullEntry[];
}
