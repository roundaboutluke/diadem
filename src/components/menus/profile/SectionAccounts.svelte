<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { clearOverlays } from "@/lib/ui/overlays.svelte";
	import { Users, Unplug, UserPlus, LoaderCircle } from "@lucide/svelte";
	import MenuCard from "@/components/menus/MenuCard.svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import {
		getConnectedAccounts,
		removeConnectedAccount,
		type ConnectedAccount
	} from "@/lib/features/autoBattle";

	let accounts = $state<ConnectedAccount[]>([]);
	let loading = $state(true);
	let removing = $state<string | null>(null);

	const stateLabel: Record<ConnectedAccount["state"], string> = {
		active: "",
		pending: "Awaiting friend request",
		inactive: "Reconnect — friend code changed"
	};

	onMount(async () => {
		try {
			accounts = (await getConnectedAccounts()).accounts;
		} catch {
			// Only available to authenticated users; leave the list empty otherwise.
		} finally {
			loading = false;
		}
	});

	async function disconnect(friendCode: string) {
		removing = friendCode;
		try {
			await removeConnectedAccount(friendCode);
			accounts = accounts.filter((account) => account.friendCode !== friendCode);
		} catch {
			// Keep the row on failure so the user can retry.
		} finally {
			removing = null;
		}
	}
</script>

<MenuCard title="Connected Accounts" Icon={Users}>
	<div class="py-3 px-4 w-full">
		{#if loading}
			<div class="flex items-center gap-2 text-muted-foreground text-sm">
				<LoaderCircle class="size-4 animate-spin" />
				<span>Loading…</span>
			</div>
		{:else if accounts.length === 0}
			<p class="text-sm text-muted-foreground">
				No connected accounts yet. Connect your Pokémon GO account to use Auto Battle.
			</p>
		{:else}
			<div class="flex flex-col gap-2">
				{#each accounts as account (account.friendCode)}
					<div class="flex gap-2 items-center">
						<div
							class="border border-yellow-300 rounded-full size-6 flex items-center justify-center shrink-0"
						>
							<span class="text-xs font-semibold">{account.level || "?"}</span>
						</div>
						<div class="min-w-0">
							<span class="font-medium block truncate">
								{account.nickname || account.friendCode}
							</span>
							{#if stateLabel[account.state]}
								<span class="text-xs text-muted-foreground">{stateLabel[account.state]}</span>
							{/if}
						</div>
						<Button
							class="ml-auto shrink-0"
							size="icon"
							variant="outline"
							disabled={removing === account.friendCode}
							onclick={() => void disconnect(account.friendCode)}
						>
							{#if removing === account.friendCode}
								<LoaderCircle class="size-3.5 animate-spin" />
							{:else}
								<Unplug class="size-3.5" />
							{/if}
						</Button>
					</div>
				{/each}
			</div>
		{/if}

		<Button
			class="mt-3 w-full"
			variant="outline"
			onclick={() => {
				clearOverlays();
				void goto("/battle");
			}}
		>
			<UserPlus class="size-3.5" />
			Connect new account
		</Button>
	</div>
</MenuCard>
