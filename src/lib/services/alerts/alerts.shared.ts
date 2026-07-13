// Shared (client + server) types and constants for the Pokedex tool —
// Diadem's native Poracle alert configuration page. Types mirror the
// PoracleNG REST API (see ~/PoracleAlts/PoracleNG-main/API.md) and the
// tracking-row shapes returned by GET /api/tracking/{type}/{id}.
//
// This module is import-safe from both client and server: it contains
// no secrets and no server-only imports. The server proxy lives in
// pokedex.server.ts; the DB-facing secret never reaches here.

// ─── Tracking types ─────────────────────────────────────────────────

export const pokedexTrackingTypes = [
	"pokemon",
	"raid",
	"egg",
	"quest",
	"invasion",
	"lure",
	"gym",
	"nest",
	"maxbattle",
	"fort"
] as const;

export type PokedexTrackingType = (typeof pokedexTrackingTypes)[number];

export function isPokedexTrackingType(value: string): value is PokedexTrackingType {
	return (pokedexTrackingTypes as readonly string[]).includes(value);
}

/**
 * Per-type display metadata for the tab bar. `icon` names a
 * @lucide/svelte icon resolved via a static allow-list in the tab
 * component (unknown names render label-only). `hook` is the
 * PoracleWeb config `disabledHooks` token — a type whose hook appears
 * in that list is hidden because the backend won't emit it.
 */
export const pokedexTypeMeta: Record<
	PokedexTrackingType,
	{ label: string; icon: string; hook: string; blurb: string }
> = {
	pokemon: { label: "Pokémon", icon: "Sparkles", hook: "pokemon", blurb: "Wild spawns by IV, CP, level, PVP rank and more." },
	raid: { label: "Raids", icon: "Swords", hook: "raid", blurb: "Raid bosses by level or specific Pokémon." },
	egg: { label: "Eggs", icon: "Egg", hook: "raid", blurb: "Raid eggs by level and gym team." },
	quest: { label: "Quests", icon: "ScrollText", hook: "quest", blurb: "Field research rewards." },
	invasion: { label: "Invasions", icon: "Skull", hook: "invasion", blurb: "Team GO Rocket grunts by type and gender." },
	lure: { label: "Lures", icon: "Flower2", hook: "lure", blurb: "Lured Pokéstops by lure type." },
	gym: { label: "Gyms", icon: "Castle", hook: "gym", blurb: "Gym control and battle changes by team." },
	nest: { label: "Nests", icon: "TreePine", hook: "nest", blurb: "Pokémon nests by spawn rate." },
	maxbattle: { label: "Max Battles", icon: "Zap", hook: "maxbattle", blurb: "Dynamax / Gigantamax power spots." },
	fort: { label: "Fort Updates", icon: "MapPin", hook: "pokestop", blurb: "Pokéstop / gym additions, edits and removals." }
};

// ─── Tracking rule shapes ───────────────────────────────────────────
// GET /api/tracking/{type}/{id} returns rows keyed by `uid` with a
// human-readable `description`. Field names are the snake_case DB
// columns (see processor/internal/db/*.go). All rules share the base;
// each type extends it. Fields are optional on read where the backend
// may omit them; forms fill defaults from the *Defaults objects below.

export interface BaseRule {
	uid: number;
	profile_no?: number;
	distance?: number;
	template?: string;
	clean?: boolean;
	ping?: string;
	description?: string;
}

export interface PokemonRule extends BaseRule {
	pokemon_id: number;
	form: number;
	min_iv: number;
	max_iv: number;
	min_cp: number;
	max_cp: number;
	min_level: number;
	max_level: number;
	atk: number;
	def: number;
	sta: number;
	max_atk: number;
	max_def: number;
	max_sta: number;
	gender: number;
	size: number;
	max_size: number;
	rarity: number;
	max_rarity: number;
	pvp_ranking_league: number;
	pvp_ranking_best: number;
	pvp_ranking_worst: number;
	pvp_ranking_min_cp: number;
	pvp_ranking_cap: number;
}

export interface RaidRule extends BaseRule {
	pokemon_id: number;
	form: number;
	level: number;
	team: number;
	exclusive: boolean;
	move: number;
	evolution: number;
	gym_id: string | null;
	rsvp_changes: number;
}

export interface EggRule extends BaseRule {
	level: number;
	team: number;
	exclusive: boolean;
	gym_id: string | null;
	rsvp_changes: number;
}

export interface QuestRule extends BaseRule {
	reward_type: number;
	reward: number;
	form: number;
	shiny: boolean;
	amount: number;
}

export interface InvasionRule extends BaseRule {
	grunt_type: string;
	gender: number;
}

export interface LureRule extends BaseRule {
	lure_id: number;
}

export interface GymRule extends BaseRule {
	team: number;
	slot_changes: boolean;
	battle_changes: boolean;
	gym_id: string | null;
}

export interface NestRule extends BaseRule {
	pokemon_id: number;
	form: number;
	min_spawn_avg: number;
}

export interface MaxBattleRule extends BaseRule {
	pokemon_id: number;
	level: number;
	form: number;
	move: number;
	gmax: number;
	evolution: number;
	station_id: string | null;
}

export interface FortRule extends BaseRule {
	fort_type: string;
	include_empty: boolean;
	change_types: string[];
}

export type AnyRule =
	| PokemonRule
	| RaidRule
	| EggRule
	| QuestRule
	| InvasionRule
	| LureRule
	| GymRule
	| NestRule
	| MaxBattleRule
	| FortRule;

