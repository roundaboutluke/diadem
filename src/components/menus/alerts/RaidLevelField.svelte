<script lang="ts">
	import RadioGroup from "@/components/ui/input/selectgroup/RadioGroup.svelte";
	import SelectGroupItem from "@/components/ui/input/selectgroup/SelectGroupItem.svelte";
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
</script>

<div class="flex flex-col gap-1">
	<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
	<RadioGroup
		value={String(value)}
		onValueChange={(v) => onchange(Number(v))}
		class="w-full px-1 py-1"
	>
		{#each RAID_LEVELS as level (level)}
			<SelectGroupItem class="w-[48%] h-16!" type="radio" value={String(level)}>
				<img
					class="w-5"
					src={resize(getIconRaidEgg(level), { width: 64 })}
					alt={mRaid(level, true)}
				/>
				{mRaid(level, true)}
			</SelectGroupItem>
		{/each}
	</RadioGroup>
</div>
