import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import { getServerConfig } from "@/lib/services/config/config.server";
import { isAuthEnabled, isAuthRequired } from "@/lib/server/auth/betterAuth";
import type { SupportedFeatures } from "@/lib/services/supportedFeatures";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals }) => {
	const config = getServerConfig();
	const authRequired = isAuthRequired();

	return json({
		koji: !!config.koji && !!config.koji.url,
		geocoding:
			(!!config.nominatim && !!config.nominatim.url) ||
			(!!config.pelias && !!config.pelias.url) ||
			(!!config.photon && !!config.photon.url),
		auth: isAuthEnabled(),
		authRequired,
		showFullscreenLogin: authRequired && !locals.user,
		geometryLookup:
			Boolean(config.nominatim?.url) &&
			(!Boolean(config.pelias?.url) || Boolean(config.photon?.url)),
		// The Alerts bell only makes sense when a Poracle backend secret is
		// configured server-side; the flag lets the client hide it otherwise.
		poracle: Boolean(env.PORACLE_API_SECRET)
	} as SupportedFeatures);
};
