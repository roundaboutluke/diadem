// Client-side fetch helpers for the Pokedex page's own SvelteKit
// endpoints (NOT Poracle directly — those calls are server-side only,
// behind pokedex.server.ts). Every helper throws PokedexApiError with
// the server's human-readable message on failure so components can
// surface it in a toast/banner.

import type {
	AnyRule,
	PoracleArea,
	PoracleHuman,
	PoracleProfile,
	PoracleWebConfig
} from "./alerts.shared";
import type { PokedexTrackingType } from "./alerts.shared";

export class PokedexApiError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.name = "PokedexApiError";
		this.status = status;
	}
}

const JSON_HEADERS = { "content-type": "application/json" };

async function req<T>(input: string, init?: RequestInit): Promise<T> {
	let res: Response;
	try {
		res = await fetch(input, init);
	} catch (err) {
		throw new PokedexApiError(0, err instanceof Error ? err.message : "Network error");
	}
	let data: unknown = null;
	try {
		data = await res.json();
	} catch {
		// Some 200s (or errors) may have no body — leave data null.
	}
	if (!res.ok) {
		const message =
			(data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string"
				? (data as { error: string }).error
				: null) ?? `Request failed (${res.status})`;
		throw new PokedexApiError(res.status, message);
	}
	return data as T;
}

export function fetchConfig() {
	return req<{ config: PoracleWebConfig; gruntTypes: string[] }>("/api/alerts/config");
}

/**
 * One-shot bootstrap bundle for the Alerts menu — the client-side
 * equivalent of the old page load (config, grunt types, available areas,
 * profiles, active human, and all tracking rules).
 */
export function fetchInit() {
	return req<{
		config: PoracleWebConfig | null;
		gruntTypes: string[];
		areas: PoracleArea[];
		profiles: PoracleProfile[];
		human: PoracleHuman | null;
		tracking: Record<string, unknown> | null;
	}>("/api/alerts/init");
}

/** Reachability probe for the hero indicator. Always resolves (200). */
export function fetchStatus() {
	return req<{ reachable: boolean; message?: string }>("/api/alerts/status");
}

/**
 * Per-profile bundle (human + profiles + all tracking) for the current
 * active profile. Used to refresh in place after a profile switch.
 */
export function fetchState() {
	return req<{
		human: PoracleHuman | null;
		profiles: PoracleProfile[];
		tracking: Record<string, unknown>;
	}>("/api/alerts/state");
}

/**
 * Resolves gym IDs (from raid/egg/gym rules) to gym names, permission-gated
 * server-side. Fails soft: returns `{}` on any error so the card just keeps
 * the raw ID.
 */
export async function fetchGymNames(ids: string[]): Promise<Record<string, string>> {
	if (ids.length === 0) return {};
	try {
		const data = await req<{ names: Record<string, string> }>("/api/alerts/gyms", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({ ids })
		});
		return data.names ?? {};
	} catch {
		return {};
	}
}

/**
 * Name search over gyms (permission-gated server-side) for the gym picker.
 * Fails soft: returns `[]` on any error. Requires ≥2 chars.
 */
export async function searchGyms(q: string): Promise<{ id: string; name: string }[]> {
	if (q.trim().length < 2) return [];
	try {
		const data = await req<{ results: { id: string; name: string }[] }>("/api/alerts/gym-search", {
			method: "POST",
			headers: JSON_HEADERS,
			body: JSON.stringify({ q: q.trim() })
		});
		return data.results ?? [];
	} catch {
		return [];
	}
}

/** Returns the fresh rule list for one type (server echoes `{ [type]: [...] }`). */
export async function fetchTracking(type: PokedexTrackingType): Promise<AnyRule[]> {
	const data = await req<Record<string, AnyRule[]>>(`/api/alerts/tracking/${type}`);
	return data[type] ?? [];
}

export function saveTracking(type: PokedexTrackingType, body: unknown) {
	return req<Record<string, unknown>>(`/api/alerts/tracking/${type}`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify(body)
	});
}

export function deleteRule(type: PokedexTrackingType, uid: number) {
	return req<{ status: string }>(`/api/alerts/tracking/${type}/${uid}`, { method: "DELETE" });
}

export function bulkDeleteRules(type: PokedexTrackingType, uids: number[]) {
	return req<{ status: string }>(`/api/alerts/tracking/${type}/delete`, {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify(uids)
	});
}

export function saveAreas(areas: string[]) {
	return req<{ status: string; setAreas: string[] }>("/api/alerts/areas", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify(areas)
	});
}

export function saveLocation(lat: number, lon: number) {
	return req<{ status: string }>("/api/alerts/location", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ lat, lon })
	});
}

// ── Profiles ──

export async function fetchProfiles(): Promise<PoracleProfile[]> {
	const data = await req<{ profile: PoracleProfile[] }>("/api/alerts/profiles");
	return data.profile ?? [];
}

export function addProfile(name: string, activeHours?: string) {
	return req<{ status: string }>("/api/alerts/profiles", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ name, active_hours: activeHours })
	});
}

export function switchProfile(profileNo: number) {
	return req<{ status: string }>("/api/alerts/profiles/switch", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ profile_no: profileNo })
	});
}

export function copyProfile(from: number, to: number) {
	return req<{ status: string }>("/api/alerts/profiles/copy", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify({ from, to })
	});
}

export function updateProfileHours(profileNo: number, activeHours: string) {
	return req<{ status: string }>("/api/alerts/profiles/update", {
		method: "POST",
		headers: JSON_HEADERS,
		body: JSON.stringify([{ profile_no: profileNo, active_hours: activeHours }])
	});
}

export function deleteProfile(profileNo: number) {
	return req<{ status: string }>(`/api/alerts/profiles/${profileNo}`, { method: "DELETE" });
}
