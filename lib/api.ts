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
/* Live activity feed (Aha moment / launching page)                   */
/* ------------------------------------------------------------------ */

export interface ActivityItem {
  action: string;
  reasoning: string;
  created_at: string;
  type: "decision" | "account";
}

export interface ActivityAccount {
  company: string;
  industry: string | null;
  icp_match_score: number;
}

export interface ActivityResponse {
  activity: ActivityItem[];
  accounts_discovered: number;
  accounts: ActivityAccount[];
}

export async function getActivity(clientId: string): Promise<ActivityResponse> {
  const { data } = await api.get<ActivityResponse>(
    `/api/clients/${clientId}/activity`,
  );
  return {
    activity: data.activity ?? [],
    accounts_discovered: data.accounts_discovered ?? 0,
    accounts: data.accounts ?? [],
  };
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

/**
 * Persist an edited email body (plain text) for a queued sequence.
 * Requires a backend PATCH /api/clients/{id}/queue/{seq_id} route — see note in
 * components/queue.tsx where the TipTap editor calls this.
 */
export async function updateSequenceBody(clientId: string, seqId: string, body: string) {
  const { data } = await api.patch(`/api/clients/${clientId}/queue/${seqId}`, { body });
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

export interface BeliefState {
  angles_tried?: string[];
  touch_history?: { angle?: string; at?: string }[];
  recommended_next_angle?: string | null;
  [key: string]: unknown;
}

export interface Account {
  id: string;
  company: string;
  domain: string | null;
  state: string;
  enrichment_layer: number | null;
  dm_name: string | null;
  dm_title: string | null;
  dm_linkedin: string | null;
  dm_email?: string | null;
  intent_score: number | null;
  industry?: string | null;
  size_estimate?: number | null;
  hq_location?: string | null;
  description?: string | null;
  icp_match_score?: number | null;
  touch_count?: number | null;
  last_touched_at?: string | null;
  belief_state?: BeliefState | null;
  engagement_score?: number | null;
  angles_tried?: string[] | null;
  created_at?: string;
}

/** One email touch for a single account — company detail expansion + mind map. */
export interface AccountSequence {
  id: string;
  subject: string | null;
  body: string | null;
  angle_used: string | null;
  status: string;
  critic_score: number | null;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  reply_text: string | null;
  reply_sentiment: string | null;
  reply_intent: string | null;
  touch_number_in_sequence: number | null;
  created_at: string;
}

export async function getAccountSequences(
  clientId: string,
  accountId: string,
): Promise<AccountSequence[]> {
  const { data } = await api.get<{ sequences: AccountSequence[] }>(
    `/api/clients/${clientId}/accounts/${accountId}/sequences`,
  );
  return data.sequences ?? [];
}

/** A sequence with a reply — Job Search "Replies" page + dashboard needs-attention. */
export interface Reply {
  id: string;
  account_id: string;
  subject: string | null;
  reply_text: string;
  reply_sentiment: string | null;
  reply_intent: string | null;
  reply_next_action: string | null;
  reply_reasoning: string | null;
  follow_up_due_at: string | null;
  replied_at: string | null;
  created_at: string;
  company: string | null;
  dm_name: string | null;
  dm_title: string | null;
  needs_follow_up: boolean;
}

export async function getReplies(clientId: string): Promise<Reply[]> {
  const { data } = await api.get<{ replies: Reply[] }>(`/api/clients/${clientId}/replies`);
  return data.replies ?? [];
}

export async function sendActionsToTelegram(
  clientId: string,
): Promise<{ sent: boolean; action_count: number; message: string }> {
  const { data } = await api.post(`/api/clients/${clientId}/send-actions-to-telegram`);
  return data;
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

/* ------------------------------------------------------------------ */
/* Job Search profile — resume upload + context graph                 */
/* ------------------------------------------------------------------ */

export interface ContextGraphExperience {
  company: string;
  role: string;
  industry?: string;
  duration?: string;
  achievements?: string[];
  skills?: string[];
  transferable_to?: string[];
  recency_weight?: number;
}

export interface ContextGraphBuild {
  name: string;
  type?: string;
  stack?: string[];
  proof?: string;
  demonstrates?: string[];
}

export interface ContextGraphEducation {
  institution: string;
  degree?: string;
  year?: string;
}

export interface ContextGraph {
  experiences?: ContextGraphExperience[];
  builds?: ContextGraphBuild[];
  education?: ContextGraphEducation[];
  skills?: string[];
  seeking?: {
    roles?: string[];
    industries?: string[];
    stage?: string[];
    size?: { min?: number; max?: number };
  };
}

export interface UserProfile {
  context_graph: ContextGraph;
  resumes: { filename: string }[];
  voice_anchor: string | null;
  updated_at?: string | null;
}

export async function getProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/profile");
  return data;
}

/** Uses raw fetch, not the shared `api` instance — axios would JSON-stringify
 * FormData because the instance's default Content-Type is application/json,
 * clobbering the multipart boundary the backend needs to parse the file. */
export async function uploadResume(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append("file", file);
  const token = await getClerkToken();
  const res = await fetch(`${API_URL}/api/profile/resume`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Upload failed (${res.status})`);
  }
  return res.json();
}

export async function updateVoiceAnchor(voiceAnchor: string): Promise<UserProfile> {
  const { data } = await api.patch<UserProfile>("/api/profile", { voice_anchor: voiceAnchor });
  return data;
}

/* ------------------------------------------------------------------ */
/* Job Search queue — "Why this company" match card                   */
/* ------------------------------------------------------------------ */

export interface MatchHighlight {
  type: "experience" | "build";
  company?: string;
  role?: string;
  name?: string;
  achievement?: string;
  proof?: string;
  score: number;
}

export interface MatchCard {
  highlights: MatchHighlight[];
  deaified_text: string;
}

export async function getMatchCard(clientId: string, seqId: string): Promise<MatchCard> {
  const { data } = await api.get<MatchCard>(
    `/api/clients/${clientId}/queue/${seqId}/match-card`,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* User role — permanent, DB-backed. Set once via the role selector,   */
/* read by the shell to pick which nav to render.                     */
/* ------------------------------------------------------------------ */

export type UserRole = "abm" | "candidate" | "hiring_manager";

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  user_role: UserRole | null;
  plan: string | null;
}

export async function getMe(): Promise<Me> {
  const { data } = await api.get<Me>("/api/users/me");
  return data;
}

export async function setUserRole(
  role: UserRole,
  company?: { company_name?: string; company_stage?: string },
): Promise<{ role: UserRole }> {
  const { data } = await api.post<{ role: UserRole }>("/api/users/role", {
    role,
    company_name: company?.company_name,
    company_stage: company?.company_stage,
  });
  return data;
}

/* ------------------------------------------------------------------ */
/* Organisations — hiring-manager company profile                     */
/* ------------------------------------------------------------------ */

export interface OrgInput {
  name: string;
  domain?: string;
  stage?: string;
  industry?: string;
}

export interface Organisation {
  id: string;
  name: string;
  domain: string | null;
  stage: string | null;
  industry: string | null;
  size_min: number;
  size_max: number;
  created_at: string;
}

export async function createOrg(data: OrgInput): Promise<{ org_id: string }> {
  const { data: res } = await api.post<{ org_id: string }>("/api/organisations", data);
  return res;
}

export async function getMyOrg(): Promise<Organisation | Record<string, never>> {
  const { data } = await api.get<Organisation | Record<string, never>>("/api/organisations/me");
  return data;
}

/* ------------------------------------------------------------------ */
/* Hiring marketplace — briefs, shortlists, reveal flow                */
/* ------------------------------------------------------------------ */

export interface BriefRequirements {
  must_have?: string[];
  nice_to_have?: string[];
  dealbreakers?: string[];
  culture?: string;
}

export interface CustomKeyword {
  keyword: string;
  weight: number; // fraction 0-1
  label: string;
}

export interface CreateBriefPayload {
  role_title: string;
  role_type?: string;
  location?: string;
  company_name: string;
  industry?: string;
  company_stage?: string;
  requirements?: BriefRequirements;
  weights?: Record<string, number>;
  custom_keywords?: CustomKeyword[];
}

export interface HiringBrief {
  id: string;
  user_id: string;
  company_name: string;
  company_stage: string | null;
  company_size_min: number;
  company_size_max: number;
  industry: string | null;
  location: string | null;
  role_title: string;
  role_type: string;
  requirements: BriefRequirements;
  weights: Record<string, number>;
  custom_keywords: CustomKeyword[];
  ctc_min: number | null;
  ctc_max: number | null;
  equity: boolean;
  active: boolean;
  filled: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
  /** Only present on listBriefs() — COUNT(shortlists) per brief. */
  match_count?: number;
}

export async function createBrief(
  data: CreateBriefPayload,
): Promise<{ brief_id: string; status: string }> {
  const { data: res } = await api.post<{ brief_id: string; status: string }>(
    "/api/hiring/briefs",
    data,
  );
  return res;
}

export async function listBriefs(): Promise<HiringBrief[]> {
  const { data } = await api.get<HiringBrief[]>("/api/hiring/briefs");
  return data;
}

/** PATCH /api/hiring/briefs/{id} — needs the matching backend route added
 * (api/main.py has no update endpoint for hiring_briefs yet). Wired here so
 * the "Mark filled" action is ready the moment that route exists. */
export async function markBriefFilled(
  briefId: string,
): Promise<{ id: string; filled: boolean; active: boolean }> {
  const { data } = await api.patch<{ id: string; filled: boolean; active: boolean }>(
    `/api/hiring/briefs/${briefId}`,
    { filled: true },
  );
  return data;
}

export interface ShortlistHighlight {
  type: "strength" | "gap";
  text: string;
}

export interface DimensionScore {
  label: string;
  raw_score: number; // 0-100
  weight: number; // percentage 0-100 (already *100'd by the backend)
  weighted_score: number;
  signals_found: string[];
  type: "standard" | "custom_keyword";
}

export interface ShortlistProfileSignal {
  summary: string;
  industries: string[];
  location: string;
  skills_count: number;
  builds_count: number;
}

export interface ShortlistProfileRevealed {
  name: string;
  context_graph: ContextGraph;
}

interface ShortlistEntryBase {
  shortlist_id: string;
  score: number;
  match_explanation: string;
  match_highlights: ShortlistHighlight[];
  dimension_scores: Record<string, DimensionScore>;
  reveal_state: "signal" | "requested" | "revealed" | "rejected";
}

export type ShortlistEntry =
  | (ShortlistEntryBase & { anonymous: true; profile: ShortlistProfileSignal })
  | (ShortlistEntryBase & { anonymous: false; profile: ShortlistProfileRevealed });

export async function getBriefShortlist(briefId: string): Promise<ShortlistEntry[]> {
  const { data } = await api.get<ShortlistEntry[]>(`/api/hiring/briefs/${briefId}/shortlist`);
  return data;
}

export async function requestReveal(shortlistId: string): Promise<{ requested: boolean }> {
  const { data } = await api.post<{ requested: boolean }>(
    `/api/hiring/shortlist/${shortlistId}/request-reveal`,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Candidate side — matches + notifications                           */
/* ------------------------------------------------------------------ */

export interface CandidateMatch {
  /** Needs `s.id AS shortlist_id` added to the backend's candidate_matches
   * SELECT (api/main.py) — without it there's no id to act on. */
  shortlist_id: string;
  match_score: number;
  reveal_state: "signal" | "requested" | "revealed" | "rejected";
  match_explanation: string | null;
  role_title: string;
  company_stage: string | null;
  location: string | null;
  industry: string | null;
  created_at: string;
}

export async function getCandidateMatches(): Promise<CandidateMatch[]> {
  const { data } = await api.get<CandidateMatch[]>("/api/candidate/matches");
  return data;
}

export interface CandidateNotification {
  id: string;
  user_id: string;
  type: string;
  title: string | null;
  body: string | null;
  read: boolean;
  metadata: { shortlist_id?: string; score?: number; brief_id?: string };
  created_at: string;
}

export async function getCandidateNotifications(): Promise<CandidateNotification[]> {
  const { data } = await api.get<CandidateNotification[]>("/api/candidate/notifications");
  return data;
}

export async function respondToNotification(
  notifId: string,
  action: "approve" | "reject",
): Promise<{ action: string; shortlist_id: string | null }> {
  const { data } = await api.post<{ action: string; shortlist_id: string | null }>(
    `/api/candidate/notifications/${notifId}/respond`,
    { action },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Admin — platform overview                                          */
/* ------------------------------------------------------------------ */

export interface PlatformOverviewUser {
  id: string;
  email: string | null;
  name: string | null;
  user_role: UserRole | null;
  plan: string | null;
  created_at: string;
  client_count: number;
}

export interface PlatformClientBreakdown {
  client_type: string;
  count: number;
  active_count: number;
}

export interface PlatformOverview {
  total_users: number;
  users_by_role: Record<string, number>;
  clients: PlatformClientBreakdown[];
  today_cost_usd: number;
  emails_sent_today: number;
  hiring_briefs: { total: number; active: number; filled: number };
  matches_made: number;
  all_users: PlatformOverviewUser[];
}

export async function getPlatformOverview(): Promise<PlatformOverview> {
  const { data } = await api.get<PlatformOverview>("/api/admin/platform");
  return data;
}
