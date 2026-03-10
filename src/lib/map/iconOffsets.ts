export function getOffsetForRotatedIcon(
	imageOffset: number[] = [0, 0],
	imageRotation?: number
) {
	if (!imageRotation) return imageOffset;

	// MapLibre rotates icon-offset with icon-rotate, so offset markers need the inverse rotation
	// if they should stay anchored in place while the icon itself spins.
	const radians = (imageRotation * Math.PI) / 180;
	const [x, y] = imageOffset;
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);

	return [x * cos + y * sin, -x * sin + y * cos];
}
