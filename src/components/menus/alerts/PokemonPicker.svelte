<script lang="ts">
	import { X } from "@lucide/svelte";
	import SearchBar from "@/components/ui/input/SearchBar.svelte";
	import { resize } from "@/lib/services/assets";
	import { getAllPokemon, getMasterPokemon } from "@/lib/services/masterfile";
	import { getIconPokemon } from "@/lib/services/uicons.svelte";

	let {
		pokemonId = $bindable(0),
		form = $bindable(0),
		allowAny = true,
		hasIcons = true
	}: {
		pokemonId?: number;
		form?: number;
		allowAny?: boolean;
		hasIcons?: boolean;
	} = $props();

	let search = $state("");
	let open = $state(false);

	function displayName(id: number, formId: number): string {
		const base = getMasterPokemon(id);
		if (!base) return `#${id}`;
		const species = base.name;
		if (!formId) return species;
		const formEntry = getMasterPokemon(id, formId);
		const label = formEntry?.name;
		return label && label !== species ? `${species} (${label})` : species;
	}

	const options = $derived.by(() =>
		getAllPokemon().map((p) => ({
			pokemon_id: p.pokemon_id,
			form: p.form,
			label: displayName(p.pokemon_id, p.form)
		}))
	);

	const filtered = $derived.by(() => {
		const q = search.trim().toLowerCase();
		const list = q
			? options.filter((o) => o.label.toLowerCase().includes(q) || String(o.pokemon_id) === q)
			: options;
		return list.slice(0, 150);
	});

	const selectedLabel = $derived(pokemonId === 0 ? "Any Pokémon" : displayName(pokemonId, form));

	function select(id: number, formId: number) {
		pokemonId = id;
		form = formId;
		open = false;
		search = "";
	}
</script>

<div class="relative">
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted/40"
		onclick={() => (open = !open)}
	>
		{#if pokemonId !== 0 && hasIcons}
			<img src={getIconPokemon({ pokemon_id: pokemonId, form })} alt="" class="h-6 w-6 shrink-0" />
		{/if}
		<span class="truncate">{selectedLabel}</span>
	</button>

	{#if open}
		<div
			class="absolute z-40 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
		>
			<div class="flex items-center gap-2 border-b p-2">
				<SearchBar bind:query={search} placeholder="Search Pokémon…" />
				<button
					type="button"
					class="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
					aria-label="Close"
					onclick={() => (open = false)}
				>
					<X class="h-4 w-4" />
				</button>
			</div>
			<div class="max-h-64 overflow-y-auto p-2">
				{#if allowAny}
					<button
						type="button"
						class="mb-2 w-full rounded-sm px-3 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent"
						onclick={() => select(0, 0)}
					>
						Any Pokémon
					</button>
				{/if}
				<div class="grid" style:grid-template-columns="repeat(auto-fill, minmax(2.5rem, 1fr))">
					{#each filtered as opt (opt.pokemon_id + "-" + opt.form)}
						<button
							type="button"
							class="size-10 rounded-sm text-center hover:bg-accent active:bg-accent"
							title={opt.label}
							onclick={() => select(opt.pokemon_id, opt.form)}
						>
							{#if hasIcons}
								<img
									class="mx-auto max-h-9 max-w-9"
									src={resize(getIconPokemon({ pokemon_id: opt.pokemon_id, form: opt.form }), {
										width: 64
									})}
									alt={opt.label}
									loading="lazy"
								/>
							{:else}
								<span class="line-clamp-2 px-0.5 text-[10px] leading-tight">{opt.label}</span>
							{/if}
						</button>
					{/each}
				</div>
				{#if filtered.length === 0}
					<p class="px-1 py-2 text-sm text-muted-foreground">No matches</p>
				{/if}
			</div>
		</div>
	{/if}
</div>
