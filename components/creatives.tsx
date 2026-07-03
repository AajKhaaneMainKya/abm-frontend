"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import {
  getCreatives,
  generateCreative,
  approveCreative,
  rejectCreative,
  type Creative,
  type CreativePlatform,
} from "@/lib/api";
import { XpButton, XpBadge, Loading, ErrorNote } from "@/components/xp";

const STATUS_COLORS: Record<string, string> = {
  DRAFTED: "#777777",
  PENDING_APPROVAL: "#c8a020",
  APPROVED: "#2d7a2d",
  LIVE: "#2563eb",
  PAUSED: "#a02020",
  REJECTED: "#a02020",
};

function CreativeTile({ c, clientId }: { c: Creative; clientId: string }) {
  const qc = useQueryClient();
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["creatives", clientId] });
  const approve = useMutation({
    mutationFn: () => approveCreative(clientId, c.id),
    onSuccess: invalidate,
  });
  const reject = useMutation({
    mutationFn: () => rejectCreative(clientId, c.id),
    onSuccess: invalidate,
  });
  const pending = c.status === "PENDING_APPROVAL" || c.status === "DRAFTED";
  const busy = approve.isPending || reject.isPending;

  return (
    <div className="card-flush">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <ImageIcon size={15} className="text-[var(--accent)]" />
        <span className="text-[13px] font-semibold text-[var(--foreground)]">
          Variant {c.variant}
        </span>
        <XpBadge color="#2563eb" className="uppercase">
          {c.platform}
        </XpBadge>
        <XpBadge color={STATUS_COLORS[c.status] ?? "#6b7280"} className="ml-auto">
          {c.status}
        </XpBadge>
      </div>
      <div className="space-y-2 px-4 py-3 text-[12px]">
        <div className="text-[14px] font-semibold text-[var(--foreground)]">{c.headline}</div>
        <div className="text-[var(--text-secondary)]">{c.body}</div>
        {c.cta && (
          <div className="inline-block rounded-md bg-[var(--accent)] px-3 py-1 text-[12px] font-semibold text-white">
            {c.cta}
          </div>
        )}
        {c.image_brief && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] italic text-[var(--text-secondary)]">
            <span className="font-semibold not-italic text-[var(--foreground)]">Art brief: </span>
            {c.image_brief}
          </div>
        )}
        {c.landing_page_copy && (
          <div className="whitespace-pre-wrap rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--foreground)]">Landing: </span>
            {c.landing_page_copy}
          </div>
        )}
        {pending && (
          <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-2">
            <XpButton variant="green" disabled={busy} onClick={() => approve.mutate()}>
              Approve
            </XpButton>
            <XpButton variant="red" disabled={busy} onClick={() => reject.mutate()}>
              Reject
            </XpButton>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreativesGrid({ clientId }: { clientId: string }) {
  const qc = useQueryClient();
  const [platform, setPlatform] = useState<CreativePlatform>("linkedin");

  const { data, isLoading, error } = useQuery({
    queryKey: ["creatives", clientId],
    queryFn: () => getCreatives(clientId),
    enabled: !!clientId,
  });

  const generate = useMutation({
    mutationFn: () => generateCreative(clientId, platform),
    onSuccess: () => {
      // Agent works async via the event bus; poll a couple of times.
      setTimeout(
        () => qc.invalidateQueries({ queryKey: ["creatives", clientId] }),
        4000,
      );
      setTimeout(
        () => qc.invalidateQueries({ queryKey: ["creatives", clientId] }),
        12000,
      );
    },
  });

  const creatives = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
        <Sparkles size={15} className="text-[var(--warning)]" />
        <span className="text-[12px] font-semibold text-[var(--foreground)]">
          Generate ad variants:
        </span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as CreativePlatform)}
          className="select w-auto"
        >
          <option value="linkedin">LinkedIn</option>
          <option value="meta">Meta</option>
          <option value="google">Google</option>
        </select>
        <XpButton
          variant="primary"
          disabled={generate.isPending}
          onClick={() => generate.mutate()}
        >
          {generate.isPending ? "Requesting…" : "Generate (A/B/C)"}
        </XpButton>
        {generate.isSuccess && (
          <span className="text-[11px] text-[var(--success)]">
            Queued — the Creative Agent is drafting 3 variants…
          </span>
        )}
      </div>

      {isLoading ? (
        <Loading label="Loading creatives…" />
      ) : error ? (
        <ErrorNote error={error} />
      ) : creatives.length === 0 ? (
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-6 text-center text-[13px] text-[var(--text-secondary)]">
          No creatives yet. Generate a set of A/B/C variants above.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creatives.map((c) => (
            <CreativeTile key={c.id} c={c} clientId={clientId} />
          ))}
        </div>
      )}
    </div>
  );
}
