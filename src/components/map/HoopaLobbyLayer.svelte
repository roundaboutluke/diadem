<script lang="ts">
	import { Marker } from "svelte-maplibre";
	import { scale } from "svelte/transition";
	import { onMount } from "svelte";
	import { getIconReward } from "@/lib/services/uicons.svelte.js";
	import { RewardType } from "@/lib/utils/pokestopUtils";
	import { ensureRemoteRaidProbe } from "@/lib/features/remoteRaid/remoteRaid.svelte";
	import {
		ensureHoopaLobbyPolling,
		getActiveHoopaLobbies
	} from "@/lib/features/remoteRaid/hoopaLobbies.svelte";

	// In-game Remote Raid Pass item icon (wwm-uicons rewards/items/1408).
	const passIcon = getIconReward(RewardType.ITEM, { item_id: 1408 });
	const lobbies = $derived(getActiveHoopaLobbies());

	onMount(() => {
		ensureRemoteRaidProbe();
		return ensureHoopaLobbyPolling();
	});
</script>

{#each lobbies as lobby (lobby.fortId)}
	<Marker lngLat={[lobby.lon, lobby.lat]}>
		<div class="hoopa-lobby" transition:scale|global={{ duration: 120 }}>
			<span class="hoopa-lobby-pulse"></span>
			<img src={passIcon} alt="" class="hoopa-lobby-icon" />
		</div>
	</Marker>
{/each}

<style>
	/* Visual-only badge sitting above the fort icon, so clicks pass through to
	   the gym/station marker underneath. */
	.hoopa-lobby {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.35rem;
		height: 1.35rem;
		pointer-events: none;
		transform: translateY(-1.35rem);
	}
	.hoopa-lobby-icon {
		position: relative;
		z-index: 1;
		width: 1.05rem;
		height: 1.05rem;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.55));
	}
	.hoopa-lobby-pulse {
		position: absolute;
		inset: 0;
		border-radius: 9999px;
		background: var(--color-primary, #6366f1);
		opacity: 0.45;
		animation: hoopa-lobby-pulse 1.9s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	@keyframes hoopa-lobby-pulse {
		0% {
			transform: scale(0.65);
			opacity: 0.45;
		}
		70% {
			transform: scale(1.7);
			opacity: 0;
		}
		100% {
			opacity: 0;
		}
	}
</style>
