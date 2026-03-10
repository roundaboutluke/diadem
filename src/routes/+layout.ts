import type { LayoutLoad } from "./$types";
import { getConfig, setConfig } from "@/lib/services/config/config";
import {
	getDefaultUserSettings,
	setUserSettings,
	updateUserSettings
} from "@/lib/services/userSettings.svelte";
import { loadMasterFile } from "@/lib/services/masterfile";
import { browser } from "$app/environment";

export const ssr = false

export const load: LayoutLoad = async ({ fetch }) => {
	const configResponse = await fetch("/api/config");
	setConfig(await configResponse.json());
	await loadMasterFile(fetch);

	let rawUserSettings: string | null = null
	if (browser && window.localStorage) {
		rawUserSettings = localStorage.getItem("userSettings");
	}

	if (rawUserSettings) {
		setUserSettings(JSON.parse(rawUserSettings));
	} else {
		setUserSettings(getDefaultUserSettings());
	}

	updateUserSettings();
};
