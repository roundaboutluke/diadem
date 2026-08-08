<script lang="ts">
	// Custom tools drawer entries — rendered at the bottom of the Tools
	// drawer when [client.tools] customTools = true. setup.sh copies this
	// example to config/Tools.svelte and symlinks it into
	// src/components/custom/Tools.svelte; edit config/Tools.svelte (not
	// this example) for your deployment.
	//
	// Reuse the shipped ToolLink component so entries match the built-in
	// Scout / Coverage Map cards — including the compactTools single-row
	// style when that flag is on. Icons come from @lucide/svelte.
	import { Gift, Trophy } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import ToolLink from "@/components/menus/tools/ToolLink.svelte";
</script>

<ToolLink
	Icon={Trophy}
	title="Leaderboard"
	description="Local trainer rankings"
	onclick={() => goto("/leaderboard")}
/>

<ToolLink
	Icon={Gift}
	title="Vivillon"
	description="Collect every Vivillon region"
	onclick={() => goto("/vivillon")}
/>
