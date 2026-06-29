<script lang="ts">
	import { CircleLayer, GeoJSON } from "svelte-maplibre";
	import type { FeatureCollection, Point } from "geojson";
	import { onMount } from "svelte";
	import { ensureRemoteRaidProbe } from "@/lib/features/remoteRaid/remoteRaid.svelte";
	import {
		ensureHoopaLobbyPolling,
		getActiveHoopaLobbies
	} from "@/lib/features/remoteRaid/hoopaLobbies.svelte";
	import { getUserSettings } from "@/lib/services/userSettings.svelte";
	import { MapObjectLayerId } from "@/lib/map/layers";

	// Remote-raid teal — reads as "a remote raid is happening here". Tunable.
	const GLOW_COLOR = "#2dd4bf";
	const GLOW_RADIUS = 22;

	const lobbies = $derived(getActiveHoopaLobbies());
	const iconSize = $derived(getUserSettings().mapIconSize);

	const glowData = $derived<FeatureCollection<Point>>({
		type: "FeatureCollection",
		features: lobbies.map((l) => ({
			type: "Feature",
			geometry: { type: "Point", coordinates: [l.lon, l.lat] },
			properties: { fortId: l.fortId }
		}))
	});

	onMount(() => {
		ensureRemoteRaidProbe();
		return ensureHoopaLobbyPolling();
	});
</script>

<GeoJSON id="hoopa-lobby-glow-src" data={glowData}>
	<!-- Soft halo rendered UNDER the fort icon (beforeId), so it flags an active
		lobby anchored to the fort's point — independent of icon height. The
		headcount lives in the popup. -->
	<CircleLayer
		id="hoopa-lobby-glow"
		beforeId={MapObjectLayerId.ICONS}
		paint={{
			"circle-color": GLOW_COLOR,
			"circle-radius": GLOW_RADIUS * iconSize,
			"circle-blur": 0.8,
			"circle-opacity": 0.5
		}}
	/>
</GeoJSON>
