import { kvGet, kvSet } from "./cache";

export const TRAKT_API_BASE = "https://api.trakt.tv";

// Trakt client id / username and the TMDB key double as client-side credentials
// for the live "now watching" poller, so prefer the PUBLIC_ names and fall back
// to the legacy server-only names so existing deployments keep building.
const TRAKT_CLIENT_ID =
	import.meta.env.PUBLIC_TRAKT_CLIENT_ID ?? import.meta.env.TRAKT_CLIENT_ID;
const TRAKT_USERNAME =
	import.meta.env.PUBLIC_TRAKT_USERNAME ?? import.meta.env.TRAKT_USERNAME;
const TMDB_API_KEY =
	import.meta.env.PUBLIC_TMDB_API_KEY ?? import.meta.env.TMDB_API_KEY;

export interface TraktHistoryItem {
	id: number;
	watched_at: string;
	action: string;
	type: "movie" | "episode";
	episode?: {
		season: number;
		number: number;
		title: string;
		ids: {
			trakt: number;
			tmdb: number;
		};
	};
	show?: {
		title: string;
		year: number;
		ids: {
			trakt: number;
			tmdb: number;
		};
	};
	movie?: {
		title: string;
		year: number;
		ids: {
			trakt: number;
			tmdb: number;
		};
	};
}

function traktHeaders(clientId: string) {
	return {
		"Content-Type": "application/json",
		"trakt-api-version": "2",
		"trakt-api-key": clientId,
		"User-Agent": "onesal.me/1.0",
	};
}

