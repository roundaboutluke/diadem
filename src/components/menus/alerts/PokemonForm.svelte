<script lang="ts">
	import Switch from "@/components/ui/input/Switch.svelte";
	import DistanceField from "./DistanceField.svelte";
	import PvpFields from "./PvpFields.svelte";
	import PokemonPicker from "./PokemonPicker.svelte";
	import RangeSlider from "./RangeSlider.svelte";
	import {
		clampInt,
		genderOptions,
		pokemonRuleDefaults,
		type PokemonRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	let {
		config,
		hasIcons = true,
		initial = null,
		defaultDistance = 0,
		onSubmit
	}: {
		config: PoracleWebConfig | null;
		hasIcons?: boolean;
		initial?: PokemonRule | null;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
	} = $props();

	const maxDistance = $derived(config?.maxDistance ?? 0);

	// svelte-ignore state_referenced_locally
	const seed = initial;

	let pokemonId = $state(seed?.pokemon_id ?? 0);
	let form = $state(seed?.form ?? 0);
	let minIv = $state(seed && seed.min_iv >= 0 ? clampInt(seed.min_iv, 0, 100) : 90);
	let includeUnencountered = $state((seed?.min_iv ?? 0) < 0);
	let maxIv = $state(clampInt(seed?.max_iv ?? 100, 0, 100));
	let minCp = $state(clampInt(seed?.min_cp ?? 0, 0, 10000));
	let maxCp = $state(clampInt(seed?.max_cp ?? 9000, 0, 10000));
	let minLevel = $state(clampInt(seed?.min_level ?? 0, 0, 40));
	let maxLevel = $state(clampInt(seed?.max_level ?? 40, 0, 40));
	let gender = $state(seed?.gender ?? 0);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	let pvpLeague = $state(seed?.pvp_ranking_league ?? 0);
	let pvpBest = $state(seed?.pvp_ranking_best ?? 1);
	let pvpWorst = $state(seed?.pvp_ranking_worst ?? 100);
	let pvpMinCp = $state(seed?.pvp_ranking_min_cp ?? 0);

	function submit() {
		const rule: Record<string, unknown> = {
			...pokemonRuleDefaults,
			pokemon_id: pokemonId,
			form,
			min_iv: includeUnencountered ? -1 : clampInt(minIv, 0, 100),
			max_iv: clampInt(maxIv, 0, 100),
			min_cp: clampInt(minCp, 0, 100000),
			max_cp: clampInt(maxCp, 0, 100000),
			min_level: clampInt(minLevel, 0, 40),
			max_level: clampInt(maxLevel, 0, 40),
			gender: clampInt(gender, 0, 2),
			distance,
			pvp_ranking_league: pvpLeague,
			pvp_ranking_best: pvpBest,
			pvp_ranking_worst: pvpWorst,
			pvp_ranking_min_cp: pvpMinCp
		};
		onSubmit(rule);
	}
</script>

<form
	id="alert-rule-form"
	class="flex flex-col gap-3"
	onsubmit={(e) => {
		e.preventDefault();
		submit();
	}}
>
	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Filters</h3>
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pokémon</span>
			<PokemonPicker bind:pokemonId bind:form {hasIcons} />
		</div>

		<div class="flex flex-col gap-2">
			<RangeSlider
				title="IV %"
				min={0}
				max={100}
				bind:valueMin={minIv}
				bind:valueMax={maxIv}
				format={(v) => `${v}%`}
			/>
			<label class="flex items-center gap-2 text-xs text-muted-foreground">
				<Switch
					checked={includeUnencountered}
					onCheckedChange={(v) => (includeUnencountered = v)}
				/>
				Include 0 IV / unencountered
			</label>
		</div>

		<RangeSlider
			title="CP"
			min={0}
			max={10000}
			step={50}
			bind:valueMin={minCp}
			bind:valueMax={maxCp}
			format={(v) => v.toLocaleString()}
		/>

		<RangeSlider title="Level" min={0} max={40} bind:valueMin={minLevel} bind:valueMax={maxLevel} />

		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			<span class="font-medium uppercase tracking-wide">Gender</span>
			<select
				bind:value={gender}
				class="h-10 rounded-md border bg-background px-2 text-sm text-foreground"
			>
				{#each genderOptions as g (g.value)}
					<option value={g.value}>{g.label}</option>
				{/each}
			</select>
		</label>

		<PvpFields
			bind:league={pvpLeague}
			bind:best={pvpBest}
			bind:worst={pvpWorst}
			bind:minCp={pvpMinCp}
			{config}
		/>
	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
		<DistanceField bind:distance {maxDistance} />
	</section>
</form>
