import type { AnySearchEntry } from "@/lib/services/search.svelte";
import {
	type DefaultFormLookup,
	getCanonicalFormValue,
	normalizeContestFocusPokemon,
	normalizePokemonWithForm
} from "@/lib/utils/pokemonForms";

export function normalizeSearchEntry<T extends AnySearchEntry>(
	entry: T,
	getDefaultFormId: DefaultFormLookup
) {
	if (entry.type === "pokemon") {
		const form = getCanonicalFormValue(entry.id, entry.form, getDefaultFormId) ?? 0;
		return {
			...entry,
			form,
			key: `pokemon-${entry.id}-${form}`
		} as T;
	}

	if (entry.type === "raid_boss") {
		const legacyEntry = entry as T & { form_id?: number };
		const form = getCanonicalFormValue(
			entry.pokemon_id,
			entry.form ?? legacyEntry.form_id,
			getDefaultFormId
		) ?? 0;
		const normalized = {
			...legacyEntry,
			form,
			key: `raidboss-${entry.pokemon_id}-${form}`
		} as T & { form: number; form_id?: number };

		delete normalized.form_id;
		return normalized as T;
	}

	if (entry.type === "max_battle_boss") {
		const form = getCanonicalFormValue(entry.pokemon_id, entry.form, getDefaultFormId) ?? 0;
		return {
			...entry,
			form,
			key: `raidboss-${entry.pokemon_id}-${form}-${entry.bread_mode}`
		} as T;
	}

	if (entry.type === "nest") {
		const form = getCanonicalFormValue(entry.pokemon_id, entry.form, getDefaultFormId) ?? 0;
		return {
			...entry,
			form,
			key: `nest-${entry.pokemon_id}-${form}`
		} as T;
	}

	if (entry.type === "contest") {
		const focus = normalizeContestFocusPokemon(entry.focus, getDefaultFormId);
		return {
			...entry,
			focus,
			key: `contest-${entry.rankingStandard}-${JSON.stringify(focus)}`
		} as T;
	}

	if (entry.type === "quest") {
		let reward = entry.reward;
		if (reward.type === 7) {
			reward = {
				...reward,
				info: normalizePokemonWithForm(reward.info, getDefaultFormId)
			};
		}

		return {
			...entry,
			reward,
			key: `quest-${JSON.stringify(reward)}`
		} as T;
	}

	return entry;
}

export function normalizeSearchEntries<T extends AnySearchEntry[] | undefined>(
	entries: T,
	getDefaultFormId: DefaultFormLookup
) {
	return entries?.map((entry) => normalizeSearchEntry(entry, getDefaultFormId)) as T;
}
