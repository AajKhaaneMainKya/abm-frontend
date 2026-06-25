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
  LIVE: "#1b5dbf",
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
    <div className="xp-window !rounded-md">
      <div className="flex items-center gap-2 bg-[#d4d0c8] px-3 py-1.5">
        <ImageIcon size={14} className="text-[#0a246a]" />
        <span className="text-[12px] font-bold text-[#0a246a]">
          Variant {c.variant}
        </span>
        <XpBadge color="#1b5dbf" className="uppercase">
          {c.platform}
        </XpBadge>
        <XpBadge color={STATUS_COLORS[c.status] ?? "#555"} className="ml-auto">
          {c.status}
        </XpBadge>
      </div>
      <div className="space-y-2 bg-white px-4 py-3 text-[12px]">
        <div className="text-[14px] font-bold text-neutral-800">{c.headline}</div>
        <div className="text-neutral-600">{c.body}</div>
        {c.cta && (
          <div className="inline-block rounded bg-[#1b5dbf] px-3 py-1 text-[12px] font-bold text-white">
            {c.cta}
          </div>
        )}
        {c.image_brief && (
          <div className="xp-inset px-3 py-2 text-[11px] italic text-neutral-600">
            <span className="font-bold not-italic text-neutral-500">Art brief: </span>
            {c.image_brief}
          </div>
        )}
        {c.landing_page_copy && (
          <div className="xp-inset whitespace-pre-wrap px-3 py-2 text-[11px] text-neutral-600">
            <span className="font-bold text-neutral-500">Landing: </span>
            {c.landing_page_copy}
          </div>
        )}
        {pending && (
          <div className="flex justify-end gap-2 border-t border-[#eee] pt-2">
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
      <div className="flex flex-wrap items-center gap-2 xp-inset px-3 py-2">
        <Sparkles size={15} className="text-[#c8a020]" />
        <span className="text-[12px] font-bold text-neutral-700">
          Generate ad variants:
        </span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as CreativePlatform)}
          className="rounded-sm border border-[#7f9db9] bg-white px-2 py-1 text-[12px]"
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
          <span className="text-[11px] text-[#2d7a2d]">
            Queued — the Creative Agent is drafting 3 variants…
          </span>
        )}
      </div>

      {isLoading ? (
        <Loading label="Loading creatives…" />
      ) : error ? (
        <ErrorNote error={error} />
      ) : creatives.length === 0 ? (
        <div className="xp-inset px-4 py-6 text-center text-[13px] text-neutral-500">
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
