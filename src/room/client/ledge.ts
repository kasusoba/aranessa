// The ledge: each pill with a data-pop opens its pop above it (now: the sticky note; elsewhere: the socials on a narrow
// ledge). One open at a time. Returns close() for esc, which says whether it closed anything.
export function ledge() {
	const el = document.getElementById("ledge");
	if (!el) return () => false;
	const ledge: HTMLElement = el;
	let open: HTMLElement | null = null;
	const popOf = (btn: HTMLElement) => ledge.querySelector<HTMLElement>(`.pop[data-for="${btn.dataset.pop}"]`);
	const close = () => {
		if (!open) return;
		open.classList.remove("on");
		open.setAttribute("aria-expanded", "false");
		popOf(open)?.classList.remove("on");
		open = null;
	};
	const show = (btn: HTMLElement) => {
		const pop = popOf(btn);
		if (!pop) return;
		close();
		open = btn;
		btn.classList.add("on");
		btn.setAttribute("aria-expanded", "true");
		const lr = ledge.getBoundingClientRect();
		const br = btn.getBoundingClientRect();
		pop.style.left = `${Math.max(0, Math.min(br.left - lr.left, lr.width - pop.offsetWidth))}px`;
		pop.classList.add("on");
	};
	for (const btn of ledge.querySelectorAll<HTMLElement>("[data-pop]"))
		btn.addEventListener("click", () => (open === btn ? close() : show(btn)));
	document.addEventListener("click", (e) => {
		if (open && !ledge.contains(e.target as Node)) close();
	});
	return () => {
		const had = !!open;
		close();
		return had;
	};
}
