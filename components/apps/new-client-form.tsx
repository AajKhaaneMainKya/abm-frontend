"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check, AlertTriangle } from "lucide-react";
import {
  createClient,
  ApiValidationError,
  type CreateClientPayload,
  type Client,
} from "@/lib/api";
import { XpButton, XpProgress, XpDialog, ErrorNote } from "@/components/xp";
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

const STEPS = ["Basics", "ICP", "Positioning", "Campaign"] as const;

const TITLE_SUGGESTIONS = [
  "CEO", "Founder", "Co-Founder", "CTO", "CMO", "VP Marketing", "VP Growth",
  "Head of Marketing", "Head of Growth", "Head of Sales", "Director of Marketing",
  "Growth Lead", "Demand Generation Manager", "Marketing Manager",
];

const baseInput =
  "w-full xp-inset rounded-sm px-2 py-1.5 text-[13px] text-neutral-800 outline-none focus:ring-1 focus:ring-[#316ac5]";

type FieldState = "neutral" | "error" | "warn" | "valid";

function ringClass(state: FieldState): string {
  return state === "error"
    ? "ring-1 ring-[#a02020]"
    : state === "warn"
      ? "ring-1 ring-[#c8a020]"
      : state === "valid"
        ? "ring-1 ring-[#2d7a2d]"
        : "";
}

