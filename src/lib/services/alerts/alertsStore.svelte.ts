import { fetchInit } from "./alerts.client";
import {
	pokedexTrackingTypes,
	type AnyRule,
	type PokedexTrackingType,
	type PoracleArea,
	type PoracleHuman,
	type PoracleProfile,
	type PoracleWebConfig
} from "./alerts.shared";

export function bundleToRules(
	bundle: Record<string, unknown> | null
): Partial<Record<PokedexTrackingType, AnyRule[]>> {
	const out: Partial<Record<PokedexTrackingType, AnyRule[]>> = {};
	for (const type of pokedexTrackingTypes)
		out[type] = bundle ? ((bundle[type] as AnyRule[]) ?? []) : [];
	return out;
}

// Shared reactive state for the Alerts feature. Lives at module scope so the
// bundle survives the AlertsMenu unmounting (menu reopens instantly) and so the
// FAB bell can show a rule-count badge without opening the menu. `load()` is
// idempotent — the FAB and the menu both call it; only the first fetches.
class AlertsStore {
	loaded = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);

	config = $state<PoracleWebConfig | null>(null);
	gruntTypes = $state<string[]>([]);
	areas = $state<PoracleArea[]>([]);
	human = $state<PoracleHuman | null>(null);
	profiles = $state<PoracleProfile[]>([]);
	rules = $state<Partial<Record<PokedexTrackingType, AnyRule[]>>>(bundleToRules(null));

	total = $derived(pokedexTrackingTypes.reduce((n, t) => n + (this.rules[t]?.length ?? 0), 0));

	async load(force = false) {
		if (this.loading) return;
		if (this.loaded && !force) return;
		this.loading = true;
		try {
			const init = await fetchInit();
			this.config = init.config;
			this.gruntTypes = init.gruntTypes ?? [];
			this.areas = init.areas ?? [];
			this.human = init.human;
			this.profiles = init.profiles ?? [];
			this.rules = bundleToRules(init.tracking as Record<string, unknown> | null);
			this.loaded = true;
			this.error = null;
		} catch (err) {
			this.error = err instanceof Error ? err.message : "Failed to load alerts";
		} finally {
			this.loading = false;
		}
	}
}

export const alertsStore = new AlertsStore();
