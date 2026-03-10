<script lang="ts">
	import { getQuestRewards } from "@/lib/features/masterStats.svelte";
	import { RewardType } from "@/lib/utils/pokestopUtils";
	import PokemonSelect from "@/components/menus/filters/filterset/PokemonSelect.svelte";
	import type { FiltersetQuest } from "@/lib/features/filters/filtersets";

	let { data }: { data: FiltersetQuest } = $props();

	let rewards = $derived(getQuestRewards(RewardType.POKEMON));
	let rewardPokemon = $derived(
		rewards
			.map((reward) => ({
				pokemon_id: reward.reward.info.pokemon_id ?? 0,
				form: reward.reward.info.form ?? 0
			}))
			.filter((pokemon) => pokemon.pokemon_id > 0)
			.sort((a, b) => a.pokemon_id - b.pokemon_id || a.form - b.form)
	);
</script>

<div class="h-114 overflow-y-auto flex flex-wrap -mx-4 px-4">
	<PokemonSelect
		pokemonList={rewardPokemon}
		selected={data?.pokemon ?? []}
		onselect={(pokemon, isSelected) => {
			if (!isSelected) {
				data.pokemon = data.pokemon?.filter(
					(selected) => selected.pokemon_id !== pokemon.pokemon_id || selected.form !== pokemon.form
				);
			} else {
				if (!data.pokemon) data.pokemon = [];
				data.pokemon.push(pokemon);
			}

			if (data.pokemon?.length === 0) delete data.pokemon;
		}}
	/>
</div>
