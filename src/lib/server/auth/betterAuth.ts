import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import type { RequestEvent } from "@sveltejs/kit";
import { getTableColumns, getTableName, sql } from "drizzle-orm";

import { SESSION_REFRESH, SESSION_TTL } from "@/lib/constants";
import { db } from "@/lib/server/db/internal";
import { account, session, user, verification } from "@/lib/server/db/internal/schema";
import { generateAuthRecordId } from "@/lib/server/auth/authRecords";
import { getServerConfig } from "@/lib/services/config/config.server";
import { getLogger } from "@/lib/utils/logger";

const log = getLogger("auth");

const authTables = [user, session, account, verification] as const;
const authConfig = getServerConfig().auth;
const discordConfig = authConfig.discord;
const discordClientId = discordConfig?.clientId?.trim();
const discordClientSecret = discordConfig?.clientSecret?.trim();
const rawAuthBaseUrl = authConfig.baseUrl?.trim();
const authSecret =
	authConfig.secret?.trim() ||
	process.env.BETTER_AUTH_SECRET?.trim() ||
	process.env.AUTH_SECRET?.trim();

const authErrors: string[] = [];

export const authBaseUrl = parseAuthBaseUrl(rawAuthBaseUrl, authErrors);

function parseAuthBaseUrl(raw: string | undefined, errors: string[]): string | null {
	if (!raw) {
		errors.push("server.auth.baseUrl is required");
		return null;
	}
	try {
		const parsed = new URL(raw);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error();
		return parsed.origin;
	} catch {
		errors.push("server.auth.baseUrl must be an absolute http(s) URL, e.g. https://map.co");
		return null;
	}
}

if (!authSecret) authErrors.push("server.auth.secret (or BETTER_AUTH_SECRET env) is required");
if (!discordClientId) authErrors.push("server.auth.discord.clientId is required");
if (!discordClientSecret) authErrors.push("server.auth.discord.clientSecret is required");

const isFeatureEnabled = Boolean(authConfig.enabled);
const canConstructAuth = isFeatureEnabled && authErrors.length === 0;

const isMissingTableError = (e: { code?: string; errno?: number } | null | undefined) =>
	e?.code === "ER_NO_SUCH_TABLE" || e?.errno === 1146;
const isMissingColumnError = (e: { code?: string; errno?: number } | null | undefined) =>
	e?.code === "ER_BAD_FIELD_ERROR" || e?.errno === 1054;

async function assertBetterAuthSchemaReady() {
	const missing: string[] = [];
	for (const t of authTables) {
		const tableName = getTableName(t);
		const cols = Object.values(getTableColumns(t))
			.map((c) => `\`${c.name}\``)
			.join(", ");
		try {
			await db.execute(sql.raw(`SELECT ${cols} FROM \`${tableName}\` LIMIT 0`));
		} catch (e) {
			const err = e as { code?: string; errno?: number };
			if (isMissingTableError(err) || isMissingColumnError(err)) missing.push(tableName);
			else throw new Error(`[AUTH_STARTUP_ERROR] Schema probe failed: ${e}`);
		}
	}
	if (missing.length > 0) {
		throw new Error(
			`[AUTH_STARTUP_ERROR] Better Auth schema is incomplete. ` +
				`Missing tables or columns in: ${missing.join(", ")}. ` +
				"Run your DB migration before starting the app."
		);
	}
}

let startupReadinessPromise: Promise<void> | null = null;
export async function assertBetterAuthStartupReadiness() {
	if (!authConfig.enabled) return;
	if (authErrors.length > 0) {
		throw new Error(
			`[AUTH_STARTUP_ERROR] Better Auth config is invalid:\n  - ${authErrors.join("\n  - ")}\n` +
				"Set the values and restart, or set server.auth.enabled=false."
		);
	}
	if (!startupReadinessPromise) {
		startupReadinessPromise = assertBetterAuthSchemaReady();
	}
	await startupReadinessPromise;
}

