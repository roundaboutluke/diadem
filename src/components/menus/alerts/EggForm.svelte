<script lang="ts">
	import SelectField from "./SelectField.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import { mRaid } from "@/lib/services/ingameLocale";
	import DistanceField from "./DistanceField.svelte";
	import GymPicker from "./GymPicker.svelte";
	import {
		teamOptions,
		type EggRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	let {
		config,
		initial = null,
		defaultDistance = 0,
		onSubmit
	}: {
		config: PoracleWebConfig | null;
		initial?: EggRule | null;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);
	const baseLevels = [1, 2, 3, 4, 5, 6];
	const levels =
		seed && seed.level > 0 && !baseLevels.includes(seed.level)
			? [...baseLevels, seed.level].sort((a, b) => a - b)
			: baseLevels;

	let level = $state(seed && seed.level > 0 ? seed.level : 5);
	let team = $state(seed?.team ?? 4);
	let exclusive = $state(seed?.exclusive ?? false);
	let gymId = $state<string | null>(seed?.gym_id ?? null);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit({ level, team, exclusive, distance, gym_id: gymId });
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
			label="Egg level"
			value={level}
			options={levels.map((l) => ({ value: l, label: mRaid(l) }))}
			onchange={(v) => (level = Number(v))}
		/>

		<SelectField
			label="Gym team"
			value={team}
			options={teamOptions}
			onchange={(v) => (team = Number(v))}
		/>

		<label class="flex items-center gap-2 text-sm">
			<Switch checked={exclusive} onCheckedChange={(v) => (exclusive = v)} />
			EX gyms only
		</label>
	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
		<GymPicker bind:gymId />

		<DistanceField bind:distance {maxDistance} />
	</section>
</form>
