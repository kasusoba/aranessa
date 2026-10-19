// Builds snapshot.js (real data for the room prototype) from the site's dev cache.
// No API calls: it only reads .cache/dev-*.json, which `pnpm dev` fills while you
// browse the real pages, plus `git log` for the code view.
//   node prototypes/room/snapshot.mjs
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const load = key => {
	try {
		const raw = JSON.parse(readFileSync(join(root, ".cache", `dev-${key}.json`), "utf8"));
		return { v: raw._v, t: raw._t };
	} catch {
		console.warn(`missing .cache/dev-${key}.json`);
		return { v: null, t: 0 };
	}
};
const ages = {};
const get = (key, fallback) => {
	const r = load(key);
	ages[key] = r.t;
	return r.v ?? fallback;
};

const STAR = "2a96cbd8b46e442fc41c2b86b821562f";
const pick = (arr, order = ["extralarge", "large", "medium"]) => {
	for (const s of order) {
		const u = arr?.find(i => i.size === s)?.["#text"];
		if (u && !u.includes(STAR)) return u;
	}
	return "";
};
const iso = d => new Date(d).toISOString();
const normType = t => {
	const v = String(t).toLowerCase();
	return v === "tv" || v === "episode" || v === "season" || v.startsWith("tv") ? "show" : v;
};
const lastPart = p => String(p ?? "").split(" - ").pop();
const kv = (() => { try { return JSON.parse(readFileSync(join(root, ".cache/kv.json"), "utf8")); } catch { return {}; } })();

/* ---------- listen (last.fm) ---------- */
const periodsRaw = get("ll-periods", {});
const recentRaw = get("ll-recent", []);
const lovedRaw = get("ll-loved", []);
const periods = Object.fromEntries(Object.entries(periodsRaw).map(([p, d]) => [p, {
	albums: d.albums.map(a => ({ name: a.name, artist: a.artist.name, img: pick(a.image), url: a.url, plays: +a.playcount })),
	artists: d.artists.map(a => ({ name: a.name, img: kv[`deezer:artist:${a.name.toLowerCase()}`] || "", url: a.url, plays: +a.playcount })),
	tracks: d.tracks.map(t => ({ name: t.name, artist: t.artist.name, img: pick(t.image), url: t.url, plays: +t.playcount })),
}]));
const recent = recentRaw.map(t => ({
	name: t.name, artist: t.artist["#text"], album: t.album?.["#text"] ?? "", img: pick(t.image, ["extralarge", "large", "medium"]), url: t.url,
	live: t["@attr"]?.nowplaying === "true", date: t.date?.uts ? iso(+t.date.uts * 1000) : null,
}));
const listen = {
	now: recent.find(r => r.live) ?? recent[0],
	recent: recent.filter(r => r !== (recent.find(x => x.live) ?? recent[0])),
	periods,
	loved: lovedRaw.map(t => ({ name: t.name, artist: t.artist.name, url: t.url })),
};

/* ---------- watch (trakt + anilist anime) / read (hardcover + anilist manga) ---------- */
const trakt = get("trakt-history", []);
const traktFav = get("trakt-favorites", []);
const traktReviews = get("trakt-reviews", []);
const traktFinished = get("trakt-finished", []);
const alAct = get("anilist-activity", []);
const alFav = get("anilist-favorites", { anime: [], manga: [] });
const alEntries = get("anilist-entries", []);
const hcReading = get("hardcover-reading", []);
const hcRead = get("hardcover-read", []);

const skip = s => /dropped|plans|paused/.test(s);
const alRecent = alAct.filter(a => !skip(a.status?.toLowerCase() ?? "")).map(a => {
	const s = a.status.toLowerCase(), anime = a.media.type === "ANIME";
	return {
		t: a.media.title.english || a.media.title.romaji, img: a.media.coverImage.large, url: a.siteUrl || a.media.siteUrl,
		type: anime ? "anime" : "manga", prog: s.includes("completed") ? "done" : `${anime ? "e" : "ch"}${lastPart(a.progress)}`,
		date: iso(a.createdAt * 1000), total: anime ? a.media.episodes : a.media.chapters, mid: a.media.id,
	};
});
const trRecent = trakt.map(i => ({
	t: i.type === "episode" ? i.show?.title : i.movie?.title, img: i.image, type: i.type === "episode" ? "show" : "movie",
	prog: i.type === "episode" ? `s${i.episode?.season}e${i.episode?.number}` : "movie", date: iso(i.watched_at),
	url: i.type === "episode" ? `https://trakt.tv/shows/${i.show?.ids.trakt}` : `https://trakt.tv/movies/${i.movie?.ids.trakt}`,
}));
const byDate = (a, b) => new Date(b.date) - new Date(a.date);
// one tile per title: the latest thing you did with it
const dedupe = list => list.filter((x, i, arr) => arr.findIndex(o => o.t === x.t) === i);

