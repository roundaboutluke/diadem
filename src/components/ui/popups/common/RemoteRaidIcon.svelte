<script lang="ts">
	import { Loader2, X } from "lucide-svelte";
	import * as m from "@/lib/paraglide/messages";
	import { getIconReward } from "@/lib/services/uicons.svelte.js";
	import { RewardType } from "@/lib/utils/pokestopUtils";
	import {
		ensureRemoteRaidProbe,
		remoteRaidAvailable,
		type RemoteRaidFlow,
		type RemoteRaidKind
	} from "@/lib/features/remoteRaid/remoteRaid.svelte";

	let {
		flow,
		kind,
		fortId,
		lat,
		lon
	}: {
		flow: RemoteRaidFlow;
		kind: RemoteRaidKind;
		fortId: string;
		lat: number;
		lon: number;
	} = $props();

	ensureRemoteRaidProbe();

	// In-game Remote Raid Pass item icon (wwm-uicons rewards/items/1408).
	const passIcon = getIconReward(RewardType.ITEM, { item_id: 1408 });

	const inLobby = $derived(flow.phase === "in_lobby");
	const pending = $derived(flow.busy || flow.releasing);
	const label = $derived(
		inLobby
			? m.remote_raid_cancel()
			: kind === "rsvp"
				? m.remote_raid_rsvp()
				: kind === "bread"
					? m.remote_raid_max_battle()
					: m.remote_raid_title()
	);

	function onclick() {
		if (inLobby) void flow.release();
		else void flow.run({ kind, fortId, lat, lon });
	}
</script>

{#if remoteRaidAvailable()}
	<button
		type="button"
		{onclick}
		disabled={pending}
		title={label}
		aria-label={label}
		class="ml-auto flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card shadow-sm transition-colors hover:bg-accent/40 disabled:opacity-60"
		class:text-destructive={inLobby}
	>
		{#if pending}
			<Loader2 class="size-5 animate-spin text-muted-foreground" />
		{:else if inLobby}
			<X class="size-5" />
		{:else}
			<img src={passIcon} alt="" class="size-6" />
		{/if}
	</button>
{/if}
