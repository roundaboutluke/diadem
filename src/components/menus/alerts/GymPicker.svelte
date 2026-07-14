<script lang="ts">
	import { MapPin, X } from "@lucide/svelte";
	import SearchBar from "@/components/ui/input/SearchBar.svelte";
	import { fetchGymNames, searchGyms } from "@/lib/services/alerts/alerts.client";

	// Optional "target a specific gym" picker for raid / egg / gym rules.
	// Searches gym names (permission-gated server-side); selecting sets
	// `gymId`. `gymName` is bindable so the parent can seed / read the label;
	// when only an ID is known (editing a rule) the name is resolved lazily.
	let {
		gymId = $bindable(null),
		gymName = $bindable("")
	}: {
		gymId?: string | null;
		gymName?: string;
	} = $props();

	let query = $state("");
	let results = $state<{ id: string; name: string }[]>([]);
	let searching = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	// Resolve the label for an ID that arrived without one (rule edit).
	$effect(() => {
		if (gymId && !gymName) {
			const id = gymId;
			fetchGymNames([id]).then((names) => {
				if (names[id] && gymId === id) gymName = names[id];
			});
		}
	});

	// Debounced name search driven by the SearchBar's bound query.
	$effect(() => {
		const v = query;
		clearTimeout(timer);
		if (v.trim().length < 2) {
			results = [];
			searching = false;
			return;
		}
		searching = true;
		timer = setTimeout(async () => {
			const r = await searchGyms(v);
			if (query === v) {
				results = r;
				searching = false;
			}
		}, 250);
		return () => clearTimeout(timer);
	});

	function pick(g: { id: string; name: string }) {
		gymId = g.id;
		gymName = g.name;
		query = "";
		results = [];
	}

	function clear() {
		gymId = null;
		gymName = "";
		query = "";
		results = [];
	}
</script>

<div class="flex flex-col gap-1 text-xs text-muted-foreground">
	<span>Specific gym (optional)</span>
	{#if gymId}
		<div
			class="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-foreground"
		>
			<MapPin class="h-4 w-4 shrink-0 text-primary" />
			<span class="min-w-0 flex-1 truncate">{gymName || gymId}</span>
			<button
				type="button"
				class="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
				aria-label="Clear gym"
				onclick={clear}
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	{:else}
		<div class="relative">
			<SearchBar bind:query placeholder="Search for a gym by name…" />
			{#if results.length > 0}
				<ul
					class="absolute z-40 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background shadow-md"
				>
					{#each results as g (g.id)}
						<li>
							<button
								type="button"
								class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
								onclick={() => pick(g)}
							>
								<MapPin class="h-4 w-4 shrink-0 text-muted-foreground" />
								<span class="min-w-0 flex-1 truncate">{g.name}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else if query.trim().length >= 2 && !searching}
				<p class="mt-1 text-muted-foreground">No gyms found in your areas.</p>
			{/if}
		</div>
	{/if}
</div>
