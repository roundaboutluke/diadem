import { json } from "@sveltejs/kit";
import { checkIfAuthed, hasAnyFeatureAnywhereServer } from "@/lib/server/auth/checkIfAuthed";
import { query } from "@/lib/server/db/external/internalQuery";
import { isPointInAllowedArea } from "@/lib/services/user/checkPerm";
import { Features } from "@/lib/utils/features";
import { getLogger } from "@/lib/utils/logger";

const log = getLogger("pokedex-gym-search");

// Name search over the gym table so raid/egg/gym rules can target a specific
// gym. Results are gated per-gym by the same GYM permission the map uses — a
// gym only appears if the user is allowed to see gyms at its location.
const MAX_RESULTS = 40;
const SCAN_LIMIT = 300;

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user)) {
		return json({ results: [] }, { status: 401 });
	}
	if (!hasAnyFeatureAnywhereServer(locals.perms, [Features.GYM], locals.user)) {
		return json({ results: [] });
	}

	let raw: unknown;
	try {
		raw = (await request.json())?.q;
	} catch {
		return json({ results: [] }, { status: 400 });
	}
	const term = typeof raw === "string" ? raw.trim() : "";
	if (term.length < 2) return json({ results: [] });

	try {
		// Escape LIKE wildcards so a literal % / _ in the query isn't a wildcard.
		const like = `%${term.replace(/[%_\\]/g, "\\$&")}%`;
		const rows = await query<{ id: string; name: string; lat: number; lon: number }[]>(
			`SELECT id, name, lat, lon FROM gym WHERE name LIKE ? AND name IS NOT NULL AND deleted = 0 ORDER BY name ASC LIMIT ${SCAN_LIMIT}`,
			[like]
		);

		const results: { id: string; name: string }[] = [];
		for (const row of rows) {
			if (results.length >= MAX_RESULTS) break;
			if (isPointInAllowedArea(locals.perms, Features.GYM, row.lat, row.lon)) {
				results.push({ id: row.id, name: row.name });
			}
		}
		return json({ results });
	} catch (e) {
		log.error("Gym search failed", e);
		return json({ results: [] });
	}
}
