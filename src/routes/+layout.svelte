<script lang="ts">
	import "../app.css";
	import { getUserSettings } from "@/lib/services/userSettings.svelte";
	import { ModeWatcher } from "mode-watcher";
	import Metadata from "@/components/utils/Metadata.svelte";
	import { onMount } from "svelte";
	import { initPwaInstall } from "@/lib/services/pwa.svelte";

	let { children } = $props();

	onMount(() => {
		initPwaInstall();
	});
</script>

<Metadata />

<ModeWatcher defaultMode={getUserSettings().themeMode} track={false} />
{@render children()}
