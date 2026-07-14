<script lang="ts">
	import { onMount, setContext, untrack } from "svelte";
	import { Bell, Plus, Settings2 } from "@lucide/svelte";
	import { openToast } from "@/lib/ui/toasts.svelte.js";
	import RadioGroup from "@/components/ui/input/selectgroup/RadioGroup.svelte";
	import SelectGroupItem from "@/components/ui/input/selectgroup/SelectGroupItem.svelte";
	import { LoadedFeature, hasLoadedFeature } from "@/lib/services/initialLoad.svelte";
	import AreaSelector from "./AreaSelector.svelte";
	import CollapsibleSection from "./CollapsibleSection.svelte";
	import LocationBox from "./LocationBox.svelte";
	import ProfilesModal from "./ProfilesModal.svelte";
	import RuleList from "./RuleList.svelte";
	import AlertModal from "./AlertModal.svelte";
	import { alertsStore, bundleToRules } from "@/lib/services/alerts/alertsStore.svelte";
	import {
		addProfile,
		bulkDeleteRules,
		copyProfile,
		deleteProfile,
		deleteRule,
		fetchGymNames,
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
		type PokedexTrackingType
	} from "@/lib/services/alerts/alerts.shared";

	const hasIcons = $derived(hasLoadedFeature(LoadedFeature.ICON_SETS));
	const masterfileLoaded = $derived(hasLoadedFeature(LoadedFeature.MASTER_FILE));
	const masterfileTypes: PokedexTrackingType[] = ["pokemon", "raid", "quest", "nest", "maxbattle"];

	onMount(() => alertsStore.load());

	function parseAreas(raw: string | null | undefined): string[] {
		if (!raw) return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? parsed.map(String) : [];
		} catch {
			return [];
		}
	}

	let gymNames = $state<Record<string, string>>({});
	const requestedGyms = new Set<string>();
	$effect(() => {
		const missing: string[] = [];
		for (const t of ["raid", "egg", "gym"] as const) {
			for (const rule of alertsStore.rules[t] ?? []) {
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

	const disabledHooks = $derived(alertsStore.config?.disabledHooks ?? []);
	const visibleTypes = $derived(
		pokedexTrackingTypes.filter((t) => !disabledHooks.includes(pokedexTypeMeta[t].hook))
	);
	const typesWithRules = $derived(
		visibleTypes.filter((t) => (alertsStore.rules[t]?.length ?? 0) > 0)
	);

	const selectedAreas = $derived(parseAreas(alertsStore.human?.area));
	const hasAreasSelected = $derived(selectedAreas.length > 0);
	const newRuleDefaultDistance = $derived(
		hasAreasSelected
			? 0
			: alertsStore.config?.defaultDistance && alertsStore.config.defaultDistance > 0
				? alertsStore.config.defaultDistance
				: 1000
	);
	const initialLat = $derived(alertsStore.human?.latitude ?? null);
	const initialLon = $derived(alertsStore.human?.longitude ?? null);

	const currentProfileNo = $derived(alertsStore.human?.current_profile_no ?? 1);
	const activeProfileName = $derived(
		alertsStore.profiles.find((p) => p.profile_no === currentProfileNo)?.name ?? ""
	);
	setContext("pokedexRuleScope", {
		get hasAreas() {
			return hasAreasSelected;
		},
		get profileName() {
			return activeProfileName;
		}
	});

	let locationMode = $state<"location" | "area">("location");
	$effect(() => {
		void currentProfileNo;
		locationMode = untrack(() => (selectedAreas.length > 0 ? "area" : "location"));
	});

	let managingProfiles = $state(false);
	let switchingProfile = $state(false);
	let profileBusy = $state(false);
	let savingHours = $state(false);
	let savingLocation = $state(false);
	let savingAreas = $state(false);

	let openSections = $state<Record<PokedexTrackingType, boolean>>(
		Object.fromEntries(pokedexTrackingTypes.map((t) => [t, false])) as Record<
			PokedexTrackingType,
			boolean
		>
	);

	let formType = $state<PokedexTrackingType>("pokemon");
	let showPicker = $state(false);
	let showForm = $state(false);
	let editingRule = $state<AnyRule | null>(null);
	let submitting = $state(false);
	let deletingUid = $state<number | null>(null);
	let bulkBusy = $state(false);
	const needsMasterfile = $derived(masterfileTypes.includes(formType));

	function flash(kind: "error" | "success", text: string) {
		openToast(text, kind === "error" ? 4000 : 1500);
	}
	function errText(err: unknown) {
		return err instanceof PokedexApiError ? err.message : "Something went wrong";
	}

	async function refresh(type: PokedexTrackingType) {
		alertsStore.rules = { ...alertsStore.rules, [type]: await fetchTracking(type) };
	}
	async function refreshProfiles() {
		alertsStore.profiles = await fetchProfiles();
	}

	async function handleSaveAreas(names: string[]) {
		savingAreas = true;
		try {
			const res = await saveAreas(names);
			if (alertsStore.human) {
				alertsStore.human = { ...alertsStore.human, area: JSON.stringify(res.setAreas ?? names) };
			}
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
			alertsStore.human = state.human;
			alertsStore.profiles = state.profiles;
			alertsStore.rules = bundleToRules(state.tracking);
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
			const before = new Set(alertsStore.profiles.map((p) => p.profile_no));
			await addProfile(name);
			await refreshProfiles();
			if (copyFrom != null) {
				const created = alertsStore.profiles.find((p) => !before.has(p.profile_no));
				if (created) await copyProfile(copyFrom, created.profile_no);
			}
			flash(
				"success",
				copyFrom != null ? "Profile created with copied rules." : "Profile created."
			);
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
			if (alertsStore.human) {
				alertsStore.human = { ...alertsStore.human, latitude: lat, longitude: lon };
			}
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
	{#if alertsStore.loading && !alertsStore.loaded}
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
		<div class="grid grid-cols-2 gap-2">
			<button
				type="button"
				class="flex flex-col items-center justify-center gap-1 rounded-md border border-transparent bg-primary px-3 py-2.5 text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
				onclick={startAdd}
			>
				<Plus class="h-5 w-5" />
				<span class="text-sm font-semibold">Add alert</span>
			</button>
			<button
				type="button"
				class="flex flex-col items-center justify-center gap-1 rounded-md border px-3 py-2.5 shadow-sm transition-colors hover:bg-muted/40 {managingProfiles
					? 'bg-muted'
					: 'bg-card'}"
				onclick={() => (managingProfiles = !managingProfiles)}
			>
				<Settings2 class="h-5 w-5 text-muted-foreground" />
				<span class="text-sm font-semibold">Settings</span>
				{#if activeProfileName}
					<span class="max-w-full truncate text-xs text-muted-foreground">{activeProfileName}</span>
				{/if}
			</button>
		</div>

		{#if alertsStore.error}
			<p
				class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{alertsStore.error}
			</p>
		{/if}

		{#if alertsStore.total === 0}
			<div
				class="flex flex-col items-center gap-3 rounded-md border border-dashed bg-card px-4 py-10 text-center"
			>
				<Bell class="h-8 w-8 text-muted-foreground/50" />
				<div>
					<p class="text-sm font-medium">No alerts yet</p>
					<p class="mt-1 text-sm text-muted-foreground">
						Add one to get notified about spawns, raids, quests and more.
					</p>
				</div>
			</div>
		{:else}
			{#each typesWithRules as type (type)}
				{@const count = alertsStore.rules[type]?.length ?? 0}
				<CollapsibleSection
					icon={typeIcon(type)}
					iconUrl={hasIcons ? (sectionIconUrl(type) ?? undefined) : undefined}
					title={pokedexTypeMeta[type].label}
					subtitle={`${count} alert${count === 1 ? "" : "s"}`}
					bind:open={openSections[type]}
				>
					<RuleList
						{type}
						rules={alertsStore.rules[type] ?? []}
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

{#snippet locationEditor()}
	<div class="flex flex-col gap-3">
		<RadioGroup
			value={locationMode}
			onValueChange={(v) => (locationMode = v as "location" | "area")}
			class="w-full"
		>
			<SelectGroupItem type="radio" value="location" class="p-2 flex-1">By location</SelectGroupItem
			>
			<SelectGroupItem type="radio" value="area" class="p-2 flex-1">By area</SelectGroupItem>
		</RadioGroup>

		{#key currentProfileNo}
			{#if locationMode === "location"}
				<LocationBox
					lat={initialLat}
					lon={initialLon}
					saving={savingLocation}
					onSave={handleSaveLocation}
				/>
			{:else}
				<AreaSelector
					areas={alertsStore.areas}
					selected={selectedAreas}
					saving={savingAreas}
					onSave={handleSaveAreas}
				/>
			{/if}
		{/key}
	</div>
{/snippet}

<ProfilesModal
	bind:open={managingProfiles}
	profiles={alertsStore.profiles}
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

<AlertModal
	open={showPicker || showForm}
	step={showForm ? "form" : "pick"}
	{formType}
	{editingRule}
	config={alertsStore.config}
	{hasIcons}
	gruntTypes={alertsStore.gruntTypes}
	defaultDistance={newRuleDefaultDistance}
	{submitting}
	{needsMasterfile}
	{masterfileLoaded}
	{visibleTypes}
	onPick={pickType}
	onBack={backToPicker}
	onSubmit={handleSubmit}
	onClose={closeAlertModal}
/>
