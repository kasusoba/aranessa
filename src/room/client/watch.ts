// Watch. Hovering a channel (in the door's guide, or the opened view's) tunes the telly to it through a moment of static;
// leaving goes back to the latest. Each channel carries what it shows in data attributes.
function tune(set: HTMLElement, row: HTMLElement) {
	const nz = set.querySelector(".nz");
	for (const c of set.querySelectorAll(".ch")) c.classList.toggle("on", c === row);
	nz?.classList.add("on");
	clearTimeout(Number(set.dataset.t));
	set.dataset.t = String(
		setTimeout(() => {
			const scr = set.querySelector<HTMLElement>(".scr i");
			if (scr) scr.style.background = row.dataset.bg ?? "";
			const osd = set.querySelector(".osd");
			if (osd) osd.textContent = row.dataset.osd ?? "";
			const pb = set.querySelector<HTMLElement>(".pb");
			const p = Number(row.dataset.pct) || 0;
			if (pb) {
				if (set.matches("[data-tune]")) pb.style.visibility = p ? "" : "hidden";
				(pb.firstElementChild as HTMLElement).style.width = `${p * 100}%`;
			}
			const tt = set.querySelector("[data-tt]");
			if (tt && row.dataset.title) tt.textContent = row.dataset.title;
			const ts = set.querySelector("[data-ts]");
			if (ts && row.dataset.sub) ts.textContent = row.dataset.sub;
			setTimeout(() => nz?.classList.remove("on"), 120);
		}, 140),
	);
}
const SETS = ".wd-chan, [data-tune]";

export function watch() {
	document.addEventListener("pointerover", (e) => {
		const set = (e.target as Element).closest?.<HTMLElement>(SETS);
		// in the door, the set itself counts as channel 01
		const row = (e.target as Element).closest?.<HTMLElement>(".ch") ?? (set?.matches(".wd-chan") ? set.querySelector<HTMLElement>(".ch") : null);
		if (set && row && set.contains(row) && !row.classList.contains("on")) tune(set, row);
	});
	document.addEventListener("pointerout", (e) => {
		const set = (e.target as Element).closest?.<HTMLElement>(SETS);
		if (!set || set.contains(e.relatedTarget as Node)) return;
		const home = set.querySelector<HTMLElement>(".ch");
		if (home && !home.classList.contains("on")) tune(set, home);
	});
}
