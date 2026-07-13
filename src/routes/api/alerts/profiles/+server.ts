import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	addProfile,
	createRateLimitBucket,
	ensureHuman,
	getPoracleError,
	getProfiles
} from "@/lib/server/poracle/poracle.server";

// GET — list the user's profiles. POST — create a new profile (body:
// { name, active_hours? }). Discord ID comes only from the session.
const readLimiter = createRateLimitBucket(60, 5 * 60_000);
const writeLimiter = createRateLimitBucket(20, 5 * 60_000);

export async function GET({ locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!readLimiter.check(locals.user.discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}
	try {
		const res = await getProfiles(locals.user.discordId);
		return json({ profile: res.profile ?? [] }, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!writeLimiter.check(discordId)) {
		return json({ error: "Too many changes. Try again shortly." }, { status: 429 });
	}

	let payload: { name?: unknown; active_hours?: unknown };
	try {
		payload = (await request.json()) as { name?: unknown; active_hours?: unknown };
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	const name = typeof payload.name === "string" ? payload.name.trim() : "";
	if (!name || name.length > 64) {
		return json({ error: "Profile name must be 1–64 characters" }, { status: 400 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");
		const body: Record<string, unknown> = { name };
		if (typeof payload.active_hours === "string") body.active_hours = payload.active_hours;
		const result = await addProfile(discordId, body);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
