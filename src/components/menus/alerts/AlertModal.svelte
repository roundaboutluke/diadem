<script lang="ts">
	import { Drawer } from "$lib/drawer";
	import { ArrowLeft } from "@lucide/svelte";
	import CloseButton from "@/components/ui/CloseButton.svelte";
	import TypePicker from "./TypePicker.svelte";
	import PokemonForm from "./PokemonForm.svelte";
	import RaidForm from "./RaidForm.svelte";
	import EggForm from "./EggForm.svelte";
	import QuestForm from "./QuestForm.svelte";
	import InvasionForm from "./InvasionForm.svelte";
	import LureForm from "./LureForm.svelte";
	import GymForm from "./GymForm.svelte";
	import NestForm from "./NestForm.svelte";
	import MaxBattleForm from "./MaxBattleForm.svelte";
	import FortForm from "./FortForm.svelte";
	import {
		pokedexTypeMeta,
		type AnyRule,
		type EggRule,
		type FortRule,
		type GymRule,
		type InvasionRule,
		type LureRule,
		type MaxBattleRule,
		type NestRule,
		type PokedexTrackingType,
		type PokemonRule,
		type PoracleWebConfig,
		type QuestRule,
		type RaidRule
	} from "@/lib/services/alerts/alerts.shared";

	// The "Add / Edit alert" flow as a bottom-sheet on the new $lib/drawer
	// (matching the Settings modal). Drawer.VirtualKeyboardProvider handles the
	// on-screen keyboard so the form's text fields stay usable. Adding flows
	// pick-type → form (Back returns to the picker); editing jumps straight to
	// the form. All view state lives on the parent; this is a thin presenter
	// driven by `step`.
	let {
		open = false,
		step,
		formType,
		editingRule,
		config,
		hasIcons,
		gruntTypes,
		defaultDistance,
		submitting,
		needsMasterfile,
		masterfileLoaded,
		visibleTypes,
		counts,
		onPick,
		onBack,
		onSubmit,
		onClose
	}: {
		open?: boolean;
		step: "pick" | "form";
		formType: PokedexTrackingType;
		editingRule: AnyRule | null;
		config: PoracleWebConfig | null;
		hasIcons: boolean;
		gruntTypes: string[];
		defaultDistance: number;
		submitting: boolean;
		needsMasterfile: boolean;
		masterfileLoaded: boolean;
		visibleTypes: PokedexTrackingType[];
		counts: Partial<Record<PokedexTrackingType, number>>;
		onPick: (type: PokedexTrackingType) => void;
		onBack: () => void;
		onSubmit: (rule: Record<string, unknown>) => void;
		onClose: () => void;
	} = $props();

	const title = $derived(
		step === "pick"
			? "Add alert"
			: editingRule
				? `Edit ${pokedexTypeMeta[formType].label} alert`
				: `New ${pokedexTypeMeta[formType].label} alert`
	);
</script>

<Drawer.Root
	{open}
	onOpenChangeComplete={(o) => {
		if (!o) onClose();
	}}
>
	<Drawer.Portal>
		<Drawer.Backdrop class="fixed inset-0 z-50 backdrop-blur-[1px] backdrop-brightness-95" />
		<Drawer.VirtualKeyboardProvider>
			<Drawer.Viewport class="drawer-viewport flex items-end justify-center z-50!">
				<Drawer.Popup
					class="drawer-popup flex h-[85dvh] w-full flex-col overflow-hidden rounded-t-xl border-t bg-background sm:max-w-lg"
				>
					<div class="mx-auto mb-1 mt-3 h-1 w-10 shrink-0 rounded-full bg-ring"></div>
			<Drawer.Title
				class="flex shrink-0 items-center gap-2 border-b px-5 py-3 text-base font-semibold"
			>
				{#if step === "form" && !editingRule}
					<button
						type="button"
						class="-ml-1.5 rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
						aria-label="Back to alert types"
						onclick={onBack}
					>
						<ArrowLeft class="h-4.5 w-4.5" />
					</button>
				{/if}
				{title}
				<CloseButton class="ml-auto" onclick={onClose} />
			</Drawer.Title>

			<Drawer.Content
				class="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain px-5 py-4"
				style="padding-bottom: max(1rem, env(safe-area-inset-bottom));"
			>
				{#if step === "pick"}
					<TypePicker types={visibleTypes} {counts} {onPick} onCancel={onClose} />
				{:else if needsMasterfile && !masterfileLoaded}
					<p class="text-sm text-muted-foreground">Loading Pokémon data…</p>
				{:else}
					{#key `${formType}:${editingRule?.uid ?? "new"}`}
						{#if formType === "pokemon"}
							<PokemonForm {config} {hasIcons} {defaultDistance} initial={editingRule as PokemonRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "raid"}
							<RaidForm {config} {hasIcons} {defaultDistance} initial={editingRule as RaidRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "egg"}
							<EggForm {config} {defaultDistance} initial={editingRule as EggRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "quest"}
							<QuestForm {config} {hasIcons} {defaultDistance} initial={editingRule as QuestRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "invasion"}
							<InvasionForm {config} {gruntTypes} {defaultDistance} initial={editingRule as InvasionRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "lure"}
							<LureForm {config} {defaultDistance} initial={editingRule as LureRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "gym"}
							<GymForm {config} {defaultDistance} initial={editingRule as GymRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "nest"}
							<NestForm {config} {hasIcons} {defaultDistance} initial={editingRule as NestRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "maxbattle"}
							<MaxBattleForm {config} {hasIcons} {defaultDistance} initial={editingRule as MaxBattleRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{:else if formType === "fort"}
							<FortForm {config} {defaultDistance} initial={editingRule as FortRule | null} {submitting} {onSubmit} onCancel={onClose} />
						{/if}
					{/key}
				{/if}
			</Drawer.Content>
				</Drawer.Popup>
			</Drawer.Viewport>
		</Drawer.VirtualKeyboardProvider>
	</Drawer.Portal>
</Drawer.Root>
