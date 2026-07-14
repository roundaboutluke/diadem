<script lang="ts">
	import { Dialog } from "bits-ui";
	import { Search } from "@lucide/svelte";
	import CloseButton from "@/components/ui/CloseButton.svelte";
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
		return list.slice(0, 300);
	});

	const selectedLabel = $derived(pokemonId === 0 ? "Any Pokémon" : displayName(pokemonId, form));

	function select(id: number, formId: number) {
		pokemonId = id;
		form = formId;
		open = false;
		search = "";
	}
</script>

<button
	type="button"
	class="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted/40"
	onclick={() => (open = true)}
>
	{#if pokemonId !== 0 && hasIcons}
		<img src={getIconPokemon({ pokemon_id: pokemonId, form })} alt="" class="h-6 w-6 shrink-0" />
	{/if}
	<span class="min-w-0 flex-1 truncate">{selectedLabel}</span>
	<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
</button>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
		<Dialog.Content
			trapFocus={false}
			class="fixed inset-0 z-[60] flex flex-col bg-background sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-[70vh] sm:max-h-[38rem] sm:w-[calc(100%-1rem)] sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-md sm:border sm:shadow-xl"
		>
			<div
				class="flex shrink-0 items-center gap-2 border-b p-2"
				style="padding-top: max(0.5rem, env(safe-area-inset-top));"
			>
				<SearchBar bind:query={search} placeholder="Search Pokémon…" />
				<CloseButton onclick={() => (open = false)} />
			</div>
			<div
				class="min-h-0 flex-1 overflow-y-auto p-3"
				style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom));"
			>
				{#if allowAny}
					<button
						type="button"
						class="mb-2 w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50"
						onclick={() => select(0, 0)}
					>
						Any Pokémon
					</button>
				{/if}
				<div class="grid" style:grid-template-columns="repeat(auto-fill, minmax(2.75rem, 1fr))">
					{#each filtered as opt (opt.pokemon_id + "-" + opt.form)}
						<button
							type="button"
							class="size-11 rounded-md text-center hover:bg-accent active:bg-accent"
							title={opt.label}
							onclick={() => select(opt.pokemon_id, opt.form)}
						>
							{#if hasIcons}
								<img
									class="mx-auto max-h-10 max-w-10"
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
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
