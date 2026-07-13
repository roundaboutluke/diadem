<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import { pokedexTypeMeta, type PokedexTrackingType } from "@/lib/services/alerts/alerts.shared";
	import { typeIcon, sectionIconUrl } from "@/lib/services/alerts/alerts.icons";

	// "Add alert" step one: pick the type. A compact grid of square icon
	// tiles (icon + label; the per-type blurb is a hover tooltip) that stays
	// tidy on mobile and desktop. Choosing a tile opens that type's form.
	// Tiles use the same UICON artwork as the Alerts section headers (falling
	// back to the lucide glyph) so the two views read as one set.
	let {
		types,
		counts = {},
		hasIcons = false,
		onPick,
		onCancel
	}: {
		types: PokedexTrackingType[];
		counts?: Partial<Record<PokedexTrackingType, number>>;
		hasIcons?: boolean;
		onPick: (type: PokedexTrackingType) => void;
		onCancel: () => void;
	} = $props();
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between gap-2">
		<span class="text-sm font-medium">What do you want to be alerted about?</span>
		<Button variant="ghost" size="sm" onclick={onCancel}>Cancel</Button>
	</div>
	<!-- Auto-fill square tiles: ~3 across on a phone, ~4 on desktop, no media
		queries. The grid + aspect-ratio are inline styles because Tailwind's
		content scan is unreliable in this (custom) dir; the colour/hover classes
		are reused from the rest of the tooling so they're known to compile. -->
	<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(6.5rem, 1fr)); gap:0.5rem;">
		{#each types as type (type)}
			{@const meta = pokedexTypeMeta[type]}
			{@const Icon = typeIcon(type)}
			{@const iconUrl = hasIcons ? sectionIconUrl(type) : null}
			{@const count = counts[type] ?? 0}
			<button
				type="button"
				title={meta.blurb}
				class="relative flex flex-col items-center justify-center gap-2 rounded-md border p-3 text-center transition-colors hover:border-primary/60 hover:bg-muted/30"
				style="aspect-ratio:1;"
				onclick={() => onPick(type)}
			>
				{#if count > 0}
					<span
						class="absolute rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground"
						style="top:0.375rem; right:0.375rem;"
					>{count}</span>
				{/if}
				{#if iconUrl}
					<img src={iconUrl} alt="" class="h-9 w-9 shrink-0 object-contain" />
				{:else if Icon}
					<Icon class="h-7 w-7 shrink-0 text-primary" />
				{/if}
				<span class="text-xs font-semibold">{meta.label}</span>
			</button>
		{/each}
	</div>
</div>
