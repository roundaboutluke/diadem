<script lang="ts">
	import { Slider } from "bits-ui";
	import SliderCommon from "@/components/ui/input/slider/SliderCommon.svelte";

	let {
		title,
		min,
		max,
		step = 1,
		valueMin = $bindable(),
		valueMax = $bindable(),
		format = (v: number) => String(v)
	}: {
		title: string;
		min: number;
		max: number;
		step?: number;
		valueMin: number;
		valueMax: number;
		format?: (v: number) => string;
	} = $props();
</script>

<div class="flex flex-col gap-1.5">
	<div class="flex items-center gap-2">
		<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</span>
		<span class="ml-auto text-sm font-medium tabular-nums">
			{format(valueMin)} – {format(valueMax)}
		</span>
	</div>
	<Slider.Root
		bind:value={
			() => [valueMin, valueMax],
			(v) => {
				valueMin = v[0];
				valueMax = v[1];
			}
		}
		type="multiple"
		{min}
		{max}
		{step}
		class="relative flex w-full touch-none select-none items-center py-1.5"
	>
		{#snippet children({ thumbItems, tickItems })}
			<SliderCommon {thumbItems} {tickItems} />
		{/snippet}
	</Slider.Root>
</div>
