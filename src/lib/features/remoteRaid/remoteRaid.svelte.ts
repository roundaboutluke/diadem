// Map-driven remote-raid flow. Lets a user trigger Hoopa directly from a
// gym/station popup with a single call to the deployed (custom)/hoopa proxy's
// /raid endpoint, which claims the bot, scans the fort's coords, matches the
// fort server-side, joins the lobby, and auto-invites the owner.
//
// Core stays decoupled from the gitignored hoopa page: this module only speaks
// the proxy's HTTP contract (no imports from (custom)/hoopa). The session token
// is mirrored into the same sessionStorage keys the controller page reads so an
// "Open controller" handoff resumes ownership.

const HOOPA_BASE = "/hoopa";

// Shared with the hoopa controller page (hoopa.api.ts) for the handoff.
const TOKEN_STORAGE_KEY = "hoopa.session.token";
const TOKEN_ACQUIRED_AT_STORAGE_KEY = "hoopa.session.acquired_at";

export type RemoteRaidKind = "raid" | "bread" | "rsvp";

type RaidResponse = {
	token: string;
	acquired_at: string;
	raid_battle_start_ms?: number;
	player_join_end_ms?: number;
	rsvp_timeslot_ms?: number;
	owner_daily_cap_reached?: boolean;
};

type StatusResponse = {
	session?: { state?: string; lobby_player_count?: number; invited_count?: number } | null;
	joinable_lobby?: { lobby_player_count?: number; invited_count?: number } | null;
};

export type RemoteRaidPhase =
	| "idle"
	| "working"
	| "in_lobby"
	| "busy"
	| "no_link"
	| "not_found"
	| "error";

// ─── Availability probe (auto-detect) ───────────────────────────────
// Hoopa isn't part of core Diadem; the button only appears when the proxy
// route answers. A 404 means the (custom)/hoopa page isn't installed; anything
// else (incl. 401 when logged out) means it's there. Probed once per session.

let availability = $state<"unknown" | "available" | "unavailable">("unknown");
let probeStarted = false;

export function ensureRemoteRaidProbe() {
	if (probeStarted) return;
	probeStarted = true;
	void fetch(`${HOOPA_BASE}/status`, { headers: { accept: "application/json" } })
		.then((res) => {
			availability = res.status === 404 ? "unavailable" : "available";
		})
		.catch(() => {
			availability = "unavailable";
		});
}

export function remoteRaidAvailable(): boolean {
	return availability === "available";
}

async function readJson<T>(res: Response): Promise<T> {
	return (await res.json()) as T;
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
	try {
		const body = (await res.json()) as { error?: string };
		return body?.error || fallback;
	} catch {
		return fallback;
	}
}

// ─── Per-button flow ────────────────────────────────────────────────

export type RemoteRaidTarget = {
	kind: RemoteRaidKind;
	fortId: string;
	lat: number;
	lon: number;
};

export class RemoteRaidFlow {
	phase = $state<RemoteRaidPhase>("idle");
	/** Human-readable detail for error/busy phases. */
	detail = $state<string>("");
	/** Absolute ms timestamps from the join, for live countdowns. */
	battleStartMs = $state<number | undefined>(undefined);
	autoLeaveMs = $state<number | undefined>(undefined);
	/** Invite outcome flags for the in_lobby summary. */
	invited = $state(false);
	dailyCapReached = $state(false);
	/** True while a release/cancel request is in flight. */
	releasing = $state(false);
	/** Live lobby occupancy + invited count, polled from /status while in_lobby. */
	lobbyPlayerCount = $state<number | undefined>(undefined);
	invitedCount = $state<number | undefined>(undefined);
	/** Session token from the join — used to release/cancel from the map. */
	private token: string | undefined = undefined;

	get busy(): boolean {
		return this.phase === "working";
	}

	reset() {
		this.phase = "idle";
		this.detail = "";
		this.battleStartMs = undefined;
		this.autoLeaveMs = undefined;
		this.invited = false;
		this.dailyCapReached = false;
		this.releasing = false;
		this.lobbyPlayerCount = undefined;
		this.invitedCount = undefined;
		this.token = undefined;
	}

