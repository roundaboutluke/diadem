// open-redirect defense for the `redir` query param
export function sanitizeRedirectPath(redirectPath: string | null | undefined, fallback: string) {
	if (!redirectPath) return fallback;
	if (!redirectPath.startsWith("/")) return fallback;
	if (redirectPath.startsWith("//")) return fallback;
	// control chars + any backslash (some browsers normalize `\` to `/`)
	if (/[\x00-\x1f\\]/.test(redirectPath)) return fallback;
	return redirectPath;
}
