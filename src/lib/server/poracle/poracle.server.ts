import { env } from "$env/dynamic/private";
import type {
	PoracleArea,
	PoracleGrunt,
	PoracleHuman,
	PoracleProfile,
	PoracleWebConfig,
	PokedexToolLink,
	PokedexTrackingType
} from "@/lib/services/alerts/alerts.shared";

// ─── Poracle (PoracleNG) API connection ─────────────────────────────
// The Pokedex page is a server-side proxy in front of the PoracleNG
// processor's REST API (default port 3030). It authenticates with the
// `X-Poracle-Secret` header and keys every request by the logged-in
// Diadem user's Discord ID (locals.user.discordId). Env vars override
// the defaults below. See ~/PoracleAlts/PoracleNG-main/API.md.
const DEFAULT_API_URL = "http://127.0.0.1:3030";
const SECRET_HEADER = "X-Poracle-Secret";
// ────────────────────────────────────────────────────────────────────

// ─── Tools menu defaults (mirrors vivillon.server.ts) ───────────────
// Cross-tool quick-switch menu rendered in the hero card. Operators
// override the whole list via PORACLE_TOOL_LINKS_JSON. Icons resolve
// against ToolsMenu's static allow-list; unknown names render
// label-only.
const DEFAULT_TOOL_LINKS: PokedexToolLink[] = [
	{ label: "Map", href: "/map", icon: "Map" },
	{ label: "Leaderboard", href: "/leaderboard", icon: "Trophy" },
	{ label: "Vivillon", href: "/vivillon", icon: "Gift" },
	{ label: "Hoopa", href: "/hoopa", icon: "Aperture" },
	{ label: "Pokedex", href: "/pokedex", icon: "BookOpen" },
	{ label: "Logout", href: "/logout", icon: "LogOut" }
];
// ────────────────────────────────────────────────────────────────────

export class PoracleRequestError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.name = "PoracleRequestError";
		this.status = status;
	}
}

function getBaseUrl() {
	const raw = (env.PORACLE_API_BASE_URL ?? DEFAULT_API_URL).trim();
	const withProtocol = /^[a-z]+:\/\//i.test(raw) ? raw : `http://${raw}`;
	return withProtocol.replace(/\/+$/, "");
}

function getSecret() {
	return (env.PORACLE_API_SECRET ?? "").trim();
}

async function extractErrorMessage(response: Response) {
	const body = await response.text();
	if (!body) return `Poracle request failed with ${response.status}`;
	try {
		const payload = JSON.parse(body) as { message?: unknown; reason?: unknown; error?: unknown };
		for (const key of ["message", "reason", "error"] as const) {
			const value = payload[key];
			if (typeof value === "string" && value.length > 0) return value;
		}
	} catch {
		// Plain-text upstream error — fall through to the raw body.
	}
	return body;
}

/**
 * Single JSON round-trip to the Poracle processor. Adds the secret
 * header, forces no-store, and normalises Poracle's two failure
 * shapes into a thrown PoracleRequestError:
 *   - transport / non-2xx HTTP  → status from the response
 *   - HTTP 200 but body.status is "error" / "authError" → mapped to
 *     400 / 403 respectively (Poracle answers 200 for these)
 */
async function poracleJson<T>(path: string, init: RequestInit = {}): Promise<T> {
	const headers = new Headers(init.headers);
	headers.set("accept", "application/json");
	const secret = getSecret();
	if (secret) headers.set(SECRET_HEADER, secret);
	if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

	const url = `${getBaseUrl()}${path}`;
	let response: Response;
	try {
		response = await fetch(url, { ...init, headers, cache: "no-store" });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown network error";
		throw new PoracleRequestError(502, `Unable to reach Poracle at ${url}: ${message}`);
	}

	if (!response.ok) {
		throw new PoracleRequestError(response.status, await extractErrorMessage(response));
	}

	const data = (await response.json()) as T & { status?: string; message?: string; reason?: string };
	if (data && typeof data.status === "string" && data.status !== "ok") {
		if (data.status === "authError") {
			throw new PoracleRequestError(403, data.reason ?? "Poracle rejected the API secret");
		}
		throw new PoracleRequestError(400, data.message ?? data.reason ?? "Poracle returned an error");
	}
	return data;
}

