<script lang="ts">
	import { Bell, CircleUserRound, PocketKnife, Settings2 } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import * as m from "@/lib/paraglide/messages";
	import { getUserDetails } from "@/lib/services/user/userDetails.svelte.js";
	import { closeMenu, getOpenedMenu, Menu, openMenu } from "@/lib/ui/menus.svelte.js";
	import { hasLoadedFeature, LoadedFeature } from "@/lib/services/initialLoad.svelte.js";
	import { isSupportedFeature } from "@/lib/services/supportedFeatures";
	import { fade } from "svelte/transition";
	import { Avatar } from "bits-ui";
	import { getConfig } from "@/lib/services/config/config";

	function isSelected(type: Menu) {
		return type === getOpenedMenu();
	}

	function onNavigate(type: Menu) {
		if (isSelected(type)) {
			closeMenu();
		} else {
			openMenu(type);
		}
	}

	// Derived (not a static array) so the gated Alerts bell can appear once
	// supported-features + the user session have loaded.
	const buttons = $derived.by(() => {
		// Reactive dep: re-read the (async-loaded) feature flags once ready.
		hasLoadedFeature(LoadedFeature.SUPPORTED_FEATURES);
		const list: { text: string; icon: typeof Settings2; type: Menu }[] = [];

		list.push({ text: m.nav_filters(), icon: Settings2, type: Menu.FILTERS });

		if (getConfig().tools?.showToolsMenu) {
			list.push({ text: m.nav_tools(), icon: PocketKnife, type: Menu.TOOLS });
		}

		// Alerts (Poracle) bell — only for logged-in users on an instance with
		// a Poracle backend configured.
		if (isSupportedFeature("poracle") && getUserDetails()?.details) {
			list.push({ text: m.nav_alerts(), icon: Bell, type: Menu.ALERTS });
		}

		list.push({ text: m.nav_profile(), icon: CircleUserRound, type: Menu.PROFILE });
		return list;
	});
</script>

<div
	class="z-10 h-16 mx-2 text-sm grid divide-x rounded-lg border bg-card text-card-foreground shadow-lg min-w-0 shrink-0"
	style="pointer-events: all; grid-template-columns: repeat({buttons.length}, minmax(0, 1fr));"
	transition:fade={{ duration: 90 }}
>
	{#each buttons as btn}
		{@const Icon = btn.icon}

		{#snippet icon()}
			<Icon size="20" />
		{/snippet}

		<Button
			variant="ghost"
			size=""
			class="min-w-21! flex px-2 pt-0.5 justify-center items-center flex-col text-sm bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent active:text-accent-foreground first:rounded-l-lg last:rounded-r-lg"
			onclick={() => onNavigate(btn.type)}
			disabled={!hasLoadedFeature(
				LoadedFeature.REMOTE_LOCALE,
				LoadedFeature.ICON_SETS,
				LoadedFeature.SUPPORTED_FEATURES
			)}
		>
			{#if btn.type === "profile"}
				<Avatar.Root>
					<Avatar.Image
						class="border-2 border-foreground rounded-full h-6 w-6 -mb-1"
						src={getUserDetails()?.details?.avatarUrl}
						alt={getUserDetails()?.details?.displayName}
					/>
					<Avatar.Fallback>
						{@render icon()}
					</Avatar.Fallback>
				</Avatar.Root>
			{:else}
				{@render icon()}
			{/if}

			<span class:font-bold={isSelected(btn.type)}>
				{btn.text}
			</span>
		</Button>
	{/each}
</div>
