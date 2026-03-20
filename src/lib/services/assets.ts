
export const ALLOWED_WIDTHS = ["64"];

type ResizeOptions = {
	width?: number
}

export function resize(url: string, options?: ResizeOptions) {
	const params = []
	if (options && options.width) params.push(`w=${options.width}`)

	const hashIndex = url.indexOf("#");
	if (hashIndex !== -1) {
		const base = url.slice(0, hashIndex);
		const fragment = url.slice(hashIndex);
		return base + "?" + params.join("&") + fragment;
	}

	return url + "?" + params.join("&");
}