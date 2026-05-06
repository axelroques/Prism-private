<script lang="ts">
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import type { Session } from '../../types';

  export let session: Session;
  export let enabledDimIds: string[];
  export let enabledTagIds: string[];

  let container: HTMLDivElement;

  function buildHeatmap() {
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const W = container.clientWidth;
    const H = container.clientHeight;

    // Collect active tags
    type TagInfo = { id: string; label: string; color: string; dimLabel: string };
    const tags: TagInfo[] = [];
    for (const dim of session.dimensions) {
      if (!enabledDimIds.includes(dim.id)) continue;
      for (const tag of dim.tags) {
        if (!enabledTagIds.includes(tag.id)) continue;
        tags.push({ id: tag.id, label: `#${tag.label}`, color: dim.color, dimLabel: dim.label });
      }
    }

    if (tags.length < 2) return;

    // Build co-occurrence matrix
    const matrix: number[][] = Array.from({ length: tags.length }, () =>
      new Array(tags.length).fill(0)
    );

    for (const entry of session.entries) {
      const meta = session.papers[entry.id];
      if (!meta) continue;

      const paperTagIds = new Set<string>();
      for (const dim of session.dimensions) {
        for (const tagId of (meta.tags?.[dim.id] ?? [])) {
          paperTagIds.add(tagId);
        }
      }

      const activeIndices = tags
        .map((t, i) => ({ i, has: paperTagIds.has(t.id) }))
        .filter(x => x.has)
        .map(x => x.i);

      for (const a of activeIndices) {
        for (const b of activeIndices) {
          matrix[a][b]++;
        }
      }
    }

    const margin = { top: 100, right: 24, bottom: 24, left: 100 };
    const size = Math.min(
      (W - margin.left - margin.right) / tags.length,
      (H - margin.top - margin.bottom) / tags.length,
      40
    );

    const svg = d3.select(container)
      .append('svg')
      .attr('width', W)
      .attr('height', H);

    const totalW = size * tags.length + margin.left + margin.right;
    const totalH = size * tags.length + margin.top + margin.bottom;
    const offsetX = Math.max(margin.left, (W - totalW) / 2 + margin.left);
    const offsetY = Math.max(margin.top, (H - totalH) / 2 + margin.top);

  const g = svg.append('g')
    .attr('transform', `translate(${offsetX},${offsetY})`);

    const maxVal = d3.max(matrix.flat().filter((v, i) => {
      const row = Math.floor(i / tags.length);
      const col = i % tags.length;
      return row !== col;
    })) ?? 1;

    // Tooltip
    const tooltip = d3.select(container)
      .append('div')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', '#26231d')
      .style('border', '1px solid #3a3530')
      .style('border-radius', '8px')
      .style('padding', '6px 10px')
      .style('opacity', '0')
      .style('transition', 'opacity 0.15s')
      .style('font-size', '11px')
      .style('font-family', 'Quicksand, sans-serif')
      .style('color', '#e8e0d4')
      .style('z-index', '10');

    // Cells
    for (let row = 0; row < tags.length; row++) {
      for (let col = 0; col < tags.length; col++) {
        const val = matrix[row][col];
        const isDiag = row === col;
        const color = isDiag ? tags[row].color : tags[row].color;
        const opacity = isDiag ? 0.15 : val === 0 ? 0.04 : 0.1 + (val / maxVal) * 0.75;

        g.append('rect')
          .attr('x', col * size)
          .attr('y', row * size)
          .attr('width', size - 1)
          .attr('height', size - 1)
          .attr('rx', 2)
          .attr('fill', color)
          .attr('fill-opacity', opacity)
          .attr('stroke', isDiag ? color : 'none')
          .attr('stroke-opacity', 0.3)
          .attr('stroke-width', isDiag ? 1.5 : 0)
          .on('mouseenter', function(event) {
            if (!isDiag) {
              tooltip.style('opacity', '1')
                .html(`<span style="color:${tags[row].color}">${tags[row].label}</span> + <span style="color:${tags[col].color}">${tags[col].label}</span><br/><b>${val}</b> paper${val !== 1 ? 's' : ''}`);
            }
          })
          .on('mousemove', function(event) {
            const rect = container.getBoundingClientRect();
            tooltip
              .style('left', (event.clientX - rect.left + 12) + 'px')
              .style('top', (event.clientY - rect.top - 8) + 'px');
          })
          .on('mouseleave', () => tooltip.style('opacity', '0'));

        // Count text in cell
        if (!isDiag && val > 0 && size >= 20) {
          g.append('text')
            .attr('x', col * size + size / 2)
            .attr('y', row * size + size / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('font-size', Math.min(size * 0.35, 11) + 'px')
            .attr('font-family', 'Quicksand, sans-serif')
            .attr('font-weight', '700')
            .attr('fill', color)
            .attr('fill-opacity', 0.9)
            .attr('pointer-events', 'none')
            .text(val);
        }
      }
    }

    // X axis labels (top)
    tags.forEach((tag, i) => {
      g.append('text')
        .attr('x', i * size + size / 2)
        .attr('y', -8)
        .attr('text-anchor', 'start')
        .attr('font-size', '10px')
        .attr('font-family', 'Quicksand, sans-serif')
        .attr('font-weight', '700')
        .attr('fill', tag.color)
        .attr('transform', `rotate(-45, ${i * size + size / 2}, -8)`)
        .text(tag.label);
    });

    // Y axis labels (left)
    tags.forEach((tag, i) => {
      g.append('text')
        .attr('x', -8)
        .attr('y', i * size + size / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('font-family', 'Quicksand, sans-serif')
        .attr('font-weight', '700')
        .attr('fill', tag.color)
        .text(tag.label);
    });
  }

  $: if (container && session) buildHeatmap();
  $: enabledDimIds, enabledTagIds, buildHeatmap();

  onMount(() => buildHeatmap());
</script>

<div bind:this={container} class="w-full h-full relative overflow-hidden"></div>