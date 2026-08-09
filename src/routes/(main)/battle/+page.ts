import type { AvailableBoss } from "$lib/features/autoBattle";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch }) => {
	// Never block the page from opening on a transient availability
	// failure (a momentary Auto Battle backend hiccup, a reconnecting
	// worker pool). Previously a non-200 threw and the page wouldn't
	// open at all — it now renders with an empty grid instead.
	try {
		const response = await fetch("/api/auto-battle/available");
		if (response.ok) {
			return (await response.json()) as { bosses: AvailableBoss[] };
		}
	} catch {
		// fall through to the empty default
	}
	return { bosses: [] as AvailableBoss[] };
};
