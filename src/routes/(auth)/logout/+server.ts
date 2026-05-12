import type { RequestEvent } from "@sveltejs/kit";
import { getDiscordAccessToken, isAuthFeatureEnabled, signOut } from "@/lib/server/auth/betterAuth";
import { revokeDiscordToken } from "@/lib/server/auth/discordApi";
import { getLogger } from "@/lib/utils/logger";

const log = getLogger("auth");

export async function POST(event: RequestEvent): Promise<Response> {
	if (!isAuthFeatureEnabled()) return new Response(null, { status: 404 });
	if (!event.locals.session) return new Response(null, { status: 204 });

	// fire-and-forget the Discord revoke; revokeDiscordToken logs its own failures
	const accessToken = await getDiscordAccessToken(event);
	if (accessToken) {
		revokeDiscordToken(accessToken).catch((e) => log.error("Discord token revoke threw: %s", e));
	}

	if (!(await signOut(event))) {
		log.error("Better Auth sign-out failed at %s", event.url.pathname);
		return new Response(null, { status: 500 });
	}
	return new Response(null, { status: 204 });
}
