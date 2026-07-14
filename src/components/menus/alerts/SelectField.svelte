<script lang="ts">
	import RadioGroup from "@/components/ui/input/selectgroup/RadioGroup.svelte";
	import SelectGroupItem from "@/components/ui/input/selectgroup/SelectGroupItem.svelte";

	let {
		label,
		value,
		options,
		onchange
	}: {
		label: string;
		value: number | string;
		options: readonly { value: number | string; label: string }[];
		onchange: (value: string) => void;
	} = $props();
</script>

<div class="flex flex-col gap-1">
	<span class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
	<RadioGroup value={String(value)} onValueChange={(v) => onchange(v)} class="w-full">
		{#each options as o (o.value)}
			<SelectGroupItem type="radio" value={String(o.value)} class="p-2 flex-1">
				{o.label}
			</SelectGroupItem>
		{/each}
	</RadioGroup>
</div>
