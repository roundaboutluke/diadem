<script lang="ts">
	import { Marker } from "svelte-maplibre";
	import { scale as scaleTransition } from "svelte/transition";
	import { onMount } from "svelte";
	import { UsersRound } from "lucide-svelte";
	import { ensureRemoteRaidProbe } from "@/lib/features/remoteRaid/remoteRaid.svelte";
	import {
		ensureHoopaLobbyPolling,
		getActiveHoopaLobbies
	} from "@/lib/features/remoteRaid/hoopaLobbies.svelte";
	import { getUserSettings } from "@/lib/services/userSettings.svelte";

	const lobbies = $derived(getActiveHoopaLobbies());

	// Clearance above the fort icon, in screen pixels. A fort lobby icon is a
	// composite (gym + raid boss, or a power spot) whose height is ~constant per
	// icon set, so a single tunable baseline reads better than trying to derive
	// per-feature sprite height — which lives across several modifiers (gym +
	// raid_pokemon) we can't cleanly combine. Scales with the user's map icon
	// size so it tracks when they resize icons. Bump this one number if the pill
	// sits a touch high or low for your icon set.
	const BASE_CLEARANCE_PX = 38;
	const clearancePx = $derived(BASE_CLEARANCE_PX * getUserSettings().mapIconSize);

	onMount(() => {
		ensureRemoteRaidProbe();
		return ensureHoopaLobbyPolling();
	});
</script>

{#each lobbies as lobby (lobby.fortId)}
	<Marker lngLat={[lobby.lon, lobby.lat]}>
		<!-- Outer anchor handles positioning; inner pill keeps the scale
			transition so the two don't fight. Visual-only — clicks pass through
			to the fort marker underneath. -->
		<div class="hoopa-lobby-anchor" style="transform: translateY(-{clearancePx}px)">
			<div class="hoopa-lobby-pill" transition:scaleTransition|global={{ duration: 120 }}>
				<UsersRound class="size-3" />
				<span>{lobby.lobbyPlayerCount}</span>
			</div>
		</div>
	</Marker>
{/each}

<style>
	.hoopa-lobby-anchor {
		pointer-events: none;
	}
	.hoopa-lobby-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		padding: 0.05rem 0.35rem;
		border-radius: 9999px;
		background: var(--color-primary, #6366f1);
		color: var(--color-primary-foreground, #fff);
		font-size: 0.66rem;
		font-weight: 700;
		line-height: 1;
		pointer-events: none;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
		white-space: nowrap;
	}
</style>
