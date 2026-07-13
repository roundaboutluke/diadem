<script lang="ts">
	import { LoaderCircle, LocateFixed, MapPin, Search, X } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import { getLocale } from "@/lib/paraglide/runtime";
	import type { AddressData } from "@/lib/features/geocoding";

	// Location picker for the active profile. Search an address via
	// Diadem's Photon-backed /api/search/address endpoint, or grab the
	// browser's current position, then save the coordinates. AddressData
	// centre is GeoJSON order [lon, lat].
	let {
		lat = null,
		lon = null,
		label = "",
		saving = false,
		onSave
	}: {
		lat?: number | null;
		lon?: number | null;
		label?: string;
		saving?: boolean;
		onSave: (lat: number, lon: number, label: string) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let coords = $state<{ lat: number; lon: number } | null>(
		lat != null && lon != null ? { lat, lon } : null
	);
	// svelte-ignore state_referenced_locally
	let coordLabel = $state(label);

	let query = $state("");
	let results = $state<AddressData[]>([]);
	let searching = $state(false);
	let geoError = $state<string | null>(null);
	let debounce: ReturnType<typeof setTimeout> | null = null;

	function runSearch(q: string) {
		if (q.trim().length <= 2) {
			results = [];
			return;
		}
		searching = true;
		const url = `/api/search/address/${encodeURIComponent(q)}?lang=${getLocale()}`;
		fetch(url)
			.then((r) => (r.ok ? r.json() : []))
			.then((data: AddressData[]) => {
				results = Array.isArray(data) ? data : [];
			})
			.catch(() => (results = []))
			.finally(() => (searching = false));
	}

	function onInput(value: string) {
		query = value;
		geoError = null;
		if (debounce) clearTimeout(debounce);
		debounce = setTimeout(() => runSearch(value), 250);
	}

	function pick(result: AddressData) {
		// AddressData.center is [lon, lat].
		coords = { lon: result.center[0], lat: result.center[1] };
		coordLabel = result.name;
		query = "";
		results = [];
	}

	function useMyLocation() {
		geoError = null;
		if (!navigator.geolocation) {
			geoError = "Geolocation isn't available in this browser.";
			return;
		}
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				coords = {
					lat: Number(pos.coords.latitude.toFixed(6)),
					lon: Number(pos.coords.longitude.toFixed(6))
				};
				coordLabel = "My current location";
			},
			() => (geoError = "Couldn't get your location.")
		);
	}

	function save() {
		if (!coords) return;
		onSave(coords.lat, coords.lon, coordLabel);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="relative">
		<div class="flex items-center gap-2 rounded-md border bg-background px-3">
			<Search class="h-4 w-4 shrink-0 text-muted-foreground" />
			<input
				value={query}
				oninput={(e) => onInput((e.target as HTMLInputElement).value)}
				placeholder="Search for a place or address…"
				class="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
			/>
			{#if searching}
				<LoaderCircle class="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
			{:else if query}
				<button type="button" aria-label="Clear" onclick={() => (onInput(""), (query = ""))}>
					<X class="h-4 w-4 text-muted-foreground" />
				</button>
			{/if}
		</div>
		{#if results.length > 0}
			<div
				class="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-lg"
			>
				{#each results as result (result.id)}
					<button
						type="button"
						class="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
						onclick={() => pick(result)}
					>
						<MapPin class="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						<span class="min-w-0">{result.name}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<Button variant="outline" onclick={useMyLocation} type="button">
			<LocateFixed class="h-4 w-4" /> Use my location
		</Button>
		<Button onclick={save} disabled={saving || !coords}>
			{saving ? "Saving…" : "Save location"}
		</Button>
	</div>

	{#if coords}
		<p class="flex items-center gap-1.5 text-sm text-muted-foreground">
			<MapPin class="h-3.5 w-3.5 shrink-0" />
			{#if coordLabel}<span class="text-foreground">{coordLabel}</span> ·{/if}
			<span class="font-mono tabular-nums">{coords.lat.toFixed(5)}, {coords.lon.toFixed(5)}</span>
		</p>
	{:else}
		<p class="text-sm text-muted-foreground">No location set yet.</p>
	{/if}

	{#if geoError}
		<p class="text-sm text-destructive">{geoError}</p>
	{/if}
</div>
