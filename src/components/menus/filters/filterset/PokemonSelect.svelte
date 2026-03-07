<script lang="ts">
	import { mPokemon } from "@/lib/services/ingameLocale";
	import { resize } from "@/lib/services/assets";
	import { getIconPokemon } from "@/lib/services/uicons.svelte";
	import LongSelectItem from "@/components/menus/filters/LongSelectItem.svelte";

	type PokemonLike = { pokemon_id: number; form?: number | null; form_id?: number | null };
	type SelectedPokemon = { pokemon_id: number; form_id: number };

	let {
		pokemonList,
		selected,
		onselect
	}: {
		pokemonList: PokemonLike[];
		selected: PokemonLike[];
		onselect: (pokemon: SelectedPokemon, isSelected: boolean) => void;
	} = $props();

	// TODO: style pokemon select better
	const isCompact = false;

	function getPokemonForm(pokemon: PokemonLike) {
		return pokemon.form ?? pokemon.form_id ?? 0;
	}

	function pokemonValue(pokemon: PokemonLike) {
		return `${pokemon.pokemon_id}-${getPokemonForm(pokemon)}`;
	}

	function getDisplayPokemon(pokemon: PokemonLike) {
		return { pokemon_id: pokemon.pokemon_id, form: getPokemonForm(pokemon) };
	}

	function getSelectedPokemon(pokemon: PokemonLike): SelectedPokemon {
		return { pokemon_id: pokemon.pokemon_id, form_id: getPokemonForm(pokemon) };
	}

	let selectedValues = $derived(selected.map((pokemon) => pokemonValue(pokemon)) ?? []);
</script>

{#each pokemonList as pokemon (`${pokemon.pokemon_id}-${getPokemonForm(pokemon)}`)}
	<LongSelectItem
		isSelected={selectedValues.includes(pokemonValue(pokemon))}
		onselect={(isSelected) => {
			onselect(getSelectedPokemon(pokemon), isSelected);
		}}
	>
		{@const displayPokemon = getDisplayPokemon(pokemon)}
		<img
			class:size-10={!isCompact}
			alt={mPokemon(displayPokemon)}
			src={resize(getIconPokemon(displayPokemon), { width: 64 })}
			loading="lazy"
		/>
		<span>
			{mPokemon(displayPokemon)}
		</span>
	</LongSelectItem>
{/each}
