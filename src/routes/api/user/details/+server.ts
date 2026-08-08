import { json } from "@sveltejs/kit";
import { getUserInfoResult, isGuildMember } from "@/lib/server/auth/discordDetails";
import type { UserData } from "@/lib/services/user/userDetails.svelte";
import { getClientConfig } from "@/lib/services/config/config.server";
import { getEveryonePerms } from "@/lib/server/auth/permissions";
import { getDiscordAccessToken } from "@/lib/server/auth/betterAuth";
import { getServerLogger } from "@/lib/server/logging";
import { noStoreHttpHeaders } from "@/lib/utils/apiUtils.server";
import { removeRedundantPermissionAreas } from "@/lib/utils/features";
import type { RequestHandler } from "./$types";

const log = getServerLogger("auth");

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;

	if (!user) {
		return json(
			{
				permissions: removeRedundantPermissionAreas(await getEveryonePerms(event.fetch))
			} as UserData,
			{ headers: noStoreHttpHeaders }
		);
	}

	const accessToken = await getDiscordAccessToken(event);
	if (!accessToken) {
		return json({ permissions: removeRedundantPermissionAreas(event.locals.perms) } as UserData, {
			headers: noStoreHttpHeaders
		});
	}

	const [userInfoResult, isMember] = await Promise.all([
		getUserInfoResult(accessToken),
		isGuildMember(getClientConfig().discord.serverId, accessToken).catch((error) => {
			log.warning(`Error checking Discord guild membership: ${error}`);
			return undefined;
		})
	]);
	const data = userInfoResult.data;

	if (!data) {
		// A missing Discord profile here is almost always a transient
		// access-token hiccup (rotated/racey refresh token), NOT a real
		// sign-out. Do NOT destroy the session on a 401 — that turned a
		// momentary Discord blip into a full logout and tripped every
		// auth gate. The session (locals.user) is our source of truth;
		// return current permissions and let the next load re-resolve.
		return json({ permissions: removeRedundantPermissionAreas(event.locals.perms) } as UserData, {
			headers: noStoreHttpHeaders
		});
	}

	return json(
		{
			details: data,
			permissions: removeRedundantPermissionAreas(event.locals.perms),
			isGuildMember: isMember
		} as UserData,
		{ headers: noStoreHttpHeaders }
	);
};
