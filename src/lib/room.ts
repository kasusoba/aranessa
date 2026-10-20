// Everything the room shows, resolved once at build time. Each source keeps the
// dev cache key it always had, so `pnpm dev` reuses what's already in .cache/.
import { execSync } from "node:child_process";
import { userConfig } from "../config";
import { type AnilistActivity, getAnilistActivity, getAnilistEntries, getAnilistFavorites } from "./anilist";
import { devCache } from "./cache";
import { deezerImageFor, mapLimit } from "./deezer";
import { getProjects } from "./github";
import { getHardcoverRead, getHardcoverReading } from "./hardcover";
import { getListenData } from "./listen";
import { getSetlistAttended } from "./setlistfm";
import { getHeaderImage, getSteamLibrary, STEAM_PROFILE } from "./steam";
import { getTraktFavorites, getTraktFinished, getTraktHistory, getTraktReviews } from "./trakt";

const TTL = 30 * 60 * 1000;

export type MediaType = "anime" | "manga" | "movie" | "show" | "book";

// something being watched or read: prog is "e16", "s4e9", "ch132", "movie", "done", or a book's "63%"
export interface Progress {
	t: string;
	img: string;
	url: string;
	type: MediaType;
	prog: string;
	date: string;
	total?: number | null;
	pct?: number;
}
export interface Review {
	t: string;
	img: string;
	url: string;
	type: MediaType;
	sub: string;
	r: string;
	note: string;
	spoiler: boolean;
	date: string;
}
export interface Finished {
	t: string;
	img: string;
	url: string;
	type: MediaType;
	r: string;
	date: string;
}
export interface Favorite {
	t: string;
	img: string;
	url: string;
	type: MediaType;
}
export interface Game {
	t: string;
	mins: number;
	mins2w: number;
	last: string | null;
	// portrait library art, with the wide header as the fallback layer
	img: string;
	img2: string;
	header: string;
	url: string;
	ach: { got: number; total: number; recent: { title: string; desc: string; icon: string; at: string }[] } | null;
}
export interface Unlock {
	game: string;
	title: string;
	desc: string;
	icon: string;
	at: string;
}
export interface Show {
	id: string;
	artist: string;
	img: string;
	venue: string;
	city: string;
	date: string;
	url: string;
	tour: string;
	songs: string[];
}
export interface Project {
	t: string;
	cat: string;
	d: string;
	img: string;
	// the repo, and its homepage ("" without one)
	url: string;
	site: string;
	featured: boolean;
}
export interface Commit {
	sha: string;
	msg: string;
	date: string;
}

const iso = (d: Date | string | number) => new Date(d).toISOString();
const byDate = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);
// one entry per title: the latest thing that happened to it
const dedupe = <T extends { t: string }>(list: T[]) => list.filter((x, i, arr) => arr.findIndex((o) => o.t === x.t) === i);
const normType = (t: string): MediaType => {
	const v = String(t).toLowerCase();
	return v === "tv" || v === "episode" || v === "season" || v.startsWith("tv") ? "show" : (v as MediaType);
};
const lastPart = (p: string | number) => String(p ?? "").split(" - ").pop() ?? "";
const isWatch = (x: { type: MediaType }) => ["anime", "movie", "show"].includes(x.type);
const isRead = (x: { type: MediaType }) => ["manga", "book"].includes(x.type);
const clean = (note: string) => String(note ?? "").replace(/^\[Spoiler Warning\]\s*/i, "").trim();

