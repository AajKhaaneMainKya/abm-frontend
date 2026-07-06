"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createBrief, type BriefRequirements, type CustomKeyword } from "@/lib/api";
import WeightSliders, { DEFAULT_WEIGHTS } from "@/components/weight-sliders";
import KeywordWeights from "@/components/keyword-weights";

const ROLE_TYPES = [
  { value: "full_time", label: "Full-time" },
  { value: "contract", label: "Contract" },
  { value: "co_founder", label: "Co-founder" },
];

const STAGES = ["Seed", "Series A", "Series B", "Growth"];

type TagVariant = "teal" | "red" | "grey";

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
  variant = "grey",
}: {
  label: string;
  placeholder?: string;
  tags: string[];
  onChange: (next: string[]) => void;
  variant?: TagVariant;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v || tags.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...tags, v]);
    setDraft("");
  };

  const chipClass =
    variant === "teal"
      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
      : variant === "red"
        ? "bg-[var(--danger-soft)] text-[var(--danger)]"
        : "bg-[var(--surface)] text-[var(--text-secondary)]";

  return (
    <div>
      <label className="text-[13px] font-semibold text-[var(--foreground)]">{label}</label>
      <input
        className="input mt-1.5"
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
      />
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${chipClass}`}
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                className="opacity-60 hover:opacity-100"
                aria-label={`Remove ${t}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostBriefPage() {
  const router = useRouter();

  const [roleTitle, setRoleTitle] = useState("");
  const [roleType, setRoleType] = useState("full_time");
  const [location, setLocation] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");

  const [mustHave, setMustHave] = useState<string[]>([]);
  const [niceToHave, setNiceToHave] = useState<string[]>([]);
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [culture, setCulture] = useState("");

  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [customKeywords, setCustomKeywords] = useState<CustomKeyword[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!roleTitle.trim() && !!companyName.trim() && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const requirements: BriefRequirements = {
        must_have: mustHave,
        nice_to_have: niceToHave,
        dealbreakers,
        culture: culture.trim() || undefined,
      };
      const { brief_id } = await createBrief({
        role_title: roleTitle.trim(),
        role_type: roleType,
        location: location.trim() || undefined,
        company_name: companyName.trim(),
        industry: industry.trim() || undefined,
        company_stage: stage || undefined,
        requirements,
        weights,
        custom_keywords: customKeywords,
      });
      router.push(`/hiring/shortlist?brief=${brief_id}`);
    } catch {
      setError("Could not post this brief — please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <div>
        <h1 className="text-[20px] font-bold text-[var(--foreground)]">Post a Brief</h1>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          Tell Sahayak what you&apos;re hiring for — it&apos;ll traverse candidate profiles and bring
          you a ranked shortlist.
        </p>
      </div>

      <section className="card-flush">
        <div className="card-header">The Role</div>
        <div className="space-y-4 p-4">
          <div>
            <label className="text-[13px] font-semibold text-[var(--foreground)]">
              Role title *
            </label>
            <input
              className="input mt-1.5"
              placeholder="Founding Engineer"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--foreground)]">
              Role type
            </label>
            <div className="flex gap-2">
              {ROLE_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setRoleType(rt.value)}
                  className={`rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    roleType === rt.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-white text-[var(--foreground)]"
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[var(--foreground)]">Location</label>
            <input
              className="input mt-1.5"
              placeholder="Bengaluru / Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card-flush">
        <div className="card-header">Your Company</div>
        <div className="space-y-4 p-4">
          <div>
            <label className="text-[13px] font-semibold text-[var(--foreground)]">
              Company name *
            </label>
            <input
              className="input mt-1.5"
              placeholder="Acme Inc"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[13px] font-semibold text-[var(--foreground)]">Industry</label>
            <input
              className="input mt-1.5"
              placeholder="B2B SaaS, Fintech..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-[13px] font-semibold text-[var(--foreground)]">
              Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStage(s)}
                  className={`rounded-md border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                    stage === s
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--border)] bg-white text-[var(--foreground)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="card-flush">
        <div className="card-header">Requirements</div>
        <div className="space-y-4 p-4">
          <TagInput
            label="Must have"
            placeholder="Type a requirement, press Enter"
            tags={mustHave}
            onChange={setMustHave}
            variant="teal"
          />
          <TagInput
            label="Nice to have"
            placeholder="Type a nice-to-have, press Enter"
            tags={niceToHave}
            onChange={setNiceToHave}
            variant="grey"
          />
          <TagInput
            label="Dealbreakers"
            placeholder="Type a dealbreaker, press Enter"
            tags={dealbreakers}
            onChange={setDealbreakers}
            variant="red"
          />
          <div>
            <label className="text-[13px] font-semibold text-[var(--foreground)]">
              Culture in one line
            </label>
            <input
              className="input mt-1.5"
              placeholder="Direct, no fluff, founder-led"
              value={culture}
              onChange={(e) => setCulture(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card-flush">
        <div className="card-header">What matters most?</div>
        <div className="p-4">
          <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
            Sahayak traverses candidate profiles weighted by your preferences.
          </p>
          <WeightSliders value={weights} onChange={setWeights} />
        </div>
      </section>

      <section className="card-flush">
        <div className="card-header">
          Custom keywords <span className="font-normal text-[var(--text-secondary)]">(optional)</span>
        </div>
        <div className="p-4">
          <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
            Add specific signals with their own weight.
          </p>
          <KeywordWeights value={customKeywords} onChange={setCustomKeywords} />
        </div>
      </section>

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      <button type="button" onClick={submit} disabled={!canSubmit} className="btn btn-primary w-full">
        {submitting ? "Posting…" : "Post brief & find candidates →"}
      </button>
    </div>
  );
}
