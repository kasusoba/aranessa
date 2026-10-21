// What's on right now: Last.fm's now playing lights the listen door and view, Trakt's now watching lights watch.
// Both show the thing itself, not just a lit label: the playing album moves to the front of the crate, the show
// on now gets its own channel at the top of the guide. Polled every 30 seconds while the page is open; a view
// opened later picks up the latest state.
import { cov, EQ, esc, ext, fresh } from "../render/util";
import { fetchTracks, fetchWatching, type LiveTrack, type LiveWatch, poll } from "../../scripts/live";
import { agoNode, setFresh } from "./time";
import { tune } from "./watch";

let track: LiveTrack | null = null;
let watching: LiveWatch | null = null;

const lo = (s: string) => esc(s.toLowerCase());
const trackCov = (t: LiveTrack) => cov({ img: t.image }, t.artist + t.album);
const watchCov = (w: LiveWatch) => cov({ img: w.image }, w.title);

// the front sleeve of the door's crate: the album playing now while it plays, back to the built one after
function paintFront(root: ParentNode, t: LiveTrack | null) {
	for (const sv of root.querySelectorAll<HTMLElement>(".ld-peek .sv:last-child")) {
		const i = sv.querySelector<HTMLElement>("i");
		const b = i?.querySelector("b");
		if (!i || !b) continue;
		if (!sv.dataset.home) sv.dataset.home = JSON.stringify({ bg: i.style.background, label: b.textContent, title: sv.title });
		const home = JSON.parse(sv.dataset.home);
		sv.classList.toggle("np", !!t);
		i.style.background = t ? trackCov(t) : home.bg;
		b.textContent = t ? `${t.name} · ${t.artist}`.toLowerCase() : home.label;
		sv.title = t ? `${t.name}, ${t.artist}` : home.title;
	}
}

function paintListen(root: ParentNode) {
	if (!track) return;
	const t = track;
	const live = t.live;
	for (const el of root.querySelectorAll<HTMLElement>("[data-np-head]")) {
		el.className = live ? "live" : "muted";
		if (live) el.innerHTML = `now ${EQ}`;
		else if (t.date) el.replaceChildren(agoNode(t.date));
	}
	paintFront(root, live ? t : null);
	for (const el of root.querySelectorAll<HTMLElement>("[data-np-view]")) {
		if (live) el.innerHTML = `<span class="lit">now playing</span> ${EQ} <a class="np-t" ${ext(t.url)}>${esc(t.name)}</a> <span class="np-a">· ${lo(t.artist)}</span>`;
		else if (t.date) el.replaceChildren("last played · ", agoNode(t.date));
	}
	for (const li of root.querySelectorAll<HTMLElement>("[data-np-built]")) {
		li.hidden = live && li.dataset.npBuilt === t.name;
		const ss = li.closest<HTMLElement>(".ss");
		if (ss) ss.hidden = [...ss.querySelectorAll("li")].every((x) => x.hidden);
	}
	// on top of recently, the track playing now, like a session of its own
	for (const el of root.querySelectorAll<HTMLElement>("[data-np-row]")) {
		el.hidden = !live;
		if (live)
			el.innerHTML = `<i class="u-lit" style="background:${trackCov(t)}"></i><div><b>${esc(t.album || t.name)}</b><small>${lo(t.artist)}</small><ol><li><a ${ext(t.url)}>${esc(t.name)}</a><em class="live">now ${EQ}</em></li></ol></div>`;
	}
}

// how far into it, from when trakt says it started and expects it to end
const progress = (w: LiveWatch) => {
	const a = Date.parse(w.started);
	const b = Date.parse(w.expires);
	return a && b > a ? Math.min(1, Math.max(0, (Date.now() - a) / (b - a))) : 0;
};

// the show on now as channel "live" at the top of the guide; the set tunes to it and comes back to it on leave
function paintChannel(set: HTMLElement, w: LiveWatch | null) {
	const gd = set.querySelector(".gd");
	if (!gd) return;
	let row = gd.querySelector<HTMLElement>(".ch.np");
	if (!w) {
		if (!row) return;
		row.remove();
		const home = gd.querySelector<HTMLElement>(".ch");
		if (home) tune(set, home);
		return;
	}
	const added = !row;
	if (!row) {
		row = document.createElement(set.matches("[data-tune]") ? "a" : "div");
		row.className = "ch np";
		gd.prepend(row);
	}
	const p = progress(w);
	const label = w.type === "movie" ? "film" : w.sub;
	Object.assign(row.dataset, {
		bg: watchCov(w),
		osd: `live · ${label}`,
		pct: String(p),
		title: w.title,
		sub: `${w.type} · ${label}`,
		type: w.type,
	});
	if (row instanceof HTMLAnchorElement && w.url) Object.assign(row, { href: w.url, target: "_blank", rel: "noreferrer" });
	row.innerHTML = `<em>${EQ}</em><b>${esc(w.title)}</b><span>${esc(label)}</span>${row instanceof HTMLAnchorElement ? `<small class="live">on now</small>${p ? `<s style="width:${p * 100}%"></s>` : ""}` : ""}`;
	// tune in the first time it shows up; after that just keep the set's bar moving while it's on screen
	if (added) tune(set, row);
	else if (row.classList.contains("on")) {
		const bar = set.querySelector<HTMLElement>(".tvb .pb s");
		if (bar) bar.style.width = `${p * 100}%`;
	}
}

function paintWatch(root: ParentNode) {
	const box = root.querySelector('.box[data-k="watch"]') ?? (root as Element).closest?.('.box[data-k="watch"]');
	if (!box) return;
	const on = !!watching?.live;
	// while trakt says something's on, the labels stay lit; after that they go back to "how long ago"
	for (const el of box.querySelectorAll<HTMLElement>("[data-fresh]")) {
		el.dataset.forced = on ? "1" : "";
		setFresh(el, on || undefined);
	}
	const set = box.querySelector<HTMLElement>(".wd-chan");
	set?.classList.toggle("live", on || fresh(set.dataset.freshLive, 3));
	for (const s of box.querySelectorAll<HTMLElement>(".wd-chan, [data-tune]")) paintChannel(s, on ? watching : null);
}

export function live() {
	poll(async () => {
		const tracks = await fetchTracks(1);
		if (!tracks?.[0]) return;
		track = tracks[0];
		paintListen(document);
	}, 30000);
	poll(async () => {
		const w = await fetchWatching();
		if (!w) return;
		watching = w;
		paintWatch(document);
	}, 30000);
	document.addEventListener("room:open", (e) => {
		paintListen(e.target as Element);
		paintWatch(e.target as Element);
	});
}
