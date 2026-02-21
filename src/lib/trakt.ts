export const TRAKT_API_BASE = "https://api.trakt.tv";

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

// Function to fetch image from TMDB if API key is present
async function getTmdbImage(
	type: "movie" | "tv",
	tmdbId: number,
): Promise<string | null> {
	const apiKey = import.meta.env.PUBLIC_TMDB_API_KEY;
	if (!apiKey) return null;

	try {
		const response = await fetch(
			`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}`,
		);
		const data = await response.json();
		if (data.poster_path) {
			return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
		}
	} catch (error) {
		console.error("Failed to fetch TMDB image:", error);
	}
	return null;
}

export interface TraktItemWithImage extends TraktHistoryItem {
	image?: string | null;
}

export async function getTraktHistory(
	limit: number = 20,
): Promise<TraktItemWithImage[]> {
	const clientId = import.meta.env.PUBLIC_TRAKT_CLIENT_ID;
	const username = import.meta.env.PUBLIC_TRAKT_USERNAME;

	if (!clientId || !username) return [];

	try {
		const response = await fetch(
			`${TRAKT_API_BASE}/users/${username}/history?limit=${limit}`,
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
		if (import.meta.env.PUBLIC_TMDB_API_KEY) {
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