	/** Poll live lobby occupancy from /status while in_lobby (driven by the
	 * status component's effect). Best-effort: transient errors are ignored. */
	async refreshLobby() {
		if (this.phase !== "in_lobby") return;
		try {
			const res = await fetch(`${HOOPA_BASE}/status`, { headers: { accept: "application/json" } });
			if (!res.ok) return;
			const data = (await res.json()) as StatusResponse;
			const lobby = data.session ?? data.joinable_lobby ?? undefined;
			this.lobbyPlayerCount = lobby?.lobby_player_count;
			this.invitedCount = lobby?.invited_count;
		} catch {
			/* ignore transient poll errors */
		}
	}

	async run(target: RemoteRaidTarget) {
		if (this.phase === "working") return;
		this.reset();
		this.phase = "working";

		try {
			// 1) Resolve the user's linked friend code (LinkCable).
			const linkRes = await fetch(`${HOOPA_BASE}/linkcable`, {
				headers: { accept: "application/json" }
			});
			if (!linkRes.ok) {
				this.phase = "error";
				this.detail = await errorMessage(linkRes, "Couldn't reach Hoopa");
				return;
			}
			const link = (await linkRes.json()) as { friend_code?: string } | null;
			const friendCode = link?.friend_code;
			if (!friendCode) {
				this.phase = "no_link";
				return;
			}

			// 2) One-shot: claim + scan + match this fort + join + auto-invite,
			// all server-side. Gym joins stay public (private: false); the
			// backend ignores the flag for bread.
			const res = await fetch(`${HOOPA_BASE}/raid`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					friend_code: friendCode,
					fort_id: target.fortId,
					lat: target.lat,
					lon: target.lon,
					target_kind: target.kind,
					private: false
				})
			});
			if (res.status === 409) {
				this.phase = "busy";
				this.detail = await errorMessage(res, "The bot is busy with another raid");
				return;
			}
			if (res.status === 404) {
				this.phase = "not_found";
				return;
			}
			if (!res.ok) {
				this.phase = "error";
				this.detail = await errorMessage(res, "Remote raid failed");
				return;
			}

			const raid = await readJson<RaidResponse>(res);
			this.token = raid.token;
			persistToken(raid.token, raid.acquired_at);
			// For an RSVP (unhatched egg) there's no live lobby — the slot ms is
			// when the egg hatches and the lobby opens, so use it for the countdown.
			this.battleStartMs = raid.raid_battle_start_ms ?? raid.rsvp_timeslot_ms;
			this.autoLeaveMs = raid.player_join_end_ms;
			// /raid auto-invites the session owner (us); owner_daily_cap_reached
			// tells us whether that invite hit POGO's daily remote-raid limit.
			this.dailyCapReached = raid.owner_daily_cap_reached ?? false;
			this.invited = !this.dailyCapReached;
			this.phase = "in_lobby";
		} catch (error) {
			this.phase = "error";
			this.detail = error instanceof Error ? error.message : "Remote raid failed";
		}
	}

	/** Release/cancel the active session from the map (POST /hoopa/release). */
	async release() {
		if (this.phase !== "in_lobby" || !this.token || this.releasing) return;
		this.releasing = true;
		this.detail = "";
		try {
			const res = await fetch(`${HOOPA_BASE}/release`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ token: this.token })
			});
			if (res.ok) {
				clearToken();
				this.reset();
			} else {
				this.detail = await errorMessage(res, "Couldn't cancel the session");
			}
		} catch (error) {
			this.detail = error instanceof Error ? error.message : "Couldn't cancel the session";
		} finally {
			this.releasing = false;
		}
	}
}

function persistToken(token: string, acquiredAt: string) {
	try {
		window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
		window.sessionStorage.setItem(TOKEN_ACQUIRED_AT_STORAGE_KEY, acquiredAt);
	} catch {
		/* sessionStorage disabled — handoff just won't resume ownership */
	}
}

function clearToken() {
	try {
		window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
		window.sessionStorage.removeItem(TOKEN_ACQUIRED_AT_STORAGE_KEY);
	} catch {
		/* ignore */
	}
}
