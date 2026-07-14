<script lang="ts">
	import { Dialog } from "bits-ui";
	import { MapPin, Search } from "@lucide/svelte";
	import CloseButton from "@/components/ui/CloseButton.svelte";
	import SearchBar from "@/components/ui/input/SearchBar.svelte";
	import { fetchGymNames, searchGyms } from "@/lib/services/alerts/alerts.client";

	let {
		gymId = $bindable(null),
		gymName = $bindable("")
	}: {
		gymId?: string | null;
		gymName?: string;
	} = $props();

	let open = $state(false);
	let query = $state("");
	let results = $state<{ id: string; name: string }[]>([]);
	let searching = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (gymId && !gymName) {
			const id = gymId;
			fetchGymNames([id]).then((names) => {
				if (names[id] && gymId === id) gymName = names[id];
			});
		}
	});

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
		open = false;
		query = "";
		results = [];
	}

	function clear() {
		gymId = null;
		gymName = "";
		open = false;
		query = "";
		results = [];
	}
</script>

<div class="flex flex-col gap-1 text-xs text-muted-foreground">
	<span>Specific gym (optional)</span>
	<button
		type="button"
		class="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm text-foreground hover:bg-muted/40"
		onclick={() => (open = true)}
	>
		<MapPin class="h-4 w-4 shrink-0 {gymId ? 'text-primary' : 'text-muted-foreground'}" />
		<span class="min-w-0 flex-1 truncate text-left {gymId ? '' : 'text-muted-foreground'}">
			{gymId ? gymName || gymId : "Any gym in scope"}
		</span>
		<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
	</button>
</div>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
		<Dialog.Content
			trapFocus={false}
			class="fixed left-1/2 top-1/2 z-[60] flex max-h-[80dvh] w-[calc(100%-1rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md border bg-background shadow-md"
		>
			<div class="flex shrink-0 items-center gap-2 border-b p-2">
				<SearchBar bind:query placeholder="Search for a gym by name…" />
				<CloseButton onclick={() => (open = false)} />
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto p-2">
				<button
					type="button"
					class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50"
					onclick={clear}
				>
					Any gym in scope
				</button>
				{#each results as g (g.id)}
					<button
						type="button"
						class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted/50"
						onclick={() => pick(g)}
					>
						<MapPin class="h-4 w-4 shrink-0 text-muted-foreground" />
						<span class="min-w-0 flex-1 truncate">{g.name}</span>
					</button>
				{/each}
				{#if query.trim().length >= 2 && !searching && results.length === 0}
					<p class="px-3 py-2 text-sm text-muted-foreground">No gyms found in your areas.</p>
				{/if}
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
