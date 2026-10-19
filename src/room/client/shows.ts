// Hanging bands: each ribbon is a two-segment pendulum hung from the rail. The upper part swings on its own spring (slower
// the longer it is), the lower part with the lock follows it with a lag, so the heavy end whips. Brushing the pointer
// through pushes ribbons by the pointer's horizontal speed, more the closer and the lower down it catches them.
interface Ribbon {
	el: HTMLElement;
	lo: HTMLElement;
	a: number;
	v: number;
	b: number;
	w: number;
	i: number;
}

export function shows() {
	const RIB = new WeakMap<HTMLElement, Ribbon>();
	const live = new Set<Ribbon>();
	let raf = 0;
	let last = 0;
	let px: number | null = null;
	let pt = 0;
	const still = matchMedia("(prefers-reduced-motion: reduce)");
	const state = (el: HTMLElement) => {
		let r = RIB.get(el);
		if (!r) {
			r = { el, lo: el.querySelector<HTMLElement>(".lo") as HTMLElement, a: 0, v: 0, b: 0, w: 0, i: [...(el.parentNode?.children ?? [])].indexOf(el) };
			RIB.set(el, r);
		}
		return r;
	};
	const step = (now: number) => {
		const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
		last = now;
		// contact: a ribbon swinging into its neighbour pushes it, measured where they'd touch (70% down the shorter one)
		for (const r of [...live]) {
			for (const j of [r.i - 1, r.i + 1]) {
				const nb = r.el.parentNode?.children[j] as HTMLElement | undefined;
				if (!nb) continue;
				const o = state(nb);
				const side = Math.sign(j - r.i);
				const d = Math.min(r.el.offsetHeight, nb.offsetHeight) * 1.56 * 0.7;
				const xr = r.el.offsetLeft + r.el.offsetWidth / 2 + Math.sin(r.a) * d;
				const xo = nb.offsetLeft + nb.offsetWidth / 2 + Math.sin(o.a) * d;
				const gap = (xo - xr) * side - r.el.offsetWidth * 0.9;
				if (gap < 0) {
					const p = (-gap * 0.9 * dt * 60) / d;
					r.v -= side * p;
					o.v += side * p;
					live.add(o);
				}
			}
		}
		for (const r of live) {
			const len = r.el.offsetHeight * 1.56 || 300; // whole ribbon, both segments, in px
			const k = (9.8 * 520) / len; // pendulum spring: shorter ribbons swing faster
			r.v += (-k * r.a - 1.5 * r.v) * dt;
			r.a += r.v * dt;
			// the lower segment's angle relative to the upper one: pulled back straight, kicked by the upper's acceleration
			r.w += (-60 * (r.b - r.a) - 3.2 * (r.w - r.v)) * dt;
			r.b += r.w * dt;
			r.el.style.rotate = `${r.a}rad`;
			r.lo.style.rotate = `${r.b - r.a}rad`;
			if (Math.abs(r.a) + Math.abs(r.v) + Math.abs(r.b - r.a) + Math.abs(r.w) < 1e-3) {
				r.a = r.v = r.b = r.w = 0;
				r.el.style.rotate = r.lo.style.rotate = "";
				live.delete(r);
			}
		}
		raf = live.size ? requestAnimationFrame(step) : 0;
	};
	document.addEventListener("pointermove", (e) => {
		const hang = (e.target as Element).closest?.(".sd-hang");
		if (!hang || still.matches) {
			px = null;
			return;
		}
		const now = performance.now();
		const vx = px == null ? 0 : ((e.clientX - px) / Math.max(8, now - pt)) * 1000; // px per second
		px = e.clientX;
		pt = now;
		if (!vx) return;
		for (const el of hang.querySelectorAll<HTMLElement>(".hb")) {
			const b = el.getBoundingClientRect();
			const len = b.height * 1.56;
			const d = Math.abs(e.clientX - (b.left + b.width / 2));
			const y = (e.clientY - b.top) / len;
			if (d > 26 || y < 0 || y > 1) continue;
			const r = state(el);
			const f = (1 - d / 26) * (0.25 + y); // a push low down moves it more than one near the rail
			r.v = Math.max(-2.2, Math.min(2.2, r.v + (vx * f * 0.0009) / (len / 300)));
			live.add(r);
		}
		if (live.size && !raf) {
			last = performance.now();
			raf = requestAnimationFrame(step);
		}
	});
	// on a phone the shelves are the only thing that moves the bands: the rail travels with the swipe and the ribbons lag
	// behind it, the lock end most
	const strip = document.getElementById("strip");
	const phone = matchMedia("(max-width: 760px)");
	let sl = strip?.scrollLeft ?? 0;
	strip?.addEventListener(
		"scroll",
		() => {
			const d = strip.scrollLeft - sl;
			sl = strip.scrollLeft;
			if (!phone.matches || still.matches || !d) return;
			for (const el of strip.querySelectorAll<HTMLElement>(".box:not(.on) .sd-hang .hb")) {
				const r = state(el);
				const len = el.offsetHeight * 1.56 || 300;
				r.v = Math.max(-2.2, Math.min(2.2, r.v - (d * 0.012) / (len / 300)));
				live.add(r);
			}
			if (live.size && !raf) {
				last = performance.now();
				raf = requestAnimationFrame(step);
			}
		},
		{ passive: true },
	);
}
