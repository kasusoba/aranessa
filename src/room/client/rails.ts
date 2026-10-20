// Rails: the rows that scroll sideways (favorites). A trackpad or shift+wheel already scrolls them; with only a mouse
// they can be dragged, and arrows at each end step them by most of a screen. An arrow shows only while there's more
// that way. A drag that moved doesn't count as a click on what it started on.
const RAILS = ".hrow3";

function arm(row: HTMLElement) {
	if (row.parentElement?.classList.contains("rail")) return;
	const wrap = document.createElement("div");
	wrap.className = "rail";
	row.before(wrap);
	wrap.append(row);
	const btn = (d: -1 | 1) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = `ra ${d < 0 ? "l" : "r"}`;
		b.setAttribute("aria-label", d < 0 ? "scroll back" : "scroll on");
		b.textContent = d < 0 ? "‹" : "›";
		b.addEventListener("click", (e) => {
			e.stopPropagation();
			row.scrollBy({ left: d * row.clientWidth * 0.8, behavior: "smooth" });
		});
		wrap.append(b);
		return b;
	};
	const l = btn(-1);
	const r = btn(1);
	const ends = () => {
		const max = row.scrollWidth - row.clientWidth;
		l.hidden = row.scrollLeft <= 2;
		r.hidden = row.scrollLeft >= max - 2;
	};
	row.addEventListener("scroll", ends, { passive: true });
	new ResizeObserver(ends).observe(row);
	// a filter chip can change how much is in the row
	wrap.addEventListener("pointerenter", ends);
	ends();

	let drag: { x: number; left: number; moved: boolean; id: number } | null = null;
	let dragged = false;
	// the click that ends a drag lands on whatever was under the mouse: it doesn't count
	row.addEventListener(
		"click",
		(e) => {
			if (!dragged) return;
			e.preventDefault();
			e.stopPropagation();
		},
		{ capture: true },
	);
	row.addEventListener("pointerdown", (e) => {
		if (e.pointerType !== "mouse" || e.button !== 0 || row.scrollWidth <= row.clientWidth) return;
		drag = { x: e.clientX, left: row.scrollLeft, moved: false, id: e.pointerId };
	});
	row.addEventListener("pointermove", (e) => {
		if (!drag || e.pointerId !== drag.id) return;
		const dx = e.clientX - drag.x;
		if (!drag.moved && Math.abs(dx) < 5) return;
		if (!drag.moved) {
			drag.moved = true;
			row.setPointerCapture(e.pointerId);
			row.classList.add("dragging");
		}
		row.scrollLeft = drag.left - dx;
	});
	const end = () => {
		if (!drag) return;
		const moved = drag.moved;
		drag = null;
		row.classList.remove("dragging");
		if (!moved) return;
		dragged = true;
		setTimeout(() => (dragged = false), 50);
	};
	row.addEventListener("pointerup", end);
	row.addEventListener("pointercancel", end);
	// links and pictures would start the browser's own drag instead
	row.addEventListener("dragstart", (e) => e.preventDefault());
}

export function rails() {
	document.addEventListener("room:open", (e) => {
		for (const row of (e.target as Element).querySelectorAll<HTMLElement>(RAILS)) arm(row);
	});
}
