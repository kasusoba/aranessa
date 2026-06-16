// Client-side live pollers shared by the home, listen, and watch pages. The
// site is static (built once), so "now playing" (Last.fm) and "now watching"
// (Trakt) come alive in the browser by polling and normalizing into the small
// shapes the pages wire into their own markup.
import { getRelativeTime } from "../lib/utils";

const LFM_KEY = import.meta.env.PUBLIC_LASTFM_API_KEY;
const LFM_USER = import.meta.env.PUBLIC_LASTFM_USERNAME;
const TRAKT_KEY = import.meta.env.PUBLIC_TRAKT_CLIENT_ID;
const TRAKT_USER = import.meta.env.PUBLIC_TRAKT_USERNAME;
const TMDB_KEY = import.meta.env.PUBLIC_TMDB_API_KEY;

const STAR = "2a96cbd8b46e442fc41c2b86b821562f"; // Last.fm placeholder image hash

// biome-ignore lint/suspicious/noExplicitAny: loosely-typed Last.fm image array
function pickImg(images: any, order = ["extralarge", "large", "medium"]): string {
	for (const s of order) {
		// biome-ignore lint/suspicious/noExplicitAny: loosely-typed entry
		const u = images?.find((i: any) => i.size === s)?.["#text"];
		if (u && !u.includes(STAR)) return u;
	}
	return "";
}

export interface LiveTrack {
	live: boolean;
	name: string;
	artist: string;
	url: string;
	image: string;
	when: string;
}

// Recent Last.fm tracks; index 0 carries @attr.nowplaying when something's on.
export async function fetchTracks(limit = 20): Promise<LiveTrack[] | null> {
	if (!LFM_KEY || !LFM_USER) return null;
	try {
		const res = await fetch(
			`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LFM_USER}&api_key=${LFM_KEY}&format=json&limit=${limit}`,
		);
		if (!res.ok) return null;
		const data = await res.json();
		const tracks = data?.recenttracks?.track;
		if (!Array.isArray(tracks)) return null;
		// biome-ignore lint/suspicious/noExplicitAny: loosely-typed Last.fm track
		return tracks.map((t: any) => {
			const uts = t.date?.uts;
			return {
				live: t["@attr"]?.nowplaying === "true",
				name: t.name,
				artist: t.artist?.["#text"] ?? "",
				url: t.url,
				image: pickImg(t.image),
				when: uts ? getRelativeTime(new Date(parseInt(uts, 10) * 1000)) : "",
			};
		});
	} catch {
		return null;
	}
}

export interface LiveWatch {
	live: boolean;
	title: string;
	sub: string;
	url: string;
	image: string;
}

async function tmdbPoster(type: "movie" | "tv", id?: number): Promise<string> {
	if (!TMDB_KEY || !id) return "";
	try {
		const res = await fetch(
			`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_KEY}`,
		);
		if (!res.ok) return "";
		const d = await res.json();
		return d.poster_path ? `https://image.tmdb.org/t/p/w342${d.poster_path}` : "";
	} catch {
		return "";
	}
}

// Trakt currently-watching. A 204 means nothing is on (live: false). Returns
// null only when unconfigured or the request fails, so callers leave the UI be.
export async function fetchWatching(): Promise<LiveWatch | null> {
	if (!TRAKT_KEY || !TRAKT_USER) return null;
	const idle: LiveWatch = { live: false, title: "", sub: "", url: "", image: "" };
	try {
		const res = await fetch(`https://api.trakt.tv/users/${TRAKT_USER}/watching`, {
			headers: { "trakt-api-version": "2", "trakt-api-key": TRAKT_KEY },
		});
		if (res.status === 204) return idle;
		if (!res.ok) return null;
		const d = await res.json();
		if (d.type === "episode") {
			const s = d.episode?.season;
			const n = d.episode?.number;
			return {
				live: true,
				title: d.show?.title ?? "",
				sub: `s${s}e${n}`,
				url: `https://trakt.tv/shows/${d.show?.ids?.trakt}/seasons/${s}/episodes/${n}`,
				image: await tmdbPoster("tv", d.show?.ids?.tmdb),
			};
		}
		if (d.type === "movie") {
			return {
				live: true,
				title: d.movie?.title ?? "",
				sub: "film",
				url: `https://trakt.tv/movies/${d.movie?.ids?.trakt}`,
				image: await tmdbPoster("movie", d.movie?.ids?.tmdb),
			};
		}
		return idle;
	} catch {
		return null;
	}
}

// Run now, then on an interval. Returns the timer so callers can clear it.
export function poll(fn: () => void, ms: number): number {
	fn();
	return window.setInterval(fn, ms);
}