export const auth = canConstructAuth
	? betterAuth({
			secret: authSecret!,
			baseURL: authBaseUrl!,
			basePath: "/api/auth",
			database: drizzleAdapter(db, {
				provider: "mysql",
				camelCase: true,
				usePlural: false,
				schema: {
					user,
					session,
					account,
					verification
				}
			}),
			trustedOrigins: [authBaseUrl!],
			advanced: {
				database: {
					generateId: () => generateAuthRecordId()
				}
			},
			session: {
				expiresIn: SESSION_TTL,
				updateAge: SESSION_REFRESH
			},
			account: {
				encryptOAuthTokens: true
			},
			user: {
				additionalFields: {
					discordId: {
						type: "string",
						required: true,
						unique: true,
						input: false,
						returned: true
					}
				}
			},
			socialProviders: {
				discord: {
					clientId: discordClientId!,
					clientSecret: discordClientSecret!,
					scope: ["identify", "guilds.members.read"],
					mapProfileToUser: (profile) => ({
						discordId: profile.id,
						name: profile.global_name || profile.username,
						// synthetic email — we don't request the email scope; `.local` ensures no delivery
						email: `${profile.id}@discord.diadem.local`,
						emailVerified: true,
						image: profile.image_url || undefined
					})
				}
			},
			// sveltekitCookies must be the last plugin so it wraps cookie-setting from the others
			plugins: [sveltekitCookies(getRequestEvent)]
		})
	: null;

type AuthInstance = NonNullable<typeof auth>;
export type BetterAuthSession = AuthInstance["$Infer"]["Session"];
export type BetterAuthSessionData = BetterAuthSession["session"];
export type BetterAuthUserData = BetterAuthSession["user"];

export const discordClientCredentials =
	discordClientId && discordClientSecret
		? { clientId: discordClientId, clientSecret: discordClientSecret }
		: null;

export function isAuthFeatureEnabled() {
	return isFeatureEnabled;
}

export function isAuthRequiredEnabled() {
	return isFeatureEnabled && !authConfig.optional;
}

type SignInSocialResult = { url?: string; redirect: boolean };

async function callAuth<T>(
	label: string,
	level: "warning" | "error",
	fn: (a: AuthInstance) => Promise<T>
): Promise<T | null> {
	if (!auth) return null;
	try {
		return await fn(auth);
	} catch (e) {
		log[level]("%s failed: %s", label, e);
		return null;
	}
}

export function signInWithDiscord(
	event: RequestEvent,
	options: { callbackURL: string; errorCallbackURL: string }
): Promise<SignInSocialResult | null> {
	return callAuth(
		"Sign-in with Discord",
		"warning",
		(a) =>
			a.api.signInSocial({
				body: {
					provider: "discord",
					callbackURL: options.callbackURL,
					newUserCallbackURL: options.callbackURL,
					errorCallbackURL: options.errorCallbackURL,
					disableRedirect: true
				},
				headers: event.request.headers
			}) as Promise<SignInSocialResult>
	);
}

export async function signOut(event: RequestEvent): Promise<boolean> {
	// no auth = already signed out
	if (!auth) return true;
	const result = await callAuth("Sign-out", "warning", (a) =>
		a.api.signOut({ headers: event.request.headers })
	);
	return result !== null;
}

export function getAuthSession(event: RequestEvent): Promise<BetterAuthSession | null> {
	// error-level: a failure here silently logs every user out
	return callAuth("Read auth session", "error", (a) =>
		a.api.getSession({ headers: event.request.headers })
	);
}

export async function getDiscordAccessToken(event: RequestEvent): Promise<string | null> {
	const result = await callAuth("Fetch Discord access token", "warning", (a) =>
		a.api.getAccessToken({
			headers: event.request.headers,
			body: { providerId: "discord" }
		})
	);
	return result?.accessToken ?? null;
}
