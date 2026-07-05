"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as d3 from "d3";
import type { Account, AccountSequence } from "@/lib/api";
import { STATE_NODE_FILL, fmtRelative } from "@/lib/job-search";

type NodeType = "company" | "founder" | "email";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: NodeType;
  label: string;
  r: number;
  color: string;
  stroke: string;
  accountId: string;
  state?: string;
  touchCount?: number;
  lastTouch?: string | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  kind: "founder" | "email";
}

export interface MindMapHandle {
  resetLayout: () => void;
}

interface TooltipState {
  x: number;
  y: number;
  title: string;
  lines: string[];
}

const rScale = d3.scaleLinear().domain([0, 100]).range([14, 30]).clamp(true);

function buildGraph(
  accounts: Account[],
  sequencesByAccount: Record<string, AccountSequence[]>,
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  for (const a of accounts) {
    const fill = STATE_NODE_FILL[a.state] ?? "#e5e7eb";
    nodes.push({
      id: `c-${a.id}`,
      type: "company",
      label: a.company,
      r: rScale(a.intent_score ?? 0),
      color: fill,
      stroke: "#0f766e",
      accountId: a.id,
      state: a.state,
      touchCount: a.touch_count ?? 0,
      lastTouch: a.last_touched_at,
    });

    if (a.dm_name) {
      const founderId = `f-${a.id}`;
      nodes.push({
        id: founderId,
        type: "founder",
        label: a.dm_name,
        r: 8,
        color: "#ffffff",
        stroke: "#6b7280",
        accountId: a.id,
      });
      links.push({ source: `c-${a.id}`, target: founderId, kind: "founder" });
    }

    for (const seq of sequencesByAccount[a.id] ?? []) {
      const emailId = `e-${seq.id}`;
      nodes.push({
        id: emailId,
        type: "email",
        label: seq.subject ?? "(no subject)",
        r: 5,
        color: "#ffffff",
        stroke: "#2563eb",
        accountId: a.id,
      });
      links.push({ source: `c-${a.id}`, target: emailId, kind: "email" });
    }
  }

  return { nodes, links };
}

const MindMap = forwardRef<
  MindMapHandle,
  {
    accounts: Account[];
    sequencesByAccount: Record<string, AccountSequence[]>;
    onSelect: (accountId: string) => void;
  }
>(function MindMap({ accounts, sequencesByAccount, onSelect }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  useImperativeHandle(ref, () => ({
    resetLayout() {
      const sim = simRef.current;
      if (sim) {
        sim.nodes().forEach((n) => {
          n.fx = null;
          n.fy = null;
        });
        sim.alpha(1).restart();
      }
      if (svgRef.current && zoomRef.current) {
        d3.select(svgRef.current)
          .transition()
          .duration(300)
          .call(zoomRef.current.transform, d3.zoomIdentity);
      }
    },
  }));

  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const { nodes, links } = buildGraph(accounts, sequencesByAccount);

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const root = svg.append("g").attr("class", "sk-graph-root");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => {
        root.attr("transform", event.transform.toString());
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    const link = root
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => (d.kind === "founder" ? "#9ca3af" : "#93c5fd"))
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => (d.kind === "email" ? "4,3" : null));

    const node = root
      .append("g")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer");

    node
      .filter((d) => d.type !== "email")
      .append("circle")
      .attr("r", (d) => d.r)
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => d.stroke)
      .attr("stroke-width", (d) => (d.type === "company" ? 2 : 1.5));

    node
      .filter((d) => d.type === "email")
      .append("rect")
      .attr("x", (d) => -d.r)
      .attr("y", (d) => -d.r)
      .attr("width", (d) => d.r * 2)
      .attr("height", (d) => d.r * 2)
      .attr("fill", (d) => d.color)
      .attr("stroke", (d) => d.stroke)
      .attr("stroke-width", 1.5);

    node
      .filter((d) => d.type === "company")
      .append("text")
      .text((d) => d.label)
      .attr("x", 0)
      .attr("y", (d) => d.r + 13)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .attr("fill", "#111827")
      .style("pointer-events", "none");

    node
      .on("mouseenter", (event: MouseEvent, d) => {
        const rect = container.getBoundingClientRect();
        setTooltip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          title: d.type === "company" ? d.label : d.type === "founder" ? `👤 ${d.label}` : `📧 ${d.label}`,
          lines:
            d.type === "company"
              ? [`State: ${d.state ?? "—"}`, `Touches: ${d.touchCount ?? 0}`, `Last touch: ${fmtRelative(d.lastTouch)}`]
              : [],
        });
      })
      .on("mousemove", (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        setTooltip((t) => (t ? { ...t, x: event.clientX - rect.left, y: event.clientY - rect.top } : t));
      })
      .on("mouseleave", () => setTooltip(null))
      .on("click", (_event: MouseEvent, d) => onSelect(d.accountId));

    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = d.x;
        d.fy = d.y;
      });
    node.call(drag);

    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => (d.kind === "email" ? 36 : 70))
          .strength(0.6),
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<GraphNode>().radius((d) => d.r + 6),
      )
      .on("tick", () => {
        link
          .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
          .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
          .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
          .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
        node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      });

    simRef.current = simulation;

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts, sequencesByAccount]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg ref={svgRef} width="100%" height="100%" className="block" />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-md border border-[var(--border)] bg-white px-3 py-2 text-[12px] shadow-md"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <div className="font-semibold text-[var(--foreground)]">{tooltip.title}</div>
          {tooltip.lines.map((l, i) => (
            <div key={i} className="text-[var(--text-secondary)]">{l}</div>
          ))}
        </div>
      )}
    </div>
  );
});

export default MindMap;
