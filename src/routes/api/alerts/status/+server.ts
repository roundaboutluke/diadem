import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import { createRateLimitBucket, getPoracleError, getPoracleWebConfig } from "@/lib/server/poracle/poracle.server";

// GET — lightweight reachability probe for the hero status indicator.
// Hits the cheapest authenticated Poracle endpoint (poracleWeb config)
// and reports reachable/unreachable so the client can poll it without
// pulling the whole config each time.
const limiter = createRateLimitBucket(60, 5 * 60_000);

export async function GET({ locals, getClientAddress }) {
	if (!checkIfAuthed(locals.user)) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const rateLimitKey = locals.user?.discordId ?? getClientAddress();
	if (!limiter.check(rateLimitKey)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	try {
		await getPoracleWebConfig();
		return json({ reachable: true }, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		// Reachability failure is a normal state for this endpoint, not an
		// HTTP error — return 200 with reachable:false so the poll always
		// resolves and the indicator flips to "Offline".
		return json(
			{ reachable: false, message: failure.message },
			{ headers: { "cache-control": "no-store" } }
		);
	}
}
