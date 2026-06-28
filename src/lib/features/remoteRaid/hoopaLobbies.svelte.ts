// Shared poller for the pool's active Hoopa lobbies. Polls the proxy /status
// (which returns lobbies[] across the worker pool) and exposes them reactively
// so the map can flag forts with a live raid and the popup can offer to join an
// in-progress lobby. Ref-counted: the timer runs only while something (the map
// layer or an open popup) is subscribed.

import { HOOPA_BASE, remoteRaidAvailable } from "./remoteRaid.svelte";

export type HoopaActiveLobby = {
	fortId: string;
	lat: number;
	lon: number;
	kind: "raid" | "bread" | "rsvp";
	lobbyPlayerCount: number;
	battleStartMs?: number;
	pokemonId?: number;
	/** People Hoopa has pulled into this raid — updates as users join. */
	invitedCount: number;
	/** True when the viewer is already invited to / hosting this lobby. */
	alreadyInvited: boolean;
};

type LobbyFort = {
	fort_id?: string;
	station_id?: string;
	lat?: number;
	lon?: number;
	pokemon_id?: number;
};
type LobbyView = {
	kind?: string;
	raid?: LobbyFort;
	bread?: LobbyFort;
	lobby_player_count?: number;
	invited_count?: number;
	battle_start_ms?: number;
	already_invited?: boolean;
};

const POLL_INTERVAL_MS = 12_000;

let lobbies = $state<HoopaActiveLobby[]>([]);
let timer: ReturnType<typeof setInterval> | null = null;
let subscribers = 0;

// The viewer's linked friend code, fetched once so /status can flag which
// lobbies they're already in (already_invited) — stops us offering "Join" on a
// lobby they host or have already joined.
let friendCode: string | undefined;
let friendCodeFetched = false;

async function ensureFriendCode() {
	if (friendCodeFetched) return;
	friendCodeFetched = true;
	try {
		const res = await fetch(`${HOOPA_BASE}/linkcable`, { headers: { accept: "application/json" } });
		if (!res.ok) return;
		const link = (await res.json()) as { friend_code?: string } | null;
		friendCode = link?.friend_code;
	} catch {
		/* not linked / unavailable — already_invited just stays false */
	}
}

async function poll() {
	if (!remoteRaidAvailable()) {
		if (lobbies.length) lobbies = [];
		return;
	}
	await ensureFriendCode();
	try {
		const url = friendCode
			? `${HOOPA_BASE}/status?friend_code=${encodeURIComponent(friendCode)}`
			: `${HOOPA_BASE}/status`;
		const res = await fetch(url, { headers: { accept: "application/json" } });
		if (!res.ok) return;
		const data = (await res.json()) as { lobbies?: LobbyView[] };
		lobbies = (data.lobbies ?? [])
			.map((l): HoopaActiveLobby | null => {
				const fort = l.raid ?? l.bread;
				const fortId = l.raid?.fort_id ?? l.bread?.station_id;
				if (!fort || !fortId || fort.lat === undefined || fort.lon === undefined) return null;
				return {
					fortId,
					lat: fort.lat,
					lon: fort.lon,
					kind: (l.kind as HoopaActiveLobby["kind"]) ?? "raid",
					lobbyPlayerCount: l.lobby_player_count ?? 0,
					invitedCount: l.invited_count ?? 0,
					battleStartMs: l.battle_start_ms,
					pokemonId: fort.pokemon_id,
					alreadyInvited: l.already_invited ?? false
				};
			})
			.filter((l): l is HoopaActiveLobby => l !== null);
	} catch {
		/* ignore transient poll errors */
	}
}

/** Start the shared poller (ref-counted). Returns a cleanup to call on unmount;
 * the timer stops once the last subscriber leaves. */
export function ensureHoopaLobbyPolling(): () => void {
	subscribers++;
	if (!timer) {
		void poll();
		timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
	}
	return () => {
		subscribers = Math.max(0, subscribers - 1);
		if (subscribers === 0 && timer) {
			clearInterval(timer);
			timer = null;
			lobbies = [];
		}
	};
}

export function getActiveHoopaLobbies(): HoopaActiveLobby[] {
	return lobbies;
}

export function getActiveHoopaLobby(fortId: string): HoopaActiveLobby | undefined {
	return lobbies.find((l) => l.fortId === fortId);
}
