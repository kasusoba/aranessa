// Artist photos via Deezer's keyless public API, shared by listen (top artists)
// and shows (setlist.fm acts). Cached forever in the persistent kv store.
import { kvGet, kvSet } from "./cache";

// Run async work over a list with a small concurrency cap (be nice to Deezer).
export async function mapLimit<T, R>(
	items: T[],
	limit: number,
	fn: (t: T) => Promise<R>,
) {
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
export async function deezerImage(name: string): Promise<string> {
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

// The artist's own Deezer page, through MusicBrainz: a name search picks the most popular match, so "Eve" (the
// Japanese singer) came back as the US rapper. MusicBrainz links an artist to its Deezer id, so an mbid (setlist.fm
// gives one per act) finds the right one. Falls back to the name search when there's no link.
// Only an actual MusicBrainz answer is cached: from CI it often answers 503 (shared runner IPs), and caching that
// as "no link" pinned the wrong photo on every later build. The key is v2 so those poisoned entries are skipped.
let mbLast = 0;
async function mbFetch(url: string) {
	for (let attempt = 0; attempt < 4; attempt++) {
		// MusicBrainz allows one request a second; back off further after a 503
		const gap = 1100 * 2 ** attempt;
		const wait = mbLast + gap - Date.now();
		mbLast = Date.now() + Math.max(0, wait);
		if (wait > 0) await new Promise((r) => setTimeout(r, wait));
		try {
			const r = await fetch(url, {
				headers: {
					"User-Agent": "aranessa-site/1.0 (https://onesal.me)",
					Accept: "application/json",
				},
			});
			if (r.ok) return await r.json();
			if (r.status === 404) return { relations: [] };
		} catch {
			// network hiccup, try again
		}
	}
	return null;
}

export async function deezerImageFor(
	name: string,
	mbid?: string,
): Promise<string> {
	if (!mbid) return deezerImage(name);
	const key = `deezer:mbid2:${mbid}`;
	const cached = kvGet(key);
	if (cached !== undefined) return cached || deezerImage(name);
	const d = await mbFetch(
		`https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`,
	);
	if (!d) {
		console.warn(
			`[shows] musicbrainz unreachable for ${name} (${mbid}), using the name search this build`,
		);
		return deezerImage(name);
	}
	const id = (d.relations ?? [])
		.map(
			(x: { url?: { resource?: string } }) =>
				String(x.url?.resource ?? "").match(
					/deezer\.com\/(?:\w+\/)?artist\/(\d+)/,
				)?.[1],
		)
		.find(Boolean);
	if (!id) {
		kvSet(key, "");
		return deezerImage(name);
	}
	try {
		const a = await (await fetch(`https://api.deezer.com/artist/${id}`)).json();
		const url = a.picture_medium ?? "";
		if (url) kvSet(key, url);
		return url || deezerImage(name);
	} catch {
		return deezerImage(name);
	}
}
