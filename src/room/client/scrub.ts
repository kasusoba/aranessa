// A phone has no hover, so swiping the shelves does what the pointer does on a desktop: every so many pixels of swipe,
// each door steps to its next sleeve, channel, book or case (back the other way when the swipe turns), and a moment
// after the shelves stop they all go back to the latest. The bands swing with the swipe in shows.ts.
import { peek } from "./listen";
import { pick } from "./pick";
import { tune } from "./watch";

const STEP = 36; // px of swipe per step
const REST = 900; // ms after the shelves stop before the doors go home

export function scrub() {
	const el = document.getElementById("strip");
	if (!el) return;
	const strip: HTMLElement = el;
	const phone = matchMedia("(max-width: 760px)");
	let last = strip.scrollLeft;
	let run = 0; // swipe since the doors were last home, in px, signed
	let shown = 0;
	let rest = 0;
	const doors = (sel: string) =>
		strip.querySelectorAll<HTMLElement>(`.box:not(.on) ${sel}`);
	// the k-th item of n, wrapping both ways; 0 is home
	const nth = (k: number, n: number) => ((k % n) + n) % n;

	function show(k: number) {
		// listen: the sleeves behind the front one rise in turn, front to back
		for (const stk of doors(".ld-peek .stk")) {
			const svs = [...stk.querySelectorAll<HTMLElement>(".sv")]
				.slice(0, -1)
				.reverse();
			const i = nth(k, svs.length + 1);
			peek(stk, i ? svs[i - 1] : undefined);
		}
		// watch: the telly tunes down the guide
		for (const set of doors(".wd-chan")) {
			const rows = [...set.querySelectorAll<HTMLElement>(".ch")];
			const row = rows[nth(k, rows.length)];
			if (row && !row.classList.contains("on")) tune(set, row);
		}
		// read: the books under the top one slide out in turn, top down
		for (const pile of doors(".rd-pull")) {
			const bks = [...pile.querySelectorAll<HTMLElement>(".bk")];
			const i = nth(k, bks.length + 1);
			for (const [j, b] of bks.entries())
				b.classList.toggle("out", j === i - 1);
		}
		// play and the shows caption: the picker steps through its items
		for (const h of doors(".pd-tune, .sd-tune")) {
			const n = new Set(
				[...h.querySelectorAll<HTMLElement>("[data-n]")].map(
					(x) => x.dataset.n,
				),
			).size;
			if (n) pick(h, nth(k, n));
		}
	}

	strip.addEventListener(
		"scroll",
		() => {
			const d = strip.scrollLeft - last;
			last = strip.scrollLeft;
			if (!phone.matches || strip.classList.contains("has-on")) return;
			run += d;
			const k = Math.trunc(run / STEP);
			if (k !== shown) {
				shown = k;
				show(k);
			}
			clearTimeout(rest);
			rest = window.setTimeout(() => {
				run = shown = 0;
				show(0);
			}, REST);
		},
		{ passive: true },
	);
}
