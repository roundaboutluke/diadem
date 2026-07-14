<script lang="ts">
	import Input from "@/components/ui/input/Input.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import DistanceField from "./DistanceField.svelte";
	import PokemonPicker from "./PokemonPicker.svelte";
	import { clampInt, questRewardTypes, type PoracleWebConfig, type QuestRule } from "@/lib/services/alerts/alerts.shared";

	// Field-research (quest) reward tracking. The reward field's meaning
	// depends on reward_type: a Pokémon id for pokemon/candy/mega, an
	// item id for items, or 0 for stardust (amount carries the value).
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
		initial?: QuestRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let rewardType = $state(seed?.reward_type ?? 7);
	let pokemonId = $state(seed && [4, 7, 12].includes(seed.reward_type) ? seed.reward : 0);
	let form = $state(seed?.form ?? 0);
	let itemId = $state(seed && seed.reward_type === 2 ? seed.reward : 0);
	let shiny = $state(seed?.shiny ?? false);
	let amount = $state(seed?.amount ?? 0);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	const isPokemon = $derived([4, 7, 12].includes(rewardType));
	const isItem = $derived(rewardType === 2);

	function submit() {
		const reward = isPokemon ? pokemonId : isItem ? itemId : 0;
		onSubmit({
			reward_type: rewardType,
			reward,
			form: rewardType === 7 ? form : 0,
			shiny: rewardType === 7 ? shiny : false,
			amount: clampInt(amount, 0, 1000000),
			distance
		});
	}
</script>

<form id="alert-rule-form" class="flex flex-col gap-3" onsubmit={(e) => { e.preventDefault(); submit(); }}>
	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Filters</h3>
	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		<span class="font-medium uppercase tracking-wide">Reward type</span>
		<select bind:value={rewardType} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each questRewardTypes as r (r.value)}
				<option value={r.value}>{r.label}</option>
			{/each}
		</select>
	</label>

	{#if isPokemon}
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pokémon</span>
			<PokemonPicker bind:pokemonId bind:form {hasIcons} />
		</div>
		{#if rewardType === 7}
			<label class="flex items-center gap-2 text-sm">
				<Switch checked={shiny} onCheckedChange={(v) => (shiny = v)} />
				Shiny-capable only
			</label>
		{/if}
	{:else if isItem}
		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			<span class="font-medium uppercase tracking-wide">Item ID</span>
			<Input
				type="number"
				min="0"
				value={itemId}
				oninput={(e: Event) => (itemId = clampInt(Number((e.target as HTMLInputElement).value), 0, 100000))}
				class="w-32"
			/>
		</label>
	{/if}

	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		<span class="font-medium uppercase tracking-wide">Minimum amount{rewardType === 3 ? " (stardust)" : ""}</span>
		<Input
			type="number"
			min="0"
			value={amount}
			oninput={(e: Event) => (amount = clampInt(Number((e.target as HTMLInputElement).value), 0, 1000000))}
			class="w-32"
		/>
	</label>

	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
	<DistanceField bind:distance {maxDistance} />

	</section>
</form>
