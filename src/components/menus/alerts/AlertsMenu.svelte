<script lang="ts">
	import { onMount, setContext } from "svelte";
	import { Plus } from "@lucide/svelte";
	import { openToast } from "@/lib/ui/toasts.svelte.js";
	import Button from "@/components/ui/input/Button.svelte";
	import RadioGroup from "@/components/ui/input/selectgroup/RadioGroup.svelte";
	import SelectGroupItem from "@/components/ui/input/selectgroup/SelectGroupItem.svelte";
	import { LoadedFeature, hasLoadedFeature } from "@/lib/services/initialLoad.svelte";
	import AreaSelector from "./AreaSelector.svelte";
	import CollapsibleSection from "./CollapsibleSection.svelte";
	import LocationBox from "./LocationBox.svelte";
	import ProfileBar from "./ProfileBar.svelte";
	import ProfilesModal from "./ProfilesModal.svelte";
	import RuleList from "./RuleList.svelte";
	import AlertModal from "./AlertModal.svelte";
	import {
		addProfile,
		bulkDeleteRules,
		copyProfile,
		deleteProfile,
		deleteRule,
		fetchGymNames,
		fetchInit,
		fetchProfiles,
		fetchState,
		fetchTracking,
		PokedexApiError,
		saveAreas,
		saveLocation,
		saveTracking,
		switchProfile,
		updateProfileHours
	} from "@/lib/services/alerts/alerts.client";
	import { typeIcon, sectionIconUrl } from "@/lib/services/alerts/alerts.icons";
	import {
		pokedexTrackingTypes,
		pokedexTypeMeta,
		type AnyRule,
		type PokedexTrackingType,
		type PoracleArea,
		type PoracleHuman,
		type PoracleProfile,
		type PoracleWebConfig
	} from "@/lib/services/alerts/alerts.shared";

	// The native Alerts menu — the notification bell's panel. Replaces the
	// standalone /pokedex page: it fetches the same bundle client-side (a menu
	// has no +page.server.ts load) and drives the two nested $lib/drawer sheets
	// (Add-alert and Settings) that were reworked for this. All CRUD mirrors the
	// old page orchestrator.

	const hasIcons = $derived(hasLoadedFeature(LoadedFeature.ICON_SETS));
	const masterfileLoaded = $derived(hasLoadedFeature(LoadedFeature.MASTER_FILE));
	const masterfileTypes: PokedexTrackingType[] = ["pokemon", "raid", "quest", "nest", "maxbattle"];

	// ── Bootstrap (client-side init) ──
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let config = $state<PoracleWebConfig | null>(null);
	let gruntTypes = $state<string[]>([]);
	let areas = $state<PoracleArea[]>([]);
	let human = $state<PoracleHuman | null>(null);
	let profiles = $state<PoracleProfile[]>([]);
	let selectedAreas = $state<string[]>([]);

	function bundleToRules(
		bundle: Record<string, unknown> | null
	): Partial<Record<PokedexTrackingType, AnyRule[]>> {
		const out: Partial<Record<PokedexTrackingType, AnyRule[]>> = {};
		for (const type of pokedexTrackingTypes) out[type] = bundle ? ((bundle[type] as AnyRule[]) ?? []) : [];
		return out;
	}
	function parseAreas(raw: string | null | undefined): string[] {
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed.map(String) : [];
		} catch {
			return [];
		}
	}

	let rules = $state<Partial<Record<PokedexTrackingType, AnyRule[]>>>(bundleToRules(null));

	onMount(async () => {
		try {
			const init = await fetchInit();
			config = init.config;
			gruntTypes = init.gruntTypes ?? [];
			areas = init.areas ?? [];
			profiles = init.profiles ?? [];
			human = init.human;
			selectedAreas = parseAreas(init.human?.area);
			locationMode = selectedAreas.length > 0 ? "area" : "location";
			rules = bundleToRules(init.tracking as Record<string, unknown> | null);
		} catch (err) {
			loadError = errText(err);
		} finally {
			loading = false;
		}
	});

	// ── Gym-name resolution for raid/egg/gym cards (lazy, permission-gated) ──
	let gymNames = $state<Record<string, string>>({});
	const requestedGyms = new Set<string>();
	$effect(() => {
		const missing: string[] = [];
		for (const t of ["raid", "egg", "gym"] as const) {
			for (const rule of rules[t] ?? []) {
				const gid = (rule as { gym_id?: string | null }).gym_id;
				if (gid && !requestedGyms.has(gid)) {
					requestedGyms.add(gid);
					missing.push(gid);
				}
			}
		}
		if (missing.length > 0) {
			fetchGymNames(missing).then((names) => (gymNames = { ...gymNames, ...names }));
		}
	});

	// ── Derived overview ──
	const disabledHooks = $derived(config?.disabledHooks ?? []);
	const counts = $derived.by(() => {
		const c: Partial<Record<PokedexTrackingType, number>> = {};
		for (const type of pokedexTrackingTypes) c[type] = rules[type]?.length ?? 0;
		return c;
	});
	const visibleTypes = $derived(
		pokedexTrackingTypes.filter((t) => !disabledHooks.includes(pokedexTypeMeta[t].hook))
	);
	const typesWithRules = $derived(visibleTypes.filter((t) => (rules[t]?.length ?? 0) > 0));
	const totalRules = $derived(pokedexTrackingTypes.reduce((n, t) => n + (rules[t]?.length ?? 0), 0));

	// ── Area / location interplay (per-profile) ──
	const hasAreasSelected = $derived(selectedAreas.length > 0);
	const newRuleDefaultDistance = $derived(
		hasAreasSelected ? 0 : config?.defaultDistance && config.defaultDistance > 0 ? config.defaultDistance : 1000
	);
	let locationMode = $state<"location" | "area">("location");
	const initialLat = $derived(human?.latitude ?? null);
	const initialLon = $derived(human?.longitude ?? null);

	// ── Profiles ──
	const currentProfileNo = $derived(human?.current_profile_no ?? 1);
	const activeProfileName = $derived(profiles.find((p) => p.profile_no === currentProfileNo)?.name ?? "");
	// Per-rule scope for the deeply-nested DistanceField.
	setContext("pokedexRuleScope", {
		get hasAreas() {
			return hasAreasSelected;
		},
		get profileName() {
			return activeProfileName;
		}
	});
	let managingProfiles = $state(false);
	let switchingProfile = $state(false);
	let profileBusy = $state(false);
	let savingHours = $state(false);
	let savingLocation = $state(false);
	let savingAreas = $state(false);

	let openSections = $state<Record<PokedexTrackingType, boolean>>(
		Object.fromEntries(pokedexTrackingTypes.map((t) => [t, false])) as Record<PokedexTrackingType, boolean>
	);

	// ── Add/edit form state ──
	let formType = $state<PokedexTrackingType>("pokemon");
	let showPicker = $state(false);
	let showForm = $state(false);
	let editingRule = $state<AnyRule | null>(null);
	let submitting = $state(false);
	let deletingUid = $state<number | null>(null);
	let bulkBusy = $state(false);
	const needsMasterfile = $derived(masterfileTypes.includes(formType));

	// Transient feedback via diadem's toast system (errors linger a little).
	function flash(kind: "error" | "success", text: string) {
		openToast(text, kind === "error" ? 4000 : 1500);
	}
	function errText(err: unknown) {
		return err instanceof PokedexApiError ? err.message : "Something went wrong";
	}

	async function refresh(type: PokedexTrackingType) {
		rules = { ...rules, [type]: await fetchTracking(type) };
	}
	async function refreshProfiles() {
		profiles = await fetchProfiles();
	}

	async function handleSaveAreas(names: string[]) {
		savingAreas = true;
		try {
			const res = await saveAreas(names);
			selectedAreas = res.setAreas ?? names;
			if (human) human = { ...human, area: JSON.stringify(selectedAreas) };
			await refreshProfiles();
			flash("success", "Areas saved.");
		} catch (err) {
			flash("error", errText(err));
		} finally {
			savingAreas = false;
		}
	}

	async function handleSwitchProfile(no: number) {
		if (no === currentProfileNo) return;
		switchingProfile = true;
		try {
			await switchProfile(no);
			const state = await fetchState();
			human = state.human;
			profiles = state.profiles;
			selectedAreas = parseAreas(state.human?.area);
			locationMode = selectedAreas.length > 0 ? "area" : "location";
			rules = bundleToRules(state.tracking);
			closeAlertModal();
		} catch (err) {
			flash("error", errText(err));
		} finally {
			switchingProfile = false;
		}
	}

	async function handleAddProfile(name: string, copyFrom: number | null) {
		profileBusy = true;
		try {
			const before = new Set(profiles.map((p) => p.profile_no));
			await addProfile(name);
			await refreshProfiles();
			if (copyFrom != null) {
				const created = profiles.find((p) => !before.has(p.profile_no));
				if (created) await copyProfile(copyFrom, created.profile_no);
			}
			flash("success", copyFrom != null ? "Profile created with copied rules." : "Profile created.");
		} catch (err) {
			flash("error", errText(err));
		} finally {
			profileBusy = false;
		}
	}

	async function handleDeleteProfile(no: number) {
		profileBusy = true;
		try {
			await deleteProfile(no);
			await refreshProfiles();
			flash("success", "Profile deleted.");
		} catch (err) {
			flash("error", errText(err));
		} finally {
			profileBusy = false;
		}
	}

	async function handleSaveHours(no: number, activeHoursJson: string) {
		savingHours = true;
		try {
			await updateProfileHours(no, activeHoursJson);
			await refreshProfiles();
			flash("success", "Schedule saved.");
		} catch (err) {
			flash("error", errText(err));
		} finally {
			savingHours = false;
		}
	}

	async function handleSaveLocation(lat: number, lon: number, _label?: string) {
		savingLocation = true;
		try {
			await saveLocation(lat, lon);
			if (human) human = { ...human, latitude: lat, longitude: lon };
			await refreshProfiles();
			flash("success", "Location saved.");
		} catch (err) {
			flash("error", errText(err));
		} finally {
			savingLocation = false;
		}
	}

	async function handleBulkDelete(type: PokedexTrackingType, uids: number[]) {
		if (uids.length === 0) return;
		bulkBusy = true;
		try {
			await bulkDeleteRules(type, uids);
			await refresh(type);
			flash("success", `Deleted ${uids.length} rule${uids.length === 1 ? "" : "s"}.`);
		} catch (err) {
			flash("error", errText(err));
		} finally {
			bulkBusy = false;
		}
	}

	async function handleSubmit(rule: Record<string, unknown>) {
		submitting = true;
		const type = formType;
		const original = editingRule;
		try {
			const res = await saveTracking(type, rule);
			if (original) {
				const newUids = (res.newUids as number[]) ?? [];
				const inserted = (res.insert as number) ?? 0;
				if (inserted > 0 && !newUids.includes(original.uid)) {
					await deleteRule(type, original.uid).catch(() => {});
				}
			}
			await refresh(type);
			showForm = false;
			editingRule = null;
			flash("success", original ? "Rule updated." : "Rule added.");
		} catch (err) {
			flash("error", errText(err));
		} finally {
			submitting = false;
		}
	}

	async function handleDelete(type: PokedexTrackingType, uid: number) {
		deletingUid = uid;
		try {
			await deleteRule(type, uid);
			await refresh(type);
		} catch (err) {
			flash("error", errText(err));
		} finally {
			deletingUid = null;
		}
	}

	function startEdit(type: PokedexTrackingType, rule: AnyRule) {
		formType = type;
		editingRule = rule;
		showPicker = false;
		showForm = true;
	}
	function startAdd() {
		showForm = false;
		editingRule = null;
		showPicker = true;
	}
	function pickType(type: PokedexTrackingType) {
		formType = type;
		editingRule = null;
		showPicker = false;
		showForm = true;
	}
	function backToPicker() {
		showForm = false;
		editingRule = null;
		showPicker = true;
	}
	function closeAlertModal() {
		showForm = false;
		showPicker = false;
		editingRule = null;
	}
