// Inside the opened views: chips (switch panes, or filter by type), spoilers, long notes, "show all".
const ARCHIVE_CAP = 18;

function refilter(root: Element, v: string) {
	for (const el of root.querySelectorAll<HTMLElement>("[data-type]")) el.classList.toggle("off", v !== "all" && el.dataset.type !== v);
	for (const s of root.querySelectorAll("[data-sec]")) {
		const items = [...s.querySelectorAll("[data-type]")];
		s.classList.toggle("is-empty", items.length > 0 && items.every((i) => i.classList.contains("off")));
	}
	capArchive(root);
}

// an archive section shows its first few, then a "show all (n)" button
function capArchive(root: Element) {
	for (const s of root.querySelectorAll<HTMLElement>("[data-archive]")) {
		const cap = Number(s.dataset.cap) || ARCHIVE_CAP;
		const items = [...s.querySelectorAll(".body > * > [data-type]")];
		const vis = items.filter((i) => !i.classList.contains("off"));
		for (const i of items) i.classList.remove("extra");
		vis.forEach((i, n) => i.classList.toggle("extra", n >= cap));
		let b = s.querySelector<HTMLButtonElement>("[data-showall]");
		if (!b) {
			s.querySelector(".body")?.insertAdjacentHTML("beforeend", `<button class="more3" data-showall></button>`);
			b = s.querySelector<HTMLButtonElement>("[data-showall]");
		}
		if (!b) continue;
		b.hidden = vis.length <= cap;
		b.textContent = s.classList.contains("all") ? "show less" : `show all (${vis.length})`;
	}
	markLong(root);
}

// a note that runs past its clamp fades out and gets a visible "read more"; short ones show whole.
// measured again on resize, since the opened box is still growing when the view first lands
function markLong(root: Element) {
	for (const n of root.querySelectorAll<HTMLElement>("[data-note]")) {
		if (!n.offsetParent || n.classList.contains("open")) continue;
		const long = n.scrollHeight > n.clientHeight + 2;
		n.classList.toggle("long", long);
		const b = n.nextElementSibling?.matches("[data-more]") ? (n.nextElementSibling as HTMLElement) : null;
		if (b) b.hidden = !long;
		else if (long) n.insertAdjacentHTML("afterend", `<button class="nmore" data-more>read more</button>`);
	}
}

export function views() {
	document.addEventListener("click", (e) => {
		const t = e.target as Element;
		const root = t.closest(".v3");
		if (!root) return;
		const chip = t.closest<HTMLElement>(".chips3 button");
		if (chip) {
			const g = chip.parentElement as HTMLElement;
			for (const b of g.querySelectorAll("button")) b.classList.toggle("on", b === chip);
			if (g.dataset.group === "filter") refilter(root, chip.dataset.v ?? "all");
			else for (const p of root.querySelectorAll<HTMLElement>(`[data-pane="${g.dataset.group}"]`)) p.hidden = p.dataset.v !== chip.dataset.v;
			return;
		}
		// a spoiler comes off with a click anywhere on it; after that a click anywhere on a long review opens or closes it
		const sp = t.closest(".spoil");
		if (sp && !t.closest("a")) {
			sp.classList.remove("spoil");
			return markLong(root);
		}
		const note = !t.closest("a, .chips3") && t.closest("[data-type]")?.querySelector("[data-note].long");
		if (note) {
			const o = note.classList.toggle("open");
			const b = note.nextElementSibling;
			if (b?.matches("[data-more]")) b.textContent = o ? "show less" : "read more";
			return;
		}
		const all = t.closest("[data-showall]");
		if (all) {
			all.closest("[data-archive]")?.classList.toggle("all");
			capArchive(root);
		}
	});
	const sizer = new ResizeObserver((es) => {
		for (const e of es) markLong(e.target);
	});
	document.addEventListener("room:open", (e) => {
		const v = (e.target as Element).querySelector(".v3[data-filterable]");
		if (!v) return;
		capArchive(v);
		sizer.observe(v);
	});
}
