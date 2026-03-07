<script lang="ts">
	import RadioGroup from "@/components/ui/input/selectgroup/RadioGroup.svelte";
	import SelectGroupItem from "@/components/ui/input/selectgroup/SelectGroupItem.svelte";
	import type { FiltersetQuest } from "@/lib/features/filters/filtersets";
	import { updateDetailsCurrentSelectedFilterset } from "@/lib/features/filters/filtersetPageData.svelte";
	import * as m from "@/lib/paraglide/messages";
	import { RewardType, rewardTypeLabel } from "@/lib/utils/pokestopUtils";

	let {
		data
	}: {
		data: FiltersetQuest;
	} = $props();

	const filterableRewards = [
		RewardType.POKEMON,
		RewardType.ITEM,
		RewardType.STARDUST,
		RewardType.MEGA_ENERGY,
		RewardType.XP,
		RewardType.CANDY
	];

	function clearRewardFilters(rewardType: RewardType) {
		if (rewardType !== RewardType.POKEMON) delete data.pokemon;
		if (rewardType !== RewardType.ITEM) delete data.item;
		if (rewardType !== RewardType.STARDUST) delete data.stardust;
		if (rewardType !== RewardType.MEGA_ENERGY) delete data.megaResource;
		if (rewardType !== RewardType.XP) delete data.xp;
		if (rewardType !== RewardType.CANDY) delete data.candy;
		if (rewardType !== RewardType.XL_CANDY) delete data.xlCandy;
	}
</script>

<div class="">
	<div class="text-base font-semibold mb-2">
		{m.reward()}
	</div>

	<RadioGroup
		childCount={filterableRewards.length}
		value={data.rewardType?.toString() ?? ""}
		onValueChange={(value: string) => {
			const rewardType = Number(value) as RewardType;
			if (data.rewardType === rewardType) {
				delete data.rewardType;
			} else {
				data.rewardType = rewardType;
				clearRewardFilters(rewardType);
			}

			updateDetailsCurrentSelectedFilterset();
		}}
		class="w-full gap-3!"
	>
		{#each filterableRewards as rewardType}
			<SelectGroupItem type="radio" value={rewardType.toString()} class="p-2 w-full">
				{rewardTypeLabel(rewardType)}
			</SelectGroupItem>
		{/each}
	</RadioGroup>
</div>
