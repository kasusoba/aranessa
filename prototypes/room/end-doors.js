/* the end door: always the last door in the strip, a placeholder with nothing inside. it doesn't open; it holds the
   room's end so the strip always reads as scrollable. quiet on purpose: slow or still, never something to watch.
   end-door.html lines the takes up; index.html?end=<key> tries one in the room. EDOOR.box() is the door's markup. */
const EDOOR = (() => {
  const rnd = (i, n) => ((Math.sin(i * 91.7 + n * 12.9) * 43758.5) % 1 + 1) % 1;
  const stars = (n, seed = 1) => Array.from({ length: n }, (_, i) =>
    `<i class="ed-st" style="left:${(rnd(i, seed) * 92 + 4).toFixed(1)}%;top:${(rnd(i, seed + 7) * 90 + 5).toFixed(1)}%;animation-delay:${(-i * 1.7).toFixed(1)}s"></i>`).join("");

  // the plan drawing: a wall with an opening, the leaf standing open and its swing arc in stamp red. `svg` adds to the drawing, `after` adds html over it
  const plan = (cls, svg = "", after = "") => `<div class="ed ed-plan ${cls}"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" class="pn">
    <path class="wl" d="M4 70 H30 M70 70 H96"/><path class="lf" d="M30 70 L30 30"/><path class="arc" d="M30 30 A40 40 0 0 1 70 70"/>${svg}</svg>${after}</div>`;
  const V = {
    // ---------------- floor plan, round 2 ----------------
    plan: {
      group: "floor plan · round 2", name: "floor plan", note: "round 1 as is, with only 'tbd' under it. a faint grid, the wall, the swing arc in stamp red. still.",
      html: () => plan("", "", `<span class="tbd">tbd</span>`),
    },
    dim: {
      group: "floor plan · round 2", name: "dimension", note: "a dimension line under the opening, ticks at both ends, 'tbd' where the measurement goes.",
      html: () => plan("", `<path class="dm" d="M30 84 H46 M54 84 H70 M30 79 V89 M70 79 V89 M28 86 L32 82 M68 86 L72 82"/><text class="dt" x="50" y="85.8">tbd</text>`),
    },
    beyond: {
      group: "floor plan · round 2", name: "room beyond", note: "the opening leads into a room drawn only as a dashed outline, a serif '?' in the middle of it.",
      html: () => plan("pn-up", `<path class="rm" d="M4 70 V-50 H96 V70"/><text class="q" x="50" y="-4">?</text>`),
    },
    stamped: {
      group: "floor plan · round 2", name: "stamped", note: "the plan with a stamp red rubber stamp across it: 'not yet'. object-printed text, like admit one on the tickets.",
      html: () => plan("", "", `<span class="stp">not yet</span>`),
    },
    title: {
      group: "floor plan · round 2", name: "title block", note: "a drawing sheet's title block in the corner: sheet next, scale 1:50, drawn oct 2026, status tbd.",
      html: () => plan("", "", `<div class="tb">${[["sheet", "next"], ["scale", "1:50"], ["drawn", "oct 2026"], ["status", "tbd"]].map(([k, v]) => `<span><em>${k}</em>${v}</span>`).join("")}</div>`),
    },
    sketch: {
      group: "floor plan · round 2", name: "sketch", note: "the same plan in pencil on the grid, lines a little off, a hand 'next?' with an arrow pointing at it. the hand is marginalia, as everywhere else.",
      html: () => `<div class="ed ed-plan ed-sketch"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" class="pn">
        <path class="wl" d="M4 70.6 Q17 69.4 30.4 70.2 M69.6 70.4 Q83 69.6 96 70.9"/><path class="lf" d="M30 70.5 Q29.3 50 30.7 29.5"/><path class="arc" d="M30.5 30.2 C52 31 69.5 47 69.8 70.4"/>
        <path class="ar" d="M78 22 Q66 26 60 38 M60 38 L59.5 32.5 M60 38 L64.5 35"/></svg><span class="nx">next?</span></div>`,
    },
    // ---------------- sky ----------------
    clouds: {
      group: "sky", name: "clouds", note: "the first take: blurred clouds drifting across, a pass every few minutes, a few faint stars.",
      html: () => `<div class="ed ed-clouds">${stars(7)}${[[14, 90, 140, -30], [42, 120, 190, -120], [66, 80, 160, -70], [82, 110, 220, -170]]
        .map(([t, w, s, d]) => `<i class="cl" style="top:${t}%;--w:${w}cqw;animation-duration:${s}s;animation-delay:${d}s"></i>`).join("")}</div>`,
    },
    window: {
      group: "sky", name: "window", note: "a window in the wall instead of a door. night sky with a thin moon; under lamp light the sky goes dusk. only the stars move.",
      html: () => `<div class="ed ed-window"><div class="fr"><div class="sky">${stars(9, 3)}<i class="moon"></i></div><i class="mull"></i><i class="tran"></i></div><i class="sill"></i></div>`,
    },
    stars: {
      group: "sky", name: "stars", note: "just the door's surface with stars in it, blinking out of step. a shooting star crosses about once a minute.",
      html: () => `<div class="ed ed-stars">${stars(16, 5)}<i class="shoot"></i></div>`,
    },
    // ---------------- light ----------------
    ajar: {
      group: "light", name: "ajar", note: "a door left open a crack, warm light along the gap and a wedge of it on the floor. the light breathes, slowly. reads as 'more rooms past here'.",
      html: () => `<div class="ed ed-ajar"><div class="dr"><i class="gap"></i><i class="knob"></i></div><i class="spill"></i></div>`,
    },
    beam: {
      group: "light", name: "light beam", note: "a shaft of window light falling across the door, dust floating up through it.",
      html: () => `<div class="ed ed-beam"><i class="shaft"></i>${Array.from({ length: 12 }, (_, i) =>
        `<i class="mote" style="left:${(18 + rnd(i, 2) * 55).toFixed(0)}%;top:${(25 + rnd(i, 4) * 60).toFixed(0)}%;animation-duration:${(14 + rnd(i, 6) * 12).toFixed(0)}s;animation-delay:${(-rnd(i, 8) * 20).toFixed(1)}s"></i>`).join("")}</div>`,
    },
    lava: {
      group: "light", name: "lava lamp", note: "a lava lamp standing at the bottom, wax rising and sinking very slowly in stamp red. the one object in the room that's only there to look at.",
      html: () => `<div class="ed ed-lava"><div class="lamp"><i class="cap"></i><div class="glass"><i class="b b1"></i><i class="b b2"></i><i class="b b3"></i></div><i class="base"></i></div><i class="glowf"></i></div>`,
    },
    // ---------------- object ----------------
    plant: {
      group: "object", name: "plant", note: "a potted plant in the corner, leaves swaying a few degrees out of step.",
      html: () => `<div class="ed ed-plant"><svg viewBox="0 0 120 200" class="pl">${[[-38, 70], [-18, 92], [4, 100], [24, 86], [44, 66], [-56, 50], [60, 48]]
        .map(([a, l], i) => `<g class="lf" style="--a:${a}deg;animation-delay:${-i * 1.3}s"><path d="M60 150 Q${60 + a / 4} ${150 - l / 2} 60 ${150 - l}" /><ellipse cx="60" cy="${150 - l}" rx="9" ry="17" /></g>`).join("")}
        <path class="pot" d="M38 150 H82 L76 196 H44Z"/><rect class="rim" x="34" y="146" width="52" height="9" rx="2"/></svg></div>`,
    },
    curtain: {
      group: "object", name: "curtain", note: "a curtain hung over the doorway, folds swaying slightly. something's behind it, not yet.",
      html: () => `<div class="ed ed-curtain"><i class="rod"></i><div class="cu l"></div><div class="cu r"></div></div>`,
    },
    hooks: {
      group: "object", name: "empty hooks", note: "the shows rail again, but empty: hooks waiting for whatever comes next. the hooks rock a little.",
      html: () => `<div class="ed ed-hooks"><i class="rail"></i>${[16, 34, 52, 70, 88].map((x, i) => `<i class="hk" style="left:${x}%;animation-delay:${-i * 1.1}s"></i>`).join("")}</div>`,
    },
    // ---------------- unbuilt ----------------
    blank: {
      group: "unbuilt", name: "blank", note: "a dashed outline where a door will go. nothing moves.",
      html: () => `<div class="ed ed-blank"><div class="dash"></div></div>`,
    },
    taped: {
      group: "unbuilt", name: "taped note", note: "a paper note taped on, slightly crooked: 'more rooms soon' in hand, the only marginalia on it.",
      html: () => `<div class="ed ed-taped"><div class="pp"><i class="tp a"></i><i class="tp b"></i><span>more rooms<br>soon</span></div></div>`,
    },
  };
  let cur = "beyond";
  const use = k => { if (V[k]) cur = k; };
  const box = (k = cur) => `<div class="box end-box" data-k="end" aria-hidden="true">${V[k].html()}</div>`;
  return { V, use, box, get cur() { return cur; } };
})();
