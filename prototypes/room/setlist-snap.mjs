// one-off: pulls the shows marked "i was there" on setlist.fm into .cache/dev-setlistfm-attended.json, which snapshot.mjs reads.
// run from the repo root: node prototypes/room/setlist-snap.mjs (needs SETLISTFM_API_KEY + SETLISTFM_USERNAME in .env).
// one call per 20 shows, plus a keyless deezer lookup per artist for a photo.
import { readFileSync, writeFileSync } from "node:fs";

const env = k => readFileSync(".env", "utf8").match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim().replace(/^["']|["']$/g, "");
const KEY = env("SETLISTFM_API_KEY"), USER = env("SETLISTFM_USERNAME");
if (!KEY || !USER) throw new Error("no SETLISTFM_API_KEY / SETLISTFM_USERNAME in .env");

const rows = [];
for (let p = 1; ; p++) {
  const res = await fetch(`https://api.setlist.fm/rest/1.0/user/${encodeURIComponent(USER)}/attended?p=${p}`, { headers: { "x-api-key": KEY, Accept: "application/json" } });
  if (res.status === 404) break;
  if (!res.ok) throw new Error(`setlist.fm ${res.status}: ${await res.text()}`);
  const j = await res.json();
  rows.push(...(j.setlist ?? []));
  if (p * j.itemsPerPage >= j.total) break;
  await new Promise(r => setTimeout(r, 600));
}

const photos = new Map();
for (const name of new Set(rows.map(s => s.artist?.name).filter(Boolean))) {
  try {
    const d = await (await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`)).json();
    photos.set(name, d.data?.[0]?.picture_medium ?? "");
  } catch { photos.set(name, ""); }
}

const shows = rows.map(s => {
  const [d, m, y] = String(s.eventDate).split("-").map(Number);
  return {
    id: s.id, artist: s.artist?.name ?? "", img: photos.get(s.artist?.name) ?? "",
    venue: s.venue?.name ?? "", city: s.venue?.city?.name ?? "", country: s.venue?.city?.country?.name ?? "",
    date: new Date(Date.UTC(y, m - 1, d)).toISOString(), url: s.url, tour: s.tour?.name ?? "",
    songs: (s.sets?.set ?? []).flatMap(set => (set.song ?? []).map(x => x.name).filter(Boolean)),
  };
});
writeFileSync(".cache/dev-setlistfm-attended.json", JSON.stringify({ _t: Date.now(), _v: shows }));
console.log(shows.map(s => `${s.date.slice(0, 10)}  ${String(s.songs.length).padStart(2)} songs  ${s.artist} @ ${s.venue}, ${s.city}${s.img ? "" : "  (no photo)"}`).join("\n"));