// ─── Form defaults (transcribed from API.md "Type-Specific POST Fields") ───
// A new-rule form seeds from these; the backend applies the same
// defaults for any omitted field, so keeping them in sync avoids a
// create-then-immediately-diff churn on first save.

export const pokemonRuleDefaults: Omit<PokemonRule, "uid" | "description"> = {
	pokemon_id: 0,
	form: 0,
	min_iv: -1,
	max_iv: 100,
	min_cp: 0,
	max_cp: 9000,
	min_level: 0,
	max_level: 40,
	atk: 0,
	def: 0,
	sta: 0,
	max_atk: 15,
	max_def: 15,
	max_sta: 15,
	gender: 0,
	size: 0,
	max_size: 5,
	rarity: -1,
	max_rarity: 6,
	pvp_ranking_league: 0,
	pvp_ranking_best: 1,
	pvp_ranking_worst: 100,
	pvp_ranking_min_cp: 0,
	pvp_ranking_cap: 0,
	distance: 0,
	template: "",
	clean: false
};

// ─── Enumerations for pickers ───────────────────────────────────────

export const genderOptions = [
	{ value: 0, label: "Any" },
	{ value: 1, label: "Male" },
	{ value: 2, label: "Female" }
] as const;

/** Gym team filter. 4 = any (Poracle convention). */
export const teamOptions = [
	{ value: 4, label: "Any" },
	{ value: 0, label: "Uncontested" },
	{ value: 1, label: "Mystic" },
	{ value: 2, label: "Valor" },
	{ value: 3, label: "Instinct" }
] as const;

// Special PokéStop incidents (display_type 7/8/9) that Poracle tracks through
// the invasion hook alongside Team GO Rocket grunts. They aren't in the grunt
// masterdata, so they must be listed explicitly. The value is the lowercased
// pokestopEvent name — exactly what Poracle's `!invasion` command stores (e.g.
// `!invasion kecleon`), matched case-insensitively.
export const invasionEvents = [
	{ value: "gold-stop", label: "Gold-Stop" },
	{ value: "kecleon", label: "Kecleon" },
	{ value: "showcase", label: "Showcase" }
] as const;

/** PVP leagues keyed by their CP cap, as Poracle stores them. */
export const pvpLeagues = [
	{ value: 500, label: "Little (500)" },
	{ value: 1500, label: "Great (1500)" },
	{ value: 2500, label: "Ultra (2500)" }
] as const;

export const questRewardTypes = [
	{ value: 7, label: "Pokémon" },
	{ value: 2, label: "Item" },
	{ value: 3, label: "Stardust" },
	{ value: 4, label: "Candy" },
	{ value: 12, label: "Mega Energy" }
] as const;

export const lureTypes = [
	{ value: 0, label: "Any" },
	{ value: 501, label: "Normal" },
	{ value: 502, label: "Glacial" },
	{ value: 503, label: "Mossy" },
	{ value: 504, label: "Magnetic" },
	{ value: 505, label: "Rainy" },
	{ value: 506, label: "Sparkly" }
] as const;

export const fortTypes = [
	{ value: "everything", label: "Everything" },
	{ value: "pokestop", label: "Pokéstop" },
	{ value: "gym", label: "Gym" }
] as const;

export const fortChangeTypes = [
	{ value: "new", label: "New" },
	{ value: "removal", label: "Removal" },
	{ value: "name", label: "Name" },
	{ value: "location", label: "Location" },
	{ value: "image_url", label: "Image" }
] as const;

// ─── Humans, areas, profiles, config ────────────────────────────────

export interface PoracleArea {
	name: string;
	group: string;
	description: string;
	userSelectable: boolean;
}

export interface PoracleHuman {
	id: string;
	name: string;
	type: string;
	enabled: boolean;
	area: string;
	latitude: number | null;
	longitude: number | null;
	language: string;
	current_profile_no: number;
}

export interface PoracleProfile {
	id: string;
	profile_no: number;
	name: string;
	area: string;
	latitude: number | null;
	longitude: number | null;
	active_hours: string;
}

/** One entry in a profile's active_hours schedule (JSON-encoded array). */
export interface ActiveHour {
	day: number;
	hours: number;
	mins: number;
}

/** One value in the grunts masterdata map (keyed externally by grunt id). */
export interface PoracleGrunt {
	type: string;
	grunt: string;
	gender: number;
}

/** Shape of GET /api/config/poracleWeb (see alerter apiConfig.js). */
export interface PoracleWebConfig {
	status: string;
	version?: string;
	locale?: string;
	prefix?: string;
	pvpFilterMaxRank?: number;
	pvpFilterGreatMinCP?: number;
	pvpFilterUltraMinCP?: number;
	pvpFilterLittleMinCP?: number;
	pvpLittleLeagueAllowed?: boolean;
	pvpCaps?: number[];
	pvpRequiresMinCp?: boolean;
	defaultPvpCap?: number;
	defaultTemplateName?: string;
	maxDistance?: number;
	defaultDistance?: number;
	everythingFlagPermissions?: unknown;
	disabledHooks?: string[];
	gymBattles?: boolean;
}

// ─── Tools menu (cross-tool quick-switch, mirrors vivillon) ──────────

export type PokedexToolLink = {
	label: string;
	href: string;
	icon?: string;
};

// ─── Helpers ────────────────────────────────────────────────────────

export function clampInt(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return min;
	return Math.min(max, Math.max(min, Math.trunc(value)));
}

/** IV% helper: Poracle stores min_iv = -1 to mean "include unencountered". */
export function ivLabel(minIv: number, maxIv: number): string {
	const lo = minIv < 0 ? "0*" : `${minIv}`;
	return `${lo}–${maxIv}%`;
}
