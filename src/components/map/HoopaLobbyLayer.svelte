<script lang="ts">
	import { GeoJSON, SymbolLayer } from "svelte-maplibre";
	import type { ExpressionSpecification } from "maplibre-gl";
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
	const PEOPLE_IMAGE_ID = "hoopa-lobby-people";
	const BADGE_SIZE = { width: 28, height: 16, radius: 8 };
	const MAPLIBRE_ICON_OFFSET_SCALE = 32;
	// Vertical placement, in the same em units TimerLayer uses. Sits where a
	// timer would (clear of the icon at any height). Tunable to stack relative to
	// the raid timer.
	const BADGE_BASE_OFFSET = 1.5;

	// lucide UsersRound, white stroke so it reads on the primary pill.
	const PEOPLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></svg>`;

	const lobbies = $derived(getActiveHoopaLobbies());
	let peopleReady = $state(false);

	$effect(() => {
		getMapStyleVersion();
		const map = getMap();
		if (!map) return;

		// Primary-coloured rounded-rect background (sync), like TimerLayer's.
		if (!map.hasImage(BADGE_IMAGE_ID)) {
			const canvas = document.createElement("canvas");
			canvas.width = BADGE_SIZE.width;
			canvas.height = BADGE_SIZE.height;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				ctx.fillStyle = "#6366f1"; // fallback if --color-primary can't be parsed
				const primary = getComputedStyle(document.documentElement)
					.getPropertyValue("--color-primary")
					.trim();
				if (primary) ctx.fillStyle = primary;
				ctx.roundRect(0, 0, canvas.width, canvas.height, BADGE_SIZE.radius);
				ctx.fill();
				map.addImage(BADGE_IMAGE_ID, ctx.getImageData(0, 0, canvas.width, canvas.height));
			}
		}

		// People icon (async — SVG → canvas). Until it's ready the badge shows
		// the count alone, so it never references a missing image.
		if (map.hasImage(PEOPLE_IMAGE_ID)) {
			peopleReady = true;
			return;
		}
		peopleReady = false;
		const img = new Image();
		img.onload = () => {
			const m = getMap();
			if (!m) return;
			if (!m.hasImage(PEOPLE_IMAGE_ID)) {
				const c = document.createElement("canvas");
				c.width = 22;
				c.height = 22;
				const cx = c.getContext("2d");
				if (!cx) return;
				cx.drawImage(img, 0, 0, 22, 22);
				m.addImage(PEOPLE_IMAGE_ID, cx.getImageData(0, 0, 22, 22));
			}
			peopleReady = true;
		};
		img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(PEOPLE_SVG);
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

	// Cast: MapLibre's expression types don't model an inline `image` inside
	// `format` cleanly, but this is valid at runtime.
	const textField = $derived(
		(peopleReady
			? ["format", ["image", PEOPLE_IMAGE_ID], {}, " ", {}, ["get", "count"], {}]
			: ["get", "count"]) as unknown as ExpressionSpecification
	);

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
			"text-field": textField,
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
