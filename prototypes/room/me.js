/* the "i" aspect. door: the badge with the verbs stamped on it, swinging a little as the strip scrolls. opened: the badge on the desk. */
const PHOTO = "../../src/assets/profile.jpeg";
// the line from the real home page, verb by verb. a verb links to its door when the room has one.
const WHATEVER = [["make"], ["play", "play"], ["listen to", "listen"], ["watch", "watch"], ["read", "read"], ["write", "write"], ["code", "code"], ["draw", "draw"], ["share", "gallery"]];

// only link a verb when its door is in the room right now (write, draw, share come with the bigger rooms)
const verb = ([v, k], cls = "") => {
  const live = k && (typeof strip === "undefined" || strip.keys.includes(k));
  return `<span class="${cls}" ${live ? `data-go="${k}"` : ""}>${v}</span>`;
};
const photo = (cls = "") => `<i class="m-photo ${cls}" style="background-image:url('${PHOTO}')"></i>`;

// a signature drawn as one stroke: s, a, a tall looped l, then a flourish back under the name
const SIG = `<svg class="sig" viewBox="0 0 160 72" aria-label="sal"><path pathLength="1" d="M4 54C18 42 38 8 30 9C20 11 17 26 29 32C42 38 31 56 15 51
  M40 39C46 28 59 26 56 37C53 47 42 47 46 38C50 30 60 32 58 42C57 49 63 48 69 41
  C79 29 94 -1 83 2C72 5 70 35 74 48C77 57 85 54 91 45
  C101 33 121 31 112 41C100 55 40 67 10 61C42 64 112 58 156 33"/></svg>`;

// the id card, with the verbs stamped on it
const card = () => `<div class="card u-paper u-lit">
  <div class="top"><span>RESIDENT</span><span>No. 0001</span></div>
  ${photo()}
  <b>sal</b>
  <small>does</small>
  <div class="stk">${WHATEVER.map(w => verb(w, "s")).join("")}</div><div class="does">whatever.</div>
  ${SIG}<div class="code"></div></div>`;

TOUCH.me = () => `<div class="m-badge" data-swing><div class="clip"></div>${card()}</div>`;

// opened: the badge on the desk, the line and the time as notes beside it. socials live on the ledge.
XL3.me = () => `<div class="v3 mo mo-desk">
  <div class="obj"><div class="m-badge big"><div class="clip"></div>${card()}</div></div>
  <div class="notes">
    <div class="u-label">${glyph("me")} hey</div><div class="u-title">i'm sal.</div>
    <p class="mo-line">${WHATEVER.map(w => `<span class="ln">i ${verb(w, "v")} whatever.</span>`).join(" ")}</p>
    <div class="u-label">right now</div><div class="mo-pres"><span data-clock>${clock()}</span> in <span class="nosy">nosy</span></div>
  </div></div>`;

// the door's badge hangs from its clip: scrolling the strip tips it the other way, then a spring settles it back
(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.getElementById("strip");
  let last = el.scrollLeft, vel = 0, angle = 0, spin = 0, raf = 0;
  const MAX = 4;
  const tick = () => {
    // lean against the scroll, softly capped; a damped spring follows the lean and settles back to straight
    const target = -MAX * Math.tanh(vel / 24);
    spin = (spin + (target - angle) * .1) * .82;
    angle += spin;
    vel *= .85;
    el.querySelectorAll("[data-swing] .card").forEach(c => c.style.rotate = `${angle.toFixed(2)}deg`);
    const moving = Math.abs(angle) > .02 || Math.abs(spin) > .01 || Math.abs(vel) > .1;
    if (!moving) { angle = spin = vel = 0; el.querySelectorAll("[data-swing] .card").forEach(c => c.style.rotate = ""); }
    raf = moving ? requestAnimationFrame(tick) : 0;
  };
  el.addEventListener("scroll", () => {
    vel = vel * .5 + (el.scrollLeft - last) * .5; last = el.scrollLeft;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
})();
