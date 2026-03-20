import type maplibre from "maplibre-gl";
import { getLoadedImages, setLoadedImage } from "@/lib/map/loadedImages.svelte";
import { applyColorFilter, parseColorFilteredUrl } from "@/lib/map/modifierOverlayIcons";

export async function ensureMapImage(map: maplibre.Map, url: string) {
	if (!url) return;
	if (map.hasImage(url)) return;

	let imageData = getLoadedImages()[url];
	if (!imageData) {
		const colorFilter = parseColorFilteredUrl(url);
		if (colorFilter) {
			await ensureMapImage(map, colorFilter.sourceUrl);
			const sourceData = getLoadedImages()[colorFilter.sourceUrl];
			if (sourceData) {
				imageData = await applyColorFilter(sourceData, colorFilter.filter);
				setLoadedImage(url, imageData);
			}
		} else {
			const image = await map.loadImage(url);
			imageData = image.data;
			setLoadedImage(url, imageData);
		}
	}

	if (imageData && !map.hasImage(url)) {
		map.addImage(url, imageData);
	}
}

export async function ensureMapImages(map: maplibre.Map, urls: string[]) {
	await Promise.all(
		[...new Set(urls.filter(Boolean))].map((url) => ensureMapImage(map, url))
	);
}
