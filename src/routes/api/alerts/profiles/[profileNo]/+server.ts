import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import { createRateLimitBucket, deleteProfile, getPoracleError } from "@/lib/server/poracle/poracle.server";

// DELETE — remove a profile and all its tracking rules. The static
// sibling routes (switch/copy/update) take routing priority, so this
// only ever receives a numeric profile number. Profile 1 is the
// default and cannot be deleted.
const limiter = createRateLimitBucket(20, 5 * 60_000);

export async function DELETE({ params, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const profileNo = Number.parseInt(params.profileNo, 10);
	if (!Number.isInteger(profileNo) || profileNo < 1) {
		return json({ error: "Invalid profile number" }, { status: 400 });
	}
	if (profileNo === 1) {
		return json({ error: "The default profile can't be deleted" }, { status: 400 });
	}
	const discordId = locals.user.discordId;
	if (!limiter.check(discordId)) {
		return json({ error: "Too many changes. Try again shortly." }, { status: 429 });
	}

	try {
		const result = await deleteProfile(discordId, profileNo);
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
