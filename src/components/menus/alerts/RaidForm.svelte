<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import { mRaid } from "@/lib/services/ingameLocale";
	import DistanceField from "./DistanceField.svelte";
	import GymPicker from "./GymPicker.svelte";
	import PokemonPicker from "./PokemonPicker.svelte";
	import { teamOptions, type PoracleWebConfig, type RaidRule } from "@/lib/services/alerts/alerts.shared";

	// Raid tracking rule. Two input modes (API.md): by raid level, or by
	// specific Pokémon. Optionally pinned to a specific gym via GymPicker.
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
		initial?: RaidRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);
	const baseLevels = [1, 2, 3, 4, 5, 6];
	// Keep whatever tier an existing rule uses selectable (e.g. Mega / shadow
	// tiers created elsewhere) so editing never silently resets it.
	const levels =
		seed && seed.level > 0 && !baseLevels.includes(seed.level)
			? [...baseLevels, seed.level].sort((a, b) => a - b)
			: baseLevels;

	let byPokemon = $state((seed?.pokemon_id ?? 0) > 0 && (seed?.pokemon_id ?? 0) !== 9000);
	let level = $state(seed && seed.level > 0 ? seed.level : 5);
	let pokemonId = $state(seed?.pokemon_id && seed.pokemon_id !== 9000 ? seed.pokemon_id : 0);
	let form = $state(seed?.form ?? 0);
	let team = $state(seed?.team ?? 4);
	let exclusive = $state(seed?.exclusive ?? false);
	let gymId = $state<string | null>(seed?.gym_id ?? null);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		const base = { team, exclusive, distance, gym_id: gymId };
		onSubmit(byPokemon ? { ...base, pokemon_id: pokemonId, form } : { ...base, level });
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
			<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Boss</span>
			<PokemonPicker bind:pokemonId bind:form {hasIcons} allowAny={false} />
		</div>
	{:else}
		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			Raid level
			<select bind:value={level} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
				{#each levels as l (l)}
					<option value={l}>{mRaid(l)}</option>
				{/each}
			</select>
		</label>
	{/if}

	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		Gym team
		<select bind:value={team} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each teamOptions as t (t.value)}
				<option value={t.value}>{t.label}</option>
			{/each}
		</select>
	</label>

	<label class="flex items-center gap-2 text-sm">
		<Switch checked={exclusive} onCheckedChange={(v) => (exclusive = v)} />
		EX raids only
	</label>

	<GymPicker bind:gymId />

	<DistanceField bind:distance {maxDistance} />

	<div class="flex items-center justify-end gap-2">
		{#if onCancel}<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>{/if}
		<Button onclick={submit} disabled={submitting}>
			Save
		</Button>
	</div>
</div>
