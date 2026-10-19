// The room is built once, so anything relative to now is decided again in the browser: "3h ago", "today",
// labels that read "watching" for a few hours after something was watched, and the clock.
import { agoText, fresh } from "../render/util";

const day = (iso: string) =>
	new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase();
export const clock = () =>
	new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Jakarta" }).format(new Date()).toLowerCase();

export function agoNode(iso: string) {
	const t = document.createElement("time");
	t.dateTime = iso;
	t.dataset.ago = "";
	t.textContent = agoText(iso);
	return t;
}

// a fresh label: `on` (lit) while its time is within data-h hours, else `off` + how long ago
export function setFresh(el: HTMLElement, live = fresh(el.dataset.fresh, Number(el.dataset.h) || 3)) {
	if (live) {
		const s = document.createElement("span");
		s.className = "lit";
		s.textContent = el.dataset.on ?? "";
		el.replaceChildren(s);
	} else if (el.dataset.fresh) {
		el.replaceChildren(el.dataset.off ?? "", agoNode(el.dataset.fresh));
	}
}

export function refresh(root: ParentNode = document) {
	for (const t of root.querySelectorAll<HTMLTimeElement>("time[data-ago]")) t.textContent = agoText(t.dateTime);
	for (const t of root.querySelectorAll<HTMLTimeElement>("time[data-when]")) t.textContent = fresh(t.dateTime, 24) ? "today" : day(t.dateTime);
	for (const el of root.querySelectorAll<HTMLElement>("[data-fresh]")) if (!el.dataset.forced) setFresh(el);
	for (const el of root.querySelectorAll<HTMLElement>("[data-fresh-live]")) el.classList.toggle("live", fresh(el.dataset.freshLive, 3));
	for (const el of root.querySelectorAll<HTMLElement>("[data-clock]")) el.textContent = clock();
}

export function keepFresh() {
	refresh();
	setInterval(refresh, 30000);
}
