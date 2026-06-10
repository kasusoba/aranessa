import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

// Build-time only (this code never runs on Cloudflare — the site is prerendered
// to static assets). Two caches live under .cache/:
//   - a persistent key/value store for effectively-immutable data (TMDB poster
//     paths), so repeat builds don't re-hit the API.
//   - a dev-only TTL cache of whole fetch results, so `astro dev` reloads don't
//     re-call every API. Production builds always fetch fresh.

const CACHE_DIR = ".cache";

// biome-ignore lint/suspicious/noExplicitAny: cached JSON is arbitrary
function readJson(file: string): any {
	try {
		return JSON.parse(readFileSync(file, "utf8"));
	} catch {
		return null;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: cached JSON is arbitrary
function writeJson(file: string, data: any): void {
	try {
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, JSON.stringify(data));
	} catch {
		// best-effort; a failed cache write shouldn't break the build
	}
}

// --- Persistent key/value cache (poster paths etc.) ---
const KV_FILE = `${CACHE_DIR}/kv.json`;
let kv: Record<string, string> | null = null;

function loadKv(): Record<string, string> {
	if (!kv) kv = readJson(KV_FILE) ?? {};
	return kv;
}

// Returns undefined when the key was never cached (vs "" for a cached miss).
export function kvGet(key: string): string | undefined {
	return loadKv()[key];
}

export function kvSet(key: string, value: string): void {
	loadKv()[key] = value;
	writeJson(KV_FILE, kv);
}

// --- Dev-only TTL cache for whole fetch results ---
// Revive ISO date strings back into Date objects on read.
// biome-ignore lint/suspicious/noExplicitAny: reviver handles arbitrary JSON
function reviveDates(_key: string, value: any): any {
	return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)
		? new Date(value)
		: value;
}

export async function devCache<T>(
	key: string,
	ttlMs: number,
	fn: () => Promise<T>,
): Promise<T> {
	// Only active when explicitly enabled (the `pnpm dev` script sets this).
	// Production builds never read or write this cache, so deploys are fresh.
	if (process.env.DEV_CACHE !== "1") return fn();

	const file = `${CACHE_DIR}/dev-${key}.json`;
	try {
		const raw = readFileSync(file, "utf8");
		const parsed = JSON.parse(raw, reviveDates);
		if (parsed && Date.now() - parsed._t < ttlMs) return parsed._v as T;
	} catch {
		// no/!stale cache — fall through to fetch
	}

	const value = await fn();
	writeJson(file, { _t: Date.now(), _v: value });
	return value;
}
