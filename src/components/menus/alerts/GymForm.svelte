<script lang="ts">
	import SelectField from "./SelectField.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import DistanceField from "./DistanceField.svelte";
	import GymPicker from "./GymPicker.svelte";
	import {
		teamOptions,
		type GymRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	let {
		config,
		initial = null,
		defaultDistance = 0,
		onSubmit
	}: {
		config: PoracleWebConfig | null;
		initial?: GymRule | null;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
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

<form
	id="alert-rule-form"
	class="flex flex-col gap-3"
	onsubmit={(e) => {
		e.preventDefault();
		submit();
	}}
>
	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Filters</h3>
		<SelectField
			label="Team"
			value={team}
			options={teamOptions}
			onchange={(v) => (team = Number(v))}
		/>

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
