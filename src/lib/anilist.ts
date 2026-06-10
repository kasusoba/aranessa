export const ANILIST_API_BASE = "https://graphql.anilist.co";

// Per-build memo: identical queries (e.g. the user-id lookup, or activity
// fetched by both the home and watch pages) resolve once and are shared. Lives
// for the build process only, so every deploy is still fresh.
// biome-ignore lint/suspicious/noExplicitAny: graphql response is arbitrary
const requestMemo = new Map<string, Promise<any>>();

// AniList rate-limits aggressively; a single build fires several queries. Retry
// on 429, honoring Retry-After, so favorites/notes don't silently drop out.
async function anilistRequest(
	query: string,
	// biome-ignore lint/suspicious/noExplicitAny: graphql variables are arbitrary
	variables: Record<string, any>,
	retries = 3,
	// biome-ignore lint/suspicious/noExplicitAny: graphql response is arbitrary
): Promise<any> {
	const key = JSON.stringify({ query, variables });
	const memoized = requestMemo.get(key);
	if (memoized) return memoized;

	const promise = (async () => {
		for (let attempt = 0; ; attempt++) {
			const res = await fetch(ANILIST_API_BASE, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({ query, variables }),
			});

			if (res.status === 429 && attempt < retries) {
				const retryAfter =
					Number(res.headers.get("Retry-After")) || 2 ** attempt;
				await new Promise((r) => setTimeout(r, retryAfter * 1000));
				continue;
			}
			return res.json();
		}
	})();

	requestMemo.set(key, promise);
	return promise;
}

export interface AnilistActivity {
	id: number;
	status: string; // "watched episode", "read chapter", "completed"
	progress: string | number;
	createdAt: number;
	siteUrl?: string;
	media: {
		id: number;
		siteUrl: string;
		title: {
			romaji: string;
			english: string;
			native: string;
		};
		coverImage: {
			large: string;
			medium: string;
		};
		type: "ANIME" | "MANGA";
		episodes: number | null;
		chapters: number | null;
	};
}

async function getUserId(username: string): Promise<number | null> {
	const query = `
    query ($username: String) {
      User (name: $username) {
        id
      }
    }
  `;
	try {
		const data = await anilistRequest(query, { username });
		return data.data?.User?.id || null;
	} catch (e) {
		console.error("Failed to fetch User ID", e);
		return null;
	}
}

export async function getAnilistActivity(
	startDate?: Date,
	maxPages = Number.POSITIVE_INFINITY,
): Promise<AnilistActivity[]> {
	const username = import.meta.env.ANILIST_USERNAME;

	if (!username) return [];

	const userId = await getUserId(username);
	if (!userId) return [];

	const query = `
    query ($userId: Int, $createdAt_greater: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        activities(userId: $userId, type: MEDIA_LIST, sort: ID_DESC, createdAt_greater: $createdAt_greater) {
          ... on ListActivity {
            id
            status
            progress
            createdAt
            siteUrl
            media {
              id
              siteUrl
              title {
                romaji
                english
                native
              }
              coverImage {
                large
                medium
              }
              type
              episodes
              chapters
            }
          }
        }
      }
    }
  `;

	const createdAt_greater = startDate
		? Math.floor(startDate.getTime() / 1000)
		: undefined;

	const allActivities: AnilistActivity[] = [];
	let page = 1;

	try {
		while (true) {
			const data = await anilistRequest(query, {
				userId,
				createdAt_greater,
				page,
			});

			if (data.errors) {
				console.error("Anilist API Errors:", data.errors);
				break;
			}

			const pageData = data.data.Page;
			allActivities.push(...pageData.activities);

			if (!pageData.pageInfo.hasNextPage || page >= maxPages) break;
			page++;
		}

		return allActivities;
	} catch (error) {
		console.error("Failed to fetch Anilist activity:", error);
		return [];
	}
}

export interface AnilistMediaLite {
	id: number;
	siteUrl: string;
	title: string;
	image: string; // large cover
	imageMedium: string; // smaller cover, for dense/thumbnail use
	type: "ANIME" | "MANGA";
}

export interface AnilistFavorites {
	anime: AnilistMediaLite[];
	manga: AnilistMediaLite[];
}

export interface AnilistNote {
	media: AnilistMediaLite;
	status: string; // CURRENT, COMPLETED, etc.
	notes: string;
	hasNote: boolean;
	score: number; // raw score in the user's scoreFormat
	scoreDisplay: string; // formatted for UI, "" if unscored
	date: number; // ms epoch used for sorting (completedAt → startedAt → updatedAt)
}

interface FuzzyDate {
	year: number | null;
	month: number | null;
	day: number | null;
}

// AniList fuzzy dates can be partial; return ms epoch or null if no year.
function fuzzyToMs(d: FuzzyDate | null | undefined): number | null {
	if (!d?.year) return null;
	return new Date(d.year, (d.month ?? 1) - 1, d.day ?? 1).getTime();
}

const FAVORITE_NODE = `nodes { id siteUrl title { english romaji } coverImage { large medium } }`;

