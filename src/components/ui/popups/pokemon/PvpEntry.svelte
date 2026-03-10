<script lang="ts">
	import { mPokemon } from "@/lib/services/ingameLocale.js";
	import type { PokemonData, PvpStats } from "@/lib/types/mapObjectData/pokemon";
	import { getIconPokemon, getIconRankMedal } from "@/lib/services/uicons.svelte.js";
	import * as m from "@/lib/paraglide/messages";
	import ImagePopup from "@/components/ui/popups/common/ImagePopup.svelte";

	let {
		data,
		league
	}: {
		data: PvpStats;
		league: "little" | "great" | "ultra";
	} = $props();

	let pokemon: Partial<PokemonData> = $derived({ pokemon_id: data.pokemon, form: data.form });
	let leagueName: string = $derived.by(() => {
		if (league === "little") return m.little_league();
		if (league === "great") return m.great_league();
		if (league === "ultra") return m.ultra_league();
		return "";
	});
	let rankMedalIcon: string = $derived.by(() => {
		if (league !== "great" && league !== "ultra") return "";
		return getIconRankMedal(data.rank);
	});
</script>

<div class="flex gap-2 items-center">
	<div class="relative w-6 h-6 shrink-0">
		<ImagePopup src={getIconPokemon(pokemon)} alt={mPokemon(pokemon)} class="w-6 h-6" />
		{#if rankMedalIcon}
			<img
				src={rankMedalIcon}
				alt={m.rank_x({ rank: data.rank })}
				class="absolute -right-1 -bottom-1 w-3.5 h-3.5 drop-shadow-sm"
			/>
		{/if}
	</div>
	<div>
		<div>
			#{data.rank}
			{leagueName}
			<b>{mPokemon(pokemon)}</b>
		</div>
		<div>
			{data.cp} CP at level: {data.level} ({(data.percentage * 100).toFixed(1)}%) {data.cap}
		</div>
	</div>
</div>
