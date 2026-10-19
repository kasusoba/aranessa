// Artist photos via Deezer's keyless public API, shared by listen (top artists)
// and shows (setlist.fm acts). Cached forever in the persistent kv store.
import { kvGet, kvSet } from "./cache";

// Run async work over a list with a small concurrency cap (be nice to Deezer).
export async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>) {
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
