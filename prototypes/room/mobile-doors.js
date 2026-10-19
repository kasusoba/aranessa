/* how the strip's doors sit on a phone. today a phone gets 140px doors, which hits the box's "label only" rule, so
   every closed door shows just its name. each take is a body class (md-<key>, styles in mobile-doors.css) plus the
   door width it wants; mobile-door.html lines them up in phone frames, index.html?mobile=<key> tries one.
   MDOOR.size(n, w, gap) returns the door width for a phone strip, or null to leave the room's own sizing. */
const MDOOR = (() => {
  const V = {
    pick: {
      group: "picked", name: "snapped + opens over", cls: "sh sh-snap sh-over", place: "down", note: "two shelves, a swipe settles on a column edge, and an opened door comes up over both shelves while the rest stay put. the room's phone default.",
      size: () => 190,
    },
    // ---------------- two shelves, round 2 ----------------
    // every shelves take shares html.md-sh (two rows, doors at 80%); `cls` adds its own classes, `place` pins each door
    // to a cell (top then bottom, column by column) so nothing reflows; `cols` tells the css how many columns a shelf has
    shelves: {
      group: "two shelves · round 2", name: "two shelves", cls: "sh", note: "round 1 as is: two rows of 80% doors, top then bottom column by column. opening a door makes it span both shelves, so the doors after it shift along.",
      size: () => 190,
    },
    shsnap: {
      group: "two shelves · round 2", name: "snapped", cls: "sh sh-snap", note: "the same shelves, but a swipe settles on a column edge, so the left column is always whole and a slip of the third shows on the right.",
      size: () => 190,
    },
    shacross: {
      group: "two shelves · round 2", name: "across first", cls: "sh sh-across", cols: true, note: "the top shelf holds the first half of the room (i, listen, watch, read), the bottom shelf the rest. reads left to right like two lines.",
      size: () => 190,
    },
    shstagger: {
      group: "two shelves · round 2", name: "staggered", cls: "sh sh-stagger", note: "the bottom shelf sits half a door to the right, like bricks, so it reads as two shelves rather than a grid, and the order zigzags.",
      size: () => 190,
    },
    shuneven: {
      group: "two shelves · round 2", name: "tall top", cls: "sh sh-uneven", note: "the top shelf is taller than the bottom one (about 58 / 42), so the first doors in each column show more of their hero.",
      size: () => 190,
    },
    sh3: {
      group: "two shelves · round 2", name: "three shelves", cls: "sh sh-3", note: "three rows at 62%: the whole room (7 aspects + the end) fits in about three columns, very small type.",
      size: () => 190,
    },
    shfit: {
      group: "two shelves · round 2", name: "fit the phone", cls: "sh sh-fit", note: "the scale follows the phone's height so a door keeps its desktop proportions (190 × 460): a tall phone gets bigger doors, a short one smaller. try the phone sizes up top.",
      size: () => { const h = document.getElementById("strip").clientHeight; document.documentElement.style.setProperty("--md-z", Math.min(1, Math.max(.6, (h - 8) / 2 / 460)).toFixed(3)); return 190; },
    },
    shover: {
      group: "two shelves · round 2", name: "opens over", cls: "sh sh-over", place: "down", note: "the shelves never move: an opened door comes up over both shelves, filling the strip, and esc puts it back in its cell. the others stay where they were underneath.",
      size: () => 190,
    },
    label: {
      group: "today", name: "name only", note: "what the site does now: 140px doors fall under the box's label-only rule, so every door is just its name.",
      size: () => 140,
    },
    half: {
      group: "door width", name: "one and a half", note: "doors at their desktop shape: one whole door and half the next in view, snapping to the left edge. the heroes get the width they were drawn for.",
      size: (n, w, gap) => (w - gap) / 1.5,
    },
    one: {
      group: "door width", name: "one at a time", note: "one door fills the screen, the neighbours peek at both sides; swipe snaps to the middle. the hero sits centred in the wider door.",
      size: (n, w) => w - 56,
    },
    two: {
      group: "door width", name: "two and a slip", note: "two doors and a slip of the third. narrower than the heroes were drawn for (about 150px), so they squeeze.",
      size: (n, w, gap) => (w - 2 * gap) / 2.25,
    },
    mini: {
      group: "scaled", name: "the room, smaller", note: "the desktop doors (190px) shrunk to 72% as they are, like looking at the desktop room from further away. two and a half in view, small type.",
      size: () => 190,
    },
    down: {
      group: "direction", name: "down the page", note: "the strip turns into a column: each door full width and shorter (380px), scrolling down like a phone page. a door shows the top of its hero and fades out where it ends.",
      size: (n, w) => w,
    },
  };
  // the phone default is the picked take; ?mobile=<key> tries another, ?mobile=label is the old name-only doors
  const key = new URLSearchParams(location.search).get("mobile") ?? "pick";
  const v = V[key];
  if (v) document.documentElement.classList.add("md", "md-" + key, ...(v.cls ?? "").split(" ").filter(Boolean).map(c => "md-" + c));
  // pin every door to its own cell, so opening one leaves a hole instead of shifting the rest
  const strip = document.getElementById("strip");
  if ((v?.place || v?.cols) && strip) new MutationObserver(() => {
    const bs = [...strip.children];
    strip.style.setProperty("--md-cols", Math.ceil(bs.length / 2));
    if (v.place) bs.forEach((b, i) => { b.style.setProperty("--r", i % 2 + 1); b.style.setProperty("--c", Math.floor(i / 2) + 1); });
  }).observe(strip, { childList: true });
  // the strip only follows an opened door sideways; down the page brings it to the top instead
  if (key === "down") addEventListener("click", e => {
    const b = e.target.closest(".strip .box:not(.end-box)");
    if (b) setTimeout(() => b.scrollIntoView({ behavior: "smooth", block: "start" }), 560);
  });
  // an opened door that comes up over the shelves sits outside the scroll, so the strip mustn't follow it
  const over = () => innerWidth < 760 && !!v?.cls?.includes("sh-over");
  return { V, key, over, size: (n, w, gap) => (v && innerWidth < 760 ? v.size(n, w, gap) : null) };
})();
