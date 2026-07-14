import { m } from "@/lib/paraglide/messages";
import { mPokemon, mRaid } from "@/lib/services/ingameLocale";
import { getGenderLabel } from "@/lib/utils/pokemonUtils";
import {
	lureTypes,
	questRewardTypes,
	teamOptions,
	type AnyRule,
	type EggRule,
	type FortRule,
	type GymRule,
	type InvasionRule,
	type LureRule,
	type MaxBattleRule,
	type NestRule,
	type PokedexTrackingType,
	type PokemonRule,
	type QuestRule,
	type RaidRule
} from "@/lib/services/alerts/alerts.shared";

export interface RuleChip {
	label: string;
	value: string;
}

export type RuleIcon =
	| { pokemon_id: number; form: number }
	| { egg: number; hatched: boolean }
	| { station: true }
	| { emoji: string };

function eggIcon(level: number, hatched: boolean): RuleIcon | null {
	return level >= 1 && level < 90 ? { egg: level, hatched } : null;
}

function isAnyLevel(level: number): boolean {
	return level <= 0 || level >= 90;
}

export interface RuleSummary {
	icon: RuleIcon | null;
	title: string;
	chips: RuleChip[];
}

function teamLabel(team: number): string {
	return teamOptions.find((t) => t.value === team)?.label ?? `Team ${team}`;
}

function lureLabel(id: number): string {
	return lureTypes.find((l) => l.value === id)?.label ?? `Lure ${id}`;
}

function rewardTypeLabel(type: number): string {
	return questRewardTypes.find((r) => r.value === type)?.label ?? `Reward ${type}`;
}

function whereChip(rule: AnyRule): RuleChip {
	const overrideAreas = (rule as { override_areas?: unknown }).override_areas;
	const overrideLabel = (rule as { override_location_label?: unknown }).override_location_label;
	const distance = rule.distance ?? 0;
	if (distance > 0) return { label: "Range", value: `${distance} m` };
	if (typeof overrideLabel === "string" && overrideLabel.length > 0)
		return { label: "Area", value: overrideLabel };
	if (Array.isArray(overrideAreas) && overrideAreas.length > 0)
		return { label: "Areas", value: overrideAreas.map(String).join(", ") };
	return { label: "Where", value: "My areas" };
}

function speciesName(pokemonId: number, form: number): string {
	return mPokemon({ pokemon_id: pokemonId, form });
}

function ivChip(minIv: number, maxIv: number): RuleChip | null {
	if (minIv <= 0 && maxIv >= 100) return null;
	const lo = minIv < 0 ? "0" : String(minIv);
	return { label: "IV", value: `${lo}–${maxIv}%` };
}

