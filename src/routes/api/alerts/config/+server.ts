import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	getGrunts,
	getPoracleError,
	getPoracleWebConfig
} from "@/lib/server/poracle/poracle.server";

// GET — client-side refresh of the PoracleWeb config + invasion grunt
// masterdata (used to render the forms). Cheap upstream reads, but
// still per-user rate-limited to keep the proxy from being a free
// pass-through to the backend.
const limiter = createRateLimitBucket(60, 5 * 60_000);

export async function GET({ locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	if (!limiter.check(locals.user.discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	try {
		const [config, grunts] = await Promise.all([
			getPoracleWebConfig(),
			getGrunts().catch(() => ({}) as Record<string, { type?: string }>)
		]);
		// Collapse the id-keyed grunt map to the unique character types
		// the invasion filter accepts (e.g. Dark, Dragon, Blanche),
		// dropping the "Unset" placeholder. Sorted for a stable dropdown.
		const gruntTypes = [
			...new Set(
				Object.values(grunts)
					.map((g) => g.type)
					.filter((t): t is string => typeof t === "string" && t.length > 0 && t !== "Unset")
			)
		].sort((a, b) => a.localeCompare(b));
		return json({ config, gruntTypes }, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
