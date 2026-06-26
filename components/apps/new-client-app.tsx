"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { createClient, type CreateClientPayload } from "@/lib/api";
import { XpButton, XpProgress, XpDialog, ErrorNote } from "@/components/xp";
import { useWindowManager } from "@/components/window-manager";

const STEPS = ["Company", "ICP", "Positioning", "Campaign"] as const;

function splitList(s: string): string[] {
  return s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-bold text-neutral-700">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-[11px] text-neutral-400">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full xp-inset rounded-sm px-2 py-1.5 text-[13px] text-neutral-800 outline-none focus:ring-1 focus:ring-[#316ac5]";

export default function NewClientApp() {
  const wm = useWindowManager();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [industries, setIndustries] = useState("");
  const [sizeMin, setSizeMin] = useState("20");
  const [sizeMax, setSizeMax] = useState("200");
  const [titles, setTitles] = useState("");
  const [geographies, setGeographies] = useState("");
  const [painPoints, setPainPoints] = useState("");
  const [category, setCategory] = useState("");
  const [differentiators, setDifferentiators] = useState("");
  const [proofPoints, setProofPoints] = useState("");
  const [voiceAnchor, setVoiceAnchor] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("3 discovery calls in 30 days");
  const [threshold, setThreshold] = useState(70);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: CreateClientPayload = {
        name: name.trim(),
        sender_email: senderEmail.trim() || undefined,
        sender_domain: website.trim().replace(/^https?:\/\//, "") || undefined,
        campaign_goal: campaignGoal.trim() || undefined,
        confidence_threshold: threshold,
        icp: {
          industries: splitList(industries),
          company_size: { min: Number(sizeMin) || undefined, max: Number(sizeMax) || undefined },
          titles: splitList(titles),
          geographies: splitList(geographies),
          pain_points: splitList(painPoints),
        },
        positioning: {
          category: category.trim() || undefined,
          differentiators: splitList(differentiators),
          proof_points: splitList(proofPoints),
          voice_anchor: voiceAnchor.trim() || undefined,
        },
      };
      return createClient(payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  const canNext = step === 0 ? name.trim().length > 0 : true;
  const last = step === STEPS.length - 1;

  return (
    <div className="p-4">
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

      <div className="min-h-[280px] space-y-4 xp-inset bg-white p-4">
        {step === 0 && (
          <>
            <Field label="Company name *">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc." />
            </Field>
            <Field label="Website" hint="Used as the sending domain.">
              <input className={inputCls} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
            </Field>
            <Field label="Sender email">
              <input className={inputCls} value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="founder@acme.com" />
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Target industries" hint="Comma-separated.">
              <input className={inputCls} value={industries} onChange={(e) => setIndustries(e.target.value)} placeholder="fintech, edtech, SaaS" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Company size — min"><input className={inputCls} type="number" value={sizeMin} onChange={(e) => setSizeMin(e.target.value)} /></Field>
              <Field label="Company size — max"><input className={inputCls} type="number" value={sizeMax} onChange={(e) => setSizeMax(e.target.value)} /></Field>
            </div>
            <Field label="Decision-maker titles" hint="Comma-separated.">
              <input className={inputCls} value={titles} onChange={(e) => setTitles(e.target.value)} placeholder="Head of Marketing, VP Growth, CMO" />
            </Field>
            <Field label="Geographies" hint="Comma-separated.">
              <input className={inputCls} value={geographies} onChange={(e) => setGeographies(e.target.value)} placeholder="India, SEA" />
            </Field>
            <Field label="Pain points" hint="Comma-separated.">
              <input className={inputCls} value={painPoints} onChange={(e) => setPainPoints(e.target.value)} placeholder="no marketing team, slow pipeline" />
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Category"><input className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="AI-native marketing OS" /></Field>
            <Field label="Differentiators" hint="Comma-separated.">
              <input className={inputCls} value={differentiators} onChange={(e) => setDifferentiators(e.target.value)} placeholder="no headcount needed, learns your voice" />
            </Field>
            <Field label="Proof points" hint="Comma-separated.">
              <input className={inputCls} value={proofPoints} onChange={(e) => setProofPoints(e.target.value)} placeholder="3x reply rates for Acme" />
            </Field>
            <Field label="Voice anchor" hint="How the sender actually writes.">
              <textarea className={`${inputCls} h-20 resize-none`} value={voiceAnchor} onChange={(e) => setVoiceAnchor(e.target.value)} placeholder="direct, no fluff, founder-led" />
            </Field>
          </>
        )}
        {step === 3 && (
          <>
            <Field label="Campaign goal"><input className={inputCls} value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)} /></Field>
            <Field label={`Confidence threshold: ${threshold}`} hint="Above this, the system sends autonomously; below it queues for review.">
              <input type="range" min={0} max={100} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-[#1b5dbf]" />
            </Field>
            {mutation.isError && <ErrorNote error={mutation.error} />}
          </>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <XpButton disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          <span className="inline-flex items-center gap-1"><ChevronLeft size={14} /> Back</span>
        </XpButton>
        {!last ? (
          <XpButton variant="primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            <span className="inline-flex items-center gap-1">Next <ChevronRight size={14} /></span>
          </XpButton>
        ) : (
          <XpButton variant="green" disabled={mutation.isPending || !name.trim()} onClick={() => mutation.mutate()}>
            <span className="inline-flex items-center gap-1"><Check size={14} /> {mutation.isPending ? "Creating…" : "Create Client"}</span>
          </XpButton>
        )}
      </div>

      <XpDialog
        open={mutation.isSuccess}
        onOpenChange={(o) => { if (!o) mutation.reset(); }}
        title="Setup Complete"
        footer={
          <>
            <XpButton
              variant="primary"
              onClick={() => {
                if (mutation.data) wm.open("client", { props: { clientId: mutation.data.id, clientName: mutation.data.name }, title: mutation.data.name });
                mutation.reset();
              }}
            >
              Open workspace
            </XpButton>
            <XpButton onClick={() => { wm.open("dashboard"); mutation.reset(); }}>Dashboard</XpButton>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[#2d7a2d] text-white"><Check size={22} /></div>
          <div>
            <div className="font-bold text-neutral-800">{mutation.data?.name} created.</div>
            <div className="text-[12px] text-neutral-600">The orchestrator will begin discovery on its next cycle.</div>
          </div>
        </div>
      </XpDialog>
    </div>
  );
}
