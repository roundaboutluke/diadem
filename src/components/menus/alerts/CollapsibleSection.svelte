<script lang="ts">
	import type { Snippet } from "svelte";
	import type { Icon as IconType } from "@lucide/svelte";
	import { ChevronDown } from "@lucide/svelte";

	let {
		title,
		subtitle = undefined,
		icon = undefined,
		iconUrl = undefined,
		open = $bindable(false),
		badge = undefined,
		warn = false,
		children
	}: {
		title: string;
		subtitle?: string;
		icon?: typeof IconType;
		/** A UICON image URL — preferred over `icon`; falls back to it on load error. */
		iconUrl?: string;
		open?: boolean;
		badge?: string;
		warn?: boolean;
		children: Snippet;
	} = $props();

	const Icon = $derived(icon);
	let iconUrlFailed = $state(false);
</script>

<section class="overflow-hidden rounded-md border bg-card shadow-sm">
	<button
		type="button"
		class="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30 sm:px-6"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		{#if iconUrl && !iconUrlFailed}
			<img
				src={iconUrl}
				alt=""
				onerror={() => (iconUrlFailed = true)}
				class="h-9 w-9 shrink-0 object-contain"
			/>
		{:else if Icon}
			<span
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
			>
				<Icon class="h-4.5 w-4.5" />
			</span>
		{/if}
		<span class="min-w-0 flex-1">
			<span class="flex items-center gap-2">
				<span class="text-base font-semibold">{title}</span>
				{#if badge}
					<span class="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
						>{badge}</span
					>
				{/if}
			</span>
			{#if subtitle}
				<span
					class="mt-0.5 flex items-center gap-1.5 text-sm {warn
						? 'text-amber-600 dark:text-amber-400'
						: 'text-muted-foreground'}"
				>
					{#if warn}
						<span class="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"></span>
					{/if}
					<span class="truncate">{subtitle}</span>
				</span>
			{/if}
		</span>
		<ChevronDown
			class="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 {open
				? 'rotate-180'
				: ''}"
		/>
	</button>
	{#if open}
		<div class="border-t px-5 py-6 sm:px-6">
			{@render children()}
		</div>
	{/if}
</section>
