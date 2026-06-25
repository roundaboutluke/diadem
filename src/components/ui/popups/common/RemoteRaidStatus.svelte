<script lang="ts">
	import * as m from "@/lib/paraglide/messages";
	import Countdown from "@/components/utils/Countdown.svelte";
	import type { RemoteRaidFlow } from "@/lib/features/remoteRaid/remoteRaid.svelte";

	let { flow }: { flow: RemoteRaidFlow } = $props();
</script>

{#if flow.phase !== "idle" && flow.phase !== "working"}
	<div class="border-border mb-2 border-b pb-2 text-sm">
		{#if flow.phase === "in_lobby"}
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
		{:else if flow.phase === "no_link"}
			<p class="text-muted-foreground">
				{m.remote_raid_no_link()}
				<a href="/hoopa" class="font-medium text-primary underline-offset-4 hover:underline">
					{m.remote_raid_connect()}
				</a>
			</p>
		{:else if flow.phase === "busy"}
			<p class="text-muted-foreground">
				{flow.detail || m.remote_raid_busy()}
				<a href="/hoopa" class="text-primary underline-offset-4 hover:underline">
					{m.remote_raid_open_controller()}
				</a>
			</p>
		{:else if flow.phase === "not_found"}
			<p class="text-muted-foreground">{m.remote_raid_not_found()}</p>
		{:else if flow.phase === "error"}
			<p class="text-destructive">{flow.detail || m.remote_raid_failed()}</p>
		{/if}
	</div>
{/if}
