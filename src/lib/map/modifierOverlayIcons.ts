const OVERLAY_ICON_SIZE = 128;

const overlayImageCache = new Map<string, string>();

function getHexChannels(color: string) {
	const hex = color.replace("#", "");
	if (hex.length === 3) {
		return hex.split("").map((channel) => Number.parseInt(channel + channel, 16));
	}

	if (hex.length === 6) {
		return [
			Number.parseInt(hex.slice(0, 2), 16),
			Number.parseInt(hex.slice(2, 4), 16),
			Number.parseInt(hex.slice(4, 6), 16)
		];
	}

	return [255, 255, 255];
}

function toRgba(color: string, opacity: number) {
	const [r, g, b] = getHexChannels(color);
	return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getOverlayCacheKey(kind: "background" | "glow", color: string, opacity: number) {
	return `${kind}|${color}|${opacity}`;
}

function drawOverlay(kind: "background" | "glow", color: string, opacity: number) {
	const canvas = document.createElement("canvas");
	canvas.width = OVERLAY_ICON_SIZE;
	canvas.height = OVERLAY_ICON_SIZE;

	const context = canvas.getContext("2d");
	if (!context) return "";

	const center = OVERLAY_ICON_SIZE / 2;
	const radius = OVERLAY_ICON_SIZE / 2 - 4;

	context.clearRect(0, 0, OVERLAY_ICON_SIZE, OVERLAY_ICON_SIZE);

	if (kind === "background") {
		context.fillStyle = toRgba(color, opacity);
		context.beginPath();
		context.arc(center, center, radius, 0, Math.PI * 2);
		context.fill();
		return canvas.toDataURL("image/png");
	}

	const gradient = context.createRadialGradient(center, center, 0, center, center, radius);
	gradient.addColorStop(0, toRgba(color, opacity));
	gradient.addColorStop(0.55, toRgba(color, opacity * 0.7));
	gradient.addColorStop(1, toRgba(color, 0));

	context.fillStyle = gradient;
	context.beginPath();
	context.arc(center, center, radius, 0, Math.PI * 2);
	context.fill();

	return canvas.toDataURL("image/png");
}

export function getModifierOverlayIconUrl(
	kind: "background" | "glow",
	color: string,
	opacity: number
) {
	const cacheKey = getOverlayCacheKey(kind, color, opacity);
	const cached = overlayImageCache.get(cacheKey);
	if (cached) return cached;

	const imageUrl = drawOverlay(kind, color, opacity);
	overlayImageCache.set(cacheKey, imageUrl);
	return imageUrl;
}

export function getModifierOverlayImageSize(baseImageSize: number, scaleMultiplier: number) {
	const iconRadius = Math.max(8, baseImageSize * 32);
	return (iconRadius * scaleMultiplier * 2) / OVERLAY_ICON_SIZE;
}

const COLOR_FILTER_CSS: Record<string, string> = {
	negative: "invert(1)",
	grayscale: "grayscale(1)",
	sepia: "sepia(1)"
};

export function getColorFilteredImageUrl(sourceUrl: string, filter: string) {
	return `${sourceUrl}||cf-${filter}`;
}

export function parseColorFilteredUrl(
	url: string
): { sourceUrl: string; filter: string } | null {
	const match = url.match(/\|\|cf-(negative|grayscale|sepia)$/);
	if (!match) return null;
	return { sourceUrl: url.slice(0, url.lastIndexOf("||")), filter: match[1] };
}

const emojiImageCache = new Map<string, string>();

export function getEmojiImageUrl(emoji: string): string {
	const cached = emojiImageCache.get(emoji);
	if (cached) return cached;

	const size = OVERLAY_ICON_SIZE;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;

	const context = canvas.getContext("2d");
	if (!context) return "";

	context.textAlign = "center";
	context.textBaseline = "middle";
	context.font = `${size * 0.7}px serif`;
	context.fillText(emoji, size / 2, size / 2);

	const url = canvas.toDataURL("image/png");
	emojiImageCache.set(emoji, url);
	return url;
}

type MapImage = HTMLImageElement | ImageBitmap;

export async function applyColorFilter(
	sourceImage: MapImage,
	filter: string
): Promise<ImageBitmap> {
	const cssFilter = COLOR_FILTER_CSS[filter];
	if (!cssFilter) return createImageBitmap(sourceImage);

	const width = sourceImage.width;
	const height = sourceImage.height;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const context = canvas.getContext("2d");
	if (!context) return createImageBitmap(sourceImage);

	context.filter = cssFilter;
	context.drawImage(sourceImage, 0, 0);

	return createImageBitmap(canvas);
}
