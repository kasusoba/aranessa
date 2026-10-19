// Listen. The door's crate: the hovered sleeve rises out of it; near the back there's no room above it, so the sleeves in
// front drop instead, by whatever the rise couldn't cover. The slots never move, only the sleeves inside them.
// The opened crate does the same for the picked album (sticky, so the pulled-out one stays readable).
const RISE = 64;

function lift(svs: HTMLElement[], sv: HTMLElement | undefined, rise: number) {
	for (const s of svs) {
		const i = s.querySelector<HTMLElement>("i");
		if (i) i.style.translate = "";
	}
	if (!sv) return;
	const up = Math.min(rise, sv.offsetTop);
	const i = sv.querySelector<HTMLElement>("i");
	if (i) i.style.translate = `0 ${-up}px`;
	for (let n = sv.nextElementSibling; n; n = n.nextElementSibling) {
		const ni = n.querySelector<HTMLElement>("i");
		if (ni) ni.style.translate = `0 ${rise - up}px`;
	}
}

// the door's crate with that sleeve up (none: all back down)
export function peek(stk: HTMLElement, sv?: HTMLElement) {
	for (const i of stk.querySelectorAll("i")) i.classList.remove("up");
	lift([...stk.querySelectorAll<HTMLElement>(".sv")], sv, RISE);
	sv?.querySelector("i")?.classList.add("up");
}

export function listen() {
	document.addEventListener("pointerover", (e) => {
		const t = e.target as Element;
		// the door
		const sv = t.closest?.<HTMLElement>(".ld-peek .sv:not(:last-child)") ?? undefined;
		for (const stk of document.querySelectorAll<HTMLElement>(".ld-peek .stk")) peek(stk, stk.contains(sv ?? null) ? sv : undefined);
		// the opened view: hovering an edge or a line picks that album
		const h = t.closest?.(".lv-tune");
		const pick = t.closest?.<HTMLElement>(".lv-tune [data-n]");
		if (!h || !pick) return;
		const n = Number(pick.dataset.n);
		for (const w of h.querySelectorAll(".sw")) [...w.children].forEach((x, i) => x.classList.toggle("on", i === n));
		for (const x of h.querySelectorAll<HTMLElement>(".lv-rows [data-n]")) x.classList.toggle("on", Number(x.dataset.n) === n);
		const crate = h.querySelector(".lv-crate");
		if (!crate) return;
		const svs = [...crate.querySelectorAll<HTMLElement>(".sv")];
		for (const s of svs) s.classList.toggle("on", Number(s.dataset.n) === n);
		const rise = (crate.querySelector<HTMLElement>(".sv:last-child i")?.offsetWidth ?? 0) * 0.42;
		lift(svs, n ? svs.find((s) => Number(s.dataset.n) === n) : undefined, rise);
	});
}
