import {
	Castle,
	Egg,
	Flower2,
	MapPin,
	ScrollText,
	Skull,
	Sparkles,
	Swords,
	TreePine,
	Zap
} from "@lucide/svelte";
import {
	getIconGym,
	getIconInvasion,
	getIconItem,
	getIconPokemon,
	getIconPokestop,
	getIconRaidEgg,
	getIconReward,
	getIconStation
} from "@/lib/services/uicons.svelte";
import { RewardType } from "@/lib/utils/pokestopUtils";
import { pokedexTypeMeta, type PokedexTrackingType } from "@/lib/services/alerts/alerts.shared";

const registry: Record<string, typeof Sparkles> = {
	Sparkles,
	Swords,
	Egg,
	ScrollText,
	Skull,
	Flower2,
	Castle,
	TreePine,
	Zap,
	MapPin
};

export function typeIcon(type: PokedexTrackingType) {
	return registry[pokedexTypeMeta[type].icon];
}

export function sectionIconUrl(type: PokedexTrackingType): string | null {
	try {
		switch (type) {
			case "pokemon":
				return getIconPokemon({ pokemon_id: 25 }); // Pikachu
			case "raid":
				return getIconPokemon({ pokemon_id: 150 }); // Mewtwo
			case "egg":
				return getIconRaidEgg(1);
			case "quest":
				return getIconReward(RewardType.QUEST, {});
			case "invasion":
				return getIconInvasion(4, true); // Team GO Rocket grunt (Diadem's default)
			case "lure":
				return getIconItem(501); // Troy Disk (normal lure)
			case "gym":
				return getIconGym({ team_id: 0 }); // neutral gym
			case "maxbattle":
				return getIconStation(true); // power spot / max battle
			case "fort":
				return getIconPokestop({}); // pokéstop
			default:
				return null; // nest → lucide fallback
		}
	} catch {
		return null;
	}
}
