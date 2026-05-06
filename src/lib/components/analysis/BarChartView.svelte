<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { Session } from '../../types';

  export let session: Session;
  export let enabledDimIds: string[];
  export let enabledTagIds: string[];

  let container: HTMLDivElement;

  type BarDatum = {
    label: string;
    count: number;
    color: string;
    dimLabel: string;
  };

  function buildChart() {
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth;
    const H = container.clientHeight;
    const margin = { top: 100, right: 150, bottom: 100, left: 200 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    // Build data
    const data: BarDatum[] = [];
    for (const dim of session.dimensions) {
      if (!enabledDimIds.includes(dim.id)) continue;
      for (const tag of dim.tags) {
        if (!enabledTagIds.includes(tag.id)) continue;
        const count = session.entries.filter(e =>
          (session.papers[e.id]?.tags?.[dim.id] ?? []).includes(tag.id)
        ).length;
        data.push({ label: `#${tag.label}`, count, color: dim.color, dimLabel: dim.label });
      }
    }

    if (data.length === 0) return;

    data.sort((a, b) => b.count - a.count);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) ?? 1])
      .range([0, innerW]);

    const yScale = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([0, innerH])
      .padding(0.25);

    // Gridlines
    g.append('g')
      .selectAll('line')
      .data(xScale.ticks(5))
      .join('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#3a3530')
      .attr('stroke-dasharray', '3,3');

    // Bars
    g.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', 0)
      .attr('y', d => yScale(d.label) ?? 0)
      .attr('width', d => xScale(d.count))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => d.color + '88')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 1)
      .attr('rx', 3);

    // Count labels
    g.selectAll('.count-label')
      .data(data)
      .join('text')
      .attr('class', 'count-label')
      .attr('x', d => xScale(d.count) + 6)
      .attr('y', d => (yScale(d.label) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-size', '11px')
      .attr('font-family', 'Quicksand, sans-serif')
      .attr('font-weight', '600')
      .attr('fill', '#9c9285')
      .text(d => d.count);

    // Y axis (tag labels)
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .call(ax => ax.select('.domain').remove())
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('font-family', 'Quicksand, sans-serif')
      .attr('font-weight', '700')
      .attr('fill', d => {
        const found = data.find(b => b.label === d);
        return found?.color ?? '#9c9285';
      })
      .attr('dx', '-6');

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('d')))
      .call(ax => ax.select('.domain').attr('stroke', '#3a3530'))
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'Quicksand, sans-serif')
      .attr('fill', '#7a7168');

  }

  $: if (container && session) buildChart();
  $: enabledDimIds, enabledTagIds, buildChart();

  onMount(() => buildChart());
</script>

<div bind:this={container} class="w-full h-full"></div>