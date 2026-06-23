import { getClientConfig } from "@/lib/services/config/config.server";

export const prerender = false;

// Web app manifest, driven by config so the installed app name follows
// `general.mapName` (same pattern as the robots.txt route).
export function GET() {
	const general = getClientConfig().general;
	const name = general.mapName || "Diadem";

	const manifest = {
		name,
		short_name: name,
		description: general.description,
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#0a0a0a",
		theme_color: "#0a0a0a",
		icons: [
			{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{
				src: "/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable"
			}
		]
	};

	return new Response(JSON.stringify(manifest), {
		headers: {
			"content-type": "application/manifest+json; charset=utf-8",
			"cache-control": "public, max-age=3600"
		}
	});
}
