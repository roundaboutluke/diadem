<script lang="ts">
	import {
		Clock,
		Hourglass,
		Loader2,
		LogOut,
		Settings,
		UserRoundCheck,
		UsersRound
	} from "@lucide/svelte";
	import * as m from "@/lib/paraglide/messages";
	import Button from "@/components/ui/input/Button.svelte";
	import Countdown from "@/components/utils/Countdown.svelte";
	import { getIconReward } from "@/lib/services/uicons.svelte.js";
	import { RewardType } from "@/lib/utils/pokestopUtils";
	import {
		ensureRemoteRaidProbe,
		remoteRaidAvailable,
		type RemoteRaidFlow,
		type RemoteRaidKind
	} from "@/lib/features/remoteRaid/remoteRaid.svelte";
	import {
		dropHoopaLobby,
		ensureHoopaLobbyPolling,
		getActiveHoopaLobby
	} from "@/lib/features/remoteRaid/hoopaLobbies.svelte";
	import { onMount } from "svelte";

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
	onMount(() => ensureHoopaLobbyPolling());

	// In-game Remote Raid Pass item icon (wwm-uicons rewards/items/1408).
	const passIcon = getIconReward(RewardType.ITEM, { item_id: 1408 });

	// A live Hoopa lobby already at this fort (someone else hosting) — lets us
	// offer "Join lobby" and preview its state before the user clicks.
	const activeLobby = $derived(getActiveHoopaLobby(fortId));

	const inLobby = $derived(flow.phase === "in_lobby");
	const queued = $derived(flow.phase === "queued");
	// The action button hides when we're passively in a lobby we don't own
	// (joined via queue / join-existing — nothing to trigger or cancel) and
	// while queued (the chip carries that state). Otherwise it's the trigger,
	// a spinner mid-action, or the red Cancel for a lobby we host.
	const showButton = $derived(!(inLobby && !flow.canCancel) && !queued);
	const buttonPending = $derived(flow.busy || flow.releasing);
	const showStatus = $derived(flow.phase !== "idle" && flow.phase !== "working");

	const buttonLabel = $derived(
		flow.canCancel
			? m.remote_raid_close_lobby()
			: flow.releasing
				? m.remote_raid_closing()
				: flow.busy
					? m.remote_raid_working()
					: activeLobby && !activeLobby.alreadyInvited
						? m.remote_raid_join_lobby()
						: kind === "rsvp"
							? m.remote_raid_rsvp()
							: kind === "bread"
								? m.remote_raid_max_battle()
								: m.remote_raid_title()
	);

	function onclick() {
		if (flow.canCancel) {
			// Optimistically drop the lobby so it isn't re-adopted (and the map
			// pill clears) before the release round-trips + the next poll.
			dropHoopaLobby(fortId);
			void flow.release();
		} else if (!inLobby && !queued && !flow.busy) {
			void flow.run({ kind, fortId, lat, lon });
		}
	}

	// Poll live lobby occupancy while in_lobby; queue position while queued.
	// Cleaned up on phase change / unmount so a closed popup stops polling.
	$effect(() => {
		if (flow.phase !== "in_lobby") return;
		void flow.refreshLobby();
		const id = setInterval(() => void flow.refreshLobby(), 5000);
		return () => clearInterval(id);
	});
	$effect(() => {
		if (flow.phase !== "queued") return;
		void flow.refreshQueue();
		const id = setInterval(() => void flow.refreshQueue(), 5000);
		return () => clearInterval(id);
	});

	// This fort already has a lobby we're in (we hosted it or joined earlier) —
	// re-attach on (re)open instead of offering to join again. Restores Close if
	// we hold the token. Done exactly ONCE per popup (after the first poll lands),
	// so closing the lobby or it expiring doesn't immediately re-adopt the
	// poller's stale entry.
	let adoptHandled = false;
	$effect(() => {
		if (adoptHandled || activeLobby === undefined) return;
		adoptHandled = true;
		if (flow.phase === "idle" && activeLobby.alreadyInvited) {
			flow.adoptOwnedLobby(fortId, activeLobby.battleStartMs, activeLobby.lobbyPlayerCount);
		}
	});

	// Chip vocabulary — rounded-full, icon + short text, tinted by meaning.
	const chip = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium";
	const chipMuted = "bg-muted text-muted-foreground";
	const chipGreen = "bg-green-500/15 text-green-700 dark:text-green-400";
	const chipAmber = "bg-amber-500/15 text-amber-700 dark:text-amber-400";
	const chipPrimary = "bg-primary/15 text-primary";

	const queueEtaMinutes = $derived(
		flow.queueEtaSeconds ? Math.max(1, Math.ceil(flow.queueEtaSeconds / 60)) : 0
	);
</script>

