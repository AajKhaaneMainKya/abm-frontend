'use client'
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface ContextGraphVizProps {
  contextGraph: any
  candidateName?: string
}

export default function ContextGraphViz({
  contextGraph,
  candidateName = 'You'
}: ContextGraphVizProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; text: string
  } | null>(null)

  useEffect(() => {
    if (!svgRef.current || !contextGraph) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth || 800
    const height = 500

    // Build nodes and links from context graph
    const nodes: any[] = []
    const links: any[] = []

    // Center node — the candidate
    nodes.push({
      id: 'candidate',
      label: candidateName,
      type: 'candidate',
      radius: 28,
    })

    // Experience nodes
    const experiences = contextGraph.experiences || []
    experiences.forEach((exp: any, i: number) => {
      const nodeId = `exp_${i}`
      nodes.push({
        id: nodeId,
        label: exp.company || 'Company',
        sublabel: exp.role,
        type: 'experience',
        radius: 20,
        data: exp,
      })
      links.push({
        source: 'candidate',
        target: nodeId,
        type: 'worked_at'
      })

      // Achievement nodes (top 2 per company)
      const achievements = exp.achievements || []
      achievements.slice(0, 2).forEach((ach: string, j: number) => {
        const achId = `ach_${i}_${j}`
        nodes.push({
          id: achId,
          label: ach.length > 30 ? ach.slice(0, 30) + '...' : ach,
          type: 'achievement',
          radius: 10,
        })
        links.push({
          source: nodeId,
          target: achId,
          type: 'achieved'
        })
      })
    })

    // Build nodes
    const builds = contextGraph.builds || []
    builds.forEach((build: any, i: number) => {
      const nodeId = `build_${i}`
      nodes.push({
        id: nodeId,
        label: build.name || 'Build',
        sublabel: build.type,
        type: 'build',
        radius: 18,
        data: build,
      })
      links.push({
        source: 'candidate',
        target: nodeId,
        type: 'built'
      })
    })

    // Skill nodes (top 8)
    const skills = (contextGraph.skills || []).slice(0, 8)
    skills.forEach((skill: string, i: number) => {
      const nodeId = `skill_${i}`
      nodes.push({
        id: nodeId,
        label: skill,
        type: 'skill',
        radius: 12,
      })
      links.push({
        source: 'candidate',
        target: nodeId,
        type: 'has_skill'
      })
    })

    // Color scheme
    const colors: Record<string, string> = {
      candidate: '#0f766e',
      experience: '#3b82f6',
      build: '#8b5cf6',
      skill: '#f59e0b',
      achievement: '#6b7280',
    }

    // Force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance((d: any) => {
          if (d.type === 'achieved') return 60
          if (d.type === 'has_skill') return 80
          return 120
        })
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius((d: any) => d.radius + 8)
      )

    const g = svg.append('g')

    // Zoom
    svg.call(d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    )

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', (d: any) =>
        d.type === 'has_skill' ? '#fde68a' :
        d.type === 'built' ? '#ddd6fe' :
        d.type === 'achieved' ? '#e5e7eb' :
        '#bfdbfe'
      )
      .attr('stroke-width', (d: any) =>
        d.type === 'worked_at' ? 2 : 1
      )
      .attr('stroke-opacity', 0.6)

    // Node groups
    const node = g.append('g')
      .selectAll<SVGGElement, any>('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    // Circles
    node.append('circle')
      .attr('r', (d: any) => d.radius)
      .attr('fill', (d: any) => colors[d.type] || '#6b7280')
      .attr('fill-opacity', (d: any) =>
        d.type === 'achievement' ? 0.5 : 0.9
      )
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // Labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.radius + 12)
      .attr('font-size', (d: any) =>
        d.type === 'candidate' ? '13px' :
        d.type === 'achievement' ? '9px' : '11px'
      )
      .attr('font-weight', (d: any) =>
        d.type === 'candidate' ? '700' : '400'
      )
      .attr('fill', '#374151')
      .text((d: any) => d.label)

    // Sublabels (role under company)
    node.filter((d: any) => d.sublabel)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.radius + 22)
      .attr('font-size', '9px')
      .attr('fill', '#6b7280')
      .text((d: any) => d.sublabel)

    // Tooltip on hover
    node.on('mouseover', (event, d: any) => {
      const data = d.data || {}
      let text = d.label
      if (d.type === 'experience' && data.achievements) {
        text = data.achievements.slice(0, 2).join(' · ')
      }
      if (d.type === 'build' && data.stack) {
        text = data.stack.join(', ')
      }
      setTooltip({ x: event.pageX, y: event.pageY, text })
    })
    .on('mouseout', () => setTooltip(null))

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [contextGraph, candidateName])

  if (!contextGraph || (
    !contextGraph.experiences?.length &&
    !contextGraph.builds?.length &&
    !contextGraph.skills?.length
  )) {
    return (
      <div style={{
        textAlign: 'center', padding: '48px',
        color: '#6b7280', border: '1px dashed #e5e7eb',
        borderRadius: '12px',
      }}>
        <div style={{fontSize:'32px', marginBottom:'8px'}}>🕸️</div>
        <p>Upload a resume to see your context graph</p>
      </div>
    )
  }

  return (
    <div style={{position: 'relative'}}>
      {/* Legend */}
      <div style={{
        display: 'flex', gap: '16px', marginBottom: '12px',
        fontSize: '12px', color: '#6b7280', flexWrap: 'wrap',
      }}>
        {[
          { color: '#0f766e', label: 'You' },
          { color: '#3b82f6', label: 'Experience' },
          { color: '#8b5cf6', label: 'Build' },
          { color: '#f59e0b', label: 'Skill' },
          { color: '#6b7280', label: 'Achievement' },
        ].map(item => (
          <div key={item.label}
            style={{display:'flex', alignItems:'center', gap:'4px'}}>
            <div style={{
              width:'10px', height:'10px',
              borderRadius:'50%', background: item.color,
            }}/>
            {item.label}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{
        fontSize: '11px', color: '#9ca3af',
        marginBottom: '8px',
      }}>
        Drag nodes · Scroll to zoom · Hover for details
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '500px',
          background: '#fafafa',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
        }}
      />

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x + 12,
          top: tooltip.y - 10,
          background: '#111827',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          maxWidth: '200px',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