export function summarizeRule(
	type: PokedexTrackingType,
	rule: AnyRule,
	gymName?: (id: string) => string | undefined
): RuleSummary {
	const chips: RuleChip[] = [];
	const where = whereChip(rule);

	switch (type) {
		case "pokemon": {
			const r = rule as PokemonRule;
			const anyMon = !r.pokemon_id || r.pokemon_id <= 0;
			const iv = ivChip(r.min_iv, r.max_iv);
			if (iv) chips.push(iv);
			if (r.min_cp > 0 || r.max_cp < 9000)
				chips.push({ label: "CP", value: `${r.min_cp}–${r.max_cp}` });
			if (r.min_level > 0 || r.max_level < 40)
				chips.push({ label: "Level", value: `${r.min_level}–${r.max_level}` });
			if (r.pvp_ranking_league > 0)
				chips.push({
					label: `PVP ${r.pvp_ranking_league}`,
					value: `#${r.pvp_ranking_best}–${r.pvp_ranking_worst}`
				});
			if (r.gender) chips.push({ label: "Gender", value: getGenderLabel(r.gender) });
			chips.push(where);
			return {
				icon: !anyMon
					? { pokemon_id: r.pokemon_id, form: r.form }
					: (r.min_iv ?? 0) >= 98
						? { emoji: "💯" }
						: (r.max_iv ?? 100) === 0
							? { emoji: "🗑️" }
							: null,
				title: anyMon ? "Any Pokémon" : speciesName(r.pokemon_id, r.form),
				chips
			};
		}
		case "raid": {
			const r = rule as RaidRule;
			const byMon = r.pokemon_id && r.pokemon_id !== 9000;
			if (r.team !== 4) chips.push({ label: "Team", value: teamLabel(r.team) });
			if (r.exclusive) chips.push({ label: "EX", value: "Yes" });
			if (r.gym_id) chips.push({ label: "Gym", value: gymName?.(r.gym_id) ?? String(r.gym_id) });
			chips.push(where);
			return {
				icon: byMon ? { pokemon_id: r.pokemon_id, form: r.form } : eggIcon(r.level, true),
				title: byMon
					? speciesName(r.pokemon_id, r.form)
					: isAnyLevel(r.level)
						? "Any raid"
						: mRaid(r.level),
				chips
			};
		}
		case "egg": {
			const r = rule as EggRule;
			if (r.team !== 4) chips.push({ label: "Team", value: teamLabel(r.team) });
			if (r.exclusive) chips.push({ label: "EX", value: "Yes" });
			if (r.gym_id) chips.push({ label: "Gym", value: gymName?.(r.gym_id) ?? String(r.gym_id) });
			chips.push(where);
			return {
				icon: eggIcon(r.level, false),
				title: isAnyLevel(r.level) ? "Any egg" : mRaid(r.level),
				chips
			};
		}
		case "quest": {
			const r = rule as QuestRule;
			const isMon = [4, 7, 12].includes(r.reward_type);
			if (r.amount > 0) chips.push({ label: "Amount", value: `≥${r.amount}` });
			if (r.shiny) chips.push({ label: "Shiny", value: "Yes" });
			chips.push(where);
			return {
				icon: isMon && r.reward > 0 ? { pokemon_id: r.reward, form: r.form } : null,
				title:
					isMon && r.reward > 0
						? `${speciesName(r.reward, r.form)} ${rewardTypeLabel(r.reward_type).toLowerCase()}`
						: rewardTypeLabel(r.reward_type),
				chips
			};
		}
		case "invasion": {
			const r = rule as InvasionRule;
			if (r.gender) chips.push({ label: "Gender", value: getGenderLabel(r.gender) });
			chips.push(where);
			return { icon: null, title: r.grunt_type ? `${r.grunt_type} grunt` : "Any invasion", chips };
		}
		case "lure": {
			const r = rule as LureRule;
			chips.push(where);
			return {
				icon: null,
				title: r.lure_id ? `${lureLabel(r.lure_id)} lure` : "Any lure",
				chips
			};
		}
		case "gym": {
			const r = rule as GymRule;
			if (r.gym_id) chips.push({ label: "Gym", value: gymName?.(r.gym_id) ?? String(r.gym_id) });
			if (r.slot_changes) chips.push({ label: "Slots", value: "Yes" });
			if (r.battle_changes) chips.push({ label: "Battles", value: "Yes" });
			chips.push(where);
			return { icon: null, title: `${teamLabel(r.team)} gyms`, chips };
		}
		case "nest": {
			const r = rule as NestRule;
			const anyMon = !r.pokemon_id || r.pokemon_id <= 0;
			if (r.min_spawn_avg > 0) chips.push({ label: "Spawns/h", value: `≥${r.min_spawn_avg}` });
			chips.push(where);
			return {
				icon: anyMon ? null : { pokemon_id: r.pokemon_id, form: r.form },
				title: anyMon ? "Any nest" : `${speciesName(r.pokemon_id, r.form)} nest`,
				chips
			};
		}
		case "maxbattle": {
			const r = rule as MaxBattleRule;
			const byMon = r.pokemon_id && r.pokemon_id !== 9000;
			if (r.gmax) chips.push({ label: "G-Max", value: "Yes" });
			chips.push(where);
			return {
				icon: byMon ? { pokemon_id: r.pokemon_id, form: r.form } : { station: true },
				title: byMon
					? speciesName(r.pokemon_id, r.form)
					: isAnyLevel(r.level)
						? "Any max battle"
						: m.x_start_max_battle({ level: r.level }),
				chips
			};
		}
		case "fort": {
			const r = rule as FortRule;
			if (r.change_types && r.change_types.length > 0)
				chips.push({ label: "Changes", value: r.change_types.join(", ") });
			if (r.include_empty) chips.push({ label: "Empty", value: "Included" });
			chips.push(where);
			return {
				icon: null,
				title:
					r.fort_type === "everything"
						? "All fort updates"
						: `${r.fort_type === "gym" ? "Gym" : "Pokéstop"} updates`,
				chips
			};
		}
		default:
			return { icon: null, title: `Rule #${rule.uid}`, chips: [where] };
	}
}