export function getPoracleError(error: unknown) {
	if (error instanceof PoracleRequestError) {
		return { status: error.status, message: error.message };
	}
	console.error("[pokedex] unexpected proxy error", error);
	return { status: 500, message: "Unexpected Poracle error" };
}

// ─── Rate limiting (proxy layer, cloned from vivillon.server.ts) ────

type RateLimitBucket = { max: number; windowMs: number; history: Map<string, number[]> };
const rateLimitBuckets: RateLimitBucket[] = [];
let janitorStarted = false;

function startRateLimitJanitor() {
	if (janitorStarted) return;
	janitorStarted = true;
	const handle = setInterval(() => {
		const now = Date.now();
		for (const bucket of rateLimitBuckets) {
			const cutoff = now - bucket.windowMs;
			for (const [key, raw] of bucket.history) {
				const fresh = raw.filter((t) => t > cutoff);
				if (fresh.length === 0) bucket.history.delete(key);
				else bucket.history.set(key, fresh);
			}
		}
	}, 60 * 60_000);
	handle.unref?.();
}

export function createRateLimitBucket(max: number, windowMs: number) {
	const bucket: RateLimitBucket = { max, windowMs, history: new Map() };
	rateLimitBuckets.push(bucket);
	startRateLimitJanitor();
	return {
		check(key: string): boolean {
			const now = Date.now();
			const cutoff = now - windowMs;
			const timestamps = (bucket.history.get(key) ?? []).filter((t) => t > cutoff);
			if (timestamps.length >= max) {
				bucket.history.set(key, timestamps);
				return false;
			}
			timestamps.push(now);
			bucket.history.set(key, timestamps);
			return true;
		}
	};
}

// ─── Tool links (cloned from vivillon.server.ts getToolLinks) ───────

export function getToolLinks(): PokedexToolLink[] {
	const raw = env.PORACLE_TOOL_LINKS_JSON?.trim();
	if (!raw) return DEFAULT_TOOL_LINKS;
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (err) {
		console.warn(
			"[pokedex] PORACLE_TOOL_LINKS_JSON is not valid JSON — falling back to defaults:",
			err instanceof Error ? err.message : String(err)
		);
		return DEFAULT_TOOL_LINKS;
	}
	if (!Array.isArray(parsed)) {
		console.warn("[pokedex] PORACLE_TOOL_LINKS_JSON must be a JSON array — falling back to defaults");
		return DEFAULT_TOOL_LINKS;
	}
	const byHref = new Map<string, PokedexToolLink>();
	for (let i = 0; i < parsed.length; i++) {
		const entry = parsed[i];
		if (
			entry &&
			typeof entry === "object" &&
			typeof (entry as { label?: unknown }).label === "string" &&
			typeof (entry as { href?: unknown }).href === "string"
		) {
			const e = entry as { label: string; href: string; icon?: unknown };
			byHref.set(e.href, {
				label: e.label,
				href: e.href,
				icon: typeof e.icon === "string" ? e.icon : undefined
			});
		} else {
			console.warn(`[pokedex] PORACLE_TOOL_LINKS_JSON entry ${i} missing label/href — skipping`);
		}
	}
	const validated = Array.from(byHref.values());
	return validated.length > 0 ? validated : DEFAULT_TOOL_LINKS;
}

// ─── Human bootstrap ────────────────────────────────────────────────
// Poracle needs a "human" row before tracking works. On a user's first
// visit we create one from their Diadem session. A process-local Set
// (mirrors linkcable's migrationRan flag) skips the redundant GET on
// every subsequent request for a user we've already ensured this run.

const knownHumans = new Set<string>();

export async function ensureHuman(discordId: string, name: string): Promise<void> {
	if (knownHumans.has(discordId)) return;

	try {
		const res = await poracleJson<{ status: string; human?: PoracleHuman }>(
			`/api/humans/one/${encodeURIComponent(discordId)}`
		);
		if (res.human) {
			knownHumans.add(discordId);
			return;
		}
	} catch (err) {
		// 4xx (e.g. not found) → fall through to create. 5xx / network
		// is a real outage; surface it.
		if (!(err instanceof PoracleRequestError) || err.status >= 500) throw err;
	}

	try {
		await poracleJson(`/api/humans`, {
			method: "POST",
			body: JSON.stringify({ id: discordId, name, type: "discord:user" })
		});
	} catch (err) {
		// A concurrent first-visit race can make the create fail because
		// the row now exists — that's success for our purposes. Only a
		// 5xx / network error is fatal.
		if (err instanceof PoracleRequestError && err.status < 500) {
			knownHumans.add(discordId);
			return;
		}
		throw err;
	}
	knownHumans.add(discordId);
}

