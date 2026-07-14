<script lang="ts">
	import { ChevronRight } from "@lucide/svelte";
	import { pokedexTypeMeta, type PokedexTrackingType } from "@/lib/services/alerts/alerts.shared";
	import { typeIcon, sectionIconUrl } from "@/lib/services/alerts/alerts.icons";

	let {
		types,
		hasIcons = false,
		onPick
	}: {
		types: PokedexTrackingType[];
		hasIcons?: boolean;
		onPick: (type: PokedexTrackingType) => void;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	{#each types as type (type)}
		{@const meta = pokedexTypeMeta[type]}
		{@const Icon = typeIcon(type)}
		{@const iconUrl = hasIcons ? sectionIconUrl(type) : null}
		<button
			type="button"
			class="flex items-center gap-3 rounded-md border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40"
			onclick={() => onPick(type)}
		>
			{#if iconUrl}
				<img src={iconUrl} alt="" class="h-9 w-9 shrink-0 object-contain" />
			{:else if Icon}
				<Icon class="h-6 w-6 shrink-0 text-muted-foreground" />
			{/if}
			<span class="min-w-0 flex-1">
				<span class="block text-sm font-semibold">{meta.label}</span>
				<span class="block truncate text-xs text-muted-foreground">{meta.blurb}</span>
			</span>
			<ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground" />
		</button>
	{/each}
</div>
