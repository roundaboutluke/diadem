<script lang="ts">
	import { Plus, Trash2 } from "@lucide/svelte";
	import Button from "@/components/ui/input/Button.svelte";
	import type { ActiveHour, PoracleProfile } from "@/lib/services/alerts/alerts.shared";

	// Editor for a profile's active_hours schedule — a list of
	// {day, hours, mins} switch-points telling Poracle when to activate
	// this profile. Stored as a JSON string; "{}" / empty means no
	// schedule (manual switching only).
	let {
		profile,
		saving = false,
		onSave
	}: {
		profile: PoracleProfile;
		saving?: boolean;
		onSave: (profileNo: number, activeHoursJson: string) => void;
	} = $props();

	const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	function parse(raw: string | null | undefined): ActiveHour[] {
		if (!raw || raw === "{}") return [];
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as ActiveHour[]) : [];
		} catch {
			return [];
		}
	}

	// svelte-ignore state_referenced_locally
	let entries = $state<ActiveHour[]>(parse(profile.active_hours));

	function addEntry() {
		entries = [...entries, { day: 1, hours: 9, mins: 0 }];
	}
	function removeEntry(index: number) {
		entries = entries.filter((_, i) => i !== index);
	}
	function setTime(index: number, value: string) {
		const [h, m] = value.split(":").map((n) => Number.parseInt(n, 10));
		entries = entries.map((e, i) =>
			i === index ? { ...e, hours: Number.isFinite(h) ? h : 0, mins: Number.isFinite(m) ? m : 0 } : e
		);
	}
	function setDay(index: number, day: number) {
		entries = entries.map((e, i) => (i === index ? { ...e, day } : e));
	}
	function pad(n: number) {
		return String(n).padStart(2, "0");
	}
	function save() {
		onSave(profile.profile_no, JSON.stringify(entries));
	}
</script>

<div class="flex flex-col gap-2">
	{#each entries as entry, i (i)}
		<div class="flex flex-wrap items-center gap-2">
			<select
				value={entry.day}
				onchange={(e) => setDay(i, Number((e.target as HTMLSelectElement).value))}
				class="h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm text-foreground"
			>
				{#each dayNames as name, d (d)}
					<option value={d}>{name}</option>
				{/each}
			</select>
			<input
				type="time"
				value={`${pad(entry.hours)}:${pad(entry.mins)}`}
				onchange={(e) => setTime(i, (e.target as HTMLInputElement).value)}
				class="h-9 rounded-md border bg-background px-2 text-sm text-foreground"
			/>
			<button
				type="button"
				class="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
				aria-label="Remove schedule entry"
				onclick={() => removeEntry(i)}
			>
				<Trash2 class="h-4 w-4" />
			</button>
		</div>
	{/each}
	<div class="flex items-center gap-2">
		<Button variant="outline" size="sm" onclick={addEntry}>
			<Plus class="h-4 w-4" /> Add time
		</Button>
		<Button size="sm" onclick={save} disabled={saving}>
			{saving ? "Saving…" : "Save schedule"}
		</Button>
	</div>
</div>
