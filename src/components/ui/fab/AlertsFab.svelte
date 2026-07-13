<script lang="ts">
	import BaseFab from "@/components/ui/fab/BaseFab.svelte";
	import { Bell } from "@lucide/svelte";
	import { closeMenu, getOpenedMenu, Menu, openMenu } from "@/lib/ui/menus.svelte.js";
	import { isSupportedFeature } from "@/lib/services/supportedFeatures";
	import { getUserDetails } from "@/lib/services/user/userDetails.svelte.js";
	import { hasLoadedFeature, LoadedFeature } from "@/lib/services/initialLoad.svelte.js";

	// Alerts (Poracle) entry point, living with the map FABs (search / locate)
	// rather than crowding the bottom nav. Only shown for a logged-in user on
	// an instance with a Poracle backend configured.
	const show = $derived.by(() => {
		hasLoadedFeature(LoadedFeature.SUPPORTED_FEATURES); // re-read once flags load
		return isSupportedFeature("poracle") && Boolean(getUserDetails()?.details);
	});
	const active = $derived(getOpenedMenu() === Menu.ALERTS);
</script>

{#if show}
	<BaseFab
		onclick={() => (active ? closeMenu() : openMenu(Menu.ALERTS))}
		class={active ? "bg-accent! text-accent-foreground" : ""}
	>
		<Bell size="24" />
	</BaseFab>
{/if}
