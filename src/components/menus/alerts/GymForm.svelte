<script lang="ts">
	import Switch from "@/components/ui/input/Switch.svelte";
	import DistanceField from "./DistanceField.svelte";
	import GymPicker from "./GymPicker.svelte";
	import { teamOptions, type GymRule, type PoracleWebConfig } from "@/lib/services/alerts/alerts.shared";

	// Gym tracking rule — control by team, plus optional slot/battle
	// change notifications. Battle changes are only offered when the
	// operator enables gym battles in the PoracleWeb config.
	let {
		config,
		initial = null,
		submitting = false,
		defaultDistance = 0,
		onSubmit,
		onCancel
	}: {
		config: PoracleWebConfig | null;
		initial?: GymRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);
	const gymBattles = $derived(config?.gymBattles ?? false);

	let team = $state(seed?.team ?? 4);
	let slotChanges = $state(seed?.slot_changes ?? false);
	let battleChanges = $state(seed?.battle_changes ?? false);
	let gymId = $state<string | null>(seed?.gym_id ?? null);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit({
			team,
			slot_changes: slotChanges,
			battle_changes: gymBattles ? battleChanges : false,
			gym_id: gymId,
			distance
		});
	}
</script>

<form id="alert-rule-form" class="flex flex-col gap-3" onsubmit={(e) => { e.preventDefault(); submit(); }}>
	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Filters</h3>
	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		<span class="font-medium uppercase tracking-wide">Team</span>
		<select bind:value={team} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each teamOptions as t (t.value)}
				<option value={t.value}>{t.label}</option>
			{/each}
		</select>
	</label>

	<label class="flex items-center gap-2 text-sm">
		<Switch checked={slotChanges} onCheckedChange={(v) => (slotChanges = v)} />
		Notify on open slots
	</label>

	{#if gymBattles}
		<label class="flex items-center gap-2 text-sm">
			<Switch checked={battleChanges} onCheckedChange={(v) => (battleChanges = v)} />
			Notify on battle changes
		</label>
	{/if}

	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
	<GymPicker bind:gymId />

	<DistanceField bind:distance {maxDistance} />

	</section>
</form>
