<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import DistanceField from "./DistanceField.svelte";
	import {
		fortChangeTypes,
		fortTypes,
		type FortRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	// Fort-update tracking rule — Pokéstop / gym additions, removals and
	// edits, filtered by change type (API.md).
	let {
		config,
		initial = null,
		submitting = false,
		defaultDistance = 0,
		onSubmit,
		onCancel
	}: {
		config: PoracleWebConfig | null;
		initial?: FortRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let fortType = $state(seed?.fort_type ?? "everything");
	let includeEmpty = $state(seed?.include_empty ?? false);
	let chosen = $state(new Set(seed?.change_types ?? []));
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function toggleChange(value: string) {
		const next = new Set(chosen);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		chosen = next;
	}

	function submit() {
		onSubmit({
			fort_type: fortType,
			include_empty: includeEmpty,
			change_types: [...chosen],
			distance
		});
	}
</script>

<div class="flex flex-col gap-4 rounded-md border bg-card p-4">
	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		<span class="font-medium uppercase tracking-wide">Fort type</span>
		<select bind:value={fortType} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each fortTypes as f (f.value)}
				<option value={f.value}>{f.label}</option>
			{/each}
		</select>
	</label>

	<div class="flex flex-col gap-1.5">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Change types</span>
		<div class="flex flex-wrap gap-1.5">
			{#each fortChangeTypes as c (c.value)}
				{@const on = chosen.has(c.value)}
				<button
					type="button"
					class="rounded-full border px-3 py-1 text-sm transition-colors {on
						? 'border-primary bg-primary/10 text-primary'
						: 'bg-background hover:bg-muted/40'}"
					onclick={() => toggleChange(c.value)}
				>
					{c.label}
				</button>
			{/each}
		</div>
	</div>

	<label class="flex items-center gap-2 text-sm">
		<Switch checked={includeEmpty} onCheckedChange={(v) => (includeEmpty = v)} />
		Include changes with no name / description
	</label>

	<DistanceField bind:distance {maxDistance} />

	<div class="flex items-center justify-end gap-2">
		{#if onCancel}<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>{/if}
		<Button onclick={submit} disabled={submitting}>
			Save
		</Button>
	</div>
</div>
