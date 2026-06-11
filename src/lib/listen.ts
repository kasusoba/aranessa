// Data layer for the listen page. Server-rendered: everything is resolved at
// build time (static site), so the page ships zero runtime API calls. Period
// switching is done client-side by toggling pre-rendered per-range blocks.
import { devCache, kvGet, kvSet } from "./cache";
import {
	getLovedTracks,
	getRecentTracks,
	getTopAlbums,
	getTopArtists,
	getTopTracks,
} from "./lastfm";
import { getRelativeTime } from "./utils";

const TTL = 30 * 60 * 1000;
const STAR = "2a96cbd8b46e442fc41c2b86b821562f"; // Last.fm placeholder image hash

export const PERIODS = [
	{ value: "7day", label: "7d" },
	{ value: "1month", label: "30d" },
	{ value: "3month", label: "90d" },
	{ value: "6month", label: "180d" },
	{ value: "12month", label: "year" },
	{ value: "overall", label: "all" },
] as const;

export const DEFAULT_PERIOD = "3month";

type Img = Array<{ "#text": string; size: string }>;
const pick = (arr: Img | undefined, order = ["extralarge", "large", "medium"]) => {
	for (const s of order) {
		const u = arr?.find((i) => i.size === s)?.["#text"];
		if (u && !u.includes(STAR)) return u;
	}
	return "";
};
const rel = (uts?: string) =>
	uts ? getRelativeTime(new Date(parseInt(uts, 10) * 1000)) : "";

// Run async work over a list with a small concurrency cap (be nice to Deezer).
async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>) {
	const out: R[] = new Array(items.length);
	let i = 0;
	await Promise.all(
		Array.from({ length: Math.min(limit, items.length) }, async () => {
			while (i < items.length) {
				const idx = i++;
				out[idx] = await fn(items[idx]);
			}
		}),
	);
	return out;
}

// Resolve an artist photo via Deezer's keyless public API, cached forever in the
// persistent kv store (like TMDB posters). "" is cached for no-match.
async function deezerImage(name: string): Promise<string> {
	const key = `deezer:artist:${name.toLowerCase()}`;
	const cached = kvGet(key);
	if (cached !== undefined) return cached;
	let url = "";
	try {
		const r = await fetch(
			`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=1`,
		);
		const d = await r.json();
		url = d.data?.[0]?.picture_medium ?? "";
	} catch {
		// best-effort; leave blank
	}
	kvSet(key, url);
	return url;
}

export async function getListenData() {
	// Period-keyed top lists for every range (so chips toggle client-side).
	const periodData = await devCache("ll-periods", TTL, async () => {
		const entries = await Promise.all(
			PERIODS.map(async (p) => {
				const [albums, artists, tracks] = await Promise.all([
					getTopAlbums(14, p.value),
					getTopArtists(10, p.value),
					getTopTracks(10, p.value),
				]);
				return [p.value, { albums, artists, tracks }] as const;
			}),
		);
		return Object.fromEntries(entries);
	});

	const [recentRaw, lovedRaw] = await Promise.all([
		devCache("ll-recent", TTL, () => getRecentTracks(20)),
		devCache("ll-loved", TTL, () => getLovedTracks(12)),
	]);

	// Resolve Deezer photos for every artist that appears in any period (deduped).
	const artistNames = [
		...new Set(
			PERIODS.flatMap((p) => periodData[p.value].artists.map((a) => a.name)),
		),
	];
	const imgPairs = await mapLimit(artistNames, 6, async (n) => [n, await deezerImage(n)] as const);
	const artistImg = new Map(imgPairs);

	const periods = Object.fromEntries(
		PERIODS.map((p) => {
			const d = periodData[p.value];
			return [
				p.value,
				{
					albums: d.albums.map((a) => ({
						name: a.name,
						artist: a.artist.name,
						image: pick(a.image),
						url: a.url,
						plays: Number(a.playcount),
					})),
					artists: d.artists.map((a) => ({
						name: a.name,
						url: a.url,
						plays: Number(a.playcount),
						image: artistImg.get(a.name) || "",
					})),
					tracks: d.tracks.map((t) => ({
						name: t.name,
						artist: t.artist.name,
						image: pick(t.image),
						url: t.url,
						plays: Number(t.playcount),
					})),
				},
			];
		}),
	);

	const recent = recentRaw.map((t) => ({
		name: t.name,
		artist: t.artist["#text"],
		album: t.album["#text"],
		image: pick(t.image, ["large", "medium"]),
		url: t.url,
		live: t["@attr"]?.nowplaying === "true",
		when: rel(t.date?.uts),
	}));
	const nowPlaying = recent.find((r) => r.live) ?? recent[0];
	const feed = nowPlaying ? recent.filter((r) => r !== nowPlaying) : recent;

	const loved = lovedRaw.map((t) => ({ name: t.name, artist: t.artist.name, url: t.url }));

	return { periods, nowPlaying, feed, loved };
}

export type ListenData = Awaited<ReturnType<typeof getListenData>>;