</script>

<div class="flex flex-col gap-3 px-2 pb-4 pt-1">
	{#if loading}
		<!-- Layout-shaped skeleton (not a bare spinner) so the sheet reads as
			structured while the init bundle loads, instead of flashing empty. -->
		<div class="flex animate-pulse flex-col gap-3" aria-hidden="true">
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 rounded-full bg-muted"></div>
				<div class="h-4 w-20 rounded bg-muted"></div>
				<div class="ml-auto h-8 w-24 rounded-md bg-muted"></div>
			</div>
			<div class="h-9 w-full rounded-md bg-muted"></div>
			{#each Array(4) as _, i (i)}
				<div class="h-12 w-full rounded-md border bg-muted/40"></div>
			{/each}
		</div>
	{:else}
		{#if profiles.length > 0}
			<ProfileBar
				{profiles}
				{currentProfileNo}
				managing={managingProfiles}
				onToggleManage={() => (managingProfiles = !managingProfiles)}
			/>
		{/if}

		{#if loadError}
			<p class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
				{loadError}
			</p>
		{/if}

		<Button size="sm" class="w-full" onclick={startAdd}>
			<Plus class="h-4 w-4" /> Add alert
		</Button>

		{#if totalRules === 0}
			<p class="rounded-md border border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground">
				You're not tracking anything yet. Add an alert to get notified about spawns, raids, quests and
				more.
			</p>
		{:else}
			{#each typesWithRules as type (type)}
				{@const count = rules[type]?.length ?? 0}
				<CollapsibleSection
					icon={typeIcon(type)}
					iconUrl={hasIcons ? (sectionIconUrl(type) ?? undefined) : undefined}
					title={pokedexTypeMeta[type].label}
					subtitle={`${count} alert${count === 1 ? "" : "s"}`}
					bind:open={openSections[type]}
				>
					<RuleList
						{type}
						rules={rules[type] ?? []}
						{hasIcons}
						ready={masterfileLoaded}
						{gymNames}
						{deletingUid}
						{bulkBusy}
						onDelete={(uid) => handleDelete(type, uid)}
						onEdit={(rule) => startEdit(type, rule)}
						onBulkDelete={(uids) => handleBulkDelete(type, uids)}
					/>
				</CollapsibleSection>
			{/each}
		{/if}
	{/if}
</div>

<!-- Active profile's Location / Area editor, handed to the Settings drawer. -->
{#snippet locationEditor()}
	<div class="flex flex-col gap-3">
		<RadioGroup
			value={locationMode}
			onValueChange={(v) => (locationMode = v as "location" | "area")}
			class="w-full"
		>
			<SelectGroupItem type="radio" value="location" class="p-2 flex-1">By location</SelectGroupItem>
			<SelectGroupItem type="radio" value="area" class="p-2 flex-1">By area</SelectGroupItem>
		</RadioGroup>

		{#key currentProfileNo}
			{#if locationMode === "location"}
				<LocationBox lat={initialLat} lon={initialLon} saving={savingLocation} onSave={handleSaveLocation} />
			{:else}
				<AreaSelector {areas} selected={selectedAreas} saving={savingAreas} onSave={handleSaveAreas} />
			{/if}
		{/key}
	</div>
{/snippet}

<!-- Settings (profiles / areas / schedule / location) — nested drawer. -->
<ProfilesModal
	bind:open={managingProfiles}
	{profiles}
	{currentProfileNo}
	busy={profileBusy}
	switching={switchingProfile}
	{savingHours}
	onSwitch={handleSwitchProfile}
	onAdd={handleAddProfile}
	onDelete={handleDeleteProfile}
	onSaveHours={handleSaveHours}
	location={locationEditor}
/>

<!-- Add / edit alert — nested drawer. -->
<AlertModal
	open={showPicker || showForm}
	step={showForm ? "form" : "pick"}
	{formType}
	{editingRule}
	{config}
	{hasIcons}
	{gruntTypes}
	defaultDistance={newRuleDefaultDistance}
	{submitting}
	{needsMasterfile}
	{masterfileLoaded}
	{visibleTypes}
	{counts}
	onPick={pickType}
	onBack={backToPicker}
	onSubmit={handleSubmit}
	onClose={closeAlertModal}
/>
