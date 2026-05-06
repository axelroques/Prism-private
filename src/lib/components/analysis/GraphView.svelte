<script lang="ts">
    import { onDestroy } from 'svelte';
    import * as d3 from 'd3';
    import type { Session, } from '../../types';

    export let session: Session;
    export let enabledDimIds: string[];
    export let enabledTagIds: string[];
    export let onSelectPaper: (id: string) => void;

    let container: HTMLDivElement;
    let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    let simulation: d3.Simulation<NodeDatum, LinkDatum>;

    type NodeDatum = {
    id: string;
    type: 'paper' | 'tag';
    label: string;
    color: string;
    radius: number;
    paperCount?: number;
    status?: string;
    x?: number; y?: number; fx?: number | null; fy?: number | null;
    };

    type LinkDatum = {
    source: string | NodeDatum;
    target: string | NodeDatum;
    color: string;
    };

    let showUntagged: boolean = true;
    let repulsionForce: number = -300;
    let linkStrength: number = 0.5;
    function buildGraph(
    _showUntagged = showUntagged,
    _repulsionForce = repulsionForce,
    _linkStrength = linkStrength,
    dimIds: string[], tagIds: string[]
    ) {
        if (!container) return;

        // Clear previous
        d3.select(container).selectAll('*').remove();

        const W = container.clientWidth;
        const H = container.clientHeight;

        // ── Build nodes & links ──────────────────────────────────────────────
        const nodes: NodeDatum[] = [];
        const links: LinkDatum[] = [];

        const activeDims = session.dimensions.filter(d =>
            dimIds.includes(d.id)
        );

        // Tag nodes
        const tagNodeMap = new Map<string, NodeDatum>();
        for (const dim of activeDims) {
            for (const tag of dim.tags) {
            if (!tagIds.includes(tag.id)) continue;
            const paperCount = session.entries.filter(e =>
                (session.papers[e.id]?.tags?.[dim.id] ?? []).includes(tag.id)
            ).length;
            const node: NodeDatum = {
                id: `tag-${tag.id}`,
                type: 'tag',
                label: `#${tag.label}`,
                color: dim.color,
                radius: 8 + Math.sqrt(paperCount) * 3,
                paperCount,
            };
            nodes.push(node);
            tagNodeMap.set(tag.id, node);
            }
        }

        // Paper nodes
        for (const entry of session.entries) {
            const meta = session.papers[entry.id];
            const status = meta?.status ?? 'unsorted';

            // Collect active tags for this paper
            const activePaperTagIds: string[] = [];
            for (const dim of activeDims) {
            if (!dimIds.includes(dim.id)) continue;
            for (const tagId of (meta?.tags?.[dim.id] ?? [])) {
                if (tagIds.includes(tagId) && tagNodeMap.has(tagId)) {
                activePaperTagIds.push(tagId);
                }
            }
            }

            const isUntagged = activePaperTagIds.length === 0;
            if (isUntagged && !_showUntagged) continue;

            const color = status === 'accepted' ? '#4ade80'
            : status === 'rejected' ? '#f87171'
            : '#f59e0b';

            const paperNode: NodeDatum = {
            id: `paper-${entry.id}`,
            type: 'paper',
            label: entry.title ?? entry.id,
            color,
            radius: 5,
            status,
            };
            nodes.push(paperNode);

            for (const tagId of activePaperTagIds) {
            const dim = activeDims.find(d => d.tags.some(t => t.id === tagId));
            links.push({
                source: `paper-${entry.id}`,
                target: `tag-${tagId}`,
                color: dim?.color ?? '#888',
            });
            }
        }

        if (nodes.length === 0) return;

        // ── SVG setup ────────────────────────────────────────────────────────
        svg = d3.select(container)
            .append('svg')
            .attr('width', W)
            .attr('height', H)
            .style('background', 'transparent');

        const g = svg.append('g');

        // Zoom + pan
        svg.call(
            d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.2, 4])
            .on('zoom', (event) => g.attr('transform', event.transform))
        );

        // ── Simulation ───────────────────────────────────────────────────────
        simulation = d3.forceSimulation<NodeDatum>(nodes)
            .force('link', d3.forceLink<NodeDatum, LinkDatum>(links)
                .id(d => d.id)
                .distance(80)
                .strength(_linkStrength)
            )
            .force('charge', d3.forceManyBody<NodeDatum>().strength(d =>
                d.type === 'tag' ? _repulsionForce : _repulsionForce * 0.25
            ))
            .force('radial', d3.forceRadial<NodeDatum>(0, W / 2, H / 2).strength(d =>
                d.type === 'tag' ? 0.08 : 0.02
            ))
            .force('collision', d3.forceCollide<NodeDatum>().radius(d => d.radius + 6))
            .force('bound', () => {
                const pad = 80;
                for (const node of nodes) {
                if (node.x != null) node.x = Math.max(pad, Math.min(W - pad, node.x));
                if (node.y != null) node.y = Math.max(pad, Math.min(H - pad, node.y));
                }
            });

        simulation.alphaDecay(0.02).velocityDecay(0.4);

        // ── Links ────────────────────────────────────────────────────────────
        const link = g.append('g')
            .selectAll('line')
            .data(links)
            .join('line')
            .attr('stroke', d => d.color)
            .attr('stroke-opacity', 0.25)
            .attr('stroke-width', 1);

        // ── Nodes ────────────────────────────────────────────────────────────
        const node = g.append('g')
            .selectAll<SVGGElement, NodeDatum>('g')
            .data(nodes)
            .join('g')
            .attr('cursor', d => d.type === 'paper' ? 'pointer' : 'default')
            .call(
            d3.drag<SVGGElement, NodeDatum>()
                .on('start', (event, d) => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end', (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
                })
            );

        // Circles
        node.append('circle')
            .attr('r', d => d.radius)
            .attr('fill', d => d.type === 'tag' ? d.color + '33' : d.color)
            .attr('stroke', d => d.color)
            .attr('stroke-width', d => d.type === 'tag' ? 2 : 1.5);

        // Labels for tag nodes
        node.filter(d => d.type === 'tag')
            .append('text')
            .text(d => d.label)
            .attr('font-size', '10px')
            .attr('font-family', 'Quicksand, sans-serif')
            .attr('font-weight', '700')
            .attr('fill', d => d.color)
            .attr('text-anchor', 'middle')
            .attr('dy', d => d.radius + 12);

        // Hover interactions
        node
            .on('mouseenter', function(event, d) {
            if (d.type === 'paper') {
                // Highlight connected links and dim others
                link.attr('stroke-opacity', l =>
                (l.source as NodeDatum).id === d.id || (l.target as NodeDatum).id === d.id
                    ? 0.8 : 0.05
                );
                // Show tooltip
                tooltip
                .style('opacity', '1')
                .html(`<p class="font-bold text-sand-100 text-xs leading-snug mb-0.5">${d.label.slice(0, 80)}${d.label.length > 80 ? '…' : ''}</p>`);
            } else {
                // Highlight papers connected to this tag
                link.attr('stroke-opacity', l =>
                (l.source as NodeDatum).id === d.id || (l.target as NodeDatum).id === d.id
                    ? 0.8 : 0.05
                );
                node.select('circle').attr('opacity', (n: NodeDatum) => {
                if (n.id === d.id) return 1;
                if (n.type === 'paper') {
                    const connected = links.some(l =>
                    ((l.source as NodeDatum).id === d.id && (l.target as NodeDatum).id === n.id) ||
                    ((l.target as NodeDatum).id === d.id && (l.source as NodeDatum).id === n.id)
                    );
                    return connected ? 1 : 0.15;
                }
                return 0.4;
                });
            }
            })
            .on('mousemove', function(event) {
            const rect = container.getBoundingClientRect();
            tooltip
                .style('left', (event.clientX - rect.left + 12) + 'px')
                .style('top', (event.clientY - rect.top - 8) + 'px');
            })
            .on('mouseleave', function() {
            link.attr('stroke-opacity', 0.25);
            node.select('circle').attr('opacity', 1);
            tooltip.style('opacity', '0');
            })
            .on('click', (event, d) => {
            if (d.type === 'paper') {
                const paperId = d.id.replace('paper-', '');
                onSelectPaper(paperId);
            }
            });

        // ── Tooltip ──────────────────────────────────────────────────────────
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', '#26231d')
            .style('border', '1px solid #3a3530')
            .style('border-radius', '8px')
            .style('padding', '8px 10px')
            .style('opacity', '0')
            .style('transition', 'opacity 0.15s')
            .style('max-width', '220px')
            .style('z-index', '10');

        // ── Tick ─────────────────────────────────────────────────────────────
        simulation.on('tick', () => {
            link
            .attr('x1', d => (d.source as NodeDatum).x ?? 0)
            .attr('y1', d => (d.source as NodeDatum).y ?? 0)
            .attr('x2', d => (d.target as NodeDatum).x ?? 0)
            .attr('y2', d => (d.target as NodeDatum).y ?? 0);

            node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });
    }

    // Rebuild when inputs change
    $: if (container) buildGraph(showUntagged, repulsionForce, linkStrength, enabledDimIds, enabledTagIds);

    onDestroy(() => { simulation?.stop(); });