const reviewOf = (r, src) => ({ ...r, note: String(r.note ?? "").replace(/^\[Spoiler Warning\]\s*/i, "").trim(), src });
const alReviews = alEntries.filter(e => e.hasNote).map(n => reviewOf({
	t: n.media.title, img: n.media.image, url: n.media.siteUrl, type: n.media.type.toLowerCase(),
	sub: `${n.media.type.toLowerCase()} · ${n.status.toLowerCase()}`, r: n.scoreDisplay, note: n.notes, spoiler: false, date: iso(n.date),
}, "al"));
const trReviews = traktReviews.map(r => reviewOf({
	t: r.title, img: r.image, url: r.url, type: r.subtitle.startsWith("movie") ? "movie" : "show", sub: r.subtitle.replace(/^tv/, "show"),
	r: r.rating ? `${r.rating}/10` : "", note: r.note, spoiler: r.spoiler, date: iso(r.date),
}, "tr"));
const hcReviews = hcRead.filter(b => b.hasReview).map(b => reviewOf({
	t: b.title, img: b.image, url: b.url, type: "book", sub: "book", r: b.rating, note: b.note, spoiler: b.spoiler, date: iso(b.date),
}, "hc"));

const alFinished = alEntries.filter(e => e.status === "COMPLETED" && !e.hasNote).map(e => ({
	t: e.media.title, img: e.media.imageMedium, url: e.media.siteUrl, type: e.media.type.toLowerCase(), r: e.scoreDisplay.split("/")[0], date: iso(e.date),
}));
const trFinished = traktFinished.map(r => ({ t: r.title, img: r.image, url: r.url, type: normType(r.type), r: r.rating != null ? String(r.rating) : "", date: iso(r.date) }));
const hcFinished = hcRead.filter(b => !b.hasReview).map(b => ({ t: b.title, img: b.image, url: b.url, type: "book", r: b.rating ? b.rating.split("/")[0] : "", date: iso(b.date) }));

const favs = [
	...alFav.anime.map(f => ({ t: f.title, img: f.image, url: f.siteUrl, type: "anime" })),
	...alFav.manga.map(f => ({ t: f.title, img: f.image, url: f.siteUrl, type: "manga" })),
	...traktFav.map(f => ({ t: f.title, img: f.image, url: f.url, type: normType(f.type) })),
];
const isWatch = x => ["anime", "movie", "show"].includes(x.type);
const isRead = x => ["manga", "book"].includes(x.type);

const watchRecent = dedupe([...alRecent.filter(isWatch), ...trRecent].sort(byDate)).slice(0, 24);
const sixMo = Date.now() - 182 * 864e5;
const watch = {
	now: watchRecent[0],
	recent: watchRecent,
	favorites: favs.filter(isWatch),
	reviews: [...alReviews, ...trReviews].filter(isWatch).sort(byDate),
	finished: [...alFinished, ...trFinished].filter(isWatch).sort(byDate),
	stats: {
		movies: trakt.filter(i => i.type === "movie" && new Date(i.watched_at) > sixMo).length,
		episodes: trakt.filter(i => i.type === "episode" && new Date(i.watched_at) > sixMo).length + alAct.filter(a => a.status === "watched episode").length,
		anime: alEntries.filter(e => e.media.type === "ANIME" && e.status === "COMPLETED").length,
	},
};

const mangaReading = dedupe(alRecent.filter(x => x.type === "manga").sort(byDate)).filter(x => x.prog !== "done").slice(0, 3);
const read = {
	reading: [
		...hcReading.map(b => ({ t: b.title, img: b.image, url: b.url, type: "book", prog: b.progress, pct: parseFloat(b.progress) / 100 || 0, date: iso(b.date) })),
		...mangaReading.map(m => {
			const ch = parseInt(m.prog.slice(2), 10);
			return { ...m, pct: m.total && ch ? Math.min(1, ch / m.total) : 0 };
		}),
	].sort(byDate),
	favorites: favs.filter(isRead),
	reviews: [...alReviews, ...hcReviews].filter(isRead).sort(byDate),
	finished: [...alFinished, ...hcFinished].filter(isRead).sort(byDate),
};

