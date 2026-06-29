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
	import { getConfigModifiers } from "@/lib/map/render/renderMapObjects";
	import { getCurrentUiconSetDetailsAllTypes } from "@/lib/services/uicons.svelte";
	import { getUserSettings } from "@/lib/services/userSettings.svelte";
	import { MapObjectType } from "@/lib/mapObjects/mapObjectTypes";

	const lobbies = $derived(getActiveHoopaLobbies());

	// Baseline clearance above the fort icon, calibrated to the previous fixed
	// translateY(-2.7rem) at the default icon scale. Everything scales off this.
	const BASE_CLEARANCE_PX = 43;
	const REFERENCE_SCALE = 0.25; // getConfigModifiers default scale

	// Place the pill above the fort icon using the SAME per-icon-set / per-type
	// modifiers that position the icon itself (mirrors TimerLayer), so it tracks
	// the icon set, the user's map icon size, and the icon's own vertical offset
	// instead of a single hard-coded value.
	function pillOffset(kind: "raid" | "bread" | "rsvp"): { x: number; y: number } {
		const type = kind === "bread" ? MapObjectType.STATION : MapObjectType.GYM;
		const iconSets = getCurrentUiconSetDetailsAllTypes();
		const { scale, offsetX, offsetY } = getConfigModifiers(iconSets[type], type);
		const iconSize = scale * getUserSettings().mapIconSize;
		const clearance = BASE_CLEARANCE_PX * (iconSize / REFERENCE_SCALE);
		return { x: offsetX * iconSize, y: offsetY * iconSize - clearance };
	}

	onMount(() => {
		ensureRemoteRaidProbe();
		return ensureHoopaLobbyPolling();
	});
</script>

{#each lobbies as lobby (lobby.fortId)}
	{@const off = pillOffset(lobby.kind)}
	<Marker lngLat={[lobby.lon, lobby.lat]}>
		<!-- Outer anchor handles positioning (scales with icon set + map icon
			size); inner pill keeps the scale transition so the two don't fight.
			Visual-only — clicks pass through to the fort marker underneath. -->
		<div class="hoopa-lobby-anchor" style="transform: translate({off.x}px, {off.y}px)">
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