</script>

<div class="w-full h-full flex overflow-hidden">

  <!-- Left controls -->
  <div class="w-48 shrink-0 flex flex-col gap-4 p-4 border-r border-stone-700 bg-charcoal-900 overflow-y-auto">

    <div class="flex flex-col gap-1.5">
      <span class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Show untagged</span>
      <button
        title="Show untagged articles toggle"
        on:click={() => showUntagged = !showUntagged}
        class="w-8 h-4 rounded-full border transition-colors cursor-pointer relative self-start
          {showUntagged ? 'bg-amber-500 border-amber-500' : 'bg-charcoal-700 border-stone-600'}"
      >
        <span class="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all
          {showUntagged ? 'left-4' : 'left-0.5'}"></span>
      </button>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Repulsion</span>
      <input type="range" min="-800" max="-50" step="50"
        bind:value={repulsionForce}
        class="w-full accent-amber-400 cursor-pointer"
      />
      <span class="text-[10px] text-sand-600">{Math.abs(repulsionForce)}</span>
    </div>

    <div class="flex flex-col gap-1.5">
      <span class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Link strength</span>
      <input type="range" min="0.1" max="2" step="0.1"
        bind:value={linkStrength}
        class="w-full accent-amber-400 cursor-pointer"
      />
      <span class="text-[10px] text-sand-600">{linkStrength.toFixed(1)}</span>
    </div>

  </div>

  <!-- Graph canvas -->
  <div bind:this={container} class="flex-1 relative overflow-hidden"></div>

  <!-- Right legend -->
  <div class="w-44 shrink-0 flex flex-col gap-4 p-4 border-l border-stone-700 bg-charcoal-900 overflow-y-auto">

    <div class="flex flex-col gap-2">
      <span class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Paper status</span>
      {#each [['#f59e0b', 'Unsorted'], ['#4ade80', 'Accepted'], ['#f87171', 'Rejected']] as [color, label]}
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full shrink-0" style="background:{color}"></span>
          <span class="text-xs text-sand-400">{label}</span>
        </div>
      {/each}
    </div>

    <div class="flex flex-col gap-2">
      <span class="text-[10px] font-bold uppercase tracking-widest text-sand-600">Dimensions</span>
      {#each session.dimensions as dim}
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full border-2 shrink-0" style="border-color:{dim.color}; background:{dim.color}33"></span>
          <span class="text-xs text-sand-400 truncate">@{dim.label}</span>
        </div>
      {/each}
    </div>

  </div>

</div>