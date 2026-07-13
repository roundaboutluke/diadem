<script lang="ts">
	import Switch from "@/components/ui/input/Switch.svelte";
	import RangeSlider from "./RangeSlider.svelte";
	import ValueSlider from "./ValueSlider.svelte";
	import { pvpLeagues, type PoracleWebConfig } from "@/lib/services/alerts/alerts.shared";

	// PVP rank filter fields. Poracle stores the league as its CP cap
	// (500/1500/2500); league 0 means "no PVP filter". Only rendered
	// when the operator's PoracleWeb config exposes PVP.
	let {
		league = $bindable(0),
		best = $bindable(1),
		worst = $bindable(100),
		minCp = $bindable(0),
		config
	}: {
		league?: number;
		best?: number;
		worst?: number;
		minCp?: number;
		config: PoracleWebConfig | null;
	} = $props();

	const maxRank = $derived(config?.pvpFilterMaxRank ?? 100);
	const leagues = $derived(
		config?.pvpLittleLeagueAllowed === false
			? pvpLeagues.filter((l) => l.value !== 500)
			: pvpLeagues
	);

	const enabled = $derived(league > 0);
</script>

<div class="flex flex-col gap-3 rounded-md border bg-muted/20 p-3">
	<label class="flex items-center gap-2 text-sm font-medium">
		<Switch checked={enabled} onCheckedChange={(on) => (league = on ? 1500 : 0)} />
		Filter by PVP rank
	</label>

	{#if enabled}
		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			<span class="font-medium uppercase tracking-wide">League</span>
			<select
				bind:value={league}
				class="h-10 rounded-md border bg-background px-2 text-sm text-foreground"
			>
				{#each leagues as l (l.value)}
					<option value={l.value}>{l.label}</option>
				{/each}
			</select>
		</label>
		<RangeSlider
			title="Rank range"
			min={1}
			max={maxRank}
			bind:valueMin={best}
			bind:valueMax={worst}
			format={(v) => `#${v}`}
		/>
		<ValueSlider
			title="Min CP"
			min={0}
			max={4000}
			step={50}
			bind:value={minCp}
			format={(v) => v.toLocaleString()}
		/>
	{/if}
</div>