// Function to fetch image from TMDB if API key is present
async function getTmdbImage(
	type: "movie" | "tv",
	tmdbId: number,
	size: "w185" | "w342" | "w500" = "w342",
): Promise<string | null> {
	const apiKey = TMDB_API_KEY;
	if (!apiKey) return null;

	// Poster paths are effectively immutable, so cache them across builds.
	// "" is cached for posterless titles to avoid re-fetching them.
	const cacheKey = `tmdb:${type}:${tmdbId}`;
	let path = kvGet(cacheKey);
	if (path === undefined) {
		try {
			const response = await fetch(
				`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}`,
			);
			const data = await response.json();
			path = data.poster_path ?? "";
		} catch (error) {
			console.error("Failed to fetch TMDB image:", error);
			path = "";
		}
		kvSet(cacheKey, path ?? "");
	}

	return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export interface TraktItemWithImage extends TraktHistoryItem {
	image?: string | null;
}

export async function getTraktHistory(
	startDate?: Date,
	limit = 1000,
): Promise<TraktItemWithImage[]> {
	const clientId = TRAKT_CLIENT_ID;
	const username = TRAKT_USERNAME;

	if (!clientId || !username) return [];

	try {
		const params = new URLSearchParams({ limit: String(limit) });
		if (startDate) params.set("start_at", startDate.toISOString());
		const response = await fetch(
			`${TRAKT_API_BASE}/users/${username}/history?${params}`,
			{
				headers: {
					"Content-Type": "application/json",
					"trakt-api-version": "2",
					"trakt-api-key": clientId,
					"User-Agent": "onesal.me/1.0",
				},
			},
		);
		const data: TraktHistoryItem[] = await response.json();

		// Fetch images in parallel if TMDB key exists
		if (TMDB_API_KEY) {
			const itemsWithImages = await Promise.all(
				data.map(async (item) => {
					let imageUrl: string | null = null;
					if (item.type === "movie" && item.movie?.ids.tmdb) {
						imageUrl = await getTmdbImage("movie", item.movie.ids.tmdb);
					} else if (item.type === "episode" && item.show?.ids.tmdb) {
						imageUrl = await getTmdbImage("tv", item.show.ids.tmdb);
					}
					return { ...item, image: imageUrl };
				}),
			);
			return itemsWithImages;
		}

		return data.map((item) => ({ ...item, image: null }));
	} catch (error) {
		console.error("Failed to fetch Trakt history:", error);
		return [];
	}
}

type TraktMediaType = "movie" | "show" | "season" | "episode";

interface TraktIds {
	trakt: number;
	tmdb?: number;
}

// Build a key so a comment can find its matching rating.
function ratingKey(type: TraktMediaType, traktId: number): string {
	return `${type}:${traktId}`;
}

export interface TraktReview {
	id: number;
	title: string;
	subtitle: string; // "movie" | "tv" | "tv · s1e2" | "tv · season 1"
	image: string | null;
	url: string;
	rating: number | null; // 1-10
	note: string;
	spoiler: boolean;
	date: Date;
}

export interface TraktFavorite {
	id: number;
	title: string;
	image: string | null;
	url: string;
	type: "movie" | "tv";
}

async function getRatingLookup(
	username: string,
	clientId: string,
): Promise<Map<string, number>> {
	const lookup = new Map<string, number>();
	try {
		const res = await fetch(
			`${TRAKT_API_BASE}/users/${username}/ratings`,
			{ headers: traktHeaders(clientId) },
		);
		if (!res.ok) return lookup;
		const items: Array<{
			rating: number;
			type: TraktMediaType;
			movie?: { ids: TraktIds };
			show?: { ids: TraktIds };
			season?: { ids: TraktIds };
			episode?: { ids: TraktIds };
		}> = await res.json();
		for (const it of items) {
			const obj = it[it.type];
			if (obj?.ids?.trakt) lookup.set(ratingKey(it.type, obj.ids.trakt), it.rating);
		}
	} catch (e) {
		console.error("Failed to fetch Trakt ratings", e);
	}
	return lookup;
}

// Pull the user's comments (which they use as reviews), attaching the matching
// rating and a poster image. One comment per item is assumed.
export async function getTraktReviews(): Promise<TraktReview[]> {
	const clientId = TRAKT_CLIENT_ID;
	const username = TRAKT_USERNAME;
	if (!clientId || !username) return [];

	try {
		const [commentsRes, ratings] = await Promise.all([
			fetch(`${TRAKT_API_BASE}/users/${username}/comments/all/all?limit=100`, {
				headers: traktHeaders(clientId),
			}),
			getRatingLookup(username, clientId),
		]);
		if (!commentsRes.ok) return [];

		// biome-ignore lint/suspicious/noExplicitAny: trakt comment payload is loosely typed
		const items: any[] = await commentsRes.json();

		const reviews = await Promise.all(
			items
				.filter((it) => it.type !== "list" && it.comment?.comment)
				.map(async (it): Promise<TraktReview> => {
					const type: TraktMediaType = it.type;
					const show = it.show;
					let title = "";
					let subtitle = "";
					let url = "";
					let ratingId = 0;
					let tmdbType: "movie" | "tv" = "tv";
					let tmdbId: number | undefined;

					if (type === "movie") {
						title = it.movie.title;
						subtitle = "movie";
						url = `https://trakt.tv/movies/${it.movie.ids.trakt}`;
						ratingId = it.movie.ids.trakt;
						tmdbType = "movie";
						tmdbId = it.movie.ids.tmdb;
					} else if (type === "show") {
						title = show.title;
						subtitle = "tv";
						url = `https://trakt.tv/shows/${show.ids.trakt}`;
						ratingId = show.ids.trakt;
						tmdbId = show.ids.tmdb;
					} else if (type === "season") {
						title = show.title;
						subtitle = `tv · season ${it.season.number}`;
						url = `https://trakt.tv/shows/${show.ids.trakt}/seasons/${it.season.number}`;
						ratingId = it.season.ids.trakt;
						tmdbId = show.ids.tmdb;
					} else {
						// episode
						title = show.title;
						subtitle = `tv · s${it.episode.season}e${it.episode.number}`;
						url = `https://trakt.tv/shows/${show.ids.trakt}/seasons/${it.episode.season}/episodes/${it.episode.number}`;
						ratingId = it.episode.ids.trakt;
						tmdbId = show.ids.tmdb;
					}

					const image = tmdbId ? await getTmdbImage(tmdbType, tmdbId) : null;
					const note = (it.comment.comment as string)
						.replace(/\[\/?spoiler\]/gi, "")
						.trim();

					return {
						id: it.comment.id,
						title,
						subtitle,
						image,
						url,
						rating: ratings.get(ratingKey(type, ratingId)) ?? null,
						note,
						spoiler: Boolean(it.comment.spoiler),
						date: new Date(it.comment.updated_at || it.comment.created_at),
					};
				}),
		);

		return reviews.sort((a, b) => b.date.getTime() - a.date.getTime());
	} catch (e) {
		console.error("Failed to fetch Trakt reviews", e);
		return [];
	}
}

export async function getTraktFavorites(): Promise<TraktFavorite[]> {
	const clientId = TRAKT_CLIENT_ID;
	const username = TRAKT_USERNAME;
	if (!clientId || !username) return [];

	try {
		const res = await fetch(
			`${TRAKT_API_BASE}/users/${username}/favorites?limit=100`,
			{ headers: traktHeaders(clientId) },
		);
		if (!res.ok) return [];
		// biome-ignore lint/suspicious/noExplicitAny: trakt favorites payload is loosely typed
		const items: any[] = await res.json();

		return Promise.all(
			items
				.filter((it) => it.type === "movie" || it.type === "show")
				.map(async (it): Promise<TraktFavorite> => {
					const isMovie = it.type === "movie";
					const obj = isMovie ? it.movie : it.show;
					const image = obj.ids.tmdb
						? await getTmdbImage(isMovie ? "movie" : "tv", obj.ids.tmdb)
						: null;
					return {
						id: obj.ids.trakt,
						title: obj.title,
						image,
						url: `https://trakt.tv/${isMovie ? "movies" : "shows"}/${obj.ids.trakt}`,
						type: isMovie ? "movie" : "tv",
					};
				}),
		);
	} catch (e) {
		console.error("Failed to fetch Trakt favorites", e);
		return [];
	}
}

export interface TraktFinished {
	id: number;
	type: "movie" | "show";
	title: string;
	image: string | null;
	url: string;
	rating: number | null; // 1-10, or null if unrated
	date: Date;
}

// Finished movies & shows that the user has NOT commented on (those are
// reviews). "Finished" = every watched movie, and shows where the watched
// episode count has caught up to the aired count. Rating attached if present.
export async function getTraktFinished(): Promise<TraktFinished[]> {
	const clientId = TRAKT_CLIENT_ID;
	const username = TRAKT_USERNAME;
	if (!clientId || !username) return [];

	try {
		const get = (path: string) =>
			fetch(`${TRAKT_API_BASE}/users/${username}/${path}`, {
				headers: traktHeaders(clientId),
			});

		const [commentsRes, ratedMoviesRes, ratedShowsRes, watchedMoviesRes, watchedShowsRes] =
			await Promise.all([
				get("comments/all/all?limit=100"),
				get("ratings/movies"),
				get("ratings/shows"),
				get("watched/movies"),
				get("watched/shows?extended=full"),
			]);

		// Movies/shows that already have a comment (excluded — they're reviews).
		const reviewed = new Set<string>();
		if (commentsRes.ok) {
			// biome-ignore lint/suspicious/noExplicitAny: trakt payload is loosely typed
			for (const it of (await commentsRes.json()) as any[]) {
				if (it.type === "movie" && it.movie)
					reviewed.add(`movie:${it.movie.ids.trakt}`);
				else if (it.show) reviewed.add(`show:${it.show.ids.trakt}`);
			}
		}

		// Rating lookup, keyed by `${type}:${traktId}`.
		const ratings = new Map<string, number>();
		const addRatings = async (
			res: Response,
			kind: "movie" | "show",
		): Promise<void> => {
			if (!res.ok) return;
			// biome-ignore lint/suspicious/noExplicitAny: trakt payload is loosely typed
			for (const it of (await res.json()) as any[]) {
				const obj = kind === "movie" ? it.movie : it.show;
				if (obj?.ids?.trakt) ratings.set(`${kind}:${obj.ids.trakt}`, it.rating);
			}
		};
		await Promise.all([
			addRatings(ratedMoviesRes, "movie"),
			addRatings(ratedShowsRes, "show"),
		]);

		// biome-ignore lint/suspicious/noExplicitAny: trakt payload is loosely typed
		const watchedMovies: any[] = watchedMoviesRes.ok ? await watchedMoviesRes.json() : [];
		// biome-ignore lint/suspicious/noExplicitAny: trakt payload is loosely typed
		const watchedShows: any[] = watchedShowsRes.ok ? await watchedShowsRes.json() : [];

		// A show counts as finished once its watched-episode count reaches the
		// aired-episode count. The public watched/shows endpoint doesn't return a
		// per-season episode breakdown (even with extended=full), so rely on the
		// top-level `plays` total — it equals aired_episodes for a fully-watched
		// show (and only exceeds it on rewatches, which `>=` tolerates).
		// biome-ignore lint/suspicious/noExplicitAny: trakt payload is loosely typed
		const finishedShows = watchedShows.filter((it: any) => {
			const aired = it.show?.aired_episodes ?? 0;
			const plays = it.plays ?? 0;
			return aired > 0 && plays >= aired;
		});

		// biome-ignore lint/suspicious/noExplicitAny: trakt payload is loosely typed
		const mapItem = async (it: any, kind: "movie" | "show"): Promise<TraktFinished> => {
			const obj = kind === "movie" ? it.movie : it.show;
			const image = obj.ids.tmdb
				? await getTmdbImage(kind === "movie" ? "movie" : "tv", obj.ids.tmdb, "w185")
				: null;
			return {
				id: obj.ids.trakt,
				type: kind,
				title: obj.title,
				image,
				url: `https://trakt.tv/${kind === "movie" ? "movies" : "shows"}/${obj.ids.trakt}`,
				rating: ratings.get(`${kind}:${obj.ids.trakt}`) ?? null,
				date: new Date(it.last_watched_at),
			};
		};

		const all = await Promise.all([
			...watchedMovies.map((it) => mapItem(it, "movie")),
			...finishedShows.map((it) => mapItem(it, "show")),
		]);
		return all.filter((r) => !reviewed.has(`${r.type}:${r.id}`));
	} catch (e) {
		console.error("Failed to fetch Trakt finished", e);
		return [];
	}
}
