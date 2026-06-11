// Data layer for the home page. Assembles a "right now" snapshot (now-playing,
// currently watching/reading/playing) + a unified "lately" feed from every
// source: Last.fm, AniList, Trakt, Steam, Hardcover. Server-rendered at build.
import { devCache } from "./cache";
import { getAnilistActivity } from "./anilist";
import { getHardcoverReading } from "./hardcover";
import { getRecentTracks } from "./lastfm";
import { getRecentGames, getHeaderImage, formatHours } from "./steam";
import { getTraktHistory } from "./trakt";
import { getRelativeTime } from "./utils";

const TTL = 30 * 60 * 1000;
const STAR = "2a96cbd8b46e442fc41c2b86b821562f";
type Img = Array<{ "#text": string; size: string }>;
const pickImg = (arr: Img | undefined) => {
	for (const s of ["extralarge", "large", "medium"]) {
		const u = arr?.find((i) => i.size === s)?.["#text"];
		if (u && !u.includes(STAR)) return u;
	}
	return "";
};
const lastPart = (p: string | number) => String(p).split(" - ").pop() ?? "";

export async function getHomeData() {
	const [tracks, anilist, trakt, games, reading] = await Promise.all([
		devCache("home-tracks", TTL, () => getRecentTracks(16)),
		devCache("home-anilist", TTL, () => getAnilistActivity(undefined, 1)),
		devCache("home-trakt", TTL, () => getTraktHistory(undefined, 14)),
		devCache("home-games", TTL, () => getRecentGames(3)),
		devCache("home-reading", TTL, () => getHardcoverReading()),
	]);

	// --- Listen ---
	const recentTracks = tracks.map((t) => ({
		kind: "listen" as const,
		title: t.name,
		sub: t.artist["#text"],
		image: pickImg(t.image),
		url: t.url,
		live: t["@attr"]?.nowplaying === "true",
		date: t.date?.uts ? new Date(parseInt(t.date.uts, 10) * 1000) : new Date(),
		when: t.date?.uts ? getRelativeTime(new Date(parseInt(t.date.uts, 10) * 1000)) : "",
	}));
	const nowPlaying = recentTracks.find((t) => t.live) ?? recentTracks[0];

	// --- Watch / read (AniList activity + Trakt history) ---
	const aniItems = anilist
		.filter((a) => {
			const s = a.status?.toLowerCase() ?? "";
			return !s.includes("dropped") && !s.includes("planning") && !s.includes("paused");
		})
		.map((a) => {
			const done = a.status?.toLowerCase().includes("completed");
			const isAnime = a.media.type === "ANIME";
			return {
				kind: (isAnime ? "anime" : "manga") as "anime" | "manga",
				title: a.media.title.english || a.media.title.romaji,
				sub: done ? "completed" : isAnime ? `e${lastPart(a.progress)}` : `ch${lastPart(a.progress)}`,
				image: a.media.coverImage.large,
				url: a.siteUrl || a.media.siteUrl,
				date: new Date(a.createdAt * 1000),
			};
		});
	const traktItems = trakt.map((t) => {
		const ep = t.type === "episode";
		return {
			kind: (ep ? "show" : "movie") as "show" | "movie",
			title: (ep ? t.show?.title : t.movie?.title) ?? "",
			sub: ep ? `s${t.episode?.season}e${t.episode?.number}` : "film",
			image: t.image ?? "",
			url: ep
				? `https://trakt.tv/shows/${t.show?.ids.trakt}/seasons/${t.episode?.season}/episodes/${t.episode?.number}`
				: `https://trakt.tv/movies/${t.movie?.ids.trakt}`,
			date: new Date(t.watched_at),
		};
	});
	const watchRow = [...aniItems, ...traktItems]
		.map((i) => ({ ...i, when: getRelativeTime(i.date) }))
		.sort((a, b) => b.date.getTime() - a.date.getTime());

	// --- Games ---
	const gameItems = games.map((g) => ({
		kind: "game" as const,
		title: g.name,
		sub: formatHours(g.playtime_forever),
		image: getHeaderImage(g.appid),
		url: "https://steamcommunity.com/profiles/76561198238407266",
		date: new Date(g.last_played * 1000),
		when: getRelativeTime(new Date(g.last_played * 1000)),
	}));

	// --- Book (currently reading) ---
	const book = reading[0]
		? {
				kind: "book" as const,
				title: reading[0].title,
				sub: reading[0].progress,
				image: reading[0].image ?? "",
				url: reading[0].url,
				date: reading[0].date,
				when: getRelativeTime(reading[0].date),
			}
		: null;

	// --- "Right now" quad: listening / watching / reading / playing ---
	const watching = watchRow.find((i) => i.kind === "anime" || i.kind === "show" || i.kind === "movie") ?? null;
	const mangaLatest = watchRow.find((i) => i.kind === "manga") ?? null;
	const reading_ =
		book && (!mangaLatest || book.date.getTime() > mangaLatest.date.getTime()) ? book : mangaLatest;
	const quad = {
		listening: nowPlaying
			? { label: nowPlaying.live ? "now playing" : "last played", ...nowPlaying }
			: null,
		watching: watching ? { label: "watching", ...watching } : null,
		reading: reading_ ? { label: "reading", ...reading_ } : null,
		playing: gameItems[0] ? { label: "playing", ...gameItems[0] } : null,
	};

	// --- Unified chronological feed (variant B) ---
	const feed = [...recentTracks, ...watchRow, ...gameItems]
		.filter((i) => i.image)
		.sort((a, b) => b.date.getTime() - a.date.getTime())
		.slice(0, 18);

	return { nowPlaying, recentTracks, watchRow, games: gameItems, book, quad, feed };
}

export type HomeData = Awaited<ReturnType<typeof getHomeData>>;
