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
	limit: number = 20,
): Promise<AnilistActivity[]> {
	const username = import.meta.env.PUBLIC_ANILIST_USERNAME;

	if (!username) return [];

	const userId = await getUserId(username);
	if (!userId) return [];

	const query = `
    query ($userId: Int, $perPage: Int) {
      Page(perPage: $perPage) {
        activities(userId: $userId, type: MEDIA_LIST, sort: ID_DESC) {
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

	try {
		const response = await fetch(ANILIST_API_BASE, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({
				query,
				variables: {
					userId,
					perPage: limit,
				},
			}),
		});

		const data = await response.json();

		if (data.errors) {
			console.error("Anilist API Errors:", data.errors);
			return [];
		}

		return data.data.Page.activities;
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
