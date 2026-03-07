import type { AnyFilter } from "@/lib/features/filters/filters";
import type { AnyFilterset } from "@/lib/features/filters/filtersets";

type PokemonLike = {
	pokemon_id: number;
	form?: number | null;
	form_id?: number | null;
};

function normalizePokemonEntry<T extends PokemonLike>(pokemon: T) {
	const normalized = {
		...pokemon,
		form_id: pokemon.form_id ?? pokemon.form ?? 0
	} as T & { form?: number | null; form_id: number };

	delete normalized.form;
	return normalized;
}

export function normalizeFilterset<T extends AnyFilterset>(filterset: T): T {
	if ("pokemon" in filterset && Array.isArray(filterset.pokemon)) {
		filterset.pokemon = filterset.pokemon.map((pokemon: PokemonLike) =>
			normalizePokemonEntry(pokemon)
		) as never;
	}

	if ("rewards" in filterset && Array.isArray(filterset.rewards)) {
		filterset.rewards = filterset.rewards.map((pokemon: PokemonLike) =>
			normalizePokemonEntry(pokemon)
		) as never;
	}

	if ("bosses" in filterset && Array.isArray(filterset.bosses)) {
		filterset.bosses = filterset.bosses.map((pokemon: PokemonLike) =>
			normalizePokemonEntry(pokemon)
		) as never;
	}

	return filterset;
}

export function normalizeFilter<T extends AnyFilter>(filter: T): T {
	if ("filters" in filter && Array.isArray(filter.filters)) {
		filter.filters = filter.filters.map((filterset) => normalizeFilterset(filterset)) as never;
	}

	if ("pokestopPlain" in filter) {
		normalizeFilter(filter.pokestopPlain);
		normalizeFilter(filter.quest);
		normalizeFilter(filter.invasion);
		normalizeFilter(filter.contest);
		normalizeFilter(filter.kecleon);
		normalizeFilter(filter.goldPokestop);
		normalizeFilter(filter.lure);
	}

	if ("gymPlain" in filter) {
		normalizeFilter(filter.gymPlain);
		normalizeFilter(filter.raid);
	}

	if ("stationPlain" in filter) {
		normalizeFilter(filter.stationPlain);
		normalizeFilter(filter.maxBattle);
	}

	return filter;
}
