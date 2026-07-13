import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	ensureHuman,
	getAllTracking,
	getAreas,
	getGrunts,
	getPoracleError,
	getPoracleWebConfig,
	getProfiles
} from "@/lib/server/poracle/poracle.server";
import type { PoracleHuman } from "@/lib/services/alerts/alerts.shared";

// GET — one-shot bootstrap bundle for the Alerts menu (the client-side
// equivalent of the old /pokedex page's server load, since a menu has no
// +page.server.ts). Bootstraps the Poracle "human" then fetches config,
// invasion grunt types, available areas, profiles, and all tracking in
// parallel. Individual sub-fetches degrade to empty defaults so a partial
// backend hiccup still paints a usable menu; only a hard failure 500s.
const limiter = createRateLimitBucket(60, 5 * 60_000);

export async function GET({ locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");

		const [config, grunts, areasRes, profilesRes, all] = await Promise.all([
			getPoracleWebConfig().catch(() => null),
			getGrunts().catch(() => ({}) as Record<string, { type?: string }>),
			getAreas(discordId).catch(() => ({ status: "error", areas: [] })),
			getProfiles(discordId).catch(() => ({ status: "error", profile: [] })),
			getAllTracking(discordId).catch(() => null)
		]);

		const gruntTypes = [
			...new Set(
				Object.values(grunts)
					.map((g) => g.type)
					.filter((t): t is string => typeof t === "string" && t.length > 0 && t !== "Unset")
			)
		].sort((a, b) => a.localeCompare(b));

		return json(
			{
				config,
				gruntTypes,
				areas: areasRes.areas ?? [],
				profiles: profilesRes.profile ?? [],
				human: (all?.human as PoracleHuman | undefined) ?? null,
				tracking: all
			},
			{ headers: { "cache-control": "no-store" } }
		);
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
