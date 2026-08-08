<script lang="ts">
	// Custom tools drawer entries — rendered at the bottom of the Tools
	// drawer when [client.tools] customTools = true. setup.sh copies this
	// example to config/Tools.svelte and symlinks it into
	// src/components/custom/Tools.svelte; edit config/Tools.svelte (not
	// this example) for your deployment.
	//
	// Use the shipped ToolLink component so entries match the built-in
	// Scout / Coverage Map cards. Pass `href` for a page route so the
	// menu closes cleanly before navigating (an onclick that just calls
	// goto() bounces off the page on mobile — the drawer's close handler
	// fires history.back()). Icons come from @lucide/svelte.
	import { Gift, Swords, Trophy } from "@lucide/svelte";
	import ToolLink from "@/components/menus/tools/ToolLink.svelte";
</script>

<ToolLink Icon={Swords} title="Auto Battle" description="Remote Raids" href="/battle" />

<ToolLink Icon={Gift} title="Vivillon" description="Regional Gifts" href="/vivillon" />

<ToolLink Icon={Trophy} title="Leaderboard" description="Community Rankings" href="/leaderboard" />
