<script lang="ts">
	import { Check } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import type { PoracleArea } from "@/lib/services/alerts/alerts.shared";

	let {
		areas,
		selected = [],
		saving = false,
		onSave
	}: {
		areas: PoracleArea[];
		selected?: string[];
		saving?: boolean;
		onSave: (names: string[]) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let chosen = $state(new Set(selected.map((s) => s.toLowerCase())));

	const selectable = $derived(areas.filter((a) => a.userSelectable));

	const groups = $derived.by(() => {
		const byGroup = new Map<string, PoracleArea[]>();
		for (const area of selectable) {
			const key = area.group || "Areas";
			const existing = byGroup.get(key);
			if (existing) existing.push(area);
			else byGroup.set(key, [area]);
		}
		return [...byGroup.entries()];
	});

	function isOn(name: string) {
		return chosen.has(name.toLowerCase());
	}

	function toggle(name: string) {
		const key = name.toLowerCase();
		const next = new Set(chosen);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		chosen = next;
	}

	function save() {
		onSave([...chosen]);
	}
</script>

<div class="flex flex-col gap-3">
	{#if selectable.length === 0}
		<p class="text-sm text-muted-foreground">
			No selectable areas are configured on this Poracle instance.
		</p>
	{:else}
		{#each groups as [group, groupAreas] (group)}
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
					>{group}</span
				>
				<div class="flex flex-wrap gap-1.5">
					{#each groupAreas as area (area.name)}
						{@const on = isOn(area.name)}
						<button
							type="button"
							title={area.description}
							class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors {on
								? 'border-primary bg-primary/10 text-primary'
								: 'bg-background hover:bg-muted/40'}"
							onclick={() => toggle(area.name)}
						>
							{#if on}<Check class="h-3.5 w-3.5" />{/if}
							{area.name}
						</button>
					{/each}
				</div>
			</div>
		{/each}
		<div>
			<Button onclick={save} disabled={saving}>{saving ? "Saving…" : "Save areas"}</Button>
		</div>
	{/if}
</div>
