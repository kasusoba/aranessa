// The strip: opening a door widens it while the scroll follows, so it glides to the middle in one motion. Each door's
// opened view comes out of its <template>. The url follows the open door (/listen, /i), and back/forward work.
import { refresh } from "./time";

const NAMES: Record<string, string> = { me: "i" };
const pathOf = (k: string | null) => (k ? `/${NAMES[k] ?? k}` : "/");
const keyOf = (path: string) => {
	const p = path.replace(/^\/|\/$/g, "");
	return p === "i" ? "me" : p || null;
};
const titleOf = (k: string | null) => (k ? `${NAMES[k] ?? k} · onesal.me` : "onesal.me");

export function strip(onClose: () => boolean) {
	const found = document.getElementById("strip");
	if (!found) return;
	const el: HTMLElement = found;
	const boxes = () => [...el.querySelectorAll<HTMLElement>(".box:not(.end-box)")];
	const keys = boxes().map((b) => b.dataset.k ?? "");
	let cur: string | null = el.querySelector<HTMLElement>(".box.on")?.dataset.k ?? null;
	const timers = new Map<HTMLElement, number>();
	// on a phone an opened door comes up over the shelves, outside the scroll, so the strip doesn't follow it
	const phone = matchMedia("(max-width: 760px)");

	// css eases the flex-basis change; this follows it with the scroll so the opened box glides to the middle
	// instead of the old one collapsing under it first. closing keeps the box where it is.
	const ease = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
		let lo = 0;
		let hi = 1;
		let u = t;
		for (let i = 0; i < 24; i++) {
			u = (lo + hi) / 2;
			if (3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 < t) lo = u;
			else hi = u;
		}
		return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3;
	};
	const curve = ease(0.2, 0.8, 0.2, 1);
	const DUR = 550;
	let raf = 0;
	const mid = (b: Element) => {
		const r = b.getBoundingClientRect();
		const s = el.getBoundingClientRect();
		return r.left + r.width / 2 - s.left;
	};
	function follow(box: Element, from: number, to: number) {
		cancelAnimationFrame(raf);
		const t0 = performance.now();
		const step = (now: number) => {
			const p = Math.min(1, (now - t0) / DUR);
			el.scrollLeft += mid(box) - (from + (to - from) * curve(p));
			if (p < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	}
	const stopFollow = () => cancelAnimationFrame(raf);
	el.addEventListener("pointerdown", stopFollow);

	// a page that landed open has no template for its door yet: the view it has becomes one, for opening again
	function stash(b: HTMLElement) {
		const view = b.querySelector(".lv-xl");
		if (!view || b.querySelector("template[data-view]")) return;
		const t = document.createElement("template");
		t.dataset.view = "";
		t.content.append(...view.childNodes);
		b.append(t);
	}

	function go(k: string | null, push = true) {
		if (k && !keys.includes(k)) k = null;
		if (k === cur) return;
		const anchor = el.querySelector(`.box[data-k="${k ?? cur}"]`);
		const from = anchor ? mid(anchor) : 0;
		for (const b of boxes()) {
			const on = b.dataset.k === k;
			b.classList.toggle("on", on);
			if (on) {
				clearTimeout(timers.get(b));
				b.classList.remove("closing", "settle");
				stash(b);
				b.querySelector(".lv-xl")?.remove();
				b.classList.add("has-xl");
				const view = document.createElement("div");
				view.className = "lv-xl";
				view.append(b.querySelector<HTMLTemplateElement>("template[data-view]")?.content.cloneNode(true) ?? "");
				b.append(view);
				refresh(view);
				view.dispatchEvent(new CustomEvent("room:open", { bubbles: true }));
			} else if (b.classList.contains("has-xl") && !b.classList.contains("closing")) {
				// the opened view fades out fast; the door's own content waits until the box is narrow again
				b.classList.add("closing");
				timers.set(
					b,
					window.setTimeout(() => {
						b.classList.remove("has-xl", "closing");
						stash(b);
						b.querySelector(".lv-xl")?.remove();
						b.classList.add("settle");
						timers.set(b, window.setTimeout(() => b.classList.remove("settle"), 300));
					}, 560),
				);
			}
		}
		cur = k;
		el.classList.toggle("has-on", !!k);
		if (anchor && !phone.matches) follow(anchor, from, k ? el.clientWidth / 2 : from);
		document.title = titleOf(k);
		if (push) history.pushState({ k }, "", pathOf(k));
	}

	// doors grow with the screen until the row overflows with the end door half in view, so the strip always reads as
	// scrollable. when the real doors already overflow at the smallest width, they stay at the smallest width.
	// (a phone ignores --door: its shelves hold desktop-sized doors at 80%)
	function size() {
		const min = 190;
		const gap = 10;
		const n = keys.length;
		const w = el.clientWidth;
		const door = n * min + (n - 1) * gap > w ? min : Math.max(min, (w - n * gap) / (n + 0.5));
		el.style.setProperty("--door", `${door}px`);
	}
	size();
	addEventListener("resize", size);

	// a page like /listen lands with that door open and centred
	const open = cur && el.querySelector(`.box[data-k="${cur}"]`);
	if (open) {
		if (!phone.matches) el.scrollLeft += mid(open) - el.clientWidth / 2;
		open.querySelector(".lv-xl")?.dispatchEvent(new CustomEvent("room:open", { bubbles: true }));
	}
	history.replaceState({ k: cur }, "");
	addEventListener("popstate", (e) => go(e.state?.k ?? keyOf(location.pathname), false));

	el.addEventListener(
		"wheel",
		(e) => {
			stopFollow();
			if ((e.target as Element).closest(".box.on")) return;
			if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
				el.scrollLeft += e.deltaY;
				e.preventDefault();
			}
		},
		{ passive: false },
	);
	el.addEventListener("click", (e) => {
		const t = e.target as Element;
		if (t.closest("[data-close]")) {
			e.stopPropagation();
			return go(null);
		}
		// a verb in the "i" door or view opens its own door
		const v = t.closest<HTMLElement>("[data-go]");
		if (v && keys.includes(v.dataset.go ?? "")) {
			e.stopPropagation();
			return go(v.dataset.go ?? null);
		}
		const b = t.closest<HTMLElement>(".box:not(.end-box)");
		if (!b) return;
		// the door's name is a real link (keyboard, no js, a new tab); a plain click opens it in place
		if (t.closest("a.nm")) {
			if (e.metaKey || e.ctrlKey || e.shiftKey) return;
			e.preventDefault();
		}
		if (b.dataset.k !== cur) go(b.dataset.k ?? null);
	});
	document.addEventListener("keydown", (e) => {
		if (e.metaKey || e.ctrlKey || e.altKey) return;
		if (e.key === "Escape") {
			if (!onClose()) go(null);
			return;
		}
		if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
			const i = cur ? keys.indexOf(cur) : -1;
			const d = e.key === "ArrowRight" ? 1 : -1;
			go(keys[(i + d + keys.length) % keys.length]);
		}
	});
}
