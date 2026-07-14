<script lang="ts">
	import { Drawer } from "$lib/drawer";
	import { ArrowLeft } from "@lucide/svelte";
	import CloseButton from "@/components/ui/CloseButton.svelte";
	import Button from "@/components/ui/input/Button.svelte";
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

	const snapPoints = [0.55, 1];
	let snapPoint = $state<number | string>(snapPoints[0]);
	const contentClass = $derived(
		snapPoint === snapPoints[snapPoints.length - 1] ? "drawer-full" : "drawer-partial"
	);
</script>

<Drawer.Root
	{open}
	{snapPoints}
	bind:snapPoint
	onOpenChangeComplete={(o) => {
		if (!o) onClose();
	}}
>
	<Drawer.Portal>
		<Drawer.Backdrop class="fixed inset-0 z-50 backdrop-blur-[1px] backdrop-brightness-95" />
		<Drawer.VirtualKeyboardProvider>
			<Drawer.Viewport class="drawer-viewport flex items-end justify-center z-50!">
				<Drawer.Popup
					class="drawer-popup {contentClass} flex h-full w-full flex-col border border-t-border bg-card/60 px-2 pt-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm sm:max-w-lg"
				>
					<div
						class="mb-2 flex shrink-0 items-center justify-between rounded-lg border border-border bg-card py-1"
					>
						<div class="flex min-w-0 items-center">
							{#if step === "form" && !editingRule}
								<button
									type="button"
									class="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-accent/90 hover:text-foreground"
									aria-label="Back to alert types"
									onclick={onBack}
								>
									<ArrowLeft class="h-4.5 w-4.5" />
								</button>
							{/if}
							<Drawer.Title
								class="{step === 'form' && !editingRule
									? 'ml-1.5'
									: 'ml-4'} truncate text-base font-bold tracking-tight"
							>
								{title}
							</Drawer.Title>
						</div>
						<CloseButton class="mr-1 hover:bg-accent/90! active:bg-accent/90!" onclick={onClose} />
					</div>

					<Drawer.Content class="content flex min-h-0 flex-1 flex-col px-3 pb-6 pt-1">
						{#if step === "pick"}
							<TypePicker types={visibleTypes} {hasIcons} {onPick} />
						{:else if needsMasterfile && !masterfileLoaded}
							<p class="text-sm text-muted-foreground">Loading Pokémon data…</p>
						{:else}
							{#key `${formType}:${editingRule?.uid ?? "new"}`}
								{#if formType === "pokemon"}
									<PokemonForm
										{config}
										{hasIcons}
										{defaultDistance}
										initial={editingRule as PokemonRule | null}
										{onSubmit}
									/>
								{:else if formType === "raid"}
									<RaidForm
										{config}
										{hasIcons}
										{defaultDistance}
										initial={editingRule as RaidRule | null}
										{onSubmit}
									/>
								{:else if formType === "egg"}
									<EggForm
										{config}
										{defaultDistance}
										initial={editingRule as EggRule | null}
										{onSubmit}
									/>
								{:else if formType === "quest"}
									<QuestForm
										{config}
										{hasIcons}
										{defaultDistance}
										initial={editingRule as QuestRule | null}
										{onSubmit}
									/>
								{:else if formType === "invasion"}
									<InvasionForm
										{config}
										{gruntTypes}
										{defaultDistance}
										initial={editingRule as InvasionRule | null}
										{onSubmit}
									/>
								{:else if formType === "lure"}
									<LureForm
										{config}
										{defaultDistance}
										initial={editingRule as LureRule | null}
										{onSubmit}
									/>
								{:else if formType === "gym"}
									<GymForm
										{config}
										{defaultDistance}
										initial={editingRule as GymRule | null}
										{onSubmit}
									/>
								{:else if formType === "nest"}
									<NestForm
										{config}
										{hasIcons}
										{defaultDistance}
										initial={editingRule as NestRule | null}
										{onSubmit}
									/>
								{:else if formType === "maxbattle"}
									<MaxBattleForm
										{config}
										{hasIcons}
										{defaultDistance}
										initial={editingRule as MaxBattleRule | null}
										{onSubmit}
									/>
								{:else if formType === "fort"}
									<FortForm
										{config}
										{defaultDistance}
										initial={editingRule as FortRule | null}
										{onSubmit}
									/>
								{/if}
							{/key}
						{/if}
					</Drawer.Content>

					{#if step === "form" && (!needsMasterfile || masterfileLoaded)}
						<div class="mt-1 flex shrink-0 justify-end border-t border-t-border px-3 pb-1 pt-2">
							<Button type="submit" form="alert-rule-form" disabled={submitting}>Save</Button>
						</div>
					{/if}
				</Drawer.Popup>
			</Drawer.Viewport>
		</Drawer.VirtualKeyboardProvider>
	</Drawer.Portal>
</Drawer.Root>
