<script lang="ts">
	import { mPokemon } from "@/lib/services/ingameLocale";
	import { resize } from "@/lib/services/assets";
	import { getIconPokemon } from "@/lib/services/uicons.svelte";
	import LongSelectItem from "@/components/menus/filters/LongSelectItem.svelte";

	type Pokemon = { pokemon_id: number; form: number };
	type SelectedPokemon = { pokemon_id: number; form?: number };

	let {
		pokemonList,
		selected,
		onselect
	}: {
		pokemonList: Pokemon[];
		selected: SelectedPokemon[];
		onselect: (pokemon: Pokemon, isSelected: boolean) => void;
	} = $props();

	// TODO: style pokemon select better
	const isCompact = false;

	function pokemonValue(pokemon: SelectedPokemon) {
		return `${pokemon.pokemon_id}-${pokemon.form ?? 0}`;
	}

	let selectedValues = $derived(selected.map((pokemon) => pokemonValue(pokemon)) ?? []);
</script>

{#each pokemonList as pokemon (`${pokemon.pokemon_id}-${pokemon.form}`)}
	<LongSelectItem
		isSelected={selectedValues.includes(pokemonValue(pokemon))}
		onselect={(isSelected) => {
			onselect(pokemon, isSelected);
		}}
	>
		<img
			class:size-10={!isCompact}
			alt={mPokemon(pokemon)}
			src={resize(getIconPokemon(pokemon), { width: 64 })}
			loading="lazy"
		/>
		<span>
			{mPokemon(pokemon)}
		</span>
	</LongSelectItem>
{/each}
