<script lang="ts">
	import Switch from "@/components/ui/input/Switch.svelte";
	import { mRaid } from "@/lib/services/ingameLocale";
	import DistanceField from "./DistanceField.svelte";
	import GymPicker from "./GymPicker.svelte";
	import { teamOptions, type EggRule, type PoracleWebConfig } from "@/lib/services/alerts/alerts.shared";

	// Raid-egg tracking rule — by egg level + gym team (API.md).
	let {
		config,
		initial = null,
		submitting = false,
		defaultDistance = 0,
		onSubmit,
		onCancel
	}: {
		config: PoracleWebConfig | null;
		initial?: EggRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);
	const baseLevels = [1, 2, 3, 4, 5, 6];
	// Keep an existing rule's tier selectable (e.g. Mega / shadow tiers created
	// elsewhere) so editing never silently resets it.
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

<form id="alert-rule-form" class="flex flex-col gap-4 pb-2" onsubmit={(e) => { e.preventDefault(); submit(); }}>
	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		<span class="font-medium uppercase tracking-wide">Egg level</span>
		<select bind:value={level} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each levels as l (l)}
				<option value={l}>{mRaid(l)}</option>
			{/each}
		</select>
	</label>

	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		<span class="font-medium uppercase tracking-wide">Gym team</span>
		<select bind:value={team} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each teamOptions as t (t.value)}
				<option value={t.value}>{t.label}</option>
			{/each}
		</select>
	</label>

	<label class="flex items-center gap-2 text-sm">
		<Switch checked={exclusive} onCheckedChange={(v) => (exclusive = v)} />
		EX gyms only
	</label>

	<GymPicker bind:gymId />

	<DistanceField bind:distance {maxDistance} />

</form>
