<script lang="ts">
	import SelectField from "./SelectField.svelte";
	import DistanceField from "./DistanceField.svelte";
	import {
		lureTypes,
		type LureRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	let {
		config,
		initial = null,
		defaultDistance = 0,
		onSubmit
	}: {
		config: PoracleWebConfig | null;
		initial?: LureRule | null;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let lureId = $state(seed?.lure_id ?? 0);
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function submit() {
		onSubmit({ lure_id: lureId, distance });
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
			label="Lure type"
			value={lureId}
			options={lureTypes}
			onchange={(v) => (lureId = Number(v))}
		/>
	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
		<DistanceField bind:distance {maxDistance} />
	</section>
</form>
