<script lang="ts">
	import { ChevronDown } from "@lucide/svelte";
	import PickerDrawer from "./PickerDrawer.svelte";
	import { RAID_LEVELS } from "@/lib/utils/gymUtils";
	import { mRaid } from "@/lib/services/ingameLocale";
	import { getIconRaidEgg } from "@/lib/services/uicons.svelte";
	import { resize } from "@/lib/services/assets";

	let {
		label,
		value,
		onchange
	}: {
		label: string;
		value: number;
		onchange: (value: number) => void;
	} = $props();

	let open = $state(false);

	function select(level: number) {
		onchange(level);
		open = false;
	}
</script>

<div class="flex flex-col gap-1">
	<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted/40"
		onclick={() => (open = true)}
	>
		<img src={resize(getIconRaidEgg(value), { width: 64 })} alt="" class="h-6 w-6 shrink-0" />
		<span class="min-w-0 flex-1 truncate">{mRaid(value, true)}</span>
		<ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
	</button>
</div>

<PickerDrawer bind:open title={label}>
	<div class="grid gap-2" style:grid-template-columns="repeat(auto-fill, minmax(5rem, 1fr))">
		{#each RAID_LEVELS as level (level)}
			<button
				type="button"
				class="flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center text-xs hover:bg-muted/50 {level ===
				value
					? 'border-ring ring-2 ring-ring'
					: ''}"
				onclick={() => select(level)}
			>
				<img
					class="h-8 w-8"
					src={resize(getIconRaidEgg(level), { width: 64 })}
					alt={mRaid(level, true)}
				/>
				<span class="line-clamp-2 leading-tight">{mRaid(level, true)}</span>
			</button>
		{/each}
	</div>
</PickerDrawer>
