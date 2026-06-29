<script lang="ts">
	import { Marker } from "svelte-maplibre";
	import { scale } from "svelte/transition";
	import { onMount } from "svelte";
	import { UsersRound } from "lucide-svelte";
	import { ensureRemoteRaidProbe } from "@/lib/features/remoteRaid/remoteRaid.svelte";
	import {
		ensureHoopaLobbyPolling,
		getActiveHoopaLobbies
	} from "@/lib/features/remoteRaid/hoopaLobbies.svelte";

	const lobbies = $derived(getActiveHoopaLobbies());

	onMount(() => {
		ensureRemoteRaidProbe();
		return ensureHoopaLobbyPolling();
	});
</script>

{#each lobbies as lobby (lobby.fortId)}
	<Marker lngLat={[lobby.lon, lobby.lat]}>
		<!-- Small lobby-count pill sitting above the fort icon. Visual-only so
			clicks pass through to the gym/station marker underneath. -->
		<div class="hoopa-lobby-pill" transition:scale|global={{ duration: 120 }}>
			<UsersRound class="size-3" />
			<span>{lobby.lobbyPlayerCount}</span>
		</div>
	</Marker>
{/each}

<style>
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
		transform: translateY(-2.7rem);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
		white-space: nowrap;
	}
</style>
