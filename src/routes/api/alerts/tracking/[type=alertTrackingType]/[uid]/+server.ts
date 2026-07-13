import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	deleteTrackingByUid,
	getPoracleError
} from "@/lib/server/poracle/poracle.server";
import { isPokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

// DELETE a single tracking rule by its uid. Poracle's byUid delete is
// already scoped to the {id} in the path, so a user can only ever
// delete their own rows — we pass the session Discord ID, never a
// client-supplied one.
const limiter = createRateLimitBucket(120, 5 * 60_000);

export async function DELETE({ params, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const type = params.type;
	if (!isPokedexTrackingType(type)) {
		return json({ error: "Unknown tracking type" }, { status: 400 });
	}
	const uid = Number.parseInt(params.uid, 10);
	if (!Number.isInteger(uid) || uid < 0) {
		return json({ error: "Invalid rule id" }, { status: 400 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	try {
		const result = await deleteTrackingByUid(type, discordId, uid);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
