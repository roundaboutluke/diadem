<script lang="ts">
	import { Search, X } from "@lucide/svelte";
	import Input from "@/components/ui/input/Input.svelte";
	import { getAllPokemon, getMasterPokemon } from "@/lib/services/masterfile";
	import { getIconPokemon } from "@/lib/services/uicons.svelte";

	// Controlled Pokémon + form picker backed by Diadem's masterfile.
	// `pokemon_id` 0 means "any / everything" (Poracle convention) when
	// `allowAny` is set. Two-way bound via $bindable so the parent form
	// reads the current selection directly.
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

	// Full option list built once from the masterfile. Cheap enough
	// (~1k entries) to filter reactively on each keystroke.
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
		return list.slice(0, 60);
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
		<!-- Overlay dropdown. z-index is set inline, not via a class: Tailwind
			doesn't scan this (custom) directory, so a `z-*` class here compiles
			to nothing. 40 beats the slider thumbs (z-5) below it. -->
		<div
			style="z-index: 40;"
			class="absolute mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg"
		>
			<div class="flex items-center gap-2 border-b px-2 py-1.5">
				<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
				<Input
					value={search}
					oninput={(e: Event) => (search = (e.target as HTMLInputElement).value)}
					placeholder="Search Pokémon…"
					class="h-8 border-0 px-1 shadow-none focus-visible:ring-0"
				/>
				<button type="button" aria-label="Close" onclick={() => (open = false)}>
					<X class="h-4 w-4 text-muted-foreground" />
				</button>
			</div>
			<div class="max-h-64 overflow-y-auto py-1">
				{#if allowAny}
					<button
						type="button"
						class="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50"
						onclick={() => select(0, 0)}
					>
						<span class="text-muted-foreground">Any Pokémon</span>
					</button>
				{/if}
				{#each filtered as opt (opt.pokemon_id + "-" + opt.form)}
					<button
						type="button"
						class="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50"
						onclick={() => select(opt.pokemon_id, opt.form)}
					>
						{#if hasIcons}
							<img
								src={getIconPokemon({ pokemon_id: opt.pokemon_id, form: opt.form })}
								alt=""
								class="h-6 w-6 shrink-0"
							/>
						{/if}
						<span class="truncate">{opt.label}</span>
					</button>
				{:else}
					<div class="px-3 py-2 text-sm text-muted-foreground">No matches</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
