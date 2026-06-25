/**
 * Typed API layer for the ABM REST backend (FastAPI, see api/main.py).
 * Every endpoint is scoped to a client_id. Base URL comes from
 * NEXT_PUBLIC_API_URL (the Railway deployment).
 */
import axios from "axios";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://abm-api.railway.app";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
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
  confidence_score_at_send: number | null;
  created_at: string;
  company: string | null;
  dm_name: string | null;
  dm_title: string | null;
  dm_email: string | null;
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

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  const { data } = await api.post<Client>("/api/clients", payload);
  return data;
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
