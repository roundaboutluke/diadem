<script lang="ts">
	import Button from "@/components/ui/input/Button.svelte";
	import DistanceField from "./DistanceField.svelte";
	import {
		genderOptions,
		invasionEvents,
		type InvasionRule,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	// Team GO Rocket invasion rule. grunt_type is the character/type
	// string (e.g. "Dark", "Giovanni"); empty = any. gruntTypes is the
	// unique list derived from the masterdata by the config endpoint.
	let {
		config,
		gruntTypes = [],
		initial = null,
		submitting = false,
		defaultDistance = 0,
		onSubmit,
		onCancel
	}: {
		config: PoracleWebConfig | null;
		gruntTypes?: string[];
		initial?: InvasionRule | null;
		submitting?: boolean;
		defaultDistance?: number;
		onSubmit: (rule: Record<string, unknown>) => void;
		onCancel?: () => void;
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

<div class="flex flex-col gap-4 rounded-md border bg-card p-4">
	<label class="flex flex-col gap-1 text-xs text-muted-foreground">
		Grunt type
		<select bind:value={gruntType} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
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
		Gender
		<select bind:value={gender} class="h-10 rounded-md border bg-background px-2 text-sm text-foreground">
			{#each genderOptions as g (g.value)}
				<option value={g.value}>{g.label}</option>
			{/each}
		</select>
	</label>

	<DistanceField bind:distance {maxDistance} />

	<div class="flex items-center justify-end gap-2">
		{#if onCancel}<Button variant="outline" onclick={onCancel} disabled={submitting}>Cancel</Button>{/if}
		<Button onclick={submit} disabled={submitting}>
			Save
		</Button>
	</div>
</div>
