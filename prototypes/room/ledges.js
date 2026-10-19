/* the ledge: the slim bar under the strip with the small stuff. the now pill opens the sticky note, socials sit on the right.
   LEDGE.mount(el) builds it and wires the pop; LEDGE.close() is for esc and says whether it closed anything. */
const LEDGE = (() => {
  const socials = () => D2?.socials ?? D.socials.map(n => [n]);
  let el = null, pop = null, on = false;
  function toggle(show = !on) {
    on = show;
    el.querySelector("[data-pop]").classList.toggle("on", on);
    if (!on) return pop.classList.remove("on");
    const [w, h] = XL2_SIZE.now;
    pop.innerHTML = `<div style="position:relative;height:${h}px">${XL3.now()}</div>`;
    pop.style.width = w + "px";
    const lr = el.getBoundingClientRect(), br = el.querySelector("[data-pop]").getBoundingClientRect();
    pop.style.left = Math.max(0, Math.min(br.left - lr.left, lr.width - w)) + "px";
    pop.classList.add("on");
  }
  function mount(ledge) {
    el = ledge;
    el.innerHTML = `
      <button class="lg" data-pop="now">${glyph("now")} now <i>"daydreaming."</i></button>
      <span class="sp"></span>
      <span class="lg links">${glyph("elsewhere")} ${socials().map(([n, u]) => `<a ${u ? ext(u) : 'href="#"'}>${n}</a>`).join(" ")}</span>
      <div class="pop bare"></div>`;
    pop = el.querySelector(".pop");
    el.addEventListener("click", e => { if (e.target.closest("[data-pop]")) toggle(); });
    document.addEventListener("click", e => { if (on && !el.contains(e.target)) toggle(false); });
  }
  const close = () => { const had = on; if (on) toggle(false); return had; };
  return { mount, close };
})();
