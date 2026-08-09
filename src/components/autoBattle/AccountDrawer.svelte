<script lang="ts">
	// Shared "your connected accounts" panel for the community tools
	// (Auto Battle, Leaderboard, Vivillon). Presents the same account
	// chips + Connect-account flow across all of them, in the same
	// shape as the Auto Battle steps: a side panel on desktop, a
	// bottom drawer on mobile. The tool-specific status/action for the
	// selected account is passed as the `action` snippet.
	//
	// The component owns the account list, selection, connect (via the
	// shared ConnectAccountDialog), and removal; the host page binds
	// `selectedFriendCode` and reacts to it for its own logic (join,
	// subscribe, …). Place it as a sibling of the page's main content
	// inside a flex row so the desktop side panel sits alongside.
	import { onMount, type Snippet } from "svelte";
	import { Drawer } from "$lib/drawer";
	import { isMenuSidebar } from "@/lib/utils/device";
	import Button from "@/components/ui/input/Button.svelte";
	import ConnectAccountDialog from "@/components/autoBattle/ConnectAccountDialog.svelte";
	import {
		getConnectedAccounts,
		removeConnectedAccount,
		type ConnectedAccount
	} from "@/lib/features/autoBattle";
	import { getIconTeam } from "$lib/services/uicons.svelte";
	import { mTeam } from "$lib/services/ingameLocale";
	import * as m from "$lib/paraglide/messages";
	import { ClockAlert, Ellipsis, TriangleAlert, UserPlus } from "@lucide/svelte";
	import { DropdownMenu, Popover } from "bits-ui";

	let {
		selectedFriendCode = $bindable(null),
		bottomPadding = $bindable(undefined),
		action
	}: {
		selectedFriendCode?: string | null;
		/**
		 * CSS padding-bottom the host should apply to its scrollable
		 * content on mobile so everything can scroll clear of the
		 * drawer — the exact pattern the Auto Battle page uses. Tracks
		 * the drawer's current height/snap; undefined on desktop.
		 */
		bottomPadding?: string | undefined;
		/** Tool-specific status/action for the selected account. */
		action?: Snippet<[{ friendCode: string; account: ConnectedAccount } | null]>;
	} = $props();

	let accounts = $state<ConnectedAccount[]>([]);
	let loading = $state(true);
	let connectOpen = $state(false);
	let removing = $state<string | null>(null);
	// Drawer behavior mirrors the Auto Battle page verbatim: always
	// present, h-fit (its size IS its content's size), handle toggles
	// full ↔ 64px mini strip, swipe snaps between 270px peek and full —
	// never dismissed.
	let drawerSnapPoint = $state<number>(1);
	let drawerHeight = $state(0);

	// Mirrors Auto Battle's selectPaddingBottom exactly, exported so the
	// host page can pad its scrollable content clear of the drawer.
	$effect(() => {
		if (isMenuSidebar()) {
			bottomPadding = undefined;
		} else if (drawerSnapPoint === 1) {
			bottomPadding = drawerHeight + 70 + "px";
		} else {
			bottomPadding = drawerSnapPoint + 10 + "px";
		}
	});

	const selectedAccount = $derived(
		accounts.find((account) => account.friendCode === selectedFriendCode) ?? null
	);
	const actionArg = $derived(
		selectedAccount ? { friendCode: selectedAccount.friendCode, account: selectedAccount } : null
	);

	onMount(() => void loadAccounts());

	async function loadAccounts() {
		loading = true;
		try {
			// refresh=true re-pulls live team/level/nickname/state.
			accounts = (await getConnectedAccounts(true)).accounts;
			ensureSelection();
		} catch {
			// Authenticated users only; leave empty otherwise.
		} finally {
			loading = false;
		}
	}

	function ensureSelection() {
		if (accounts.some((account) => account.friendCode === selectedFriendCode)) return;
		const next =
			accounts.find((account) => account.state === "active") ?? accounts[0] ?? null;
		selectedFriendCode = next?.friendCode ?? null;
	}

	function selectAccount(account: ConnectedAccount) {
		if (account.state !== "active") return;
		selectedFriendCode = account.friendCode;
	}

	async function remove(friendCode: string) {
		removing = friendCode;
		try {
			await removeConnectedAccount(friendCode);
			accounts = accounts.filter((account) => account.friendCode !== friendCode);
			ensureSelection();
		} catch {
			// Keep the row on failure so the user can retry.
		} finally {
			removing = null;
		}
	}

	function onAccountConnected(account: ConnectedAccount) {
		if (!accounts.some((existing) => existing.friendCode === account.friendCode)) {
			accounts = [...accounts, account];
		}
		selectedFriendCode = account.friendCode;
	}

	function stateExplanation(state: ConnectedAccount["state"]) {
		if (state === "pending") return m.auto_battle_account_pending();
		if (state === "inactive") return m.auto_battle_account_inactive();
		return "";
	}
</script>

<ConnectAccountDialog bind:open={connectOpen} onaccountconnected={onAccountConnected} />

