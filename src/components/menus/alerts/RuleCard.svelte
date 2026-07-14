<script lang="ts">
	import { Pencil, Trash2 } from "@lucide/svelte";
	import { getIconPokemon, getIconRaidEgg, getIconStation } from "@/lib/services/uicons.svelte";
	import { summarizeRule, type RuleSummary } from "@/lib/services/alerts/ruleSummary";
	import { typeIcon } from "@/lib/services/alerts/alerts.icons";
	import type { AnyRule, PokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

	// One rule rendered as a Diadem-filterset-style card: icon +
	// what-it-tracks title + a wrap of attribute chips, plus select /
	// edit / delete controls. Built from the rule's structured fields
	// (see ruleSummary) so it never falls back to "Rule #".
	let {
		type,
		rule,
		hasIcons = true,
		ready = true,
		gymNames = {},
		showSelect = false,
		selected = false,
		deleting = false,
		onToggleSelect,
		onEdit,
		onDelete
	}: {
		type: PokedexTrackingType;
		rule: AnyRule;
		hasIcons?: boolean;
		ready?: boolean;
		gymNames?: Record<string, string>;
		showSelect?: boolean;
		selected?: boolean;
		deleting?: boolean;
		onToggleSelect: () => void;
		onEdit?: () => void;
		onDelete: () => void;
	} = $props();

	// `ready` (masterfile loaded) is referenced so the summary recomputes
	// once names become resolvable — mPokemon isn't reactive on its own.
	// Guarded: a species lookup on a not-yet-loaded / missing masterfile
	// entry can throw, and under async rendering that would wedge the
	// whole page — fall back to a minimal summary and recompute on `ready`.
	const summary = $derived.by((): RuleSummary => {
		void ready;
		try {
			return summarizeRule(type, rule, (id) => gymNames[id]);
		} catch {
			return { icon: null, title: `Rule #${rule.uid}`, chips: [] };
		}
	});

	// Every card keeps a uniform icon slot: a specific species → uicon image
	// (resolved defensively so a bad/early lookup can't throw during render);
	// an emoji icon (hundo/nundo) → rendered as text; anything else falls back
	// to the tracking type's own icon.
	const TypeIcon = $derived(typeIcon(type));
	const emojiIcon = $derived(
		summary.icon && "emoji" in summary.icon ? summary.icon.emoji : null
	);
	const iconSrc = $derived.by(() => {
		const icon = summary.icon;
		if (!hasIcons || !icon) return null;
		try {
			if ("pokemon_id" in icon) return getIconPokemon(icon);
			if ("egg" in icon) return getIconRaidEgg(icon.egg, icon.hatched);
			if ("station" in icon) return getIconStation(true);
		} catch {
			return null;
		}
		return null;
	});
</script>

<li
	class="flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors {selected
		? 'bg-primary/10'
		: 'hover:bg-muted/40'}"
>
	{#if showSelect}
		<input
			type="checkbox"
			checked={selected}
			onchange={onToggleSelect}
			aria-label="Select rule"
			class="shrink-0"
		/>
	{/if}

	<span class="flex h-10 w-10 shrink-0 items-center justify-center">
		{#if iconSrc}
			<img src={iconSrc} alt="" class="h-10 w-10" />
		{:else if emojiIcon}
			<span class="text-2xl leading-none">{emojiIcon}</span>
		{:else if TypeIcon}
			<TypeIcon class="h-6 w-6 text-muted-foreground" />
		{/if}
	</span>

	<div class="flex min-w-0 flex-1 flex-col gap-1.5">
		<span class="truncate text-sm font-semibold">{summary.title}</span>
		{#if summary.chips.length > 0}
			<div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
				{#each summary.chips as chip, i (chip.label)}
					{#if i > 0}<span class="text-muted-foreground/40">·</span>{/if}
					<span class="inline-flex max-w-full items-baseline gap-1 whitespace-nowrap">
						<span class="text-muted-foreground">{chip.label}</span>
						<span class="max-w-[9rem] truncate font-medium text-foreground">{chip.value}</span>
					</span>
				{/each}
			</div>
		{/if}
	</div>

	{#if onEdit}
		<button
			type="button"
			class="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
			aria-label="Edit rule"
			onclick={onEdit}
		>
			<Pencil class="h-4 w-4" />
		</button>
	{/if}
	<button
		type="button"
		class="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
		aria-label="Delete rule"
		disabled={deleting}
		onclick={onDelete}
	>
		<Trash2 class="h-4 w-4" />
	</button>
</li>
