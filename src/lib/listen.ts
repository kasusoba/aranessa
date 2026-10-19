// Data layer for the listen aspect. Resolved at build time (static site); the
// period chips switch between pre-rendered per-range blocks in the browser.
import { devCache } from "./cache";
import { deezerImage, mapLimit } from "./deezer";
import {
	getRecentTracks,
	getTopAlbums,
	getTopArtists,
	getTopTracks,
} from "./lastfm";

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

	const recentRaw = await devCache("ll-recent", TTL, () => getRecentTracks(20));

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
						img: pick(a.image),
						url: a.url,
						plays: Number(a.playcount),
					})),
					artists: d.artists.map((a) => ({
						name: a.name,
						img: artistImg.get(a.name) || "",
						url: a.url,
						plays: Number(a.playcount),
					})),
					tracks: d.tracks.map((t) => ({
						name: t.name,
						artist: t.artist.name,
						img: pick(t.image),
						url: t.url,
						plays: Number(t.playcount),
					})),
				},
			];
		}),
	) as Record<string, ListenPeriod>;

	const recent: ListenTrack[] = recentRaw.map((t) => ({
		name: t.name,
		artist: t.artist["#text"],
		album: t.album?.["#text"] ?? "",
		img: pick(t.image),
		url: t.url,
		live: t["@attr"]?.nowplaying === "true",
		date: t.date?.uts ? new Date(Number(t.date.uts) * 1000).toISOString() : new Date().toISOString(),
	}));
	const now = recent.find((r) => r.live) ?? recent[0];
	return { now, recent: recent.filter((r) => r !== now), periods };
}

export interface ListenItem {
	name: string;
	artist: string;
	img: string;
	url: string;
	plays: number;
}
export interface ListenPeriod {
	albums: ListenItem[];
	artists: Omit<ListenItem, "artist">[];
	tracks: ListenItem[];
}
export interface ListenTrack {
	name: string;
	artist: string;
	album: string;
	img: string;
	url: string;
	live: boolean;
	date: string;
}
export type ListenData = Awaited<ReturnType<typeof getListenData>>;
