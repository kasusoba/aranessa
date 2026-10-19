// Picking, shared by play and shows: hovering anything with a data-n inside a picker switches every .sw in it (a detail,
// a caption) to that index and marks the matching data-n's. Door pickers (`reset`) go back to the first when the pointer
// moves off them; opened-view pickers stick, so the picked detail stays readable.
function pick(h: Element, n: number) {
	for (const w of h.querySelectorAll(".sw")) [...w.children].forEach((x, i) => x.classList.toggle("on", i === n));
	for (const x of h.querySelectorAll<HTMLElement>("[data-n]")) x.classList.toggle("on", Number(x.dataset.n) === n);
}

export function pickers(reset: string, sticky: string) {
	document.addEventListener("pointerover", (e) => {
		const t = e.target as Element;
		const door = t.closest?.(reset);
		for (const h of document.querySelectorAll(reset)) if (h !== door) pick(h, 0);
		const h = door ?? t.closest?.(sticky);
		const n = t.closest?.<HTMLElement>("[data-n]");
		if (h && n && h.contains(n)) pick(h, Number(n.dataset.n));
	});
}
