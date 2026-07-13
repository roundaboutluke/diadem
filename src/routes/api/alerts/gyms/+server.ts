import { json } from "@sveltejs/kit";
import { checkIfAuthed, hasAnyFeatureAnywhereServer } from "@/lib/server/auth/checkIfAuthed";
import { query } from "@/lib/server/db/external/internalQuery";
import { isPointInAllowedArea } from "@/lib/services/user/checkPerm";
import { Features } from "@/lib/utils/features";
import { getLogger } from "@/lib/utils/logger";

const log = getLogger("pokedex-gyms");

// Resolves the gym IDs carried by raid/egg/gym tracking rules to gym names
// so the alert cards can show *which* gym an alert is on (Poracle only
// stores the gym ID, never the name). Names are gated per-gym by the same
// GYM permission the map uses: a gym's name is only returned when the user
// is allowed to see gyms at that gym's location. Fails soft — on any issue
// it returns no names and the card keeps showing the raw ID.
const MAX_IDS = 250;

export async function POST({ request, locals }) {
	if (!checkIfAuthed(locals.user)) {
		return json({ names: {} }, { status: 401 });
	}
	// No GYM grant anywhere → nothing this user may see; skip the DB entirely.
	if (!hasAnyFeatureAnywhereServer(locals.perms, [Features.GYM], locals.user)) {
		return json({ names: {} });
	}

	let raw: unknown;
	try {
		raw = (await request.json())?.ids;
	} catch {
		return json({ names: {} }, { status: 400 });
	}
	const ids = Array.isArray(raw)
		? [...new Set(raw.filter((v): v is string => typeof v === "string" && v.length > 0))].slice(
				0,
				MAX_IDS
			)
		: [];
	if (ids.length === 0) return json({ names: {} });

	try {
		const placeholders = ids.map(() => "?").join(", ");
		const rows = await query<{ id: string; name: string; lat: number; lon: number }[]>(
			`SELECT id, name, lat, lon FROM gym WHERE id IN (${placeholders}) AND name IS NOT NULL AND deleted = 0`,
			ids
		);

		const names: Record<string, string> = {};
		for (const row of rows) {
			// Per-gym permission: only expose a name the user is allowed to see.
			if (isPointInAllowedArea(locals.perms, Features.GYM, row.lat, row.lon)) {
				names[row.id] = row.name;
			}
		}
		return json({ names });
	} catch (e) {
		log.error("Failed resolving gym names", e);
		return json({ names: {} });
	}
}
