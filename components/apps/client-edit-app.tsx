"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from "lucide-react";
import {
  getClient,
  updateClient,
  ApiValidationError,
  type Client,
  type UpdateClientPayload,
} from "@/lib/api";
import { XpButton, XpProgress, XpDialog, Loading, ErrorNote } from "@/components/xp";
import { TagInput } from "@/components/tag-input";
import {
  cleanDomain,
  validateDomain,
  validateGeography,
  validateSenderName,
  senderEmailIssues,
  validateVoiceAnchor,
  dailySendCapIssue,
  thresholdLabel,
} from "@/lib/validators";

const STEPS = ["Basics", "ICP", "Positioning", "Settings"] as const;

const TITLE_SUGGESTIONS = [
  "CEO", "Founder", "Co-Founder", "CTO", "CMO", "VP Marketing", "VP Growth",
  "Head of Marketing", "Head of Growth", "Head of Sales", "Director of Marketing",
  "Growth Lead", "Demand Generation Manager", "Marketing Manager",
];

const inputCls =
  "w-full xp-inset rounded-sm px-2 py-1.5 text-[13px] text-neutral-800 outline-none focus:ring-1 focus:ring-[#316ac5]";

function Field({
  label,
  hint,
  error,
  warn,
  changed,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  warn?: string | null;
  changed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block rounded-sm ${changed ? "bg-[#fff7d6] -mx-1 px-1 py-0.5" : ""}`}>
      <span className="mb-1 flex items-center gap-2 text-[12px] font-bold text-neutral-700">
        {label}
        {changed && <span className="text-[10px] font-normal text-[#9a7b10]">changed</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-0.5 block text-[11px] font-semibold text-[#a02020]">{error}</span>
      ) : warn ? (
        <span className="mt-0.5 block text-[11px] text-[#9a7b10]">⚠ {warn}</span>
      ) : hint ? (
        <span className="mt-0.5 block text-[11px] text-neutral-400">{hint}</span>
      ) : null}
    </label>
  );
}

const eqArr = (a: string[], b: string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

export default function ClientEditApp({
  clientId,
  onDone,
}: {
  clientId: string;
  onDone?: () => void;
}) {
  const qc = useQueryClient();
  const { data: client, isLoading, error } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClient(clientId),
    enabled: !!clientId,
  });

  const [step, setStep] = useState(0);

  // form state
  const [name, setName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderDomain, setSenderDomain] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [sizeMin, setSizeMin] = useState("20");
  const [sizeMax, setSizeMax] = useState("200");
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [techSignals, setTechSignals] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [differentiators, setDifferentiators] = useState<string[]>([]);
  const [proofPoints, setProofPoints] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [voiceAnchor, setVoiceAnchor] = useState("");
  const [threshold, setThreshold] = useState(70);
  const [dailyCap, setDailyCap] = useState(10);

  const initial = useRef<Client | null>(null);

  useEffect(() => {
    if (!client || initial.current) return;
    initial.current = client;
    const icp = client.icp || {};
    const pos = client.positioning || {};
    setName(client.name || "");
    setSenderName(client.sender_name || "");
    setSenderEmail(client.sender_email || "");
    setSenderDomain(client.sender_domain || "");
    setCampaignGoal(client.campaign_goal || "");
    setIndustries(icp.industries || []);
    setGeographies(icp.geographies || []);
    setTitles(icp.titles || []);
    setPainPoints(icp.pain_points || []);
    setSizeMin(String(icp.company_size?.min ?? 20));
    setSizeMax(String(icp.company_size?.max ?? 200));
    setExclusions(icp.exclusions || []);
    setTechSignals(icp.tech_signals || []);
    setCategory(pos.category || "");
    setDifferentiators(pos.differentiators || []);
    setProofPoints(pos.proof_points || []);
    setCompetitors(pos.competitors || []);
    setVoiceAnchor(pos.voice_anchor || "");
    setThreshold(client.confidence_threshold ?? 70);
    setDailyCap(client.daily_send_cap ?? 10);
  }, [client]);

  // live client-side field errors (red = blocks save) and warnings (yellow = allows)
  const domainErr = senderDomain ? validateDomain(senderDomain)[0] ?? null : "Required";
  const snIssue = validateSenderName(senderName);
  const emailIssue = senderEmail.trim()
    ? senderEmailIssues(senderEmail, senderDomain)
    : { error: "Required" as string | null, warn: null as string | null };
  const voiceIssue = validateVoiceAnchor(voiceAnchor);
  const capIssue = dailySendCapIssue(dailyCap);
  const categoryErr = !category.trim()
    ? "Required"
    : category.length < 10
      ? "Too vague — be specific (10+ chars)"
      : null;
  const sizeErr =
    Number(sizeMin) >= Number(sizeMax) ? "Min must be less than max" : null;

  const errorCount = [
    name.trim() ? null : "name",
    snIssue.error, emailIssue.error, domainErr, voiceIssue.error, capIssue.error,
    categoryErr, sizeErr,
  ].filter(Boolean).length;

  const payload: UpdateClientPayload = useMemo(
    () => ({
      name: name.trim(),
      sender_name: senderName.trim(),
      sender_email: senderEmail.trim(),
      sender_domain: cleanDomain(senderDomain),
      campaign_goal: campaignGoal.trim(),
      confidence_threshold: threshold,
      daily_send_cap: dailyCap,
      icp: {
        industries,
        geographies,
        titles,
        pain_points: painPoints,
        company_size: { min: Number(sizeMin) || undefined, max: Number(sizeMax) || undefined },
        exclusions,
        tech_signals: techSignals,
      },
      positioning: {
        category: category.trim(),
        differentiators,
        proof_points: proofPoints,
        competitors,
        voice_anchor: voiceAnchor.trim(),
      },
    }),
    [name, senderName, senderEmail, senderDomain, campaignGoal, threshold, dailyCap,
     industries, geographies, titles, painPoints, sizeMin, sizeMax, exclusions, techSignals,
     category, differentiators, proofPoints, competitors, voiceAnchor],
  );

  const mutation = useMutation({
    mutationFn: () => updateClient(clientId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client", clientId] });
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
  });

  const serverErrors: string[] =
    mutation.error instanceof ApiValidationError ? mutation.error.errors : [];

  if (isLoading) return <Loading label="Loading client…" />;
  if (error) return <ErrorNote error={error} />;

  const i = initial.current;
  const ch = {
    name: !!i && name !== (i.name || ""),
    senderName: !!i && senderName !== (i.sender_name || ""),
    senderEmail: !!i && senderEmail !== (i.sender_email || ""),
    senderDomain: !!i && cleanDomain(senderDomain) !== (i.sender_domain || ""),
    campaignGoal: !!i && campaignGoal !== (i.campaign_goal || ""),
    threshold: !!i && threshold !== (i.confidence_threshold ?? 70),
    dailyCap: !!i && dailyCap !== (i.daily_send_cap ?? 10),
    industries: !!i && !eqArr(industries, i.icp?.industries || []),
    geographies: !!i && !eqArr(geographies, i.icp?.geographies || []),
    titles: !!i && !eqArr(titles, i.icp?.titles || []),
    painPoints: !!i && !eqArr(painPoints, i.icp?.pain_points || []),
    category: !!i && category !== (i.positioning?.category || ""),
    voice: !!i && voiceAnchor !== (i.positioning?.voice_anchor || ""),
  };

  const last = step === STEPS.length - 1;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          {STEPS.map((s, idx) => (
            <span key={s} className={idx === step ? "text-[#0a246a]" : ""}>
              {idx + 1}. {s}
            </span>
          ))}
        </div>
        <XpProgress value={((step + 1) / STEPS.length) * 100} tone="teal" />
      </div>

      <div className="min-h-[300px] space-y-3 xp-inset bg-white p-4">
        {step === 0 && (
          <>
            <Field label="Client name *" changed={ch.name}>
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Your name (shown in emails)" error={snIssue.error} warn={snIssue.warn} changed={ch.senderName}>
              <input className={inputCls} value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="A real person — e.g. Akshar" />
            </Field>
            <Field label="Sender email" error={emailIssue.error} warn={emailIssue.warn} changed={ch.senderEmail}>
              <input className={inputCls} value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="founder@company.com" />
            </Field>
            <Field
              label="Sender domain"
              error={domainErr}
              hint={senderDomain ? `Cleaned: ${cleanDomain(senderDomain)}` : "Auto-cleaned on blur"}
              changed={ch.senderDomain}
            >
              <input
                className={inputCls}
                value={senderDomain}
                onChange={(e) => setSenderDomain(e.target.value)}
                onBlur={() => setSenderDomain((d) => cleanDomain(d))}
                placeholder="company.com"
              />
            </Field>
            <Field label="Campaign goal *" changed={ch.campaignGoal}>
              <input className={inputCls} value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Industries" changed={ch.industries}>
              <TagInput value={industries} onChange={setIndustries} placeholder="fintech, edtech…" />
            </Field>
            <Field label="Geographies" hint="Validated on add — invalid = red" changed={ch.geographies}>
              <TagInput value={geographies} onChange={setGeographies} placeholder="India, SEA…" validate={(g) => validateGeography(g)} />
            </Field>
            <Field label="Decision-maker titles" hint="Type for suggestions" changed={ch.titles}>
              <TagInput value={titles} onChange={setTitles} placeholder="Head of Marketing…" suggestions={TITLE_SUGGESTIONS} />
            </Field>
            <Field label="Pain points" hint="5–100 chars each" changed={ch.painPoints}>
              <TagInput
                value={painPoints}
                onChange={setPainPoints}
                placeholder="no marketing team…"
                minChars={5}
                maxChars={100}
                validate={(p) => (p.length < 5 ? "Too vague" : p.length > 100 ? "Max 100 chars" : null)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company size — min" error={sizeErr}>
                <input className={inputCls} type="number" value={sizeMin} onChange={(e) => setSizeMin(e.target.value)} />
              </Field>
              <Field label="Company size — max">
                <input className={inputCls} type="number" value={sizeMax} onChange={(e) => setSizeMax(e.target.value)} />
              </Field>
            </div>
            <Field label="Exclusions" hint="optional">
              <TagInput value={exclusions} onChange={setExclusions} placeholder="agencies, government…" />
            </Field>
            <Field label="Tech signals" hint="optional">
              <TagInput value={techSignals} onChange={setTechSignals} placeholder="HubSpot, Notion…" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Category" error={categoryErr} hint="Min 10 chars — be specific" changed={ch.category}>
              <input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="AI-native marketing OS" />
            </Field>
            <Field label="Differentiators" hint="At least 2">
              <TagInput value={differentiators} onChange={setDifferentiators} placeholder="no headcount needed…" />
            </Field>
            <Field label="Proof points" hint="At least 1">
              <TagInput value={proofPoints} onChange={setProofPoints} placeholder="3x reply rates for Acme…" />
            </Field>
            <Field label="Competitors" hint="optional">
              <TagInput value={competitors} onChange={setCompetitors} placeholder="HubSpot, Outreach…" />
            </Field>
            <Field label="Writing voice" error={voiceIssue.error} hint={`The AI matches this style · ${voiceAnchor.length}/200`} changed={ch.voice}>
              <textarea className={`${inputCls} h-20 resize-none`} value={voiceAnchor} onChange={(e) => setVoiceAnchor(e.target.value)} maxLength={200} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label={`Confidence threshold: ${threshold} — ${thresholdLabel(threshold)}`} changed={ch.threshold}>
              <input type="range" min={30} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-[#1b5dbf]" />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>30 · almost all auto</span>
                <span>70 · balanced</span>
                <span>95 · manual</span>
              </div>
            </Field>
            <Field
              label="Daily send cap"
              error={capIssue.error}
              warn={capIssue.warn}
              changed={ch.dailyCap}
            >
              <input className={inputCls} type="number" value={dailyCap} onChange={(e) => setDailyCap(Number(e.target.value))} />
            </Field>

            <div className="mt-3 border-t border-[#d8d4c8] pt-3">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#0a246a]">Review</div>
              <dl className="space-y-0.5 text-[12px]">
                {[
                  ["Name", name, ch.name],
                  ["Sender", `${senderName} <${senderEmail}>`, ch.senderName || ch.senderEmail],
                  ["Domain", cleanDomain(senderDomain), ch.senderDomain],
                  ["Goal", campaignGoal, ch.campaignGoal],
                  ["Industries", industries.join(", "), ch.industries],
                  ["Geographies", geographies.join(", "), ch.geographies],
                  ["Titles", titles.join(", "), ch.titles],
                  ["Category", category, ch.category],
                  ["Threshold", String(threshold), ch.threshold],
                  ["Daily cap", String(dailyCap), ch.dailyCap],
                ].map(([k, v, changed]) => (
                  <div key={k as string} className={`flex gap-2 rounded-sm px-1 ${changed ? "bg-[#fff7d6]" : ""}`}>
                    <dt className="w-24 shrink-0 font-semibold text-neutral-500">{k}</dt>
                    <dd className="text-neutral-800">{(v as string) || "—"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {serverErrors.length > 0 && (
              <div className="mt-2 border border-[#a02020] bg-[#fdeaea] px-3 py-2 text-[12px] text-[#7a1818]">
                <div className="mb-1 flex items-center gap-1 font-bold">
                  <AlertTriangle size={13} /> Please fix:
                </div>
                <ul className="list-disc pl-5">
                  {serverErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {mutation.isError && serverErrors.length === 0 && <ErrorNote error={mutation.error} />}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <XpButton disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <span className="inline-flex items-center gap-1"><ChevronLeft size={14} /> Back</span>
        </XpButton>
        {!last ? (
          <XpButton variant="primary" onClick={() => setStep((s) => s + 1)}>
            <span className="inline-flex items-center gap-1">Next <ChevronRight size={14} /></span>
          </XpButton>
        ) : (
          <XpButton variant="green" disabled={mutation.isPending || errorCount > 0} onClick={() => mutation.mutate()}>
            <span className="inline-flex items-center gap-1">
              <Check size={14} />
              {mutation.isPending
                ? "Saving…"
                : errorCount > 0
                  ? `Fix ${errorCount} error${errorCount > 1 ? "s" : ""} to continue`
                  : "Save Changes"}
            </span>
          </XpButton>
        )}
      </div>

      <XpDialog
        open={mutation.isSuccess}
        onOpenChange={(o) => { if (!o) { mutation.reset(); onDone?.(); } }}
        title="Saved"
        footer={<XpButton variant="primary" onClick={() => { mutation.reset(); onDone?.(); }}>Done</XpButton>}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#2d7a2d] text-white"><Check size={22} /></div>
          <div>
            <div className="font-bold text-neutral-800">Changes saved.</div>
            <div className="text-[12px] text-neutral-600">The orchestrator will re-evaluate this client on its next cycle.</div>
          </div>
        </div>
      </XpDialog>
    </div>
  );
}
