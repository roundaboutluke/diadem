<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import { m } from "@/lib/paraglide/messages";
	import DistanceField from "./DistanceField.svelte";
	import PokemonPicker from "./PokemonPicker.svelte";
	import { type MaxBattleRule, type PoracleWebConfig } from "@/lib/services/alerts/alerts.shared";

	// Max Battle (Dynamax/Gigantamax power spot) tracking rule. By level,
	// or a specific Pokémon. pokemon_id 9000 = any (API.md).
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
		initial?: MaxBattleRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);
	const baseLevels = [1, 2, 3, 4, 5, 6];
	// Keep an existing rule's tier selectable so editing never resets it.
	const levels =
		seed && seed.level > 0 && !baseLevels.includes(seed.level)
			? [...baseLevels, seed.level].sort((a, b) => a - b)
			: baseLevels;

	let byPokemon = $state((seed?.pokemon_id ?? 9000) !== 9000 && (seed?.pokemon_id ?? 0) > 0);
	let level = $state(seed && seed.level > 0 ? seed.level : 5);
	let pokemonId = $state(seed?.pokemon_id && seed.pokemon_id !== 9000 ? seed.pokemon_id : 0);
	let form = $state(seed?.form ?? 0);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit(byPokemon ? { pokemon_id: pokemonId, form, distance } : { level, distance });
	}
</script>

<div class="flex flex-col gap-4 rounded-md border bg-card p-4">
	<div class="inline-flex overflow-hidden rounded-md border text-sm">
		<button
			type="button"
			class="px-3 py-1.5 {!byPokemon ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/40'}"
			onclick={() => (byPokemon = false)}
		>
			By level
		</button>
		<button
			type="button"
			class="border-l px-3 py-1.5 {byPokemon ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted/40'}"
			onclick={() => (byPokemon = true)}
		>
			Specific Pokémon
		</button>
	</div>

	{#if byPokemon}
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pokémon</span>
			<PokemonPicker bind:pokemonId bind:form {hasIcons} allowAny={false} />
		</div>
	{:else}
		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			<span class="font-medium uppercase tracking-wide">Battle level</span>
			<select bind:value={level} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
				{#each levels as l (l)}
					<option value={l}>{m.x_start_max_battle({ level: l })}</option>
				{/each}
			</select>
		</label>
	{/if}

	<DistanceField bind:distance {maxDistance} />

	<div class="flex items-center justify-end gap-2">
		{#if onCancel}<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>{/if}
		<Button onclick={submit} disabled={submitting}>
			Save
		</Button>
	</div>
</div>
