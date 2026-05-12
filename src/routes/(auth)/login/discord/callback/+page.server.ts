import type { PageServerLoad } from "./$types";
import { isAuthRequiredEnabled } from "@/lib/server/auth/betterAuth";
import { getClientConfig } from "@/lib/services/config/config.server";
import { getMapPath } from "@/lib/utils/getMapPath";
import { sanitizeRedirectPath } from "@/lib/utils/sanitizeRedirectPath";

export const load: PageServerLoad = (event) => {
	const redir = sanitizeRedirectPath(
		event.url.searchParams.get("redir"),
		isAuthRequiredEnabled() ? "/" : getMapPath(getClientConfig())
	);

	if (event.url.searchParams.has("error") || !event.locals.authUser) {
		return { error: true, redir, name: "" };
	}

	// don't fall through to email — it's the synthetic <discord_id>@discord.diadem.local
	return { error: false, redir, name: event.locals.authUser.name || "" };
};
