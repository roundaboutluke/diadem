<script lang="ts">
	import { Trash2 } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import RuleCard from "./RuleCard.svelte";
	import { type AnyRule, type PokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

	// List of tracking rules for one type. Each row is a Diadem-filterset
	// -style RuleCard (icon + title + attribute chips) with select / edit
	// / delete, plus a bulk-delete bar. Distance is edited per rule (via the
	// rule's own form), so there's no bulk distance control.
	let {
		type,
		rules,
		hasIcons = true,
		ready = true,
		gymNames = {},
		deletingUid = null,
		bulkBusy = false,
		onDelete,
		onEdit,
		onBulkDelete
	}: {
		type: PokedexTrackingType;
		rules: AnyRule[];
		hasIcons?: boolean;
		ready?: boolean;
		gymNames?: Record<string, string>;
		deletingUid?: number | null;
		bulkBusy?: boolean;
		onDelete: (uid: number) => void;
		onEdit?: (rule: AnyRule) => void;
		onBulkDelete: (uids: number[]) => Promise<void> | void;
	} = $props();

	let selected = $state(new Set<number>());

	const selectedCount = $derived(selected.size);
	const allSelected = $derived(rules.length > 0 && selected.size === rules.length);

	function toggle(uid: number) {
		const next = new Set(selected);
		if (next.has(uid)) next.delete(uid);
		else next.add(uid);
		selected = next;
	}
	function toggleAll() {
		selected = allSelected ? new Set() : new Set(rules.map((r) => r.uid));
	}
	function clearSelection() {
		selected = new Set();
	}

	async function bulkDelete() {
		await onBulkDelete([...selected]);
		clearSelection();
	}
</script>

{#if rules.length === 0}
	<p class="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
		No rules yet.
	</p>
{:else}
	<div class="flex flex-col gap-1.5">
		<!-- Header / bulk bar — only meaningful with 2+ rules -->
		{#if rules.length > 1}
			<div class="flex flex-wrap items-center gap-3 px-1 py-1 text-xs text-muted-foreground">
			<label class="flex items-center gap-2">
				<input type="checkbox" checked={allSelected} onchange={toggleAll} aria-label="Select all" />
				Select all
			</label>
			{#if selectedCount > 0}
				<span class="font-medium text-foreground">{selectedCount} selected</span>
				<Button variant="outline" size="sm" onclick={bulkDelete} disabled={bulkBusy}>
					<Trash2 class="h-4 w-4" /> Delete
				</Button>
				<button type="button" class="underline" onclick={clearSelection}>Clear</button>
			{/if}
			</div>
		{/if}

		<ul class="flex flex-col gap-0.5">
			{#each rules as rule (rule.uid)}
				<RuleCard
					{type}
					{rule}
					{hasIcons}
					{ready}
					{gymNames}
					selected={selected.has(rule.uid)}
					deleting={deletingUid === rule.uid}
					onToggleSelect={() => toggle(rule.uid)}
					onEdit={onEdit ? () => onEdit(rule) : undefined}
					onDelete={() => onDelete(rule.uid)}
				/>
			{/each}
		</ul>
	</div>
{/if}
