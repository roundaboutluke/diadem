<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import DistanceField from "./DistanceField.svelte";
	import PokemonPicker from "./PokemonPicker.svelte";
	import ValueSlider from "./ValueSlider.svelte";
	import { clampInt, type NestRule, type PoracleWebConfig } from "@/lib/services/alerts/alerts.shared";

	// Nest tracking rule — a Pokémon (or any) with a minimum spawn rate.
	let {
		config,
		hasIcons = true,
		initial = null,
		submitting = false,
		defaultDistance = 0,
		onSubmit,
		onCancel
	}: {
		config: PoracleWebConfig | null;
		hasIcons?: boolean;
		initial?: NestRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let pokemonId = $state(seed?.pokemon_id ?? 0);
	let form = $state(seed?.form ?? 0);
	let minSpawnAvg = $state(clampInt(seed?.min_spawn_avg ?? 0, 0, 60));
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit({ pokemon_id: pokemonId, form, min_spawn_avg: clampInt(minSpawnAvg, 0, 100000), distance });
	}
</script>

<div class="flex flex-col gap-4 rounded-md border bg-card p-4">
	<div class="flex flex-col gap-1.5">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pokémon</span>
		<PokemonPicker bind:pokemonId bind:form {hasIcons} />
	</div>

	<ValueSlider title="Min spawns / hour" min={0} max={60} bind:value={minSpawnAvg} />

	<DistanceField bind:distance {maxDistance} />

	<div class="flex items-center justify-end gap-2">
		{#if onCancel}<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>{/if}
		<Button onclick={submit} disabled={submitting}>
			Save
		</Button>
	</div>
</div>
