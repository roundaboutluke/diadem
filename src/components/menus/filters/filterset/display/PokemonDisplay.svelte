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
		pokemon: { pokemon_id: number; form?: number | null }[];
	} = $props();
</script>

<HorizontalScrollDisplay {label}>
	{#each pokemon as species (species.pokemon_id + "-" + (species.form ?? 0))}
		{@const displayPokemon = { pokemon_id: species.pokemon_id, form: species.form ?? 0 }}
		<HorizontalScrollElement>
			<img class="size-9" src={getIconPokemon(displayPokemon)} alt={mPokemon(displayPokemon)} />
			<span class="text-base">
				{mPokemon(displayPokemon)}
			</span>
		</HorizontalScrollElement>
	{/each}
</HorizontalScrollDisplay>
