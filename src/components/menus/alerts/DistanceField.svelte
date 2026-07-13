<script lang="ts">
	import { getContext } from "svelte";
	import Input from "@/components/ui/input/Input.svelte";
	import { clampInt } from "@/lib/services/alerts/alerts.shared";

	// Distance scope for a rule. distance === 0 means "use my selected
	// areas" (Poracle's area-based match); any positive value is a radius
	// in metres around the user's set location. `maxDistance` (from
	// PoracleWeb config, 0 = unlimited) caps the radius.
	let {
		distance = $bindable(0),
		maxDistance = 0
	}: {
		distance?: number;
		maxDistance?: number;
	} = $props();

	// Per-rule scope from the page: whether the active profile has any
	// geofence areas (with none, the "My areas" scope matches nothing in
	// Poracle, so we hide it and force a radius), plus the profile's name
	// to anchor the radius note.
	const scope = getContext<
		{ readonly hasAreas: boolean; readonly profileName: string } | undefined
	>("pokedexRuleScope");
	const hasAreas = $derived(scope?.hasAreas ?? true);
	const profileName = $derived(scope?.profileName ?? "");

	// Local radius memory so toggling "areas ↔ radius" doesn't lose the
	// typed number. Seeds from the incoming distance or a sane default.
	let radius = $state(distance > 0 ? distance : 1000);

	const useRadius = $derived(distance > 0);

	// No areas → a radius is mandatory; make sure distance is positive.
	$effect(() => {
		if (!hasAreas && distance <= 0) {
			distance = clampInt(radius > 0 ? radius : 1000, 1, maxDistance > 0 ? maxDistance : 1_000_000);
		}
	});

	function setMode(toRadius: boolean) {
		if (toRadius) {
			distance = clampInt(radius || 1000, 1, maxDistance > 0 ? maxDistance : 1_000_000);
			radius = distance;
		} else {
			distance = 0;
		}
	}

	function onRadiusInput(value: number) {
		radius = clampInt(value, 1, maxDistance > 0 ? maxDistance : 1_000_000);
		distance = radius;
	}
</script>

<div class="flex flex-col gap-2">
	<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Distance</span>
	{#if hasAreas}
		<div class="inline-flex overflow-hidden rounded-md border text-sm">
			<button
				type="button"
				class="px-3 py-1.5 {!useRadius
					? 'bg-primary text-primary-foreground'
					: 'bg-background hover:bg-muted/40'}"
				onclick={() => setMode(false)}
			>
				My areas
			</button>
			<button
				type="button"
				class="border-l px-3 py-1.5 {useRadius
					? 'bg-primary text-primary-foreground'
					: 'bg-background hover:bg-muted/40'}"
				onclick={() => setMode(true)}
			>
				Within radius
			</button>
		</div>
	{/if}
	{#if !hasAreas || useRadius}
		<div class="flex items-center gap-2">
			<Input
				type="number"
				min="1"
				max={maxDistance > 0 ? maxDistance : undefined}
				value={radius}
				oninput={(e: Event) => onRadiusInput(Number((e.target as HTMLInputElement).value))}
				class="w-32"
			/>
			<span class="text-sm text-muted-foreground">
				metres{maxDistance > 0 ? ` (max ${maxDistance.toLocaleString()})` : ""}
			</span>
		</div>
		<p class="text-xs text-muted-foreground">
			Distance from your set location{profileName ? ` (${profileName})` : ""}.
		</p>
	{/if}
</div>
