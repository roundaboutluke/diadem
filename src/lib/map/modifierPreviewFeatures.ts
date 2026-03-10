import type { Feature, FeatureCollection, Point } from "geojson";
import { destination, point } from "@turf/turf";
import type { FiltersetModifiers } from "@/lib/features/filters/filtersets";
import {
	MODIFIER_BACKGROUND_OPACITY,
	MODIFIER_GLOW_OPACITY,
	MODIFIER_GLOW_RADIUS
} from "@/lib/features/filters/modifierPresets";
import {
	getModifierOverlayImageOffset,
	getModifierOverlayIconUrl,
	getModifierOverlayImageSize
} from "@/lib/map/modifierOverlayIcons";
import { getOffsetForRotatedIcon } from "@/lib/map/iconOffsets";

type PreviewFeatureLayer = "underlay" | "icon";

export type ModifierPreviewFeatureProperties = {
	layer: PreviewFeatureLayer;
	imageUrl: string;
	imageSize: number;
	imageOffset?: number[];
	imageRotation?: number;
};

type PreviewMarker = {
	coordinates: Point["coordinates"];
	imageUrl: string;
	imageSize: number;
	imageOffset: number[];
	imageRotation?: number;
	layer: PreviewFeatureLayer;
};

type ModifierPreviewFeatureCollectionArgs = {
	center: Point["coordinates"];
	focusIconUrl: string;
	focusBaseImageSize: number;
	focusImageOffset: number[];
	modifiers?: FiltersetModifiers;
	companionIconUrls: string[];
	companionImageSize: number;
	companionImageOffset: number[];
};

const companionPositions = [
	{ bearing: 292, distanceMeters: 24 },
	{ bearing: 110, distanceMeters: 22 },
	{ bearing: 228, distanceMeters: 15 }
] as const;

function getPreviewFeature(marker: PreviewMarker): Feature<Point, ModifierPreviewFeatureProperties> {
	return {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: marker.coordinates
		},
		properties: {
			layer: marker.layer,
			imageUrl: marker.imageUrl,
			imageSize: marker.imageSize,
			imageOffset: getOffsetForRotatedIcon(marker.imageOffset, marker.imageRotation),
			...(marker.imageRotation !== undefined && {
				imageRotation: marker.imageRotation
			})
		}
	};
}

function getCompanionCoordinates(center: Point["coordinates"], bearing: number, distanceMeters: number) {
	return destination(point(center), distanceMeters / 1000, bearing).geometry.coordinates as Point["coordinates"];
}

export function buildModifierPreviewFeatureCollection({
	center,
	focusIconUrl,
	focusBaseImageSize,
	focusImageOffset,
	modifiers,
	companionIconUrls,
	companionImageSize,
	companionImageOffset
}: ModifierPreviewFeatureCollectionArgs): FeatureCollection<Point, ModifierPreviewFeatureProperties> {
	const features: Feature<Point, ModifierPreviewFeatureProperties>[] = [];
	const focusImageSize = focusBaseImageSize * (modifiers?.scale ?? 1);

	if (modifiers?.background) {
		const backgroundImageSize = getModifierOverlayImageSize(focusImageSize, 1.1);
		features.push(
			getPreviewFeature({
				coordinates: center,
				imageUrl: getModifierOverlayIconUrl(
					"background",
					modifiers.background.color,
					modifiers.background.opacity ?? MODIFIER_BACKGROUND_OPACITY
				),
				imageSize: backgroundImageSize,
				imageOffset: getModifierOverlayImageOffset(
					focusImageOffset,
					focusImageSize,
					backgroundImageSize
				),
				layer: "underlay"
			})
		);
	}

	if (modifiers?.glow) {
		const glowImageSize = getModifierOverlayImageSize(
			focusImageSize,
			modifiers.glow.radius ?? MODIFIER_GLOW_RADIUS
		);
		features.push(
			getPreviewFeature({
				coordinates: center,
				imageUrl: getModifierOverlayIconUrl(
					"glow",
					modifiers.glow.color,
					modifiers.glow.opacity ?? MODIFIER_GLOW_OPACITY
				),
				imageSize: glowImageSize,
				imageOffset: getModifierOverlayImageOffset(
					focusImageOffset,
					focusImageSize,
					glowImageSize
				),
				layer: "underlay"
			})
		);
	}

	features.push(
		getPreviewFeature({
			coordinates: center,
			imageUrl: focusIconUrl,
			imageSize: focusImageSize,
			imageOffset: focusImageOffset,
			imageRotation: modifiers?.rotation ?? undefined,
			layer: "icon"
		})
	);

	for (const [index, imageUrl] of companionIconUrls.entries()) {
		const companionPosition = companionPositions[index];
		if (!companionPosition) break;

		features.push(
			getPreviewFeature({
				coordinates: getCompanionCoordinates(
					center,
					companionPosition.bearing,
					companionPosition.distanceMeters
				),
				imageUrl,
				imageSize: companionImageSize,
				imageOffset: companionImageOffset,
				layer: "icon"
			})
		);
	}

	return {
		type: "FeatureCollection",
		features
	};
}
