<script lang="ts">
	import AttributeDisplay from "@/components/menus/filters/filterset/display/AttributeDisplay.svelte";
	import { getIconPokemon } from "@/lib/services/uicons.svelte";
	import { mPokemon } from "@/lib/services/ingameLocale";
	import HorizontalScrollDisplay from "@/components/menus/filters/filterset/display/HorizontalScrollDisplay.svelte";
	import HorizontalScrollElement from "@/components/menus/filters/filterset/display/HorizontalScrollElement.svelte";

	let {
		label,
		pokemon
	}: {
		label: string;
		pokemon: { pokemon_id: number; form?: number | null; form_id?: number | null }[];
	} = $props();

	function getPokemonForm(species: { form?: number | null; form_id?: number | null }) {
		return species.form ?? species.form_id ?? 0;
	}
</script>

<HorizontalScrollDisplay {label}>
	{#each pokemon as species (species.pokemon_id + "-" + getPokemonForm(species))}
		{@const displayPokemon = { pokemon_id: species.pokemon_id, form: getPokemonForm(species) }}
		<HorizontalScrollElement>
			<img class="size-9" src={getIconPokemon(displayPokemon)} alt={mPokemon(displayPokemon)} />
			<span class="text-base">
				{mPokemon(displayPokemon)}
			</span>
		</HorizontalScrollElement>
	{/each}
</HorizontalScrollDisplay>
