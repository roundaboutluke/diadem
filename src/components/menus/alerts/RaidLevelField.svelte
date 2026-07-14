<script lang="ts">
	import { Dialog } from "bits-ui";
	import { ChevronDown } from "@lucide/svelte";
	import CloseButton from "@/components/ui/CloseButton.svelte";
	import { RAID_LEVELS } from "@/lib/utils/gymUtils";
	import { mRaid } from "@/lib/services/ingameLocale";
	import { getIconRaidEgg } from "@/lib/services/uicons.svelte";
	import { resize } from "@/lib/services/assets";

	let {
		label,
		value,
		onchange
	}: {
		label: string;
		value: number;
		onchange: (value: number) => void;
	} = $props();

	let open = $state(false);

	function select(level: number) {
		onchange(level);
		open = false;
	}
</script>

<div class="flex flex-col gap-1">
	<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
	<button
		type="button"
		class="flex w-full items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm hover:bg-muted/40"
		onclick={() => (open = true)}
	>
		<img src={resize(getIconRaidEgg(value), { width: 64 })} alt="" class="h-6 w-6 shrink-0" />
		<span class="min-w-0 flex-1 truncate">{mRaid(value, true)}</span>
		<ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
	</button>
</div>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
		<Dialog.Content
			trapFocus={false}
			class="fixed left-1/2 top-1/2 z-[60] flex max-h-[80dvh] w-[calc(100%-1rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-md border bg-background shadow-md"
		>
			<div class="flex shrink-0 items-center justify-between gap-2 border-b p-3">
				<span class="text-sm font-semibold">{label}</span>
				<CloseButton onclick={() => (open = false)} />
			</div>
			<div class="min-h-0 flex-1 overflow-y-auto p-3">
				<div class="grid gap-2" style:grid-template-columns="repeat(auto-fill, minmax(5rem, 1fr))">
					{#each RAID_LEVELS as level (level)}
						<button
							type="button"
							class="flex flex-col items-center justify-center gap-1 rounded-md border p-2 text-center text-xs hover:bg-muted/50 {level ===
							value
								? 'border-ring ring-2 ring-ring'
								: ''}"
							onclick={() => select(level)}
						>
							<img
								class="h-8 w-8"
								src={resize(getIconRaidEgg(level), { width: 64 })}
								alt={mRaid(level, true)}
							/>
							<span class="line-clamp-2 leading-tight">{mRaid(level, true)}</span>
						</button>
					{/each}
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
