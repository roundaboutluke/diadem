import type { ParamMatcher } from "@sveltejs/kit";

import { isPokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

// Restricts the [type] segment of the Pokedex tracking endpoints to the
// known Poracle tracking types, so a bogus type never reaches the proxy.
export const match = ((param: string) => isPokedexTrackingType(param)) satisfies ParamMatcher;
