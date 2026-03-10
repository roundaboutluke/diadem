import { getConfig } from "@/lib/services/config/config";
import type { MapMouseEvent } from "maplibre-gl";
import type { MapObjectFeature } from "@/lib/map/featuresGen.svelte.js";
import { getMapObjects } from "@/lib/mapObjects/mapObjectsState.svelte.js";
import {
	getCurrentSelectedData,
	setCurrentSelectedData
} from "@/lib/mapObjects/currentSelectedState.svelte";
import { updateAllMapObjects } from "@/lib/mapObjects/updateMapObject";
import { getMapPath } from "@/lib/utils/getMapPath";
import type { MapData } from "@/lib/mapObjects/mapObjectTypes";
import { getMap } from "@/lib/map/map.svelte";
import { CoverageMapLayerId, MapObjectLayerId } from "@/lib/map/layers";
import { closeMenu, getOpenedMenu, Menu } from "@/lib/ui/menus.svelte";
import {
	type CoverageMapAreaProperties,
	getIsCoverageMapActive,
	setClickedCoverageMapAreas
} from "@/lib/features/coverageMap.svelte";
import type { Feature, Polygon } from "geojson";
import { setCurrentScoutCenter } from "@/lib/features/scout.svelte";
import { Coords } from "@/lib/utils/coordinates";

const clickableMapObjectLayers: string[] = [
	MapObjectLayerId.ICONS_UNDERLAY,
	MapObjectLayerId.ICONS,
	MapObjectLayerId.CIRCLES,
	MapObjectLayerId.POLYGON_FILL,
	MapObjectLayerId.POLYGON_STROKE
];

export function closePopup() {
	setCurrentSelectedData(null);
	setCurrentPath();

	// call this to remove selected data (if needed)
	updateAllMapObjects().then();

	const title = document.head.querySelector("title");
	if (title) title.innerText = getConfig().general.mapName;
}

export function openPopup(data: MapData, isOverwrite: boolean = false) {
	setCurrentSelectedData(data, isOverwrite);
	setCurrentPath();
}

export function updateCurrentPath() {
	const data = getCurrentSelectedData();
	if (!data) return;
	if (window.location.pathname.includes(data.type)) return;
	setCurrentPath();
}

export function getCurrentPath() {
	const data = getCurrentSelectedData();
	if (data) {
		return `/${data.type}/${data.id}`;
	}
	return getMapPath(getConfig());
}

function setCurrentPath() {
	history.replaceState(null, "", getCurrentPath());
}

export function clickMapHandler(event: MapMouseEvent) {
	if (event.originalEvent.defaultPrevented) return;

	const map = getMap();
	if (!map) return;

	if (getIsCoverageMapActive()) {
		// @ts-ignore this is ok
		const areas = map.queryRenderedFeatures(event.point, {
			layers: [CoverageMapLayerId.POLYGON_FILL]
		}) as Feature<Polygon, CoverageMapAreaProperties>[];

		if (areas.length === 0) {
			setClickedCoverageMapAreas(undefined);
		} else {
			setClickedCoverageMapAreas(areas);
		}
	} else if (getOpenedMenu() === Menu.SCOUT) {
		setCurrentScoutCenter(Coords.infer(event.lngLat));
	} else {
		const mapObjects = getMapObjects();
		const availableLayers = clickableMapObjectLayers.filter((layerId) => map.getLayer(layerId));
		if (availableLayers.length === 0) return;
		const features = map.queryRenderedFeatures(event.point, {
			layers: availableLayers
		});

		const feature = features.find(
			(feature) => feature.properties?.id && mapObjects[feature.properties.id]
		) as MapObjectFeature | undefined;

		if (feature) {
			openPopup(mapObjects[feature.properties.id]);
		} else {
			closeMenu();
			closePopup();
		}
	}
}