async function watchAndRead() {
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
	const [trakt, traktFav, traktReviews, traktFinished, hcReading, hcRead] = await Promise.all([
		devCache("trakt-history", TTL, () => getTraktHistory(sixMonthsAgo)),
		devCache("trakt-favorites", TTL, () => getTraktFavorites()),
		devCache("trakt-reviews", TTL, () => getTraktReviews()),
		devCache("trakt-finished", TTL, () => getTraktFinished()),
		devCache("hardcover-reading", TTL, () => getHardcoverReading()),
		devCache("hardcover-read", TTL, () => getHardcoverRead()),
	]);
	// AniList rate-limits aggressively, so its sources go one at a time
	const alAct = await devCache("anilist-activity", TTL, () => getAnilistActivity(sixMonthsAgo));
	const alFav = await devCache("anilist-favorites", TTL, () => getAnilistFavorites());
	const alEntries = await devCache("anilist-entries", TTL, () => getAnilistEntries());

	const skip = (s: string) => /dropped|plans|paused/.test(s);
	const alRecent: Progress[] = alAct
		.filter((a) => !skip(a.status?.toLowerCase() ?? ""))
		.map((a: AnilistActivity) => {
			const s = a.status.toLowerCase();
			const anime = a.media.type === "ANIME";
			return {
				t: a.media.title.english || a.media.title.romaji,
				img: a.media.coverImage.large,
				url: a.siteUrl || a.media.siteUrl,
				type: anime ? "anime" : "manga",
				prog: s.includes("completed") ? "done" : `${anime ? "e" : "ch"}${lastPart(a.progress)}`,
				date: iso(a.createdAt * 1000),
				total: anime ? a.media.episodes : a.media.chapters,
			};
		});
	const trRecent: Progress[] = trakt.map((i) => ({
		t: (i.type === "episode" ? i.show?.title : i.movie?.title) ?? "",
		img: i.image ?? "",
		type: i.type === "episode" ? "show" : "movie",
		prog: i.type === "episode" ? `s${i.episode?.season}e${i.episode?.number}` : "movie",
		date: iso(i.watched_at),
		url: i.type === "episode" ? `https://trakt.tv/shows/${i.show?.ids.trakt}` : `https://trakt.tv/movies/${i.movie?.ids.trakt}`,
	}));

	const alReviews: Review[] = alEntries
		.filter((e) => e.hasNote)
		.map((n) => ({
			t: n.media.title,
			img: n.media.image,
			url: n.media.siteUrl,
			type: n.media.type.toLowerCase() as MediaType,
			sub: `${n.media.type.toLowerCase()} · ${n.status.toLowerCase()}`,
			r: n.scoreDisplay,
			note: clean(n.notes),
			spoiler: false,
			date: iso(n.date),
		}));
	const trReviews: Review[] = traktReviews.map((r) => ({
		t: r.title,
		img: r.image ?? "",
		url: r.url,
		type: r.subtitle.startsWith("movie") ? "movie" : "show",
		sub: r.subtitle.replace(/^tv/, "show"),
		r: r.rating ? `${r.rating}/10` : "",
		note: clean(r.note),
		spoiler: r.spoiler,
		date: iso(r.date),
	}));
	const hcReviews: Review[] = hcRead
		.filter((b) => b.hasReview)
		.map((b) => ({ t: b.title, img: b.image ?? "", url: b.url, type: "book", sub: "book", r: b.rating, note: clean(b.note), spoiler: b.spoiler, date: iso(b.date) }));

	const alFinished: Finished[] = alEntries
		.filter((e) => e.status === "COMPLETED" && !e.hasNote)
		.map((e) => ({ t: e.media.title, img: e.media.imageMedium, url: e.media.siteUrl, type: e.media.type.toLowerCase() as MediaType, r: e.scoreDisplay.split("/")[0], date: iso(e.date) }));
	const trFinished: Finished[] = traktFinished.map((r) => ({ t: r.title, img: r.image ?? "", url: r.url, type: normType(r.type), r: r.rating != null ? String(r.rating) : "", date: iso(r.date) }));
	const hcFinished: Finished[] = hcRead
		.filter((b) => !b.hasReview)
		.map((b) => ({ t: b.title, img: b.image ?? "", url: b.url, type: "book", r: b.rating ? b.rating.split("/")[0] : "", date: iso(b.date) }));

	const favs: Favorite[] = [
		...alFav.anime.map((f) => ({ t: f.title, img: f.image, url: f.siteUrl, type: "anime" as const })),
		...alFav.manga.map((f) => ({ t: f.title, img: f.image, url: f.siteUrl, type: "manga" as const })),
		...traktFav.map((f) => ({ t: f.title, img: f.image ?? "", url: f.url, type: normType(f.type) })),
	];

	const recent = dedupe([...alRecent.filter(isWatch), ...trRecent].sort(byDate)).slice(0, 24);
	const watch = {
		now: recent[0],
		recent,
		favorites: favs.filter(isWatch),
		reviews: [...alReviews, ...trReviews].filter(isWatch).sort(byDate),
		finished: [...alFinished, ...trFinished].filter(isWatch).sort(byDate),
	};

	const manga = dedupe(alRecent.filter((x) => x.type === "manga").sort(byDate))
		.filter((x) => x.prog !== "done")
		.slice(0, 3);
	const read = {
		reading: [
			...hcReading.map((b): Progress => ({ t: b.title, img: b.image ?? "", url: b.url, type: "book", prog: b.progress, pct: parseFloat(b.progress) / 100 || 0, date: iso(b.date) })),
			...manga.map((m) => {
				const ch = parseInt(m.prog.slice(2), 10);
				return { ...m, pct: m.total && ch ? Math.min(1, ch / m.total) : 0 };
			}),
		].sort(byDate),
		favorites: favs.filter(isRead),
		reviews: [...alReviews, ...hcReviews].filter(isRead).sort(byDate),
		finished: [...alFinished, ...hcFinished].filter(isRead).sort(byDate),
	};
	return { watch, read };
}

