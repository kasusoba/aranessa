// Easter egg (Dorohedoro): clicking the photo on the badge in the opened "i" view travels into Kaiman's mouth to reveal
// Risu behind it, then a timed Netflix-style subtitle.
export function egg() {
	const bg = document.getElementById("egg-bg-doro");
	const teeth = document.getElementById("egg-teeth");
	const risu = document.getElementById("egg-risu");
	const line = document.querySelector<HTMLElement>("#egg-subtitle .egg-sub-text");
	if (!bg || !teeth || !risu || !line) return;
	let playing = false;
	document.addEventListener("click", (e) => {
		if (!(e.target as Element).closest("[data-egg-trigger]") || playing) return;
		e.preventDefault();
		playing = true;
		bg.style.opacity = "1";
		// travel forward: the front teeth blow past the camera, revealing Risu deeper in the throat
		teeth.animate([{ transform: "scale(1)", opacity: 1 }, { transform: "scale(2.6)", opacity: 0 }], { duration: 1500, easing: "cubic-bezier(.45,0,.55,1)", fill: "forwards" });
		risu.animate([{ transform: "scale(.7)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 1200, delay: 600, easing: "ease-out", fill: "forwards" });
		// then the subtitle appears over everything, holds like a real subtitle line, and fades
		setTimeout(() => {
			line.animate([{ transform: "translateY(8px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], { duration: 320, easing: "ease-out", fill: "forwards" });
			setTimeout(() => line.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, easing: "ease-in", fill: "forwards" }), 3000);
			playing = false;
		}, 1450);
	});
}
