import { json } from "@sveltejs/kit";
import { checkIfAuthed } from "@/lib/server/auth/checkIfAuthed";
import {
	createRateLimitBucket,
	ensureHuman,
	getPoracleError,
	getTracking,
	postTracking
} from "@/lib/server/poracle/poracle.server";
import { isPokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

// Generic tracking CRUD proxy for one type. The [type] segment is
// already constrained to the valid tracking types by the
// `pokedexTrackingType` param matcher; the runtime guard below just
// narrows it for TypeScript. The Discord ID is taken only from the
// server session — never from the request.
const readLimiter = createRateLimitBucket(120, 5 * 60_000);
const writeLimiter = createRateLimitBucket(60, 5 * 60_000);

function profileNoFrom(url: URL): number | undefined {
	const raw = url.searchParams.get("profile_no");
	if (raw === null) return undefined;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

// Poracle's Go request structs type every flag (clean, exclusive, gmax,
// shiny, slot_changes, …) as a JSON *number*, so a raw boolean makes its
// decoder reject the whole body ("decode JSON body"). Coerce booleans to
// 0/1 before forwarding.
function coerceRuleBooleans(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(coerceRuleBooleans);
	if (value && typeof value === "object") {
		const out: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value)) {
			out[k] = typeof v === "boolean" ? (v ? 1 : 0) : coerceRuleBooleans(v);
		}
		return out;
	}
	return value;
}

export async function GET({ params, locals }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const type = params.type;
	if (!isPokedexTrackingType(type)) {
		return json({ error: "Unknown tracking type" }, { status: 400 });
	}
	const discordId = locals.user.discordId;
	if (!readLimiter.check(discordId)) {
		return json({ error: "Too many requests. Try again shortly." }, { status: 429 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");
		const res = await getTracking(type, discordId);
		return json(
			{ [type]: (res[type] as unknown[]) ?? [] },
			{ headers: { "cache-control": "no-store" } }
		);
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}

export async function POST({ params, request, locals, url }) {
	if (!checkIfAuthed(locals.user) || !locals.user?.discordId) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	const type = params.type;
	if (!isPokedexTrackingType(type)) {
		return json({ error: "Unknown tracking type" }, { status: 400 });
	}
	const discordId = locals.user.discordId;
	if (!writeLimiter.check(discordId)) {
		return json({ error: "Too many changes. Try again shortly." }, { status: 429 });
	}

	let payload: unknown;
	try {
		payload = await request.json();
	} catch {
		return json({ error: "Invalid JSON body" }, { status: 400 });
	}
	if (payload === null || (typeof payload !== "object" && !Array.isArray(payload))) {
		return json({ error: "Body must be a tracking rule object or array" }, { status: 400 });
	}

	try {
		await ensureHuman(discordId, locals.user.name ?? "Diadem User");
		// Not silent — the user relies on Poracle's confirmation DM (same as
		// delete) as feedback that the rule landed.
		const result = await postTracking(type, discordId, coerceRuleBooleans(payload), {
			profileNo: profileNoFrom(url)
		});
		return json(result, { headers: { "cache-control": "no-store" } });
	} catch (error) {
		const failure = getPoracleError(error);
		return json({ error: failure.message }, { status: failure.status });
	}
}
