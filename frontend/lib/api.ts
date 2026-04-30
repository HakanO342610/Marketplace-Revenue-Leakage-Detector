export type Marketplace = "trendyol" | "hepsiburada" | "amazon" | "mixed";

export type UploadResponse = {
  runId: string;
  rowCount: number;
  marketplace?: string;
};

export type ReconcileResponse = {
  runId: string;
  issueCount: number;
  totalLoss: number;
};

export type IssueBreakdown = {
  COMMISSION_MISMATCH: number;
  UNDERPAYMENT: number;
  MISSING_REFUND: number;
};

export type AmountBreakdown = {
  COMMISSION_MISMATCH: number;
  UNDERPAYMENT: number;
  MISSING_REFUND: number;
};

export type CategoryShare = {
  category: string;
  leakage: number;
  share: number;
};

export type MarketplaceShare = {
  marketplace: string;
  leakage: number;
  share: number;
};

export type TopLossDriver = {
  type: string;
  amount: number;
  share: number;
};

export type InsightsAlertLevel = "critical" | "warning";

export type InsightsAlert = {
  level: InsightsAlertLevel;
  message: string;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type TopDriver = {
  type: string;
  label: string;
  amount: number;
  share: number;
};

export type Insights = {
  executive: string;
  bullets: string[];
  alert?: InsightsAlert | null;
  risk_level: RiskLevel;
  headline: string;
  top_drivers: TopDriver[];
};

export type RootCauseType =
  | "COMMISSION_MISMATCH"
  | "UNDERPAYMENT"
  | "MISSING_REFUND";

export type RootCause = {
  type: RootCauseType;
  label: string;
  totalLoss: number;
  percentage: number;
  examples: string[];
};

export type SummaryResponse = {
  runId: string;
  total_revenue: number;
  total_paid: number;
  total_leakage: number;
  leakage_rate: number;
  leakage_score: number;
  issue_count: number;
  issue_breakdown: IssueBreakdown;

  expected_revenue: number;
  recovered_revenue_potential: number;
  unexplained_variance: number;
  confidence_score: number;
  top_loss_driver: TopLossDriver;
  amount_breakdown: AmountBreakdown;
  category_breakdown: CategoryShare[];
  marketplace_breakdown: MarketplaceShare[];
  insights: Insights;

  monthly_recovered: number;
  annual_impact: number;
  root_causes: RootCause[];
};

export type AttributionSeverity = "info" | "warning" | "critical";

export type AttributionRow = {
  ruleName: string;
  expected: number;
  actual: number;
  variance: number;
  loss: number;
  severity: AttributionSeverity;
  confidence: number;
  explanation: string;
};

export type ResultRow = {
  orderLineId: string;
  issues: string[];
  estimatedLoss: number;
  expectedAmount: number;
  actualAmount: number;
};

export type RunListItem = {
  id: string;
  marketplace: string;
  filename: string;
  rowCount: number;
  createdAt: string;
  totalLeakage: number;
};

/* --------------------------------- Org / Members --------------------------------- */

export type Role = "admin" | "member" | "viewer";

export type OrganizationLite = {
  id: string;
  name: string;
  slug: string;
  role: Role;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: Role;
  createdAt: string;
  memberCount: number;
};

export type Member = {
  userId: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
};

const TOKEN_KEY = "mrld_token";
const ORG_KEY = "mrld_org_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function apiBase(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3101";
  }
  return "";
}

function clientToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function authHeaders(): Record<string, string> {
  const t = clientToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * Server-side auth header builder. Reads the token from request cookies via
 * `next/headers`. Only call this from Server Components / Route Handlers.
 */
export async function serverAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {};
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const token = store.get(TOKEN_KEY)?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Read current org id. Client: localStorage. Server: this function returns
 * `null` (use `serverOrgHeader()` for server-side requests).
 */
export function currentOrgId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ORG_KEY);
  } catch {
    return null;
  }
}

