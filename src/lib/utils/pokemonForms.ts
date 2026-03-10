export const DITTO_ID = 132;

export type DefaultFormLookup = (pokemonId: number) => number;

export type PokemonWithMaybeForm = {
	pokemon_id?: number | null;
	form?: number | null;
	form_id?: number | null;
};

export function getCanonicalFormValue(
	pokemonId: number | null | undefined,
	form: number | null | undefined,
	getDefaultFormId: DefaultFormLookup
) {
	if (form === undefined || form === null) return undefined;
	if (pokemonId === undefined || pokemonId === null) return form;
	if (pokemonId === DITTO_ID) return 0;

	return form === getDefaultFormId(pokemonId) ? 0 : form;
}

export function getSourceFormValue(
	pokemonId: number | null | undefined,
	form: number | null | undefined,
	getDefaultFormId: DefaultFormLookup,
	options: { forQuery?: boolean } = {}
) {
	if (form === undefined || form === null) return undefined;
	if (pokemonId === undefined || pokemonId === null) return form;
	if (pokemonId === DITTO_ID) return options.forQuery ? undefined : 0;

	return form === 0 ? getDefaultFormId(pokemonId) : form;
}

export function normalizePokemonWithForm<T extends PokemonWithMaybeForm>(
	pokemon: T,
	getDefaultFormId: DefaultFormLookup
) {
	const normalized = {
		...pokemon,
		form: getCanonicalFormValue(
			pokemon.pokemon_id,
			pokemon.form ?? pokemon.form_id,
			getDefaultFormId
		)
	} as Omit<T, "form_id"> & { form?: number | null; form_id?: number | null };

	delete normalized.form_id;
	if (normalized.form === undefined || normalized.form === null) {
		delete normalized.form;
	}

	return normalized;
}

export function normalizePokemonWithForms<T extends PokemonWithMaybeForm>(
	pokemon: T[] | undefined,
	getDefaultFormId: DefaultFormLookup
) {
	return pokemon?.map((entry) => normalizePokemonWithForm(entry, getDefaultFormId));
}

export function normalizeContestFocusPokemon<T extends { type?: string; pokemon_id?: number; pokemon_form?: number | null }>(
	focus: T,
	getDefaultFormId: DefaultFormLookup
) {
	if (focus.type !== "pokemon" || !focus.pokemon_id) return focus;

	const normalized = {
		...focus,
		pokemon_form: getCanonicalFormValue(
			focus.pokemon_id,
			focus.pokemon_form,
			getDefaultFormId
		)
	} as T & { pokemon_form?: number | null };

	if (normalized.pokemon_form === undefined || normalized.pokemon_form === null) {
		delete normalized.pokemon_form;
	}

	return normalized;
}

export function formsMatch(
	pokemonId: number | null | undefined,
	filterForm: number | null | undefined,
	sourceForm: number | null | undefined,
	getDefaultFormId: DefaultFormLookup
) {
	if (filterForm === undefined || filterForm === null) return true;

	return filterForm === getCanonicalFormValue(pokemonId, sourceForm, getDefaultFormId);
}

export function getCanonicalPokemonKey(
	pokemonId: number,
	form: number | null | undefined,
	getDefaultFormId: DefaultFormLookup
) {
	return `${pokemonId}-${getCanonicalFormValue(pokemonId, form, getDefaultFormId) ?? 0}`;
}
