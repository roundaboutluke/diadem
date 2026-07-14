<script lang="ts">
	import { Settings2, UserRound } from "@lucide/svelte";
	import type { PoracleProfile } from "@/lib/services/alerts/alerts.shared";

	// The active-profile indicator IS the entry point to the settings panel —
	// the whole bar is a button (a trailing gear hints at it), so there's no
	// separate "Settings" control cluttering the header.
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

<button
	type="button"
	class="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted/40 {managing
		? 'bg-muted'
		: 'bg-card'}"
	onclick={onToggleManage}
>
	<UserRound class="h-4 w-4 shrink-0 text-muted-foreground" />
	<span class="text-muted-foreground">Profile</span>
	<span class="min-w-0 truncate font-medium">{current?.name || `Profile ${currentProfileNo}`}</span>
	<Settings2 class="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
</button>
