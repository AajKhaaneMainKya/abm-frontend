/**
 * Typed API layer for the ABM REST backend (FastAPI, see api/main.py).
 * Every endpoint is scoped to a client_id. Base URL comes from
 * NEXT_PUBLIC_API_URL (the Railway deployment).
 */
import axios from "axios";
import { getClerkToken } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://abm-api.railway.app";

/** Host (no protocol) — used to build the browser-agent WebSocket URL. */
export const API_HOST = API_URL.replace(/^https?:\/\//, "");

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Attach the Clerk session token to every request. When backend auth is
// disabled (CLERK_SECRET_KEY unset) the header is simply ignored, so this is
// safe before keys are configured. One interceptor covers all api.* calls.
api.interceptors.request.use(async (config) => {
  const token = await getClerkToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export interface ICP {
  industries?: string[];
  company_size?: { min?: number; max?: number };
  titles?: string[];
  geographies?: string[];
  tech_signals?: string[];
  pain_points?: string[];
  exclusions?: string[];
}

export interface Positioning {
  category?: string;
  differentiators?: string[];
  proof_points?: string[];
  competitors?: string[];
  voice_anchor?: string;
}

export interface ClientSummary {
  id: string;
  name: string;
  campaign_goal: string | null;
  confidence_threshold: number | null;
  daily_send_cap: number | null;
  active: boolean;
  created_at: string;
}

export interface Client extends ClientSummary {
  icp: ICP;
  positioning: Positioning;
  sender_name: string | null;
  sender_email: string | null;
  sender_domain: string | null;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  status: string;
  goal: string | null;
  budget_inr: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface CampaignStats {
  client_id: string;
  campaign_goal: string | null;
  total_accounts: number;
  emails_sent: number;
  replies: number;
  pending_sequences: number;
  campaigns: Campaign[];
}

export interface PipelineState {
  state: string;
  count: number;
}

export interface Pipeline {
  client_id: string;
  pipeline: Record<string, number>;
  states: PipelineState[];
}

export interface Decision {
  id: string;
  trigger: string;
  reasoning: string;
  action_taken: string;
  confidence_snapshot: { confidence?: number } | null;
  created_at: string;
}

export interface QueueSequence {
  id: string;
  subject: string | null;
  body: string | null;
  angle_used: string | null;
  critic_score: number | null;
  critic_feedback: string | null;
  confidence_score_at_send: number | null;
  linkedin_message: string | null;
  status: string;
  account_id: string | null;
  created_at: string;
  company: string | null;
  dm_name: string | null;
  dm_title: string | null;
  dm_email: string | null;
  dm_linkedin: string | null;
  personalization_hooks?: string[] | null;
}

export interface Creative {
  id: string;
  campaign_id: string | null;
  platform: string;
  variant: string;
  headline: string | null;
  body: string | null;
  cta: string | null;
  image_brief: string | null;
  landing_page_copy: string | null;
  utm_params: Record<string, string>;
  status: string;
  performance_data: Record<string, unknown>;
  critic_score: number | null;
  created_at: string;
}

export interface Queue {
  client_id: string;
  sequences: QueueSequence[];
  creatives: Creative[];
  total_pending: number;
}

export interface Metrics {
  client_id: string;
  sent: number;
  replied: number;
  positive_replies: number;
  sent_autonomously: number;
  converted: number;
  reply_rate: number;
  positive_reply_rate: number;
  conversion_rate: number;
}

export interface CreateClientPayload {
  name: string;
  icp: ICP;
  positioning: Positioning;
  sender_name?: string;
  sender_email?: string;
  sender_domain?: string;
  campaign_goal?: string;
  confidence_threshold?: number;
  daily_send_cap?: number;
}

export type CreativePlatform = "linkedin" | "meta" | "google";

/* ------------------------------------------------------------------ */
/* Health                                                             */
/* ------------------------------------------------------------------ */

export async function getHealth(): Promise<{ status: string; database?: string }> {
  const { data } = await api.get("/api/health");
  return data;
}

/* ------------------------------------------------------------------ */
/* Clients                                                            */
/* ------------------------------------------------------------------ */

export async function getClients(): Promise<ClientSummary[]> {
  const { data } = await api.get<{ clients: ClientSummary[] }>("/api/clients");
  return data.clients ?? [];
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await api.get<Client>(`/api/clients/${id}`);
  return data;
}

export async function createClient(
  payload: CreateClientPayload,
): Promise<Client & { warnings?: string[] }> {
  try {
    const { data } = await api.post<Client & { warnings?: string[] }>(
      "/api/clients",
      payload,
    );
    return data;
  } catch (e) {
    return unwrapErrors(e);
  }
}

/* ------------------------------------------------------------------ */
/* Campaign / pipeline / metrics                                      */
/* ------------------------------------------------------------------ */

export async function getCampaign(clientId: string): Promise<CampaignStats> {
  const { data } = await api.get<CampaignStats>(`/api/clients/${clientId}/campaign`);
  return data;
}

export async function getPipeline(clientId: string): Promise<Pipeline> {
  const { data } = await api.get<Pipeline>(`/api/clients/${clientId}/pipeline`);
  return data;
}

export async function getMetrics(clientId: string): Promise<Metrics> {
  const { data } = await api.get<Metrics>(`/api/clients/${clientId}/metrics`);
  return data;
}

/* ------------------------------------------------------------------ */
/* Cost monitor (Phase H)                                             */
/* ------------------------------------------------------------------ */

export interface AgentCost {
  agent: string;
  cost_usd: number;
  today_usd: number;
  calls: number;
  input_tokens: number;
  output_tokens: number;
}

export interface Costs {
  by_agent: AgentCost[];
  all_time_usd: number;
  today_usd: number;
  email_count: number;
  per_email_avg_usd: number;
}

export async function getCosts(clientId?: string | null): Promise<Costs> {
  const { data } = await api.get<Costs>("/api/costs", {
    params: clientId ? { client_id: clientId } : undefined,
  });
  return data;
}

/* ------------------------------------------------------------------ */
/* Decisions                                                          */
/* ------------------------------------------------------------------ */

export async function getDecisions(clientId: string): Promise<Decision[]> {
  const { data } = await api.get<{ decisions: Decision[] }>(
    `/api/clients/${clientId}/decisions`,
  );
  return data.decisions ?? [];
}

/* ------------------------------------------------------------------ */
/* Queue (email sequences)                                            */
/* ------------------------------------------------------------------ */

export async function getQueue(clientId: string): Promise<Queue> {
  const { data } = await api.get<Queue>(`/api/clients/${clientId}/queue`);
  return data;
}

export async function approveItem(clientId: string, seqId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/queue/${seqId}/approve`);
  return data;
}

export async function rejectItem(clientId: string, seqId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/queue/${seqId}/reject`);
  return data;
}

/* ------------------------------------------------------------------ */
/* Creatives                                                          */
/* ------------------------------------------------------------------ */

export async function getCreatives(clientId: string): Promise<Creative[]> {
  const { data } = await api.get<{ creatives: Creative[] }>(
    `/api/clients/${clientId}/creatives`,
  );
  return data.creatives ?? [];
}

export async function generateCreative(
  clientId: string,
  platform: CreativePlatform,
  opts?: { campaign_id?: string; market_research?: string },
) {
  const { data } = await api.post(`/api/clients/${clientId}/creatives/generate`, {
    platform,
    campaign_id: opts?.campaign_id ?? null,
    market_research: opts?.market_research ?? null,
  });
  return data;
}

export async function approveCreative(clientId: string, creativeId: string) {
  const { data } = await api.post(
    `/api/clients/${clientId}/creatives/${creativeId}/approve`,
  );
  return data;
}

export async function rejectCreative(clientId: string, creativeId: string) {
  const { data } = await api.post(
    `/api/clients/${clientId}/creatives/${creativeId}/reject`,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Handoffs (Phase H)                                                 */
/* ------------------------------------------------------------------ */

export interface Handoff {
  id: string;
  account_id: string;
  company: string | null;
  dm_name: string | null;
  dm_email: string | null;
  intent_score: number | null;
  trigger_reason: string | null;
  all_touches: unknown[];
  signals_detected: unknown[];
  recommended_talk_track: string | null;
  urgency: string;
  status: string;
  created_at: string;
}

export async function getHandoffs(clientId: string): Promise<Handoff[]> {
  const { data } = await api.get<{ handoffs: Handoff[] }>(
    `/api/clients/${clientId}/handoffs`,
  );
  return data.handoffs ?? [];
}

export interface WeeklyBrief {
  id: string;
  week_of: string;
  accounts_moved_forward: number;
  accounts_stalled: number;
  best_angle: string | null;
  worst_angle: string | null;
  icp_refinement_suggestions: string[];
  recommended_focus: string | null;
  orchestrator_guidance: string | null;
  created_at: string;
}

export async function getWeeklyBrief(
  clientId: string,
): Promise<{ latest: WeeklyBrief | null; history: WeeklyBrief[] }> {
  const { data } = await api.get(`/api/clients/${clientId}/weekly-brief`);
  return data;
}

/* ------------------------------------------------------------------ */
/* Campaign controls (Phase 2 UX)                                     */
/* ------------------------------------------------------------------ */

export interface UpdateClientPayload {
  name?: string;
  icp?: ICP;
  positioning?: Positioning;
  sender_name?: string;
  sender_email?: string;
  sender_domain?: string;
  campaign_goal?: string;
  confidence_threshold?: number;
  daily_send_cap?: number;
}

export interface ManualAccountPayload {
  company: string;
  domain: string;
  dm_name: string;
  dm_title?: string;
  dm_email: string;
  dm_linkedin?: string;
  industry?: string;
  size_estimate?: number;
}

/** Throws an ApiValidationError carrying `errors` when the API returns 422. */
export class ApiValidationError extends Error {
  errors: string[];
  constructor(errors: string[]) {
    super(errors.join("; "));
    this.name = "ApiValidationError";
    this.errors = errors;
  }
}

function unwrapErrors(e: unknown): never {
  const resp = (e as { response?: { status?: number; data?: { errors?: string[] } } }).response;
  if (resp?.status === 422 && resp.data?.errors) {
    throw new ApiValidationError(resp.data.errors);
  }
  throw e;
}

export async function updateClient(
  clientId: string,
  payload: UpdateClientPayload,
): Promise<Client> {
  try {
    const { data } = await api.patch<Client>(`/api/clients/${clientId}`, payload);
    return data;
  } catch (e) {
    return unwrapErrors(e);
  }
}

export async function triggerOrchestrator(clientId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/trigger-orchestrator`);
  return data;
}

export async function pauseClient(clientId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/pause`);
  return data;
}

export async function resumeClient(clientId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/resume`);
  return data;
}

export async function addToDnc(clientId: string, accountId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/accounts/${accountId}/dnc`);
  return data;
}

export async function addManualAccount(
  clientId: string,
  payload: ManualAccountPayload,
) {
  try {
    const { data } = await api.post(`/api/clients/${clientId}/accounts/manual`, payload);
    return data;
  } catch (e) {
    return unwrapErrors(e);
  }
}

export async function redraftItem(clientId: string, seqId: string) {
  const { data } = await api.post(`/api/clients/${clientId}/queue/${seqId}/redraft`);
  return data;
}

/* ------------------------------------------------------------------ */
/* Accounts + Browser Agent (live enrichment)                         */
/* ------------------------------------------------------------------ */

export interface Account {
  id: string;
  company: string;
  domain: string | null;
  state: string;
  enrichment_layer: number | null;
  dm_name: string | null;
  dm_title: string | null;
  dm_linkedin: string | null;
  intent_score: number | null;
}

/** List accounts, optionally filtered to specific states (e.g. DISCOVERED,ENRICHED). */
export async function getAccounts(
  clientId: string,
  states?: string[],
): Promise<Account[]> {
  const params =
    states && states.length ? { state: states.join(",") } : undefined;
  const { data } = await api.get<{ accounts: Account[] }>(
    `/api/clients/${clientId}/accounts`,
    { params },
  );
  return data.accounts ?? [];
}

export interface BrowseSession {
  session_id: string;
  account_id: string;
  company: string;
  status: string;
}

/** Start a live browser-enrichment run; returns the session_id to open the WS. */
export async function startBrowse(
  clientId: string,
  accountId: string,
): Promise<BrowseSession> {
  const { data } = await api.post<BrowseSession>(
    `/api/clients/${clientId}/accounts/${accountId}/browse`,
  );
  return data;
}

/** Build the screenshot WebSocket URL (ws:// or wss:// to match the API). */
export function browserWsUrl(sessionId: string): string {
  const proto = API_URL.startsWith("https") ? "wss" : "ws";
  return `${proto}://${API_HOST}/ws/browser/${sessionId}`;
}
