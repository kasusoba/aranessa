const SETLISTFM_API_BASE = "https://api.setlist.fm/rest/1.0";

export interface SetlistShow {
	id: string;
	artist: string;
	venue: string;
	city: string;
	country: string;
	date: Date;
	url: string;
	songs: string[];
}

// Shows the user marked "i was there" on setlist.fm, newest first. The API pages
// 20 at a time and allows ~2 requests a second, so pages are fetched one by one.
export async function getSetlistAttended(): Promise<SetlistShow[]> {
	const apiKey = import.meta.env.SETLISTFM_API_KEY;
	const username = import.meta.env.SETLISTFM_USERNAME;
	if (!apiKey || !username) return [];

	// biome-ignore lint/suspicious/noExplicitAny: setlist.fm payload is loosely typed
	const rows: any[] = [];
	try {
		for (let page = 1; ; page++) {
			const res = await fetch(
				`${SETLISTFM_API_BASE}/user/${encodeURIComponent(username)}/attended?p=${page}`,
				{ headers: { "x-api-key": apiKey, Accept: "application/json" } },
			);
			// 404 means the user has no (more) attended shows
			if (res.status === 404) break;
			if (!res.ok) {
				console.error(`setlist.fm API ${res.status}: ${await res.text()}`);
				break;
			}
			const json = await res.json();
			rows.push(...(json.setlist ?? []));
			if (page * json.itemsPerPage >= json.total) break;
			await new Promise((r) => setTimeout(r, 600));
		}
	} catch (e) {
		console.error("Failed to fetch from setlist.fm:", e);
	}

	return rows.map((s): SetlistShow => {
		// eventDate is dd-MM-yyyy
		const [d, m, y] = String(s.eventDate ?? "").split("-").map(Number);
		return {
			id: s.id,
			artist: s.artist?.name ?? "",
			venue: s.venue?.name ?? "",
			city: s.venue?.city?.name ?? "",
			country: s.venue?.city?.country?.name ?? "",
			date: new Date(Date.UTC(y, m - 1, d)),
			url: s.url,
			// biome-ignore lint/suspicious/noExplicitAny: setlist.fm payload is loosely typed
			songs: (s.sets?.set ?? []).flatMap((set: any) =>
				// biome-ignore lint/suspicious/noExplicitAny: setlist.fm payload is loosely typed
				(set.song ?? []).map((song: any) => song.name).filter(Boolean),
			),
		};
	});
}
