// What's on right now: Last.fm's now playing lights the listen door and view, Trakt's now watching lights watch.
// Polled every 30 seconds while the page is open; a view opened later picks up the latest state.
import { EQ, fresh } from "../render/util";
import { fetchTracks, fetchWatching, type LiveTrack, poll } from "../../scripts/live";
import { agoNode, setFresh } from "./time";

let track: LiveTrack | null = null;
let watching = false;

function paintListen(root: ParentNode) {
	if (!track) return;
	const live = track.live;
	for (const el of root.querySelectorAll<HTMLElement>("[data-np-head]")) {
		el.className = live ? "live" : "muted";
		if (live) el.innerHTML = `now ${EQ}`;
		else if (track.date) el.replaceChildren(agoNode(track.date));
	}
	for (const el of root.querySelectorAll<HTMLElement>("[data-np-view]")) {
		if (live) el.innerHTML = `<span class="lit">now playing</span> ${EQ}`;
		else if (track.date) el.replaceChildren("last played · ", agoNode(track.date));
	}
	for (const el of root.querySelectorAll<HTMLElement>("[data-np-time]")) {
		el.dataset.hm ??= el.textContent ?? "";
		el.textContent = live ? "now" : el.dataset.hm;
	}
}

function paintWatch(root: ParentNode) {
	const box = root.querySelector('.box[data-k="watch"]') ?? (root as Element).closest?.('.box[data-k="watch"]');
	if (!box) return;
	// while trakt says something's on, the labels stay lit; after that they go back to "how long ago"
	for (const el of box.querySelectorAll<HTMLElement>("[data-fresh]")) {
		el.dataset.forced = watching ? "1" : "";
		setFresh(el, watching || undefined);
	}
	const set = box.querySelector<HTMLElement>(".wd-chan");
	set?.classList.toggle("live", watching || fresh(set.dataset.freshLive, 3));
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
		watching = w.live;
		paintWatch(document);
	}, 30000);
	document.addEventListener("room:open", (e) => {
		paintListen(e.target as Element);
		paintWatch(e.target as Element);
	});
}
