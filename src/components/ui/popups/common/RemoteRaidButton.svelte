<script lang="ts">
	import * as m from "@/lib/paraglide/messages";
	import { Loader2 } from "lucide-svelte";
	import Countdown from "@/components/utils/Countdown.svelte";
	import { getIconReward } from "@/lib/services/uicons.svelte.js";
	import { RewardType } from "@/lib/utils/pokestopUtils";
	import {
		ensureRemoteRaidProbe,
		RemoteRaidFlow,
		remoteRaidAvailable,
		type RemoteRaidKind
	} from "@/lib/features/remoteRaid/remoteRaid.svelte";

	let {
		kind,
		fortId,
		lat,
		lon
	}: {
		kind: RemoteRaidKind;
		fortId: string;
		lat: number;
		lon: number;
	} = $props();

	ensureRemoteRaidProbe();

	const flow = new RemoteRaidFlow();
	// In-game Remote Raid Pass item icon (wwm-uicons rewards/items/1408).
	const passIcon = getIconReward(RewardType.ITEM, { item_id: 1408 });

	function trigger() {
		void flow.run({ kind, fortId, lat, lon });
	}
</script>

{#if remoteRaidAvailable()}
	<div class="mt-2 border-border border-t pt-2">
		<button
			type="button"
			onclick={trigger}
			disabled={flow.busy}
			class="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent/40 disabled:opacity-60"
		>
			{#if flow.busy}
				<Loader2 class="size-5 shrink-0 animate-spin text-muted-foreground" />
			{:else}
				<img src={passIcon} alt="" class="size-5 shrink-0" />
			{/if}
			<span>{flow.busy ? m.remote_raid_working() : m.remote_raid_title()}</span>
		</button>

		{#if flow.phase === "in_lobby"}
			<div class="mt-1.5 text-sm">
				{#if flow.invited}
					<p class="font-medium text-green-600 dark:text-green-500">{m.remote_raid_invited()}</p>
				{/if}
				{#if flow.dailyCapReached}
					<p class="text-muted-foreground">{m.remote_raid_daily_cap()}</p>
				{/if}
				{#if flow.battleStartMs}
					<p class="text-muted-foreground">
						{m.remote_raid_battle_starts()}
						<span class="font-semibold">
							<Countdown expireTime={Math.floor(flow.battleStartMs / 1000)} />
						</span>
					</p>
				{/if}
				<a href="/hoopa" class="text-primary underline-offset-4 hover:underline">
					{m.remote_raid_open_controller()}
				</a>
			</div>
		{:else if flow.phase === "no_link"}
			<p class="mt-1.5 text-sm text-muted-foreground">
				{m.remote_raid_no_link()}
				<a href="/hoopa" class="font-medium text-primary underline-offset-4 hover:underline">
					{m.remote_raid_connect()}
				</a>
			</p>
		{:else if flow.phase === "busy"}
			<p class="mt-1.5 text-sm text-muted-foreground">
				{flow.detail || m.remote_raid_busy()}
				<a href="/hoopa" class="text-primary underline-offset-4 hover:underline">
					{m.remote_raid_open_controller()}
				</a>
			</p>
		{:else if flow.phase === "not_found"}
			<p class="mt-1.5 text-sm text-muted-foreground">{m.remote_raid_not_found()}</p>
		{:else if flow.phase === "error"}
			<p class="mt-1.5 text-sm text-destructive">{flow.detail || m.remote_raid_failed()}</p>
		{/if}
	</div>
{/if}
