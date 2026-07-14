<script lang="ts">
	import { getContext } from "svelte";
	import Input from "@/components/ui/input/Input.svelte";
	import RadioGroup from "@/components/ui/input/selectgroup/RadioGroup.svelte";
	import SelectGroupItem from "@/components/ui/input/selectgroup/SelectGroupItem.svelte";
	import { clampInt } from "@/lib/services/alerts/alerts.shared";

	let {
		distance = $bindable(0),
		maxDistance = 0
	}: {
		distance?: number;
		maxDistance?: number;
	} = $props();

	const scope = getContext<
		{ readonly hasAreas: boolean; readonly profileName: string } | undefined
	>("pokedexRuleScope");
	const hasAreas = $derived(scope?.hasAreas ?? true);
	const profileName = $derived(scope?.profileName ?? "");

	let radius = $state(distance > 0 ? distance : 1000);

	const useRadius = $derived(distance > 0);

	$effect(() => {
		if (!hasAreas && distance <= 0) {
			distance = clampInt(radius > 0 ? radius : 1000, 1, maxDistance > 0 ? maxDistance : 1_000_000);
		}
	});

	function setMode(toRadius: boolean) {
		if (toRadius) {
			distance = clampInt(radius || 1000, 1, maxDistance > 0 ? maxDistance : 1_000_000);
			radius = distance;
		} else {
			distance = 0;
		}
	}

	function onRadiusInput(value: number) {
		radius = clampInt(value, 1, maxDistance > 0 ? maxDistance : 1_000_000);
		distance = radius;
	}
</script>

<div class="flex flex-col gap-2">
	<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Distance</span>
	{#if hasAreas}
		<RadioGroup
			value={useRadius ? "radius" : "area"}
			onValueChange={(v) => setMode(v === "radius")}
			class="w-full"
		>
			<SelectGroupItem type="radio" value="area" class="p-2 flex-1">My areas</SelectGroupItem>
			<SelectGroupItem type="radio" value="radius" class="p-2 flex-1">Within radius</SelectGroupItem
			>
		</RadioGroup>
	{/if}
	{#if !hasAreas || useRadius}
		<div class="flex items-center gap-2">
			<Input
				type="number"
				min="1"
				max={maxDistance > 0 ? maxDistance : undefined}
				value={radius}
				oninput={(e: Event) => onRadiusInput(Number((e.target as HTMLInputElement).value))}
				class="w-32"
			/>
			<span class="text-sm text-muted-foreground">
				metres{maxDistance > 0 ? ` (max ${maxDistance.toLocaleString()})` : ""}
			</span>
		</div>
		<p class="text-xs text-muted-foreground">
			Distance from your set location{profileName ? ` (${profileName})` : ""}.
		</p>
	{/if}
</div>
