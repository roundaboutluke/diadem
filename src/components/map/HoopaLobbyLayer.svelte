<script lang="ts">
	import { GeoJSON, SymbolLayer } from "svelte-maplibre";
	import type { Feature, FeatureCollection, Point } from "geojson";
	import { onMount } from "svelte";
	import { ensureRemoteRaidProbe } from "@/lib/features/remoteRaid/remoteRaid.svelte";
	import {
		ensureHoopaLobbyPolling,
		getActiveHoopaLobbies,
		type HoopaActiveLobby
	} from "@/lib/features/remoteRaid/hoopaLobbies.svelte";
	import { getConfigModifiers } from "@/lib/map/render/renderMapObjects";
	import { getCurrentUiconSetDetailsAllTypes } from "@/lib/services/uicons.svelte";
	import { MapObjectType } from "@/lib/mapObjects/mapObjectTypes";
	import { getMap, getMapStyleVersion } from "@/lib/map/map.svelte";

	const BADGE_IMAGE_ID = "hoopa-lobby-badge-bg";
	const BADGE_SIZE = { width: 28, height: 16, radius: 8 };
	const MAPLIBRE_ICON_OFFSET_SCALE = 32;
	// Vertical placement, in the same em units TimerLayer uses. Sits where a
	// timer would (clear of the icon at any height). Tunable to tuck above/below
	// the raid timer.
	const BADGE_BASE_OFFSET = 1.5;

	const lobbies = $derived(getActiveHoopaLobbies());

	// Generate the primary-coloured rounded-rect background once (re-added if the
	// style reloads), exactly like TimerLayer's timer background.
	$effect(() => {
		getMapStyleVersion();
		const map = getMap();
		if (!map || map.hasImage(BADGE_IMAGE_ID)) return;

		const canvas = document.createElement("canvas");
		canvas.width = BADGE_SIZE.width;
		canvas.height = BADGE_SIZE.height;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		ctx.fillStyle = "#6366f1"; // fallback if --color-primary can't be parsed
		const primary = getComputedStyle(document.documentElement)
			.getPropertyValue("--color-primary")
			.trim();
		if (primary) ctx.fillStyle = primary;
		ctx.roundRect(0, 0, canvas.width, canvas.height, BADGE_SIZE.radius);
		ctx.fill();

		map.addImage(BADGE_IMAGE_ID, ctx.getImageData(0, 0, canvas.width, canvas.height));
	});

	// Same per-icon-set / per-type offset TimerLayer uses, so the badge sits
	// correctly above any icon height instead of a hard-coded pixel value.
	function badgeOffset(kind: HoopaActiveLobby["kind"]): [number, number] {
		const type = kind === "bread" ? MapObjectType.STATION : MapObjectType.GYM;
		const iconSets = getCurrentUiconSetDetailsAllTypes();
		const { offsetX, offsetY } = getConfigModifiers(iconSets[type], type);
		return [
			offsetX / MAPLIBRE_ICON_OFFSET_SCALE,
			BADGE_BASE_OFFSET + offsetY / MAPLIBRE_ICON_OFFSET_SCALE
		];
	}

	const badgeData = $derived<FeatureCollection<Point>>({
		type: "FeatureCollection",
		features: lobbies.map(
			(l): Feature<Point> => ({
				type: "Feature",
				geometry: { type: "Point", coordinates: [l.lon, l.lat] },
				properties: {
					count: String(l.lobbyPlayerCount),
					textOffset: badgeOffset(l.kind)
				}
			})
		)
	});

	onMount(() => {
		ensureRemoteRaidProbe();
		return ensureHoopaLobbyPolling();
	});
</script>

<GeoJSON id="hoopa-lobby-badge-src" data={badgeData}>
	<SymbolLayer
		id="hoopa-lobby-badge"
		layout={{
			"icon-image": BADGE_IMAGE_ID,
			"icon-text-fit": "both",
			"icon-text-fit-padding": [2, 6, 2, 6],
			"icon-anchor": "top",
			"icon-allow-overlap": true,
			"text-field": ["get", "count"],
			"text-anchor": "top",
			"text-offset": ["get", "textOffset"],
			"text-size": 12,
			"text-allow-overlap": true,
			"text-font": [
				"IBM Plex Sans Bold",
				"Open Sans Bold",
				"Noto Sans Bold",
				"Arial Unicode MS Bold",
				"sans-serif"
			]
		}}
		paint={{
			"text-color": "#ffffff",
			"text-halo-color": "rgba(9, 9, 11, 0.45)",
			"text-halo-width": 0.5
		}}
	/>
</GeoJSON>
