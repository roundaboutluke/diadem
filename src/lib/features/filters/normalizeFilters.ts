import type { AnyFilter } from "@/lib/features/filters/filters";
import type { AnyFilterset } from "@/lib/features/filters/filtersets";
import {
	type DefaultFormLookup,
	normalizePokemonWithForm,
	normalizePokemonWithForms
} from "@/lib/utils/pokemonForms";

export function normalizeFilterset<T extends AnyFilterset>(
	filterset: T,
	getDefaultFormId: DefaultFormLookup
) {
	if ("pokemon" in filterset && Array.isArray(filterset.pokemon)) {
		filterset.pokemon = normalizePokemonWithForms(filterset.pokemon, getDefaultFormId) as never;
	}

	if ("rewards" in filterset && Array.isArray(filterset.rewards)) {
		filterset.rewards = normalizePokemonWithForms(filterset.rewards, getDefaultFormId) as never;
	}

	if ("bosses" in filterset && Array.isArray(filterset.bosses)) {
		filterset.bosses = normalizePokemonWithForms(filterset.bosses, getDefaultFormId) as never;
	}

	if ("focus" in filterset && filterset.focus && filterset.focus.pokemon_id) {
		filterset.focus = normalizePokemonWithForm(filterset.focus, getDefaultFormId) as never;
	}

	return filterset;
}

export function normalizeFilter<T extends AnyFilter>(
	filter: T,
	getDefaultFormId: DefaultFormLookup
) {
	if ("filters" in filter && Array.isArray(filter.filters)) {
		filter.filters = filter.filters.map((filterset) =>
			normalizeFilterset(filterset, getDefaultFormId)
		) as never;
	}

	if ("pokestopPlain" in filter) {
		normalizeFilter(filter.pokestopPlain, getDefaultFormId);
		normalizeFilter(filter.quest, getDefaultFormId);
		normalizeFilter(filter.invasion, getDefaultFormId);
		normalizeFilter(filter.contest, getDefaultFormId);
		normalizeFilter(filter.kecleon, getDefaultFormId);
		normalizeFilter(filter.goldPokestop, getDefaultFormId);
		normalizeFilter(filter.lure, getDefaultFormId);
	}

	if ("gymPlain" in filter) {
		normalizeFilter(filter.gymPlain, getDefaultFormId);
		normalizeFilter(filter.raid, getDefaultFormId);
	}

	if ("stationPlain" in filter) {
		normalizeFilter(filter.stationPlain, getDefaultFormId);
		normalizeFilter(filter.maxBattle, getDefaultFormId);
	}

	return filter;
}
