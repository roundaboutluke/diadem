import { json } from "@sveltejs/kit";
import { getDiscordAccessToken, signOut } from "@/lib/server/auth/betterAuth";
import { getUserInfoResult, isGuildMember } from "@/lib/server/auth/discordApi";
import { getEveryonePerms } from "@/lib/server/auth/permissions";
import { getClientConfig } from "@/lib/services/config/config.server";
import type { UserData } from "@/lib/services/user/userDetails.svelte";
import { getLogger } from "@/lib/utils/logger";

const log = getLogger("auth");

export async function GET(event) {
	const user = event.locals.user;

	if (!user) {
		return json({ permissions: await getEveryonePerms(event.fetch) } as UserData);
	}

	const accessToken = await getDiscordAccessToken(event);
	if (!accessToken) {
		return json({ permissions: user.permissions } as UserData);
	}

	const userInfoResult = await getUserInfoResult(accessToken);
	const data = userInfoResult.data;

	if (!data) {
		if (userInfoResult.status === 401) {
			await signOut(event);
			return json({ permissions: await getEveryonePerms(event.fetch) } as UserData);
		}
		return json({ permissions: user.permissions } as UserData);
	}

	let isMember: boolean | undefined;
	try {
		isMember = await isGuildMember(getClientConfig().discord.serverId, accessToken);
	} catch (e) {
		log.warning("Error checking Discord guild membership: %s", e);
	}

	return json({
		details: data,
		permissions: user.permissions,
		isGuildMember: isMember
	} as UserData);
}
