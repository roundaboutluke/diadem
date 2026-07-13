import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import { copyProfile, createRateLimitBucket, getPoracleError } from "@/lib/server/poracle/poracle.server";

// POST — copy all tracking rules from one profile to another (body:
// { from, to }).
const limiter = createRateLimitBucket(20, 5 * 60_000);

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many changes. Try again shortly." }, { status: 429 });
	}

	let payload: { from?: unknown; to?: unknown };
	try {
		payload = (await request.json()) as { from?: unknown; to?: unknown };
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	const from = Number.parseInt(String(payload.from), 10);
	const to = Number.parseInt(String(payload.to), 10);
	if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < 1 || from === to) {
		return json({ error: "Invalid from/to profile numbers" }, { status: 400 });
	}

	try {
		const result = await copyProfile(discordId, from, to);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
