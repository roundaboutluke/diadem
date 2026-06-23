// Pokémon type colours keyed by the standard Niantic/masterfile type id (1-18),
// the same ids used by `getIconType` / `mType` and the uicons type images.
// 1 Normal, 2 Fighting, 3 Flying, 4 Poison, 5 Ground, 6 Rock, 7 Bug, 8 Ghost,
// 9 Steel, 10 Fire, 11 Water, 12 Grass, 13 Electric, 14 Psychic, 15 Ice,
// 16 Dragon, 17 Dark, 18 Fairy.
const TYPE_COLORS: Record<number, string> = {
	1: "#a8a878",
	2: "#c03028",
	3: "#a890f0",
	4: "#a040a0",
	5: "#e0c068",
	6: "#b8a038",
	7: "#a8b820",
	8: "#705898",
	9: "#b8b8d0",
	10: "#f08030",
	11: "#6890f0",
	12: "#78c850",
	13: "#f8d030",
	14: "#f85888",
	15: "#98d8d8",
	16: "#7038f8",
	17: "#705848",
	18: "#ee99ac"
};

export function getTypeColor(typeId: number | undefined | null): string | undefined {
	if (!typeId) return undefined;
	return TYPE_COLORS[typeId];
}
