<script lang="ts">
	import type { Snippet } from "svelte";
	import { Drawer } from "$lib/drawer";
	import CloseButton from "@/components/ui/CloseButton.svelte";

	let {
		open = $bindable(false),
		title,
		header,
		children
	}: {
		open?: boolean;
		title: string;
		header?: Snippet;
		children: Snippet;
	} = $props();

	const snapPoints = [0.8, 1];
	let snapPoint = $state<number | string>(snapPoints[0]);
	const contentClass = $derived(
		snapPoint === snapPoints[snapPoints.length - 1] ? "drawer-full" : "drawer-partial"
	);
</script>

<Drawer.Root bind:open {snapPoints} bind:snapPoint>
	<Drawer.Portal>
		<Drawer.Backdrop class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
		<Drawer.VirtualKeyboardProvider>
			<Drawer.Viewport class="drawer-viewport flex items-end justify-center z-50!">
				<Drawer.Popup
					aria-label={title}
					class="drawer-popup {contentClass} flex h-full w-full flex-col border border-t-border bg-card/80 px-2 pt-2 pb-[env(safe-area-inset-bottom)] shadow-2xl backdrop-blur-sm sm:max-w-lg"
				>
					<div
						class="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-1.5 text-base font-bold"
					>
						<Drawer.Title class="truncate">{title}</Drawer.Title>
						<CloseButton
							class="ml-auto hover:bg-accent/90! active:bg-accent/90!"
							onclick={() => (open = false)}
						/>
					</div>
					{#if header}
						<div class="mb-2 shrink-0 px-1">
							{@render header()}
						</div>
					{/if}
					<Drawer.Content
						class="content flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-1 pb-4 pt-1"
					>
						{@render children()}
					</Drawer.Content>
				</Drawer.Popup>
			</Drawer.Viewport>
		</Drawer.VirtualKeyboardProvider>
	</Drawer.Portal>
</Drawer.Root>
