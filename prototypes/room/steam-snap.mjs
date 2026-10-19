// one-off: pulls the fuller steam picture for both accounts into .cache/dev-steam-full.json, which snapshot.mjs reads.
// run from the repo root: node prototypes/room/steam-snap.mjs (needs STEAM_API_KEY in .env). about 30 read-only calls.
import { readFileSync, writeFileSync } from "node:fs";

const KEY = readFileSync(".env", "utf8").match(/^STEAM_API_KEY=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!KEY) throw new Error("no STEAM_API_KEY in .env");
const IDS = ["76561198238407266", "76561198205996123"];
const API = "https://api.steampowered.com";
const get = async (path, q) => {
  const res = await fetch(`${API}/${path}/?${new URLSearchParams({ key: KEY, format: "json", ...q })}`);
  if (!res.ok) { console.warn(path, q.appid ?? "", res.status); return null; }
  return res.json();
};

const players = (await get("ISteamUser/GetPlayerSummaries/v2", { steamids: IDS.join(",") }))?.response?.players ?? [];
const games = new Map();
for (const id of IDS) {
  const owned = (await get("IPlayerService/GetOwnedGames/v1", { steamid: id, include_appinfo: 1, include_played_free_games: 1 }))?.response?.games ?? [];
  const recent = (await get("IPlayerService/GetRecentlyPlayedGames/v1", { steamid: id }))?.response?.games ?? [];
  const r2 = new Map(recent.map(g => [g.appid, g.playtime_2weeks ?? 0]));
  for (const g of [...owned, ...recent.filter(g => !owned.some(o => o.appid === g.appid))]) {
    const cur = games.get(g.appid) ?? { appid: g.appid, name: g.name, mins: 0, mins2w: 0, last: 0, accounts: [] };
    cur.mins += g.playtime_forever ?? 0;
    cur.mins2w += r2.get(g.appid) ?? 0;
    cur.last = Math.max(cur.last, g.rtime_last_played ?? 0);
    cur.accounts.push(id);
    games.set(g.appid, cur);
  }
}

// achievements for what's been played lately plus the most played, per account that owns it
const all = [...games.values()];
const pick = new Set([...all.filter(g => g.mins2w).map(g => g.appid), ...[...all].sort((a, b) => b.mins - a.mins).slice(0, 10).map(g => g.appid)]);
for (const appid of pick) {
  const g = games.get(appid);
  const schema = (await get("ISteamUserStats/GetSchemaForGame/v2", { appid, l: "english" }))?.game?.availableGameStats?.achievements ?? [];
  if (!schema.length) continue;
  const icons = new Map(schema.map(a => [a.name, { title: a.displayName, desc: a.description ?? "", icon: a.icon, hidden: !!a.hidden }]));
  const got = new Map();
  for (const id of g.accounts) {
    const list = (await get("ISteamUserStats/GetPlayerAchievements/v1", { steamid: id, appid }))?.playerstats?.achievements ?? [];
    for (const a of list) if (a.achieved && (!got.has(a.apiname) || a.unlocktime < got.get(a.apiname))) got.set(a.apiname, a.unlocktime);
  }
  g.ach = { total: schema.length, got: got.size,
    recent: [...got].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, t]) => ({ ...icons.get(k), at: t })) };
}

const out = { players: players.map(p => ({ id: p.steamid, name: p.personaname, playing: p.gameextrainfo ?? null, state: p.personastate, avatar: p.avatarfull })),
  games: [...games.values()].sort((a, b) => b.last - a.last) };
writeFileSync(".cache/dev-steam-full.json", JSON.stringify({ _t: Date.now(), _v: out }));
const played = out.games.filter(g => g.mins);
console.log(`${out.games.length} owned, ${played.length} played, ${played.filter(g => g.mins2w).length} in the last 2 weeks, ${out.games.filter(g => g.ach).length} with achievements`);
console.log(played.slice(0, 12).map(g => `${new Date(g.last * 1000).toISOString().slice(0, 10)}  ${String(Math.round(g.mins / 60)).padStart(5)}h  2w:${String(Math.round(g.mins2w / 60)).padStart(3)}h  ${g.ach ? `${g.ach.got}/${g.ach.total}` : "     "}  ${g.name}`).join("\n"));