{#if remoteRaidAvailable()}
	<div class="flex flex-col gap-2">
		{#if showButton}
			<Button
				variant={flow.canCancel ? "outline" : "default"}
				class="w-full rounded-full {flow.canCancel
					? 'border-primary text-primary hover:bg-primary/10 hover:text-primary'
					: ''}"
				disabled={buttonPending}
				{onclick}
			>
				{#if buttonPending}
					<Loader2 class="size-4 animate-spin" />
				{:else if flow.canCancel}
					<LogOut class="size-4" />
				{:else}
					<img src={passIcon} alt="" class="size-5" />
				{/if}
				{buttonLabel}
			</Button>
		{/if}

		{#if flow.phase === "idle" && activeLobby && !activeLobby.alreadyInvited}
			<!-- Someone else is hosting a lobby here — preview it so the button
				above reads "Join lobby". (A lobby we're already in is adopted into
				the in-lobby state by the effect above instead.) -->
			<div class="flex flex-wrap items-center gap-1.5 text-xs">
				<span class="{chip} {chipPrimary}">{m.remote_raid_lobby_in_progress()}</span>
				<span class="{chip} {chipMuted}">
					<UsersRound class="size-3" />
					{activeLobby.lobbyPlayerCount}
				</span>
				{#if activeLobby.battleStartMs}
					<span class="{chip} {chipMuted}">
						<Clock class="size-3" />
						<Countdown expireTime={Math.floor(activeLobby.battleStartMs / 1000)} />
					</span>
				{/if}
			</div>
		{:else if showStatus}
			{#if inLobby}
				<div class="flex flex-wrap items-center gap-1.5 text-xs">
					{#if flow.friendRequestSent}
						<span class="{chip} {chipAmber}">{m.remote_raid_chip_accept()}</span>
					{:else if flow.invited}
						<span class="{chip} {chipGreen}">
							<UserRoundCheck class="size-3" />
							{m.remote_raid_chip_invited()}
						</span>
					{/if}
					{#if flow.dailyCapReached}
						<span class="{chip} {chipMuted}">{m.remote_raid_chip_daily_cap()}</span>
					{/if}
					{#if flow.battleStartMs}
						<span class="{chip} {chipMuted}">
							<Clock class="size-3" />
							<Countdown expireTime={Math.floor(flow.battleStartMs / 1000)} />
						</span>
					{/if}
					{#if !flow.friendRequestSent}
						<span class="{chip} {chipMuted}">
							<UsersRound class="size-3" />
							{flow.lobbyPlayerCount ?? 0}
						</span>
					{/if}
				</div>
				{#if flow.friendRequestSent}
					<p class="text-muted-foreground text-xs">{m.remote_raid_friend_request()}</p>
				{/if}
				<a
					href="/hoopa"
					class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
				>
					<Settings class="size-3" />
					{m.remote_raid_open_controller()}
				</a>
			{:else if queued}
				<div class="flex flex-wrap items-center gap-1.5 text-xs">
					<span class="{chip} {chipAmber}">
						<Hourglass class="size-3" />
						{m.remote_raid_in_queue()}{#if flow.queuePosition}
							· {m.remote_raid_queue_position({
								position: flow.queuePosition
							})}{/if}{#if queueEtaMinutes}
							· {m.remote_raid_queue_eta({ minutes: queueEtaMinutes })}{/if}
					</span>
				</div>
				<p class="text-muted-foreground text-xs">{m.remote_raid_queue_hint()}</p>
			{:else if flow.phase === "no_link"}
				<p class="text-muted-foreground text-xs">
					{m.remote_raid_no_link()}
					<a href="/hoopa" class="text-primary font-medium underline-offset-4 hover:underline">
						{m.remote_raid_connect()}
					</a>
				</p>
			{:else if flow.phase === "needs_login"}
				<p class="text-muted-foreground text-xs">
					{m.remote_raid_needs_login()}
					<a
						href="/login/discord"
						class="text-primary font-medium underline-offset-4 hover:underline"
					>
						{m.remote_raid_login()}
					</a>
				</p>
			{:else if flow.phase === "needs_setup"}
				<p class="text-muted-foreground text-xs">
					{flow.detail}
					<a href="/hoopa" class="text-primary font-medium underline-offset-4 hover:underline">
						{m.remote_raid_connect()}
					</a>
				</p>
			{:else if flow.phase === "busy"}
				<p class="text-muted-foreground text-xs">
					{flow.detail || m.remote_raid_busy()}
					<a href="/hoopa" class="text-primary underline-offset-4 hover:underline">
						{m.remote_raid_open_controller()}
					</a>
				</p>
			{:else if flow.phase === "not_found"}
				<p class="text-muted-foreground text-xs">{m.remote_raid_not_found()}</p>
			{:else if flow.phase === "error"}
				<p class="text-destructive text-xs">{flow.detail || m.remote_raid_failed()}</p>
			{/if}
		{/if}
	</div>
{/if}
