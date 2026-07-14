<script lang="ts">
	import DistanceField from "./DistanceField.svelte";
	import {
		genderOptions,
		invasionEvents,
		type InvasionRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	let {
		config,
		gruntTypes = [],
		initial = null,
		defaultDistance = 0,
		onSubmit
	}: {
		config: PoracleWebConfig | null;
		gruntTypes?: string[];
		initial?: InvasionRule | null;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let gruntType = $state(seed?.grunt_type ?? "");
	let gender = $state(seed?.gender ?? 0);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit({ grunt_type: gruntType, gender, distance });
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
		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			<span class="font-medium uppercase tracking-wide">Grunt type</span>
			<select
				bind:value={gruntType}
				class="h-10 rounded-md border bg-background px-2 text-sm text-foreground"
			>
				<option value="">Any grunt</option>
				{#if gruntTypes.length}
					<optgroup label="Grunts">
						{#each gruntTypes as t (t)}
							<option value={t}>{t}</option>
						{/each}
					</optgroup>
				{/if}
				<optgroup label="PokéStop events">
					{#each invasionEvents as e (e.value)}
						<option value={e.value}>{e.label}</option>
					{/each}
				</optgroup>
			</select>
		</label>

		<label class="flex flex-col gap-1 text-xs text-muted-foreground">
			<span class="font-medium uppercase tracking-wide">Gender</span>
			<select
				bind:value={gender}
				class="h-10 rounded-md border bg-background px-2 text-sm text-foreground"
			>
				{#each genderOptions as g (g.value)}
					<option value={g.value}>{g.label}</option>
				{/each}
			</select>
		</label>
	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
		<DistanceField bind:distance {maxDistance} />
	</section>
</form>
