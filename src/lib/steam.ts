const STEAM_IDS = ["76561198238407266", "76561198205996123"];

export interface SteamGame {
	appid: number;
	name: string;
	playtime_forever: number; // minutes
	last_played: number; // unix timestamp
	img_icon_url: string;
}

interface SteamRecentGame {
	appid: number;
	name: string;
	playtime_forever: number;
	img_icon_url: string;
}

export function getHeaderImage(appid: number): string {
	return `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`;
}

async function fetchAccountTop3(apiKey: string, steamId: string): Promise<SteamGame[]> {
	try {
		const params = new URLSearchParams({
			key: apiKey,
			steamid: steamId,
			count: "3",
			format: "json",
		});
		const res = await fetch(
			`https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?${params}`,
		);
		if (!res.ok) return [];
		const data = await res.json();
		const games: SteamRecentGame[] = data.response?.games ?? [];
		const now = Math.floor(Date.now() / 1000);
		// Steam returns games most-recent-first; assign synthetic timestamps to
		// preserve that order when merging across accounts.
		return games.map((g, i) => ({
			appid: g.appid,
			name: g.name,
			playtime_forever: g.playtime_forever,
			last_played: now - i * 3600,
			img_icon_url: g.img_icon_url,
		}));
	} catch {
		return [];
	}
}

export async function getRecentGames(count: number = 2): Promise<SteamGame[]> {
	const apiKey = import.meta.env.STEAM_API_KEY;
	if (!apiKey) return [];

	const results = await Promise.all(
		STEAM_IDS.map((id) => fetchAccountTop3(apiKey, id).catch(() => [])),
	);

	const merged = new Map<number, SteamGame>();

	for (const games of results) {
		for (const game of games) {
			if (merged.has(game.appid)) {
				const existing = merged.get(game.appid) as SteamGame;
				merged.set(game.appid, {
					...existing,
					playtime_forever: existing.playtime_forever + game.playtime_forever,
					last_played: Math.max(existing.last_played, game.last_played),
				});
			} else {
				merged.set(game.appid, { ...game });
			}
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