async function play() {
	const lib = await devCache("steam-full", TTL, () => getSteamLibrary());
	if (!lib) return null;
	const header = (appid: number) => getHeaderImage(appid);
	// family-shared games have no last played time; the newest achievement stands in for it
	const lastOf = (g: (typeof lib.games)[number]) => g.last || Math.max(0, ...(g.ach?.recent ?? []).map((a) => a.at));
	const one = (g: (typeof lib.games)[number]): Game => ({
		t: g.name,
		mins: g.mins,
		mins2w: g.mins2w,
		last: lastOf(g) ? iso(lastOf(g) * 1000) : null,
		img: header(g.appid).replace("header.jpg", "library_600x900.jpg"),
		img2: header(g.appid),
		header: header(g.appid),
		url: `https://store.steampowered.com/app/${g.appid}`,
		ach: g.ach ? { got: g.ach.got, total: g.ach.total, recent: g.ach.recent.slice(0, 4).map((a) => ({ ...a, at: iso(a.at * 1000) })) } : null,
	});
	const played = lib.games.filter((g) => g.mins);
	return {
		games: [...played].sort((a, b) => lastOf(b) - lastOf(a)).slice(0, 10).map(one),
		owned: lib.games.length,
		played: played.length,
		unplayed: lib.games.length - played.length,
		mins: played.reduce((n, g) => n + g.mins, 0),
		profile: STEAM_PROFILE,
		top: [...played].sort((a, b) => b.mins - a.mins).slice(0, 12).map(one),
		// latest unlocks across every game
		ach: lib.games
			.flatMap((g) => (g.ach?.recent ?? []).map((a): Unlock => ({ game: g.name, title: a.title, desc: a.desc, icon: a.icon, at: iso(a.at * 1000) })))
			.sort((a, b) => b.at.localeCompare(a.at))
			.slice(0, 10),
	};
}

// setlist.fm city names are admin areas ("Kotamadya Jakarta Barat"), keep the city people would say
const cityOf = (c: string) =>
	c
		.replace(/^(Kotamadya|Kota Administrasi|Kota|Kabupaten)\s+/, "")
		.replace(/\s+(Regency|City)$/, "")
		.replace(/^Jakarta\s+(Barat|Pusat|Timur|Selatan|Utara)$/, "Jakarta");

async function shows(): Promise<Show[]> {
	const sets = await devCache("setlistfm-attended", TTL, () => getSetlistAttended());
	const acts = [...new Map(sets.filter((s) => s.artist).map((s) => [s.artist, s.mbid] as const))];
	const photos = new Map(await mapLimit(acts, 6, async ([n, mbid]) => [n, await deezerImageFor(n, mbid)] as const));
	return sets.map((s) => ({
		id: s.id,
		artist: s.artist,
		img: photos.get(s.artist) ?? "",
		venue: s.venue,
		city: cityOf(s.city),
		date: iso(s.date),
		url: s.url,
		tour: s.tour ?? "",
		songs: s.songs,
	}));
}

async function code() {
	// GitHub repos tagged `portfolio` (featured ones first), or the list in config when that's unavailable
	const fetched = await getProjects();
	const projects: Project[] = fetched?.length
		? fetched.map((p) => ({ t: p.title, cat: p.category, d: p.description, img: p.image ?? "", url: p.url, site: p.site, featured: p.featured }))
		: userConfig.projects.map((p) => ({ t: p.title, cat: p.category, d: p.description, img: p.image?.src ?? "", url: p.url, site: "", featured: false }));
	// always one featured project to lead with
	if (projects.length && !projects.some((p) => p.featured)) projects[0].featured = true;
	// what changed lately on this site, from its own git history
	let commits: Commit[] = [];
	try {
		commits = execSync("git log -6 --format=%h%x09%s%x09%cI", { encoding: "utf8" })
			.trim()
			.split("\n")
			.filter(Boolean)
			.map((l) => {
				const [sha, msg, date] = l.split("\t");
				return { sha, msg, date };
			});
	} catch {
		// no git history at build time: the code door just skips "lately"
	}
	return { projects: [...projects.filter((p) => p.featured), ...projects.filter((p) => !p.featured)], commits };
}

async function load() {
	const [listen, wr, playData, showList, codeData] = await Promise.all([getListenData(), watchAndRead(), play(), shows(), code()]);
	return { listen, ...wr, play: playData, shows: showList, code: codeData };
}

// every page is the same room, so a build fetches everything once
let loading: ReturnType<typeof load> | null = null;
export const getRoomData = () => (loading ??= load());

export type RoomData = Awaited<ReturnType<typeof load>>;
