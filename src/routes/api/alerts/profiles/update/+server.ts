import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import { createRateLimitBucket, getPoracleError, updateProfiles } from "@/lib/server/poracle/poracle.server";

// POST — update active_hours on one or more profiles. Body is an array
// of { profile_no, active_hours } where active_hours is a JSON string.
const limiter = createRateLimitBucket(30, 5 * 60_000);

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many changes. Try again shortly." }, { status: 429 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	const list = Array.isArray(payload) ? payload : [payload];
	for (const entry of list) {
		if (!entry || typeof entry !== "object") {
			return json({ error: "Each entry must be an object" }, { status: 400 });
		}
		const profileNo = (entry as { profile_no?: unknown }).profile_no;
		if (!Number.isInteger(profileNo) || (profileNo as number) < 1) {
			return json({ error: "Each entry needs a valid profile_no" }, { status: 400 });
		}
	}

	try {
		const result = await updateProfiles(discordId, list);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
