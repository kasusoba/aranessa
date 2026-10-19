// The "i" door's badge hangs from its clip: scrolling the strip tips it the other way, then a spring settles it back.
export function swing() {
	const el = document.getElementById("strip");
	if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	let last = el.scrollLeft;
	let vel = 0;
	let angle = 0;
	let spin = 0;
	let raf = 0;
	const MAX = 4;
	const cards = () => el.querySelectorAll<HTMLElement>("[data-swing] .card");
	const tick = () => {
		// lean against the scroll, softly capped; a damped spring follows the lean and settles back to straight
		const target = -MAX * Math.tanh(vel / 24);
		spin = (spin + (target - angle) * 0.1) * 0.82;
		angle += spin;
		vel *= 0.85;
		for (const c of cards()) c.style.rotate = `${angle.toFixed(2)}deg`;
		const moving = Math.abs(angle) > 0.02 || Math.abs(spin) > 0.01 || Math.abs(vel) > 0.1;
		if (!moving) {
			angle = spin = vel = 0;
			for (const c of cards()) c.style.rotate = "";
		}
		raf = moving ? requestAnimationFrame(tick) : 0;
	};
	el.addEventListener(
		"scroll",
		() => {
			vel = vel * 0.5 + (el.scrollLeft - last) * 0.5;
			last = el.scrollLeft;
			if (!raf) raf = requestAnimationFrame(tick);
		},
		{ passive: true },
	);
}
