const STEAM_IDS = ["76561198238407266", "76561198205996123"];
const API = "https://api.steampowered.com/IPlayerService";

export interface SteamGame {
	appid: number;
	name: string;
	playtime_forever: number; // minutes
	playtime_2weeks: number; // minutes
	last_played: number; // unix timestamp
	img_icon_url: string;
}

interface SteamApiGame {
	appid: number;
	name: string;
	playtime_forever?: number;
	playtime_2weeks?: number;
	rtime_last_played?: number;
	img_icon_url?: string;
}

export function getHeaderImage(appid: number): string {
	return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
}

async function call(apiKey: string, method: string, params: Record<string, string>): Promise<SteamApiGame[]> {
	try {
		const q = new URLSearchParams({ key: apiKey, format: "json", ...params });
		const res = await fetch(`${API}/${method}/v1/?${q}`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.response?.games ?? [];
	} catch {
		return [];
	}
}

// One account's recently played games, newest first, with real last-played times.
// GetRecentlyPlayedGames has the order and 2-week playtime but no timestamps;
// GetOwnedGames has rtime_last_played. Family-shared games aren't owned, so they
// have no timestamp: they borrow the next older game's time (a lower bound).
async function fetchAccountRecent(apiKey: string, steamId: string): Promise<SteamGame[]> {
	const [recent, owned] = await Promise.all([
		call(apiKey, "GetRecentlyPlayedGames", { steamid: steamId }),
		call(apiKey, "GetOwnedGames", { steamid: steamId, include_played_free_games: "1" }),
	]);
	const lastPlayed = new Map(owned.map((g) => [g.appid, g.rtime_last_played ?? 0]));
	const known = recent.map((g) => lastPlayed.get(g.appid) || 0);
	const twoWeeksAgo = Math.floor(Date.now() / 1000) - 14 * 86400;
	return recent.map((g, i) => ({
		appid: g.appid,
		name: g.name,
		playtime_forever: g.playtime_forever ?? 0,
		playtime_2weeks: g.playtime_2weeks ?? 0,
		last_played: known[i] || (known.slice(i + 1).find((t) => t) ?? twoWeeksAgo) + 1,
		img_icon_url: g.img_icon_url ?? "",
	}));
}

export async function getRecentGames(count: number = 2): Promise<SteamGame[]> {
	const apiKey = import.meta.env.STEAM_API_KEY;
	if (!apiKey) return [];

	const results = await Promise.all(
		STEAM_IDS.map((id) => fetchAccountRecent(apiKey, id).catch(() => [])),
	);

	const merged = new Map<number, SteamGame>();

	for (const games of results) {
		for (const game of games) {
			const existing = merged.get(game.appid);
			merged.set(
				game.appid,
				existing
					? {
							...existing,
							playtime_forever: existing.playtime_forever + game.playtime_forever,
							playtime_2weeks: existing.playtime_2weeks + game.playtime_2weeks,
							last_played: Math.max(existing.last_played, game.last_played),
						}
					: { ...game },
			);
		}
	}

	return Array.from(merged.values())
		.sort((a, b) => b.last_played - a.last_played)
		.slice(0, count);
}

export function formatHours(minutes: number): string {
	const hours = Math.round(minutes / 60);
	return hours === 1 ? "1 hr" : `${hours.toLocaleString()} hrs`;
}
