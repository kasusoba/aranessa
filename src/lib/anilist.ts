export const ANILIST_API_BASE = "https://graphql.anilist.co";

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
		const response = await fetch(ANILIST_API_BASE, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ query, variables: { username } }),
		});
		const data = await response.json();
		return data.data?.User?.id || null;
	} catch (e) {
		console.error("Failed to fetch User ID", e);
		return null;
	}
}

export async function getAnilistActivity(
	startDate?: Date,
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
			const response = await fetch(ANILIST_API_BASE, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({
					query,
					variables: { userId, createdAt_greater, page },
				}),
			});

			const data = await response.json();

			if (data.errors) {
				console.error("Anilist API Errors:", data.errors);
				break;
			}

			const pageData = data.data.Page;
			allActivities.push(...pageData.activities);

			if (!pageData.pageInfo.hasNextPage) break;
			page++;
		}

		return allActivities;
	} catch (error) {
		console.error("Failed to fetch Anilist activity:", error);
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
