<script lang="ts">
	import { Settings2, UserRound } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import type { PoracleProfile } from "@/lib/services/alerts/alerts.shared";

	// Compact active-profile indicator + entry point to the profile
	// manager. Switching, creating and per-profile settings all live
	// inside the manager panel (toggled here) rather than a cramped
	// inline dropdown.
	let {
		profiles,
		currentProfileNo,
		managing = false,
		onToggleManage
	}: {
		profiles: PoracleProfile[];
		currentProfileNo: number;
		managing?: boolean;
		onToggleManage: () => void;
	} = $props();

	const current = $derived(
		profiles.find((p) => p.profile_no === currentProfileNo) ?? profiles[0] ?? null
	);
</script>

<div class="flex flex-wrap items-center gap-2 text-sm">
	<UserRound class="h-4 w-4 text-muted-foreground" />
	<span class="text-muted-foreground">Profile</span>
	<span class="font-medium">{current?.name || `Profile ${currentProfileNo}`}</span>
	<Button
		variant="outline"
		size="sm"
		class="ml-auto {managing ? 'bg-muted' : ''}"
		onclick={onToggleManage}
	>
		<Settings2 class="h-4 w-4" /> Settings
	</Button>
</div>