/** Inline-validated field: red error (blocks), yellow warn (allows), green when valid. */
function Field({
  label,
  hint,
  error,
  warn,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  warn?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-bold text-neutral-700">{label}</span>
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

export default function NewClientForm({
  onOpenWorkspace,
  onDashboard,
}: {
  onOpenWorkspace: (client: Client) => void;
  onDashboard: () => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const touch = (f: string) => setTouched((s) => new Set(s).add(f));
  const show = (f: string) => tried || touched.has(f);

  // ── form state ──
  const [name, setName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderDomain, setSenderDomain] = useState("");
  const [industries, setIndustries] = useState<string[]>([]);
  const [sizeMin, setSizeMin] = useState("20");
  const [sizeMax, setSizeMax] = useState("200");
  const [titles, setTitles] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [differentiators, setDifferentiators] = useState<string[]>([]);
  const [proofPoints, setProofPoints] = useState<string[]>([]);
  const [voiceAnchor, setVoiceAnchor] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("3 discovery calls in 30 days");
  const [threshold, setThreshold] = useState(70);
  const [dailyCap, setDailyCap] = useState(10);

  // ── per-field issues (red error blocks submit, yellow warn allows) ──
  const nameErr = name.trim() ? null : "Required";
  const snIssue = validateSenderName(senderName);
  const emailIssue = senderEmail.trim()
    ? senderEmailIssues(senderEmail, senderDomain)
    : { error: "Required", warn: null };
  const domainErr = senderDomain.trim() ? validateDomain(senderDomain)[0] ?? null : "Required";
  const voiceIssue = validateVoiceAnchor(voiceAnchor);
  const capIssue = dailySendCapIssue(dailyCap);
  const categoryErr = !category.trim()
    ? "Required"
    : category.trim().length < 10
      ? "Too vague — be specific (10+ chars)"
      : null;
  const industriesErr = industries.length ? null : "Add at least one";
  const geoErr =
    geographies.length === 0
      ? "Add at least one"
      : geographies.some((g) => validateGeography(g))
        ? "Some look invalid (see red tags)"
        : null;
  const titlesErr = titles.length >= 2 ? null : "Add at least 2";
  const painErr =
    painPoints.length < 2
      ? "Add at least 2"
      : painPoints.some((p) => p.length < 5 || p.length > 100)
        ? "Each must be 5–100 chars"
        : null;
  const sizeErr = Number(sizeMin) >= Number(sizeMax) ? "Min must be less than max" : null;

  const blockingErrors = [
    nameErr, snIssue.error, emailIssue.error, domainErr, voiceIssue.error, capIssue.error,
    categoryErr, industriesErr, geoErr, titlesErr, painErr, sizeErr,
  ].filter(Boolean) as string[];
  const errorCount = blockingErrors.length;

  const fieldState = (
    shown: boolean,
    error: string | null,
    warn: string | null,
    hasValue: boolean,
  ): FieldState =>
    !shown ? "neutral" : error ? "error" : warn ? "warn" : hasValue ? "valid" : "neutral";

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateClientPayload = {
        name: name.trim(),
        sender_name: senderName.trim() || undefined,
        sender_email: senderEmail.trim() || undefined,
        sender_domain: cleanDomain(senderDomain) || undefined,
        campaign_goal: campaignGoal.trim() || undefined,
        confidence_threshold: threshold,
        daily_send_cap: dailyCap,
        icp: {
          industries,
          company_size: { min: Number(sizeMin) || undefined, max: Number(sizeMax) || undefined },
          titles,
          geographies,
          pain_points: painPoints,
        },
        positioning: {
          category: category.trim() || undefined,
          differentiators,
          proof_points: proofPoints,
          voice_anchor: voiceAnchor.trim() || undefined,
        },
      };
      return createClient(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const serverErrors =
    mutation.error instanceof ApiValidationError ? mutation.error.errors : [];
  const warnings = mutation.data?.warnings ?? [];
  const last = step === STEPS.length - 1;

  const submit = () => {
    setTried(true);
    if (errorCount > 0) {
      setStep(0); // surface the earliest errors
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="p-4">
      {/* Wizard progress */}
      <div className="mb-4">
        <div className="mb-2 flex justify-between text-[11px] font-bold uppercase tracking-wide text-neutral-500">
          {STEPS.map((s, i) => (
            <span key={s} className={i === step ? "text-[#0a246a]" : ""}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <XpProgress value={((step + 1) / STEPS.length) * 100} tone="teal" />
      </div>

      <div className="min-h-[300px] space-y-3 xp-inset bg-white p-4">
        {step === 0 && (
          <>
            <Field label="Client name *" error={show("name") ? nameErr : null}>
              <input
                className={`${baseInput} ${ringClass(fieldState(show("name"), nameErr, null, !!name.trim()))}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => touch("name")}
                placeholder="Acme Inc."
              />
            </Field>
            <Field
              label="Your name (shown in emails) *"
              error={show("senderName") ? snIssue.error : null}
              warn={show("senderName") ? snIssue.warn : null}
            >
              <input
                className={`${baseInput} ${ringClass(fieldState(show("senderName"), snIssue.error, snIssue.warn, !!senderName.trim()))}`}
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                onBlur={() => touch("senderName")}
                placeholder="e.g. Rahul"
              />
            </Field>
            <Field
              label="Sender email *"
              error={show("senderEmail") ? emailIssue.error : null}
              warn={show("senderEmail") ? emailIssue.warn : null}
            >
              <input
                className={`${baseInput} ${ringClass(fieldState(show("senderEmail"), emailIssue.error, emailIssue.warn, !!senderEmail.trim()))}`}
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                onBlur={() => touch("senderEmail")}
                placeholder="founder@acme.com"
              />
            </Field>
            <Field
              label="Sender domain *"
              error={show("senderDomain") ? domainErr : null}
              hint={senderDomain.trim() ? `Using: ${cleanDomain(senderDomain)}` : "Auto-cleaned on blur"}
            >
              <input
                className={`${baseInput} ${ringClass(fieldState(show("senderDomain"), domainErr, null, !!senderDomain.trim()))}`}
                value={senderDomain}
                onChange={(e) => setSenderDomain(e.target.value)}
                onBlur={() => {
                  setSenderDomain((d) => cleanDomain(d));
                  touch("senderDomain");
                }}
                placeholder="acme.com"
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Target industries *" error={show("industries") ? industriesErr : null}>
              <TagInput value={industries} onChange={(v) => { setIndustries(v); touch("industries"); }} placeholder="fintech, edtech, SaaS…" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company size — min" error={sizeErr}>
                <input className={baseInput} type="number" value={sizeMin} onChange={(e) => setSizeMin(e.target.value)} />
              </Field>
              <Field label="Company size — max">
                <input className={baseInput} type="number" value={sizeMax} onChange={(e) => setSizeMax(e.target.value)} />
              </Field>
            </div>
            <Field label="Decision-maker titles *" hint="Type for suggestions — at least 2" error={show("titles") ? titlesErr : null}>
              <TagInput value={titles} onChange={(v) => { setTitles(v); touch("titles"); }} placeholder="Head of Marketing, VP Growth…" suggestions={TITLE_SUGGESTIONS} />
            </Field>
            <Field label="Geographies *" hint="Validated on add — invalid = red" error={show("geographies") ? geoErr : null}>
              <TagInput value={geographies} onChange={(v) => { setGeographies(v); touch("geographies"); }} placeholder="India, SEA…" validate={(g) => validateGeography(g)} />
            </Field>
            <Field label="Pain points *" hint="5–100 chars each, at least 2" error={show("painPoints") ? painErr : null}>
              <TagInput
                value={painPoints}
                onChange={(v) => { setPainPoints(v); touch("painPoints"); }}
                placeholder="no marketing team…"
                minChars={5}
                maxChars={100}
                validate={(p) => (p.length < 5 ? "Too vague" : p.length > 100 ? "Max 100 chars" : null)}
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Category *" hint="Min 10 chars — be specific" error={show("category") ? categoryErr : null}>
              <input
                className={`${baseInput} ${ringClass(fieldState(show("category"), categoryErr, null, !!category.trim()))}`}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                onBlur={() => touch("category")}
                placeholder="AI-native marketing OS"
              />
            </Field>
            <Field label="Differentiators" hint="At least 2 recommended">
              <TagInput value={differentiators} onChange={setDifferentiators} placeholder="no headcount needed…" />
            </Field>
            <Field label="Proof points" hint="At least 1 recommended">
              <TagInput value={proofPoints} onChange={setProofPoints} placeholder="3x reply rates for Acme…" />
            </Field>
            <Field
              label="Writing voice *"
              error={show("voiceAnchor") ? voiceIssue.error : null}
              hint={`The AI matches this style when writing emails · ${voiceAnchor.length}/200`}
            >
              <textarea
                className={`${baseInput} h-20 resize-none ${ringClass(fieldState(show("voiceAnchor"), voiceIssue.error, null, !!voiceAnchor.trim()))}`}
                value={voiceAnchor}
                onChange={(e) => setVoiceAnchor(e.target.value)}
                onBlur={() => touch("voiceAnchor")}
                maxLength={200}
                placeholder="e.g. direct, no fluff, founder-led"
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Campaign goal">
              <input className={baseInput} value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} />
            </Field>
            <Field label={`Confidence threshold: ${threshold}`} hint={thresholdLabel(threshold)}>
              <input type="range" min={30} max={95} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-[#1b5dbf]" />
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>30 · almost all auto</span>
                <span>70 · balanced</span>
                <span>95 · manual</span>
              </div>
            </Field>
            <Field
              label="Daily send cap"
              error={show("dailyCap") ? capIssue.error : null}
              warn={show("dailyCap") ? capIssue.warn : null}
            >
              <input
                className={`${baseInput} ${ringClass(fieldState(show("dailyCap"), capIssue.error, capIssue.warn, true))}`}
                type="number"
                value={dailyCap}
                onChange={(e) => setDailyCap(Number(e.target.value))}
                onBlur={() => touch("dailyCap")}
              />
            </Field>

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

      {/* Wizard nav */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <XpButton disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <span className="inline-flex items-center gap-1"><ChevronLeft size={14} /> Back</span>
        </XpButton>

        {!last ? (
          <XpButton variant="primary" onClick={() => setStep((s) => s + 1)}>
            <span className="inline-flex items-center gap-1">Next <ChevronRight size={14} /></span>
          </XpButton>
        ) : (
          <XpButton
            variant="green"
            disabled={mutation.isPending || errorCount > 0}
            onClick={submit}
          >
            <span className="inline-flex items-center gap-1">
              <Check size={14} />
              {mutation.isPending
                ? "Creating…"
                : errorCount > 0
                  ? `Fix ${errorCount} error${errorCount > 1 ? "s" : ""} to continue`
                  : "Create Client"}
            </span>
          </XpButton>
        )}
      </div>

      {/* Completion dialog */}
      <XpDialog
        open={mutation.isSuccess}
        onOpenChange={(o) => { if (!o) mutation.reset(); }}
        title="Setup Complete"
        footer={
          <>
            <XpButton variant="primary" onClick={() => { if (mutation.data) onOpenWorkspace(mutation.data); mutation.reset(); }}>
              Open workspace
            </XpButton>
            <XpButton onClick={() => { onDashboard(); mutation.reset(); }}>Dashboard</XpButton>
          </>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#2d7a2d] text-white">
              <Check size={22} />
            </div>
            <div>
              <div className="font-bold text-neutral-800">{mutation.data?.name} created.</div>
              <div className="text-[12px] text-neutral-600">
                The orchestrator will begin discovery on its next cycle.
              </div>
            </div>
          </div>
          {warnings.length > 0 && (
            <div className="border border-[#d8b24a] bg-[#fff7d6] px-3 py-2 text-[11px] text-[#7a5c10]">
              <div className="mb-0.5 font-bold">Created with warnings:</div>
              <ul className="list-disc pl-4">
                {warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      </XpDialog>
    </div>
  );
}