function toMediaLite(
	node: {
		id: number;
		siteUrl: string;
		title: { english: string | null; romaji: string };
		coverImage: { large: string; medium: string };
	},
	type: "ANIME" | "MANGA",
): AnilistMediaLite {
	return {
		id: node.id,
		siteUrl: node.siteUrl,
		title: node.title.english || node.title.romaji,
		image: node.coverImage.large,
		imageMedium: node.coverImage.medium ?? node.coverImage.large,
		type,
	};
}

export async function getAnilistFavorites(): Promise<AnilistFavorites> {
	const username = import.meta.env.ANILIST_USERNAME;
	if (!username) return { anime: [], manga: [] };

	const query = `
    query ($userName: String) {
      User(name: $userName) {
        favourites {
          anime { ${FAVORITE_NODE} }
          manga { ${FAVORITE_NODE} }
        }
      }
    }
  `;

	try {
		const data = await anilistRequest(query, { userName: username });
		const fav = data.data?.User?.favourites;
		if (!fav) return { anime: [], manga: [] };
		return {
			anime: (fav.anime?.nodes ?? []).map((n: never) => toMediaLite(n, "ANIME")),
			manga: (fav.manga?.nodes ?? []).map((n: never) => toMediaLite(n, "MANGA")),
		};
	} catch (e) {
		console.error("Failed to fetch Anilist favorites", e);
		return { anime: [], manga: [] };
	}
}

// AniList scores come in one of several formats; normalize to a display string.
function formatScore(score: number, format: string): string {
	if (!score) return "";
	switch (format) {
		case "POINT_100":
			return `${score}/100`;
		case "POINT_10_DECIMAL":
			return `${score}/10`;
		case "POINT_10":
			return `${score}/10`;
		case "POINT_5":
			return `${score}/5`;
		case "POINT_3":
			return score >= 3 ? "🙂" : score === 2 ? "😐" : "🙁";
		default:
			return `${score}`;
	}
}

// Pull list entries that either have a note written or are completed, across
// both anime and manga. Callers split these into reviewed vs finished-only.
export async function getAnilistEntries(): Promise<AnilistNote[]> {
	const username = import.meta.env.ANILIST_USERNAME;
	if (!username) return [];

	const query = `
    query ($userName: String, $type: MediaType) {
      MediaListCollection(userName: $userName, type: $type) {
        user { mediaListOptions { scoreFormat } }
        lists {
          entries {
            score
            notes
            status
            updatedAt
            completedAt { year month day }
            startedAt { year month day }
            media { id siteUrl title { english romaji } coverImage { large medium } type }
          }
        }
      }
    }
  `;

	const fetchType = async (type: "ANIME" | "MANGA"): Promise<AnilistNote[]> => {
		const data = await anilistRequest(query, { userName: username, type });
		const collection = data.data?.MediaListCollection;
		if (!collection) return [];
		const format = collection.user?.mediaListOptions?.scoreFormat ?? "POINT_10";

		// An entry can appear in several lists (status list + custom lists), so
		// dedupe by media id.
		const seen = new Set<number>();
		return collection.lists
			.flatMap((list: { entries: never[] }) => list.entries)
			.filter(
				(e: { notes: string | null; status: string }) =>
					e.notes?.trim() || e.status === "COMPLETED",
			)
			.filter((e: { media: { id: number } }) => {
				if (seen.has(e.media.id)) return false;
				seen.add(e.media.id);
				return true;
			})
			.map(
				(e: {
					score: number;
					notes: string | null;
					status: string;
					updatedAt: number;
					completedAt: FuzzyDate;
					startedAt: FuzzyDate;
					media: never;
				}) => ({
					media: toMediaLite(e.media, type),
					status: e.status,
					notes: e.notes ?? "",
					hasNote: Boolean(e.notes?.trim()),
					score: e.score,
					scoreDisplay: formatScore(e.score, format),
					// Prefer when it was finished/started over updatedAt, which
					// bumps on any edit (progress, score, rewatch…).
					date:
						fuzzyToMs(e.completedAt) ??
						fuzzyToMs(e.startedAt) ??
						e.updatedAt * 1000,
				}),
			);
	};

	try {
		const [anime, manga] = await Promise.all([
			fetchType("ANIME"),
			fetchType("MANGA"),
		]);
		return [...anime, ...manga];
	} catch (e) {
		console.error("Failed to fetch Anilist notes", e);
		return [];
	}
}

// Helper to normalize the status string from activity to something cleaner
export function parseAnilistProgress(
	status: string,
	progress: string | number,
	type: string,
): string {
	const s = status ? status.toLowerCase() : "";

	if (s.includes("completed")) return "Completed";
	if (s.includes("dropped")) return "Dropped";
	if (s.includes("paused")) return "Paused";
	if (s.includes("plans")) return "Planning";

	// For "watched episode" or "read chapter"
	// progress might be "5" or "5 - 6"
	const p = progress ? progress.toString().split(" - ").pop() : "?";

	if (s.includes("read")) return `ch${p}`;
	if (s.includes("watched")) return `e${p}`;

	// Fallback
	const label = type === "ANIME" ? "e" : "ch";
	return `${label}${p}`;
}
