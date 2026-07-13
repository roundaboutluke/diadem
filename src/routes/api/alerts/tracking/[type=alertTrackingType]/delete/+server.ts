import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	bulkDeleteTracking,
	createRateLimitBucket,
	getPoracleError
} from "@/lib/server/poracle/poracle.server";
import { isPokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

// POST — bulk delete tracking rules for one type. Body is a JSON array
// of uids. Backs the multi-select "delete selected" action. Static
// `delete` segment takes routing priority over the sibling `[uid]`
// dynamic segment, so this never shadows a single-delete.
const limiter = createRateLimitBucket(30, 5 * 60_000);

export async function POST({ params, request, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const type = params.type;
	if (!isPokedexTrackingType(type)) {
		return json({ error: "Unknown tracking type" }, { status: 400 });
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
	if (!Array.isArray(payload)) {
		return json({ error: "Body must be a JSON array of rule ids" }, { status: 400 });
	}
	const uids: number[] = [];
	for (const raw of payload) {
		const uid = typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
		if (!Number.isInteger(uid) || uid < 0) {
			return json({ error: `Invalid rule id: ${raw}` }, { status: 400 });
		}
		uids.push(uid);
	}
	if (uids.length === 0) {
		return json({ error: "No rule ids provided" }, { status: 400 });
	}

	try {
		const result = await bulkDeleteTracking(type, discordId, uids);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
