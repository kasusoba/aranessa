// Read, opened: the pile stays put on the left; hovering anything on the right (or a spine) puts that book on top of the
// pile with its bookmark slip and caption. Leaving goes back to the current book.
import { agoText } from "../render/util";

interface Lift {
	bg?: string;
	slip?: string;
	title?: string;
	sub?: string;
	subAgo?: string;
}

function put(g: HTMLElement, key: Element, x: Lift) {
	const on = g as HTMLElement & { _on?: Element };
	if (on._on === key) return;
	on._on = key;
	const c = g.querySelector<HTMLElement>("[data-sc]");
	c?.classList.add("swap");
	clearTimeout(Number(g.dataset.t));
	g.dataset.t = String(
		setTimeout(() => {
			if (c) {
				c.style.background = x.bg ?? "";
				c.classList.remove("swap");
			}
			const sm = g.querySelector("[data-sm]");
			if (sm) sm.textContent = x.slip ?? "";
			const tt = g.querySelector("[data-tt]");
			if (tt) tt.textContent = x.title ?? "";
			const ts = g.querySelector("[data-ts]");
			if (ts) ts.textContent = x.subAgo ? `${x.sub} · ${agoText(x.subAgo)}` : (x.sub ?? "");
		}, 120),
	);
}

export function read() {
	document.addEventListener("pointerover", (e) => {
		const g = (e.target as Element).closest?.<HTMLElement>("[data-lean]");
		const el = (e.target as Element).closest?.<HTMLElement>("[data-ti]");
		if (g && el && g.contains(el)) put(g, el, el.dataset);
	});
	document.addEventListener("pointerout", (e) => {
		const g = (e.target as Element).closest?.<HTMLElement>("[data-lean]");
		if (!g || g.contains(e.relatedTarget as Node)) return;
		const d = g.dataset;
		put(g, g, { bg: d.homeBg, slip: d.homeSlip, title: d.homeTt, sub: d.homeTs, subAgo: d.homeAgo });
	});
}
