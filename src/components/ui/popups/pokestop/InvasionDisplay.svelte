<script lang="ts">
	import ImagePopup from "@/components/ui/popups/common/ImagePopup.svelte";
	import TimeWithCountdown from "@/components/ui/popups/common/TimeWithCountdown.svelte";
	import PokestopSection from "@/components/ui/popups/pokestop/PokestopSection.svelte";
	import type { Incident } from "@/lib/types/mapObjectData/pokestop";
	import { mCharacter, mPokemon } from "@/lib/services/ingameLocale";
	import { getIconInvasion, getIconPokemon } from "@/lib/services/uicons.svelte.js";
	import * as m from "@/lib/paraglide/messages";
	import {
		getConfirmedInvasionCatchable,
		getInvasionDisplayCatchable,
		getInvasionDisplayLineup,
		getInvasionPokemon,
		hasInvasionDisplayLineup
	} from "@/lib/features/masterStats.svelte";
	import type { InvasionPokemonStats } from "@/lib/server/api/queryStats";
	import { hasLoadedFeature, LoadedFeature } from "@/lib/services/initialLoad.svelte";
	import IconValue from "@/components/ui/popups/common/IconValue.svelte";
	import { Trophy } from "lucide-svelte";

	let {
		expanded,
		incident
	}: {
		expanded: boolean;
		incident: Incident;
	} = $props();

	const confirmedCatchables = $derived(getConfirmedInvasionCatchable(incident));
	const hasLineup = $derived(hasInvasionDisplayLineup(incident));
	const lineup = $derived(getInvasionDisplayLineup(incident));
	const catchables = $derived(getInvasionDisplayCatchable(incident));
</script>

{#snippet lineupSlot(slotLineup: InvasionPokemonStats[], num: number | undefined)}
	<div class="flex gap-1">
		{#if num}
			<div class="border border-border rounded-sm flex justify-center items-center h-9 px-1.5">
				<p class="text-sm text-muted-foreground">
					#{num}
				</p>
			</div>
		{/if}

		<div
			class="flex flex-wrap border border-border rounded-sm w-fit h-9"
			class:dark:border-yellow-800={slotLineup[0]?.encounter && num}
			class:dark:bg-yellow-950={slotLineup[0]?.encounter && num}
			class:border-indigo-300={slotLineup[0]?.encounter && num}
			class:bg-indigo-100={slotLineup[0]?.encounter && num}
		>
			{#each slotLineup as slotMon (`${slotMon.pokemon_id}-${slotMon.form}`)}
				{@const pokemon = getInvasionPokemon(slotMon)}
				<div class="p-1 size-8">
					<ImagePopup src={getIconPokemon(pokemon)} alt={mPokemon(pokemon)} />
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<PokestopSection>
	<div class="w-7 h-7 shrink-0">
		<ImagePopup
			src={getIconInvasion(incident.character, incident.confirmed)}
			alt={mCharacter(incident.character)}
			class="w-7"
		/>
	</div>

	<div>
		<span>
			{mCharacter(incident.character)}

			{#if incident.confirmed}
				({m.confirmed()})
			{/if}
		</span>

		<TimeWithCountdown expireTime={incident.expiration} showHours={incident.display_type !== 1} />

		{#if hasLineup && !expanded}
			{#if catchables.length > 1}
				<p class="text-muted-foreground mb-0.5">
					<IconValue Icon={Trophy}>
						{#if confirmedCatchables.length > 0}
							{m.rewards()}
						{:else}
							{m.invasion_x_possible_rewards({ x: catchables.length })}
						{/if}
					</IconValue>
				</p>
				{@render lineupSlot(catchables, undefined)}
			{/if}
		{/if}

		{#if !hasLineup && expanded && hasLoadedFeature(LoadedFeature.MASTER_STATS)}
			<p class="text-muted-foreground">
				{m.invasion_lineup_unavailable()}
			</p>
		{/if}
	</div>

	{#snippet stats()}
		{#if hasLineup && !expanded && catchables.length === 1}
			{@const reward = getInvasionPokemon(catchables[0])}
			<div class="flex gap-2 mt-0.5">
				<ImagePopup src={getIconPokemon(reward)} alt={mPokemon(reward)} class="w-7" />
				<span>
					{m.invasion_reward()}: <b>{mPokemon(reward)}</b>
				</span>
			</div>
		{/if}

		{#if hasLineup && expanded}
			<div class="mt-1.5 space-y-1">
				{#if (lineup?.first?.length ?? 0) > 0}
					{@render lineupSlot(lineup?.first ?? [], 1)}
				{/if}
				{#if (lineup?.second?.length ?? 0) > 0}
					{@render lineupSlot(lineup?.second ?? [], 2)}
				{/if}
				{#if (lineup?.third?.length ?? 0) > 0}
					{@render lineupSlot(lineup?.third ?? [], 3)}
				{/if}
			</div>
		{/if}
	{/snippet}
</PokestopSection>
