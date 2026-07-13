import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	ensureHuman,
	getPoracleError,
	setLocation
} from "@/lib/server/poracle/poracle.server";

// POST — set the user's location (body: { lat, lon }). Radius-based
// rules (distance > 0) notify around this point; Poracle validates it
// against the user's allowed areas when area security is on.
const limiter = createRateLimitBucket(20, 5 * 60_000);

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	let payload: { lat?: unknown; lon?: unknown };
	try {
		payload = (await request.json()) as { lat?: unknown; lon?: unknown };
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	const lat = Number(payload.lat);
	const lon = Number(payload.lon);
	if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
		return json({ error: "Invalid coordinates" }, { status: 400 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");
		const result = await setLocation(discordId, lat, lon);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
