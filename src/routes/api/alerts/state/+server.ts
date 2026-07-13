import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	ensureHuman,
	getAllTracking,
	getPoracleError,
	getProfiles
} from "@/lib/server/poracle/poracle.server";
import type { PoracleHuman } from "@/lib/services/alerts/alerts.shared";

// GET — the per-profile bundle (human + profiles + all tracking rules)
// for the user's current active profile. Used to refresh the page in
// place after a profile switch, avoiding a full reload. `/api/tracking/
// all` already carries the human record (current_profile_no, area,
// lat/lon) so one round-trip covers everything except the static
// available-areas list, which doesn't change per profile.
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
		const [all, profilesRes] = await Promise.all([
			getAllTracking(discordId),
			getProfiles(discordId).catch(() => ({ status: "error", profile: [] }))
		]);
		return json(
			{
				human: (all.human as PoracleHuman | undefined) ?? null,
				profiles: profilesRes.profile ?? [],
				tracking: all
			},
			{ headers: { "cache-control": "no-store" } }
		);
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