// ─── Typed endpoint wrappers ────────────────────────────────────────

const enc = encodeURIComponent;

export function getPoracleWebConfig() {
	return poracleJson<PoracleWebConfig>("/api/config/poracleWeb");
}

// The grunts masterdata is a raw object map keyed by grunt id — each
// value is a { type, gender, grunt, … } record. There is no { status }
// wrapper, so poracleJson passes it straight through.
export function getGrunts() {
	return poracleJson<Record<string, PoracleGrunt>>("/api/masterdata/grunts");
}

export function getAreas(id: string) {
	return poracleJson<{ status: string; areas: PoracleArea[] }>(`/api/humans/${enc(id)}`);
}

export function setAreas(id: string, areas: string[]) {
	return poracleJson<{ status: string; setAreas: string[] }>(`/api/humans/${enc(id)}/setAreas`, {
		method: "POST",
		body: JSON.stringify(areas)
	});
}

export function setLocation(id: string, lat: number, lon: number) {
	return poracleJson<{ status: string }>(`/api/humans/${enc(id)}/setLocation/${lat}/${lon}`, {
		method: "POST"
	});
}

export function switchProfile(id: string, profileNo: number) {
	return poracleJson<{ status: string }>(`/api/humans/${enc(id)}/switchProfile/${profileNo}`, {
		method: "POST"
	});
}

export function getHuman(id: string) {
	return poracleJson<{ status: string; human: PoracleHuman }>(`/api/humans/one/${enc(id)}`);
}

export function getProfiles(id: string) {
	return poracleJson<{ status: string; profile: PoracleProfile[] }>(`/api/profiles/${enc(id)}`);
}

export function addProfile(id: string, body: unknown) {
	return poracleJson<{ status: string }>(`/api/profiles/${enc(id)}/add`, {
		method: "POST",
		body: JSON.stringify(body)
	});
}

export function updateProfiles(id: string, body: unknown) {
	return poracleJson<{ status: string }>(`/api/profiles/${enc(id)}/update`, {
		method: "POST",
		body: JSON.stringify(body)
	});
}

export function copyProfile(id: string, from: number, to: number) {
	return poracleJson<{ status: string }>(`/api/profiles/${enc(id)}/copy/${from}/${to}`, {
		method: "POST"
	});
}

export function deleteProfile(id: string, profileNo: number) {
	return poracleJson<{ status: string }>(`/api/profiles/${enc(id)}/byProfileNo/${profileNo}`, {
		method: "DELETE"
	});
}

export function getAllTracking(id: string) {
	return poracleJson<Record<string, unknown>>(`/api/tracking/all/${enc(id)}`);
}

/** GET the raw tracking response for one type; caller reads `[type]`. */
export function getTracking(type: PokedexTrackingType, id: string) {
	return poracleJson<Record<string, unknown>>(`/api/tracking/${type}/${enc(id)}`);
}

type MutateOpts = { profileNo?: number; silent?: boolean };

function mutateQuery(opts?: MutateOpts) {
	const params = new URLSearchParams();
	if (opts?.profileNo !== undefined) params.set("profile_no", String(opts.profileNo));
	if (opts?.silent) params.set("silent", "true");
	const qs = params.toString();
	return qs ? `?${qs}` : "";
}

export function postTracking(
	type: PokedexTrackingType,
	id: string,
	body: unknown,
	opts?: MutateOpts
) {
	return poracleJson<Record<string, unknown>>(
		`/api/tracking/${type}/${enc(id)}${mutateQuery(opts)}`,
		{ method: "POST", body: JSON.stringify(body) }
	);
}

export function deleteTrackingByUid(type: PokedexTrackingType, id: string, uid: number) {
	return poracleJson<{ status: string }>(`/api/tracking/${type}/${enc(id)}/byUid/${uid}`, {
		method: "DELETE"
	});
}

export function bulkDeleteTracking(type: PokedexTrackingType, id: string, uids: number[]) {
	return poracleJson<{ status: string }>(`/api/tracking/${type}/${enc(id)}/delete`, {
		method: "POST",
		body: JSON.stringify(uids)
	});
}
