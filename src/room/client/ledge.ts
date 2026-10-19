// The ledge: the now pill opens the sticky note above it. Returns close() for esc, which says whether it closed anything.
export function ledge() {
	const el = document.getElementById("ledge");
	const btn = el?.querySelector<HTMLElement>("[data-pop]");
	const pop = el?.querySelector<HTMLElement>(".pop");
	let on = false;
	const toggle = (show = !on) => {
		if (!el || !btn || !pop) return;
		on = show;
		btn.classList.toggle("on", on);
		btn.setAttribute("aria-expanded", String(on));
		if (!on) return pop.classList.remove("on");
		const lr = el.getBoundingClientRect();
		const br = btn.getBoundingClientRect();
		pop.style.left = `${Math.max(0, Math.min(br.left - lr.left, lr.width - pop.offsetWidth))}px`;
		pop.classList.add("on");
	};
	btn?.addEventListener("click", () => toggle());
	document.addEventListener("click", (e) => {
		if (on && !el?.contains(e.target as Node)) toggle(false);
	});
	return () => {
		const had = on;
		if (on) toggle(false);
		return had;
	};
}
