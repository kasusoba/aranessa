// Shared pieces for rendering the room to html strings at build time. Everything time-relative is written as
// <time data-ago> (or data-fresh) and refreshed in the browser, so a static build doesn't go stale.

export const BASE = ["me", "listen", "watch", "read", "play", "code", "shows"] as const;
export type Aspect = (typeof BASE)[number];

export const NAME: Record<string, string> = { me: "i", listen: "listen", watch: "watch", read: "read", play: "play", code: "code", shows: "shows", now: "now", elsewhere: "elsewhere" };
const GLYPH: Record<string, string> = {
	me: '<circle cx="10" cy="10" r="6.5"/>',
	code: '<rect x="5.4" y="5.4" width="9.2" height="9.2" rx="1.5" transform="rotate(45 10 10)"/>',
	listen: '<path d="M10 3.5 16 15.5 4 15.5Z"/>',
	watch: '<path fill-rule="evenodd" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M7.4 10a2.6 2.6 0 1 1 5.2 0a2.6 2.6 0 1 1 -5.2 0"/>',
	read: '<rect x="4" y="4" width="12" height="12" rx="2.5"/>',
	play: '<path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5z"/>',
	shows: '<path d="M10 2 12 8 18 10 12 12 10 18 8 12 2 10 8 8z"/>',
	now: '<rect x="3" y="6.5" width="14" height="7" rx="3.5"/>',
	elsewhere: '<circle cx="7" cy="10" r="4.5"/><circle cx="13" cy="10" r="4.5" fill-opacity=".55"/>',
};
export const glyph = (k: string) => `<svg class="glyph" viewBox="0 0 20 20" aria-hidden="true">${GLYPH[k]}</svg>`;

export const hash = (s: string) => {
	let h = 0;
	for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
	return Math.abs(h);
};
// a generated gradient per name: the stand-in under every cover while it loads, or when there isn't one
export const art = (s: string) => {
	const h = hash(s) % 360;
	return `linear-gradient(135deg, hsl(${h} 45% 55%), hsl(${(h + 50) % 360} 50% 22%))`;
};
export const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
export const ext = (url?: string | null) => (url ? `href="${esc(url)}" target="_blank" rel="noreferrer"` : "");
// a real cover when there is one (img, then img2), the generated gradient underneath
export const cov = (o: { img?: string | null; img2?: string | null; t?: string; name?: string } | null | undefined, seed?: string) => {
	const layers = [o?.img, o?.img2]
		.filter((u): u is string => !!u)
		.map((u) => `url('${u.replace(/['"\s]/g, (c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)}') center/cover no-repeat`);
	return [...layers, art(seed ?? o?.t ?? o?.name ?? "")].join(", ");
};
export const pad2 = (i: number) => String(i + 1).padStart(2, "0");

export const agoText = (iso?: string | null) => {
	if (!iso) return "";
	const s = (Date.now() - new Date(iso).getTime()) / 1000;
	return s < 60
		? "just now"
		: s < 3600
			? `${(s / 60) | 0}m ago`
			: s < 86400
				? `${(s / 3600) | 0}h ago`
				: s < 604800
					? `${(s / 86400) | 0}d ago`
					: s < 2592000
						? `${(s / 604800) | 0}w ago`
						: s < 31536000
							? `${(s / 2592000) | 0}mo ago`
							: `${(s / 31536000) | 0}y ago`;
};
// "3h ago", kept current in the browser
export const ago = (iso?: string | null) => (iso ? `<time datetime="${iso}" data-ago>${agoText(iso)}</time>` : "");
export const fresh = (iso: string | null | undefined, h = 3) => !!iso && Date.now() - new Date(iso).getTime() < h * 3600e3;
// a label that reads `on` while iso is within h hours, else `off` + how long ago. decided again in the browser
export const freshLabel = (iso: string | null | undefined, on: string, off = "", h = 3) =>
	`<span data-fresh="${iso ?? ""}" data-h="${h}" data-on="${esc(on)}" data-off="${esc(off)}">${fresh(iso, h) ? `<span class="lit">${on}</span>` : `${esc(off)}${ago(iso)}`}</span>`;

export const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toLowerCase();
export const hours = (m: number) => {
	const h = Math.round(m / 60);
	return h === 1 ? "1 hr" : `${h.toLocaleString()} hrs`;
};
export const EQ = '<span class="eq"><i></i><i></i><i></i></span>';

export const PERIODS: [string, string][] = [["7day", "7d"], ["1month", "30d"], ["3month", "90d"], ["6month", "180d"], ["12month", "year"], ["overall", "all"]];
export const DEFAULT_PERIOD = "3month";

// chips switch panes (data-pane) or filter by type (group "filter"); see client/views.ts
export const chips = (group: string, items: [string, string][], on: string) =>
	`<div class="chips3" data-group="${group}">${items.map(([v, l]) => `<button data-v="${v}" class="${v === on ? "on" : ""}">${l}</button>`).join("")}</div>`;
export const types = (list: string[]): [string, string][] =>
	["all", ...["anime", "manga", "movie", "show", "book"].filter((t) => list.includes(t))].map((t) => [t, t]);
export const sec = (label: string, body: string, extra = "") =>
	`<section class="sec" data-sec ${extra}><div class="u-label">${label}</div><div class="body">${body}</div><div class="empty">nothing here yet</div></section>`;
export const wall = (list: { url: string; type: string; t: string; img: string; r: string }[]) =>
	`<div class="wallp">${list.map((x) => `<a ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i style="background:${cov(x)}"></i>${x.r ? `<b>★${esc(x.r)}</b>` : ""}</a>`).join("")}</div>`;

// object-printed dates, in the timezone the room lives in
const TZ = "Asia/Jakarta";
export const fmt = (iso: string, o: Intl.DateTimeFormatOptions, tz = TZ) =>
	new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...o }).format(new Date(iso)).toLowerCase();
export const hm = (iso: string) => fmt(iso, { hour: "2-digit", minute: "2-digit", hour12: false });
