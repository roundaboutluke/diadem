<script lang="ts">
	import type { Snippet } from "svelte";
	import { Drawer } from "$lib/drawer";
	import { Check, Clock, MapPin, Plus, Settings2, Trash2, UserRound } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import Input from "@/components/ui/input/Input.svelte";
	import CloseButton from "@/components/ui/CloseButton.svelte";
	import MenuCard from "@/components/menus/MenuCard.svelte";
	import ActiveHoursEditor from "./ActiveHoursEditor.svelte";
	import type { PoracleProfile } from "@/lib/services/alerts/alerts.shared";

	// Settings bottom-sheet on $lib/drawer, styled to match the main menu
	// drawer (translucent card surface + inset pill title). The body is flat
	// diadem MenuCards (Profile / Location / Schedule) — not collapsible
	// dropdowns — so it reads like the rest of the tooling. The Profile card
	// switches in place and creates profiles; the Location editor is injected
	// as a snippet so this component stays decoupled from the pickers.
	let {
		open = $bindable(false),
		profiles,
		currentProfileNo,
		busy = false,
		switching = false,
		savingHours = false,
		onSwitch,
		onAdd,
		onDelete,
		onSaveHours,
		location
	}: {
		open?: boolean;
		profiles: PoracleProfile[];
		currentProfileNo: number;
		busy?: boolean;
		switching?: boolean;
		savingHours?: boolean;
		onSwitch: (profileNo: number) => void;
		onAdd: (name: string, copyFrom: number | null) => void;
		onDelete: (profileNo: number) => void;
		onSaveHours: (profileNo: number, activeHoursJson: string) => void;
		location?: Snippet;
	} = $props();

	const activeProfile = $derived(
		profiles.find((p) => p.profile_no === currentProfileNo) ?? profiles[0] ?? null
	);

	// New-profile inline form
	let showNew = $state(false);
	let newName = $state("");
	let copyFrom = $state<number | "">("");

	function submitAdd() {
		const name = newName.trim();
		if (!name) return;
		onAdd(name, copyFrom === "" ? null : copyFrom);
		newName = "";
		copyFrom = "";
		showNew = false;
	}
</script>

<Drawer.Root bind:open>
	<Drawer.Portal>
		<Drawer.Backdrop class="fixed inset-0 z-50 backdrop-blur-[1px] backdrop-brightness-95" />
		<Drawer.VirtualKeyboardProvider>
			<Drawer.Viewport class="drawer-viewport flex items-end justify-center z-50!">
				<Drawer.Popup
					aria-label="Settings"
					class="drawer-popup flex h-fit max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-xl border border-t-border bg-card/60 px-2 pt-2 backdrop-blur-sm sm:max-w-lg"
				>
					<!-- Inset pill title — mirrors the main menu drawer's MobileTitle. -->
					<div
						class="mb-2 flex shrink-0 items-center gap-2 rounded-lg border border-border bg-card px-4 py-1.5 text-base font-bold"
					>
						<Settings2 class="h-4.5 w-4.5 shrink-0 text-primary" />
						Settings
						<CloseButton
							class="ml-auto hover:bg-accent/90! active:bg-accent/90!"
							onclick={() => (open = false)}
						/>
					</div>

					<Drawer.Content
						class="content flex min-h-0 flex-col gap-2 overflow-y-auto overflow-x-hidden px-1 pt-1"
						style="padding-bottom: max(1rem, env(safe-area-inset-bottom)); overscroll-behavior: contain;"
					>
						<!-- Profile selector (switch + create) -->
						<MenuCard title="Profile" Icon={UserRound}>
							<!-- Borderless rows: selection carried by a primary fill so
								the list reads as one continuous menu. -->
							<div class="flex flex-col gap-1 px-2">
								{#each profiles as p (p.profile_no)}
									{@const isActive = p.profile_no === currentProfileNo}
									<div
										class="flex items-center rounded-md transition-colors {isActive
											? 'bg-primary text-primary-foreground shadow-sm'
											: 'hover:bg-muted/40'}"
									>
										<button
											type="button"
											class="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left disabled:cursor-default"
											disabled={switching || isActive}
											onclick={() => onSwitch(p.profile_no)}
										>
											<span class="min-w-0 flex-1 truncate text-sm font-medium">
												{p.name || `Profile ${p.profile_no}`}
											</span>
											{#if isActive}
												<Check class="h-4 w-4 shrink-0" />
											{/if}
										</button>
										{#if p.profile_no !== 1}
											<button
												type="button"
												class="mr-1 shrink-0 rounded-md p-1.5 transition-colors disabled:opacity-50 {isActive
													? 'text-primary-foreground/80 hover:bg-primary-foreground/15'
													: 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'}"
												aria-label="Delete profile"
												disabled={busy}
												onclick={() => onDelete(p.profile_no)}
											>
												<Trash2 class="h-4 w-4" />
											</button>
										{/if}
									</div>
								{/each}

								<!-- New-profile row. -->
								<button
									type="button"
									class="flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-primary transition-colors hover:bg-muted/40"
									onclick={() => (showNew = !showNew)}
								>
									<Plus class="h-4 w-4 shrink-0" />
									<span class="text-sm font-medium">New profile</span>
								</button>

								{#if showNew}
									<div class="mt-1 flex flex-col gap-3 rounded-md border border-dashed p-3">
										<label class="flex flex-col gap-1 text-xs text-muted-foreground">
											Profile name
											<Input
												value={newName}
												oninput={(e: Event) => (newName = (e.target as HTMLInputElement).value)}
												placeholder="e.g. Work, Home"
												class="text-foreground"
											/>
										</label>
										<label class="flex flex-col gap-1 text-xs text-muted-foreground">
											Copy rules from
											<select
												bind:value={copyFrom}
												class="h-10 rounded-md border bg-background px-2 text-sm text-foreground"
											>
												<option value="">Start empty</option>
												{#each profiles as p (p.profile_no)}
													<option value={p.profile_no}>{p.name || `Profile ${p.profile_no}`}</option>
												{/each}
											</select>
										</label>
										<div class="flex items-center gap-2">
											<Button size="sm" onclick={submitAdd} disabled={busy || newName.trim().length === 0}>
												<Plus class="h-4 w-4" /> Create
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onclick={() => {
													showNew = false;
													newName = "";
													copyFrom = "";
												}}
											>
												Cancel
											</Button>
										</div>
									</div>
								{/if}
							</div>
						</MenuCard>

						{#if activeProfile}
							<MenuCard title="Location" Icon={MapPin}>
								<div class="px-4">
									{#if location}
										{@render location()}
									{/if}
								</div>
							</MenuCard>

							<MenuCard title="Schedule" Icon={Clock}>
								<div class="px-4">
									{#key currentProfileNo}
										<ActiveHoursEditor
											profile={activeProfile}
											saving={savingHours}
											onSave={onSaveHours}
										/>
									{/key}
								</div>
							</MenuCard>
						{/if}
					</Drawer.Content>
				</Drawer.Popup>
			</Drawer.Viewport>
		</Drawer.VirtualKeyboardProvider>
	</Drawer.Portal>
</Drawer.Root>