{#snippet panel()}
	<!-- Structure mirrors AutoBattleControls exactly (no heading — chips
		start immediately) so this drawer sizes identically to the Auto
		Battle page's. -->
	<div class="space-y-3">
		<div
			class="flex gap-2 p-1"
			class:flex-col={isMenuSidebar()}
			class:overflow-x-auto={!isMenuSidebar()}
			class:items-center={!isMenuSidebar()}
		>
			{#each accounts as account (account.friendCode)}
				{@const isSelected = account.friendCode === selectedFriendCode}
				<div
					class="rounded-md bg-accent px-3 py-2 text-sm"
					class:shrink-0={!isMenuSidebar()}
					class:ring-1={isSelected}
					class:ring-primary={isSelected}
					class:opacity-60={account.state !== "active"}
				>
					<div class="flex gap-2 items-center">
						<button
							type="button"
							class="min-w-0 flex-1 text-left flex items-center gap-2 cursor-pointer"
							aria-pressed={isSelected}
							disabled={account.state !== "active"}
							onclick={() => selectAccount(account)}
						>
							<div
								class="flex size-6 items-center justify-center rounded-full border border-yellow-300 bg-yellow-950 text-yellow-100"
							>
								<span class="text-xs font-semibold">{account.level || "?"}</span>
							</div>
							<p class="truncate font-medium">{account.nickname || account.friendCode}</p>
							{#if account.team}
								<img
									class="size-4 shrink-0"
									src={getIconTeam(account.team)}
									alt={mTeam(account.team)}
								/>
							{/if}
						</button>
						{#if account.state !== "active"}
							<Popover.Root>
								<Popover.Trigger>
									{#snippet child({ props })}
										<button
											type="button"
											class="rounded-sm text-yellow-500 outline-none focus-visible:ring-2 focus-visible:ring-ring"
											aria-label={m.auto_battle_account_status()}
											{...props}
										>
											{#if account.state === "pending"}
												<ClockAlert class="size-4.5" />
											{:else}
												<TriangleAlert class="size-4.5" />
											{/if}
										</button>
									{/snippet}
								</Popover.Trigger>
								<Popover.Content
									class="z-50 w-64 rounded-md border border-border bg-card p-3 text-sm shadow-popover"
									side="top"
								>
									<p>{stateExplanation(account.state)}</p>
									{#if account.state === "inactive"}
										<Button class="mt-3 w-full" size="sm" onclick={() => (connectOpen = true)}>
											{m.auto_battle_reconnect_account()}
										</Button>
									{/if}
								</Popover.Content>
							</Popover.Root>
						{/if}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								{#snippet child({ props })}
									<Button
										size="icon"
										variant="ghost"
										class="size-7!"
										aria-label="Account actions"
										disabled={removing === account.friendCode}
										{...props}
									>
										<Ellipsis class="size-4" />
									</Button>
								{/snippet}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content
								class="rounded-md border border-border bg-card p-1 shadow-popover"
								side={isMenuSidebar() ? "right" : "top"}
							>
								{#if account.state === "inactive"}
									<DropdownMenu.Item
										class="cursor-pointer rounded px-3 py-2"
										onSelect={() => (connectOpen = true)}
									>
										{m.auto_battle_reconnect_account()}
									</DropdownMenu.Item>
								{/if}
								<DropdownMenu.Item
									class="cursor-pointer rounded px-3 py-2"
									onSelect={() => void remove(account.friendCode)}
								>
									{m.auto_battle_remove_account()}
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</div>
				</div>
			{/each}
			<Button
				class={isMenuSidebar() ? "w-full" : "shrink-0"}
				variant="outline"
				onclick={() => (connectOpen = true)}
			>
				<UserPlus class="size-3.5" />
				{m.auto_battle_connect_account()}
			</Button>
		</div>

		{#if !loading && accounts.length === 0}
			<p class="text-sm text-muted-foreground">{m.auto_battle_hint_connect()}</p>
		{/if}

		{#if action}
			{@render action(actionArg)}
		{/if}
	</div>
{/snippet}

{#if isMenuSidebar()}
	<aside class="h-full w-96 shrink-0 overflow-y-auto border-l border-border bg-card p-5">
		{@render panel()}
	</aside>
{:else}
	<Drawer.Root
		open={true}
		onOpenChange={(open, details) => {
			if (!open) details.cancel();
		}}
		modal={false}
		defaultOpen={true}
		disablePointerDismissal
		snapPoints={[270, 1]}
		bind:snapPoint={drawerSnapPoint}
	>
		<Drawer.Portal>
			<Drawer.Viewport class="drawer-viewport flex items-end">
				<Drawer.Popup
					class="drawer-popup relative h-fit w-full rounded-t-xl border border-t-border bg-card pb-[env(safe-area-inset-bottom)]"
				>
					<button
						type="button"
						class="mx-auto my-1 flex h-8 w-16 shrink-0 items-center justify-center"
						aria-label={drawerSnapPoint === 1 ? "Minimize account panel" : "Expand account panel"}
						onclick={() => (drawerSnapPoint = drawerSnapPoint === 1 ? 64 : 1)}
					>
						<span class="h-1 w-10 rounded-full bg-ring"></span>
					</button>
					<Drawer.Content class="px-6 pb-5">
						<div bind:clientHeight={drawerHeight}>
							{@render panel()}
						</div>
					</Drawer.Content>
				</Drawer.Popup>
			</Drawer.Viewport>
		</Drawer.Portal>
	</Drawer.Root>
{/if}
