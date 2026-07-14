<script lang="ts">
	import SelectField from "./SelectField.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import DistanceField from "./DistanceField.svelte";
	import {
		fortChangeTypes,
		fortTypes,
		type FortRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	let {
		config,
		initial = null,
		defaultDistance = 0,
		onSubmit
	}: {
		config: PoracleWebConfig | null;
		initial?: FortRule | null;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const seed = initial;
	const maxDistance = $derived(config?.maxDistance ?? 0);

	let fortType = $state(seed?.fort_type ?? "everything");
	let includeEmpty = $state(seed?.include_empty ?? false);
	let chosen = $state(new Set(seed?.change_types ?? []));
	// svelte-ignore state_referenced_locally
	let distance = $state(seed?.distance ?? defaultDistance);

	function toggleChange(value: string) {
		const next = new Set(chosen);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		chosen = next;
	}

	function submit() {
		onSubmit({
			fort_type: fortType,
			include_empty: includeEmpty,
			change_types: [...chosen],
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
			label="Fort type"
			value={fortType}
			options={fortTypes}
			onchange={(v) => (fortType = v)}
		/>

		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground"
				>Change types</span
			>
			<div class="flex flex-wrap gap-1.5">
				{#each fortChangeTypes as c (c.value)}
					{@const on = chosen.has(c.value)}
					<button
						type="button"
						class="rounded-full border px-3 py-1 text-sm transition-colors {on
							? 'border-primary bg-primary/10 text-primary'
							: 'bg-background hover:bg-muted/40'}"
						onclick={() => toggleChange(c.value)}
					>
						{c.label}
					</button>
				{/each}
			</div>
		</div>

		<label class="flex items-center gap-2 text-sm">
			<Switch checked={includeEmpty} onCheckedChange={(v) => (includeEmpty = v)} />
			Include changes with no name / description
		</label>
	</section>

	<section class="flex flex-col gap-3 rounded-md border bg-card p-4 shadow-sm">
		<h3 class="mb-1 text-sm font-semibold">Where</h3>
		<DistanceField bind:distance {maxDistance} />
	</section>
</form>
