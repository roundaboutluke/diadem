<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import DistanceField from "./DistanceField.svelte";
	import { lureTypes, type LureRule, type PoracleWebConfig } from "@/lib/services/alerts/alerts.shared";

	// Lured-Pokéstop tracking rule — by lure module type.
	let {
		config,
		initial = null,
		submitting = false,
		defaultDistance = 0,
		onSubmit,
		onCancel
	}: {
		config: PoracleWebConfig | null;
		initial?: LureRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let lureId = $state(seed?.lure_id ?? 0);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit({ lure_id: lureId, distance });
	}
</script>

<div class="flex flex-col gap-4 rounded-md border bg-card p-4">
	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		Lure type
		<select bind:value={lureId} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each lureTypes as l (l.value)}
				<option value={l.value}>{l.label}</option>
			{/each}
		</select>
	</label>

	<DistanceField bind:distance {maxDistance} />

	<div class="flex items-center justify-end gap-2">
		{#if onCancel}<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>{/if}
		<Button onclick={submit} disabled={submitting}>
			{submitting ? "Saving…" : initial ? "Save changes" : "Add rule"}
		</Button>
	</div>
</div>
