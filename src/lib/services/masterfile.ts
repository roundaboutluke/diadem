import type { MasterFile, MasterPokemon, MasterWeather } from '@/lib/types/masterfile';
import { getPokemonStats } from "@/lib/features/masterStats.svelte";
import { getCanonicalFormValue } from "@/lib/utils/pokemonForms";

const url = "https://raw.githubusercontent.com/WatWowMap/Masterfile-Generator/refs/heads/master/master-latest-react-map.json"
let masterFile: MasterFile
let masterFilePromise: Promise<MasterFile> | undefined

export async function loadMasterFile(thisFetch: typeof fetch = fetch) {
	if (masterFile) return masterFile
	if (!masterFilePromise) {
		masterFilePromise = thisFetch(url).then(async (result) => {
			masterFile = await result.json()
			return masterFile
		})
	}

	return await masterFilePromise
}

export function defaultProp(obj: any | undefined, key: any, fallback: any): any {
	if (!obj) return fallback
	return obj[key] ?? fallback
}

export function getMasterFile() {
	return masterFile
}

export function getMasterPokemon(pokemonId: string | number): MasterPokemon | undefined {
	return masterFile?.pokemon["" + pokemonId]
}

export function getDefaultFormId(pokemonId: string | number) {
	return getMasterPokemon(pokemonId)?.defaultFormId ?? 0
}

const blacklistBasePokemon = [
	412, 413,	// burmy
	421,		// cherrim
	422, 423,   // shellos
	669,		// flabebe
	676,		// furfrou
	710, 711,	// pumpkaboo
	741,		// oricorio
]
const blacklistForms = [
	25,			// pikachu
	327,		// spinda
	664, 665,	// scatterbug
]

export function getSpawnablePokemon(onlyActive: boolean = false): {pokemon_id: number, form: number}[] {
	const allPokemon: {pokemon_id: number, form: number}[] = []
	if (!masterFile) return allPokemon

	for (const [strPokemonId, pokemon] of Object.entries(masterFile.pokemon)) {
		if (pokemon.mythical || pokemon.ultraBeast) continue

		const pokemonId = Number(strPokemonId)
		const defaultForm = getDefaultFormId(pokemonId)
		const canonicalDefaultForm = getCanonicalFormValue(pokemonId, defaultForm, getDefaultFormId) ?? 0

		if (!pokemon.unreleased && !blacklistBasePokemon.includes(pokemonId)) {
			if (!onlyActive || getPokemonStats(pokemonId, canonicalDefaultForm)?.entry) {
				allPokemon.push({
					pokemon_id: pokemonId,
					form: canonicalDefaultForm
				})
			}
		}

		// specific pokemon to ignore the forms of
		if (blacklistForms.includes(pokemonId)) continue

		for (const [formIdRaw, form] of Object.entries(pokemon.forms)) {
			const formId = Number(formIdRaw)
			const canonicalForm = getCanonicalFormValue(pokemonId, formId, getDefaultFormId) ?? 0
			if (
				form.name !== "Normal"
				&& !form.name.includes("Costume")
				&& !form.name.includes("20")  // gets rid of year-specific forms
				&& !(form.isCostume ?? false)
				&& !form.unreleased
				&& (formId !== defaultForm)
				&& (!onlyActive || getPokemonStats(pokemonId, canonicalForm)?.entry)
			) {
				allPokemon.push({ pokemon_id: pokemonId, form: canonicalForm })
			}
		}
	}

	const dedupedPokemon = new Map<string, {pokemon_id: number, form: number}>()
	for (const pokemon of allPokemon) {
		dedupedPokemon.set(`${pokemon.pokemon_id}-${pokemon.form}`, pokemon)
	}

	return [...dedupedPokemon.values()]
}

export function getMasterWeather(weatherId: string | number | undefined): MasterWeather | undefined {
	if (weatherId === undefined) return undefined

	return masterFile.weather["" + weatherId]
}

export function getAllLureModuleIds(): number[] {
	return Object.keys(masterFile.items)
		.filter(i => i.startsWith("5"))
		.map(Number)
}
