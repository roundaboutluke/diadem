import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	ensureHuman,
	getPoracleError,
	switchProfile
} from "@/lib/server/poracle/poracle.server";

// POST — switch the user's active profile (body: { profile_no }).
const limiter = createRateLimitBucket(30, 5 * 60_000);

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	let payload: { profile_no?: unknown };
	try {
		payload = (await request.json()) as { profile_no?: unknown };
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	const profileNo =
		typeof payload.profile_no === "number"
			? payload.profile_no
			: Number.parseInt(String(payload.profile_no), 10);
	if (!Number.isInteger(profileNo) || profileNo < 1) {
		return json({ error: "Invalid profile number" }, { status: 400 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");
		const result = await switchProfile(discordId, profileNo);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
