<script lang="ts">
	import type { AnyFilterset } from "@/lib/features/filters/filtersets";
	import MenuTitle from "@/components/menus/MenuTitle.svelte";
	import Switch from "@/components/ui/input/Switch.svelte";
	import Slider from "@/components/ui/input/slider/Slider.svelte";
	import Card from "@/components/ui/Card.svelte";
	import * as m from "@/lib/paraglide/messages";
	import ColorSwatches from "@/components/menus/filters/filterset/modifiers/ColorSwatches.svelte";
	import ModifierPreview from "@/components/menus/filters/filterset/modifiers/ModifierPreview.svelte";
	import {
		DEFAULT_BACKGROUND_COLOR,
		DEFAULT_GLOW_COLOR,
		MODIFIER_BACKGROUND_OPACITY,
		MODIFIER_GLOW_OPACITY,
		MODIFIER_GLOW_RADIUS
	} from "@/lib/features/filters/modifierPresets";

	let {
		data,
		iconUrl = undefined
	}: {
		data: AnyFilterset;
		iconUrl?: string;
	} = $props();

	let glowEnabled = $derived(Boolean(data.modifiers?.glow));
	let backgroundEnabled = $derived(Boolean(data.modifiers?.background));

	function ensureModifiers() {
		if (!data.modifiers) data.modifiers = {};
	}

	function cleanupModifiers() {
		if (
			data.modifiers &&
			!data.modifiers.glow &&
			!data.modifiers.background &&
			!data.modifiers.scale &&
			!data.modifiers.rotation
		) {
			delete data.modifiers;
		}
	}

	function getDefaultGlow() {
		return {
			color: DEFAULT_GLOW_COLOR,
			radius: MODIFIER_GLOW_RADIUS,
			opacity: MODIFIER_GLOW_OPACITY
		};
	}

	function getDefaultBackground() {
		return {
			color: DEFAULT_BACKGROUND_COLOR,
			opacity: MODIFIER_BACKGROUND_OPACITY
		};
	}

	function toggleGlow(enabled: boolean) {
		if (enabled) {
			ensureModifiers();
			data.modifiers!.glow = getDefaultGlow();
		} else if (data.modifiers) {
			delete data.modifiers.glow;
			cleanupModifiers();
		}
	}

	function toggleBackground(enabled: boolean) {
		if (enabled) {
			ensureModifiers();
			data.modifiers!.background = getDefaultBackground();
		} else if (data.modifiers) {
			delete data.modifiers.background;
			cleanupModifiers();
		}
	}

	function setScale(value: number) {
		const rounded = Number(value.toFixed(2));
		if (rounded === 1) {
			if (data.modifiers) {
				delete data.modifiers.scale;
				cleanupModifiers();
			}
			return;
		}

		ensureModifiers();
		data.modifiers!.scale = rounded;
	}

	function setRotation(value: number) {
		const rounded = Math.round(value);
		if (rounded === 0) {
			if (data.modifiers) {
				delete data.modifiers.rotation;
				cleanupModifiers();
			}
			return;
		}

		ensureModifiers();
		data.modifiers!.rotation = rounded;
	}
</script>

<div class="space-y-3 pb-2">
	<ModifierPreview modifiers={data.modifiers} {iconUrl} />

	<Card class="p-3 space-y-3">
		<div class="flex items-center justify-between gap-2">
			<MenuTitle title={m.modifier_glow()} />
			<Switch checked={glowEnabled} onCheckedChange={toggleGlow} />
		</div>
		{#if data.modifiers?.glow}
			<div class="space-y-2">
				<p class="text-sm text-muted-foreground">{m.modifier_glow_color()}</p>
				<ColorSwatches
					selected={data.modifiers.glow.color}
					onchange={(color) => {
						if (data.modifiers?.glow) {
							data.modifiers.glow = { ...getDefaultGlow(), ...data.modifiers.glow, color };
						}
					}}
				/>
				<Slider
					title={m.modifier_glow_intensity()}
					min={0.2}
					max={1}
					step={0.05}
					value={data.modifiers.glow.opacity ?? MODIFIER_GLOW_OPACITY}
					onchange={(value) => {
						if (data.modifiers?.glow) {
							data.modifiers.glow = {
								...getDefaultGlow(),
								...data.modifiers.glow,
								opacity: Number(value.toFixed(2))
							};
						}
					}}
				/>
			</div>
		{/if}
	</Card>

	<Card class="p-3 space-y-3">
		<div class="flex items-center justify-between gap-2">
			<MenuTitle title={m.modifier_background()} />
			<Switch checked={backgroundEnabled} onCheckedChange={toggleBackground} />
		</div>
		{#if data.modifiers?.background}
			<div class="space-y-2">
				<p class="text-sm text-muted-foreground">{m.modifier_background_color()}</p>
				<ColorSwatches
					selected={data.modifiers.background.color}
					onchange={(color) => {
						if (data.modifiers?.background) {
							data.modifiers.background = {
								...getDefaultBackground(),
								...data.modifiers.background,
								color
							};
						}
					}}
				/>
			</div>
		{/if}
	</Card>

	<Card class="p-3">
		<Slider
			title={m.modifier_scale()}
			min={0.5}
			max={2}
			step={0.05}
			value={data.modifiers?.scale ?? 1}
			onchange={setScale}
		/>
		<Slider
			title={m.modifier_rotation()}
			min={0}
			max={360}
			step={5}
			value={data.modifiers?.rotation ?? 0}
			onchange={setRotation}
		/>
	</Card>
</div>