export function setCurrentOrgId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORG_KEY, id);
  } catch {
    // ignore
  }
  document.cookie = `${ORG_KEY}=${encodeURIComponent(
    id,
  )}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function clearCurrentOrgId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ORG_KEY);
  } catch {
    // ignore
  }
  document.cookie = `${ORG_KEY}=; path=/; max-age=0; samesite=lax`;
}

function clientOrgHeader(): Record<string, string> {
  const id = currentOrgId();
  return id ? { "X-Org-Id": id } : {};
}

async function serverOrgHeader(): Promise<Record<string, string>> {
  if (typeof window !== "undefined") return {};
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const id = store.get(ORG_KEY)?.value;
  return id ? { "X-Org-Id": id } : {};
}

async function resolveAuthHeaders(): Promise<Record<string, string>> {
  return typeof window === "undefined"
    ? await serverAuthHeaders()
    : authHeaders();
}

async function resolveOrgHeader(): Promise<Record<string, string>> {
  return typeof window === "undefined"
    ? await serverOrgHeader()
    : clientOrgHeader();
}

function mergeHeaders(
  ...parts: Array<HeadersInit | Record<string, string> | undefined>
): Headers {
  const out = new Headers();
  for (const part of parts) {
    if (!part) continue;
    const h = new Headers(part as HeadersInit);
    h.forEach((value, key) => out.set(key, value));
  }
  return out;
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = mergeHeaders(
    await resolveAuthHeaders(),
    await resolveOrgHeader(),
    init?.headers,
  );
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `Request failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return (await res.json()) as T;
}

export async function uploadFile(
  file: File,
  marketplace?: string,
): Promise<UploadResponse> {
  const fd = new FormData();
  fd.append("file", file);
  if (marketplace) fd.append("marketplace", marketplace);
  const headers = mergeHeaders(
    await resolveAuthHeaders(),
    await resolveOrgHeader(),
  );
  const res = await fetch(`${apiBase()}/api/upload`, {
    method: "POST",
    body: fd,
    headers,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Upload failed: ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`,
    );
  }
  return (await res.json()) as UploadResponse;
}

export async function runReconcile(
  runId: string,
): Promise<ReconcileResponse> {
  return jsonFetch<ReconcileResponse>("/api/reconcile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ runId }),
  });
}

export async function getSummary(
  runId: string,
  fresh = false,
): Promise<SummaryResponse> {
  const qs = new URLSearchParams({ runId });
  if (fresh) qs.set("_t", String(Date.now()));
  return jsonFetch<SummaryResponse>(`/api/summary?${qs.toString()}`);
}

export async function getResults(
  runId: string,
  opts?: { issueType?: string; limit?: number },
): Promise<ResultRow[]> {
  const qs = new URLSearchParams({ runId });
  if (opts?.issueType) qs.set("issueType", opts.issueType);
  if (typeof opts?.limit === "number") qs.set("limit", String(opts.limit));
  return jsonFetch<ResultRow[]>(`/api/results?${qs.toString()}`);
}

export async function getMyRuns(): Promise<RunListItem[]> {
  return jsonFetch<RunListItem[]>("/api/runs");
}

export async function getAttributions(
  runId: string,
  orderLineId: string,
): Promise<AttributionRow[]> {
  const qs = new URLSearchParams({ runId }).toString();
  return jsonFetch<AttributionRow[]>(
    `/api/results/${encodeURIComponent(orderLineId)}/attributions?${qs}`,
  );
}

/* --------------------------------- Org API helpers --------------------------------- */

export async function listOrgs(): Promise<Organization[]> {
  return jsonFetch<Organization[]>("/api/orgs");
}

export async function createOrg(name: string): Promise<Organization> {
  return jsonFetch<Organization>("/api/orgs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function listMembers(orgId: string): Promise<Member[]> {
  return jsonFetch<Member[]>(`/api/orgs/${encodeURIComponent(orgId)}/members`);
}

export type InviteResult =
  | { ok: true }
  | { ok: false; reason: "not_found" | "forbidden" | "other"; message?: string };

export async function inviteMember(
  orgId: string,
  email: string,
  role: Role,
): Promise<InviteResult> {
  const headers = mergeHeaders(
    await resolveAuthHeaders(),
    await resolveOrgHeader(),
    { "Content-Type": "application/json" },
  );
  const res = await fetch(
    `${apiBase()}/api/orgs/${encodeURIComponent(orgId)}/members`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ email, role }),
      cache: "no-store",
    },
  );
  if (res.ok) return { ok: true };
  if (res.status === 404) return { ok: false, reason: "not_found" };
  if (res.status === 403) return { ok: false, reason: "forbidden" };
  const text = await res.text().catch(() => "");
  return { ok: false, reason: "other", message: text || res.statusText };
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: Role,
): Promise<void> {
  await jsonFetch<unknown>(
    `/api/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
}

export async function removeMember(
  orgId: string,
  userId: string,
): Promise<void> {
  await jsonFetch<unknown>(
    `/api/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}
