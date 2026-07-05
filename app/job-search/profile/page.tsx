"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Check, Sparkles } from "lucide-react";
import { getProfile, uploadResume, updateVoiceAnchor, type UserProfile } from "@/lib/api";
import { Loading, ErrorNote, XpButton, XpBadge } from "@/components/xp";

const PROFILE_QUERY_KEY = ["job-search-profile"];

function ResumeUpload() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<File | null>(null);
  const [justBuilt, setJustBuilt] = useState(false);

  const upload = useMutation({
    mutationFn: (file: File) => uploadResume(file),
    onSuccess: (profile) => {
      qc.setQueryData(PROFILE_QUERY_KEY, profile);
      setJustBuilt(true);
      setTimeout(() => setJustBuilt(false), 3000);
    },
  });

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) return;
    setSelected(file);
    upload.mutate(file);
  };

  return (
    <div className="card p-4">
      <div className="mb-3 text-[13px] font-semibold text-[var(--foreground)]">Resume upload</div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onClick={() => inputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors"
        style={{
          borderColor: dragOver ? "var(--accent)" : "var(--border)",
          background: dragOver ? "var(--accent-soft)" : "transparent",
        }}
      >
        <Upload size={22} className="text-[var(--text-secondary)]" />
        <div className="text-[13px] font-medium text-[var(--foreground)]">
          Drop your resume here, or click to browse
        </div>
        <div className="text-[11px] text-[var(--text-secondary)]">PDF only</div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {selected && (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--foreground)]">
          <FileText size={14} className="text-[var(--text-secondary)]" />
          {selected.name}
          {upload.isPending && <span className="text-[var(--text-secondary)]">Building graph…</span>}
          {justBuilt && (
            <span className="flex items-center gap-1 font-medium text-[var(--success)]">
              <Check size={13} /> Graph built ✓
            </span>
          )}
        </div>
      )}
      {upload.isError && <ErrorNote error={upload.error} />}
    </div>
  );
}

function ExperienceCards({ profile }: { profile: UserProfile | undefined }) {
  const experiences = profile?.context_graph?.experiences ?? [];
  if (experiences.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 text-[13px] font-semibold text-[var(--foreground)]">Experience</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {experiences.map((exp, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] p-3">
            <div className="text-[13px] font-semibold text-[var(--foreground)]">
              {exp.role} @ {exp.company}
            </div>
            {exp.duration && (
              <div className="text-[11px] text-[var(--text-secondary)]">{exp.duration}</div>
            )}
            {(exp.achievements ?? []).length > 0 && (
              <ul className="mt-2 space-y-1 text-[12px] text-[var(--foreground)]">
                {(exp.achievements ?? []).map((a, j) => (
                  <li key={j} className="flex gap-1.5">
                    <span>•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            )}
            {(exp.skills ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(exp.skills ?? []).map((s, j) => (
                  <XpBadge key={j}>{s}</XpBadge>
                ))}
              </div>
            )}
            {(exp.transferable_to ?? []).length > 0 && (
              <div className="mt-2 text-[11px] text-[var(--text-secondary)]">
                Transferable to: {(exp.transferable_to ?? []).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BuildCards({ profile }: { profile: UserProfile | undefined }) {
  const builds = profile?.context_graph?.builds ?? [];
  if (builds.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 text-[13px] font-semibold text-[var(--foreground)]">Builds</div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {builds.map((b, i) => (
          <div key={i} className="rounded-lg border border-[var(--border)] p-3">
            <div className="text-[13px] font-semibold text-[var(--foreground)]">
              {b.name}
              {b.type ? ` — ${b.type}` : ""}
            </div>
            {b.proof && <div className="mt-1 text-[12px] text-[var(--foreground)]">{b.proof}</div>}
            {(b.stack ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(b.stack ?? []).map((s, j) => (
                  <XpBadge key={j} color="#7c3aed">{s}</XpBadge>
                ))}
              </div>
            )}
            {(b.demonstrates ?? []).length > 0 && (
              <div className="mt-2 text-[11px] text-[var(--text-secondary)]">
                Demonstrates: {(b.demonstrates ?? []).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsCloud({ profile }: { profile: UserProfile | undefined }) {
  const skills = profile?.context_graph?.skills ?? [];
  if (skills.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 text-[13px] font-semibold text-[var(--foreground)]">Skills</div>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((s, i) => (
          <XpBadge key={i}>{s}</XpBadge>
        ))}
      </div>
    </div>
  );
}

function VoiceAnchor({ profile }: { profile: UserProfile | undefined }) {
  const qc = useQueryClient();
  const [text, setText] = useState(profile?.voice_anchor ?? "");
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: (voiceAnchor: string) => updateVoiceAnchor(voiceAnchor),
    onSuccess: (updated) => {
      qc.setQueryData(PROFILE_QUERY_KEY, updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <div className="card p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--foreground)]">
        <Sparkles size={14} /> Voice anchor
      </div>
      <p className="mb-2 text-[12px] text-[var(--text-secondary)]">
        Paste a sample of how you write. Used to de-AI-ify resume highlights so they sound like you.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Paste a sample of how you write…"
        className="w-full rounded-md border border-[var(--border)] p-2.5 text-[13px] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        {saved && <span className="text-[12px] font-medium text-[var(--success)]">Saved ✓</span>}
        <XpButton
          variant="primary"
          disabled={save.isPending || !text.trim()}
          onClick={() => save.mutate(text.trim())}
        >
          {save.isPending ? "Saving…" : "Save"}
        </XpButton>
      </div>
      {save.isError && <ErrorNote error={save.error} />}
    </div>
  );
}

export default function ProfilePage() {
  const profileQ = useQuery({ queryKey: PROFILE_QUERY_KEY, queryFn: getProfile });

  if (profileQ.isLoading) return <Loading label="Loading your profile…" />;
  if (profileQ.error) return <ErrorNote error={profileQ.error} />;

  const profile = profileQ.data;
  const resumes = profile?.resumes ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <ResumeUpload />

      {resumes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {resumes.map((r, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-md border border-[var(--border)] px-2.5 py-1 text-[12px] text-[var(--text-secondary)]"
            >
              <FileText size={12} /> {r.filename}
            </span>
          ))}
        </div>
      )}

      <ExperienceCards profile={profile} />
      <BuildCards profile={profile} />
      <SkillsCloud profile={profile} />
      <VoiceAnchor profile={profile} />
    </div>
  );
}
