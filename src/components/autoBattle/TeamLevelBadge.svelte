<script lang="ts">
	// The trainer level circle used on account chips across Auto
	// Battle and the community tools. Tinted by team — Mystic blue,
	// Valor red, Instinct amber — with the original yellow as the
	// unknown-team fallback, so every tool renders trainer identity
	// identically.
	import { mTeam } from "$lib/services/ingameLocale";

	let { level, team = 0 }: { level?: number | null; team?: number | null } = $props();

	const teamClasses = $derived(
		team === 1
			? "border-sky-300 bg-sky-950 text-sky-100"
			: team === 2
				? "border-rose-300 bg-rose-950 text-rose-100"
				: team === 3
					? "border-amber-300 bg-amber-950 text-amber-100"
					: "border-yellow-300 bg-yellow-950 text-yellow-100"
	);
</script>

<div
	class="flex size-6 shrink-0 items-center justify-center rounded-full border {teamClasses}"
	title={team ? mTeam(team) : undefined}
>
	<span class="text-xs font-semibold">{level || "?"}</span>
</div>
