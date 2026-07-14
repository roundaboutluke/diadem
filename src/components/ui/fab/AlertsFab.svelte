<script lang="ts">
	import BaseFab from "@/components/ui/fab/BaseFab.svelte";
	import { Bell } from "@lucide/svelte";
	import { closeMenu, getOpenedMenu, Menu, openMenu } from "@/lib/ui/menus.svelte.js";
	import { isSupportedFeature } from "@/lib/services/supportedFeatures";
	import { getUserDetails } from "@/lib/services/user/userDetails.svelte.js";
	import { hasLoadedFeature, LoadedFeature } from "@/lib/services/initialLoad.svelte.js";
	import { alertsStore } from "@/lib/services/alerts/alertsStore.svelte";

	// Alerts (Poracle) entry point, living with the map FABs (search / locate)
	// rather than crowding the bottom nav. Only shown for a logged-in user on
	// an instance with a Poracle backend configured.
	const show = $derived.by(() => {
		hasLoadedFeature(LoadedFeature.SUPPORTED_FEATURES); // re-read once flags load
		return isSupportedFeature("poracle") && Boolean(getUserDetails()?.details);
	});
	const active = $derived(getOpenedMenu() === Menu.ALERTS);

	// Warm the shared store once the bell is shown, so the count badge is ready
	// and opening the menu is instant (load() is idempotent).
	$effect(() => {
		if (show) alertsStore.load();
	});
</script>

{#if show}
	<BaseFab
		onclick={() => (active ? closeMenu() : openMenu(Menu.ALERTS))}
		class="relative {active ? 'bg-accent! text-accent-foreground' : ''}"
	>
		<Bell size="24" />
		{#if alertsStore.total > 0}
			<span
				class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground shadow"
			>
				{alertsStore.total > 99 ? "99+" : alertsStore.total}
			</span>
		{/if}
	</BaseFab>
{/if}
