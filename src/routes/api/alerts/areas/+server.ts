import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	ensureHuman,
	getPoracleError,
	setAreas
} from "@/lib/server/poracle/poracle.server";

// POST — set the user's selected geofence areas. Body is a JSON array
// of area names; Poracle validates each against the user's community
// membership and returns the accepted set. The Discord ID comes only
// from the server session.
const limiter = createRateLimitBucket(30, 5 * 60_000);

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	if (!Array.isArray(payload) || payload.some((a) => typeof a !== "string")) {
		return json({ error: "Body must be a JSON array of area names" }, { status: 400 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");
		const result = await setAreas(discordId, payload as string[]);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