/* ---------- play (steam) ---------- */
// the fuller picture comes from steam-snap.mjs (dev-steam-full); without it, fall back to the home page's 3 recent games
const steamImg = id => `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`;
const steam = get("steam-full", null);
let games, play = null;
if (steam) {
	// family-shared games have no last played time, the newest achievement stands in for it
	const lastOf = g => g.last || Math.max(0, ...(g.ach?.recent ?? []).map(a => a.at));
	const one = g => ({ t: g.name, mins: g.mins, mins2w: g.mins2w, last: lastOf(g) ? iso(lastOf(g) * 1000) : null, img: steamImg(g.appid), url: `https://store.steampowered.com/app/${g.appid}`,
		ach: g.ach ? { got: g.ach.got, total: g.ach.total, recent: g.ach.recent.slice(0, 4).map(a => ({ title: a.title, desc: a.desc, icon: a.icon, at: iso(a.at * 1000) })) } : null });
	const played = steam.games.filter(g => g.mins);
	games = [...played].sort((a, b) => lastOf(b) - lastOf(a)).slice(0, 10).map(one);
	play = {
		owned: steam.games.length, played: played.length, unplayed: steam.games.length - played.length,
		mins: played.reduce((n, g) => n + g.mins, 0), mins2w: played.reduce((n, g) => n + g.mins2w, 0),
		live: steam.players.find(p => p.playing)?.playing ?? null,
		profile: `https://steamcommunity.com/profiles/${steam.players[0]?.id ?? "76561198238407266"}`,
		top: [...played].sort((a, b) => b.mins - a.mins).slice(0, 12).map(one),
		// latest unlocks across every game
		ach: steam.games.flatMap(g => (g.ach?.recent ?? []).map(a => ({ game: g.name, img: steamImg(g.appid), title: a.title, desc: a.desc, icon: a.icon, at: iso(a.at * 1000) })))
			.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10),
	};
} else {
	games = get("home-games", []).map(g => ({
		t: g.name, mins: g.playtime_forever, last: iso(g.last_played * 1000), img: steamImg(g.appid), url: `https://store.steampowered.com/app/${g.appid}`,
	}));
}

/* ---------- shows (setlist.fm, from setlist-snap.mjs) ---------- */
// setlist.fm city names are admin areas ("Kotamadya Jakarta Barat"), keep the city people would say
const cityOf = c => c.replace(/^(Kotamadya|Kota Administrasi|Kota|Kabupaten)\s+/, "").replace(/\s+(Regency|City)$/, "").replace(/^Jakarta\s+(Barat|Pusat|Timur|Selatan|Utara)$/, "Jakarta");
const shows = get("setlistfm-attended", []).map(s => ({ ...s, city: cityOf(s.city) }));

/* ---------- code (site config + this repo's git log) ---------- */
const sh = cmd => { try { return execSync(cmd, { cwd: root, encoding: "utf8" }).trim(); } catch { return ""; } };
const commits = sh("git log -6 --format=%h%x09%s%x09%cI").split("\n").filter(Boolean).map(l => { const [sha, msg, date] = l.split("\t"); return { sha, msg, date }; });
const days = sh(`git log --since="26 weeks ago" --format=%cs`).split("\n").filter(Boolean);
const perDay = days.reduce((m, d) => (m[d] = (m[d] ?? 0) + 1, m), {});
const code = {
	projects: [
		{ t: "tmsync", cat: "web extension", featured: true, d: "auto track movie and tv show you're watching on 'streaming services' to trakt.tv. malsync for movie and tv show basically", file: "tmsync.md", img: "../../src/assets/tmsync.jpeg", url: "https://github.com/kasusoba/tmsync" },
		{ t: "chrollo", cat: "discord bot", d: "upload photos and videos in a channel to google photos automatically", file: "chrollo.md", img: "../../src/assets/chrollo.png", url: "https://github.com/kasusoba/chrollo" },
		{ t: "trying to make more", cat: "i think", d: "fr", file: "next.md", img: "", url: "https://github.com/kasusoba/" },
	],
	commits,
	perDay,
};

const socials = [["github", "https://github.com/kasusoba"], ["anilist", "https://anilist.co/user/kasusoba/"], ["last.fm", "https://www.last.fm/user/kasusoba/"], ["trakt", "https://trakt.tv/users/kasusoba"], ["letterboxd", "https://letterboxd.com/kasusoba/"], ["hardcover", "https://hardcover.app/@kasusoba"], ["ib", "https://infinitebacklog.net/users/kasusoba"], ["setlist.fm", "https://www.setlist.fm/user/kasusoba"]];

const snap = { taken: new Date().toISOString(), ages: Object.fromEntries(Object.entries(ages).map(([k, t]) => [k, t ? iso(t) : null])), listen, watch, read, games, play, shows, code, socials };
writeFileSync(join(here, "snapshot.js"), `/* generated by snapshot.mjs from .cache (real data). do not edit. */\nconst SNAP = ${JSON.stringify(snap)};\n`);
const oldest = Object.entries(ages).filter(([, t]) => t).sort((a, b) => a[1] - b[1])[0];
console.log(`snapshot.js written. oldest source: ${oldest?.[0]} (${oldest ? Math.round((Date.now() - oldest[1]) / 864e5) : "?"}d old)`);
