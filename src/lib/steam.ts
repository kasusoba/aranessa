// two accounts, merged per game everywhere
const STEAM_IDS = ["76561198238407266", "76561198205996123"];

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

export interface SteamAchievement {
	title: string;
	desc: string;
	icon: string;
	at: number; // unix seconds
}

export interface SteamLibraryGame {
	appid: number;
	name: string;
	mins: number;
	mins2w: number;
	last: number; // unix seconds, 0 for family-shared games
	ach: { got: number; total: number; recent: SteamAchievement[] } | null;
}

export interface SteamLibrary {
	games: SteamLibraryGame[];
}

// the profile linked on the site
export const STEAM_PROFILE = `https://steamcommunity.com/profiles/${STEAM_IDS[0]}`;

async function steamGet(apiKey: string, path: string, params: Record<string, string>) {
	try {
		const q = new URLSearchParams({ key: apiKey, format: "json", ...params });
		const res = await fetch(`https://api.steampowered.com/${path}/?${q}`);
		return res.ok ? await res.json() : null;
	} catch {
		return null;
	}
}

// The whole library across both accounts, merged per game (playtime summed, last
// played = latest), plus achievements for what's been played lately and the most
// played. Achievements are unioned across accounts, the earliest unlock wins.
// About 30 calls, so callers should cache it.
export async function getSteamLibrary(): Promise<SteamLibrary | null> {
	const apiKey = import.meta.env.STEAM_API_KEY;
	if (!apiKey) return null;

	const games = new Map<number, SteamLibraryGame & { accounts: string[] }>();
	for (const id of STEAM_IDS) {
		const owned: SteamApiGame[] =
			(await steamGet(apiKey, "IPlayerService/GetOwnedGames/v1", { steamid: id, include_appinfo: "1", include_played_free_games: "1" }))?.response?.games ?? [];
		const recent: SteamApiGame[] =
			(await steamGet(apiKey, "IPlayerService/GetRecentlyPlayedGames/v1", { steamid: id }))?.response?.games ?? [];
		const twoWeeks = new Map(recent.map((g) => [g.appid, g.playtime_2weeks ?? 0]));
		for (const g of [...owned, ...recent.filter((r) => !owned.some((o) => o.appid === r.appid))]) {
			const cur = games.get(g.appid) ?? { appid: g.appid, name: g.name, mins: 0, mins2w: 0, last: 0, ach: null, accounts: [] };
			cur.mins += g.playtime_forever ?? 0;
			cur.mins2w += twoWeeks.get(g.appid) ?? 0;
			cur.last = Math.max(cur.last, g.rtime_last_played ?? 0);
			cur.accounts.push(id);
			games.set(g.appid, cur);
		}
	}
	if (!games.size) return null;

	const all = [...games.values()];
	const picked = new Set([
		...all.filter((g) => g.mins2w).map((g) => g.appid),
		...[...all].sort((a, b) => b.mins - a.mins).slice(0, 10).map((g) => g.appid),
	]);
	for (const appid of picked) {
		const g = games.get(appid);
		if (!g) continue;
		const schema: Array<{ name: string; displayName: string; description?: string; icon: string }> =
			(await steamGet(apiKey, "ISteamUserStats/GetSchemaForGame/v2", { appid: String(appid), l: "english" }))?.game?.availableGameStats?.achievements ?? [];
		if (!schema.length) continue;
		const info = new Map(schema.map((a) => [a.name, { title: a.displayName, desc: a.description ?? "", icon: a.icon }]));
		const got = new Map<string, number>();
		for (const id of g.accounts) {
			const list: Array<{ apiname: string; achieved: number; unlocktime: number }> =
				(await steamGet(apiKey, "ISteamUserStats/GetPlayerAchievements/v1", { steamid: id, appid: String(appid) }))?.playerstats?.achievements ?? [];
			for (const a of list) {
				if (a.achieved && (!got.has(a.apiname) || a.unlocktime < (got.get(a.apiname) ?? 0))) got.set(a.apiname, a.unlocktime);
			}
		}
		g.ach = {
			total: schema.length,
			got: got.size,
			recent: [...got]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 6)
				.flatMap(([k, at]) => {
					const a = info.get(k);
					return a ? [{ ...a, at }] : [];
				}),
		};
	}

	return {
		games: all.map(({ accounts: _, ...g }) => g).sort((a, b) => b.last - a.last),
	};
}
