<script lang="ts">
	import { fly } from "svelte/transition";
	import { onDestroy, onMount, type Snippet } from "svelte";
	import {
		getCurrentSelectedAttribute,
		resetCurrentSelectedAttribute,
		setCurrentSelectedAttribute
	} from "@/lib/features/filters/filtersetPageData.svelte.js";
	import {
		getCurrentAttributePage,
		getFiltersetPageTransition
	} from "@/lib/features/filters/filtersetPages.svelte.js";

	onMount(() => {
		setCurrentSelectedAttribute();
	});

	onDestroy(() => {
		resetCurrentSelectedAttribute();
	});
</script>

<div
	class="w-full absolute inset-x-0 top-0 bottom-0 pb-20 overflow-y-auto"
	in:fly={getFiltersetPageTransition().in}
	out:fly={getFiltersetPageTransition().out}
>
	{#if getCurrentSelectedAttribute()}
		{@render getCurrentAttributePage().snippet?.(getCurrentSelectedAttribute())}
	{/if}
</div>
