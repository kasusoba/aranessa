/* read door explorations. each variant swaps the read door's hero, and "full" ones drop the thumbnail stack so the object is the whole door.
   read-door.html lines them all up; index.html?read=<key> tries one in the room. */
const RDOOR = (() => {
  const R = D2.read, BASE = TOUCH.read, BASE_S = A.read.s;
  const now = R.reading[0];
  // object-printed titles drop the subtitle: "Sapiens: A Graphic History, ..." is "Sapiens"
  const short = t => t.split(/: | - | \(/)[0].trim();
  // where it's up to, as written on a bookmark: "78%", "ch 132"
  const mk = x => x.type === "book" ? x.prog : x.prog.replace(/^ch/, "ch ");
  // anilist gives undated entries the epoch; those have no date to print
  const known = iso => iso && new Date(iso).getFullYear() > 1971;
  const due = iso => known(iso) ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase() : "";
  const rate = x => x.r ? `★${String(x.r).replace(/\/\d+$/, "")}` : "";
  // everything on the shelf once: what's being read (newest first), then what's finished
  const seen = new Set();
  const all = [...R.reading.map(x => ({ ...x, on: true })), ...R.finished].filter(x => !seen.has(x.t) && seen.add(x.t));
  const dim = x => `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.42)), ${cov(x)}`;
  // manga volumes are thinner and shorter than books
  const thick = x => x.type === "manga" ? 14 + hash(x.t) % 5 : 19 + hash(x.t) % 8;
  const spine = x => `<div class="nk"><div class="spn${x.on ? " on" : ""}" title="${esc(x.t)}${x.on ? `, ${esc(mk(x))}` : ""}" style="--w:${thick(x)}px;height:${x.type === "manga" ? 70 + hash(x.t + "h") % 14 : 84 + hash(x.t + "h") % 14}px;background:${dim(x)}"><span>${esc(short(x.t))}</span></div></div>`;
  // a book lying flat in the bedside pile, spine out. o.w / o.x / o.r pick width, nudge and tilt; o.end puts something on its right end
  const lying = (x, o = {}) => `<div class="bk${x.on ? " on" : ""}" title="${esc(x.t)}" style="height:${x.type === "manga" ? 15 : 20 + hash(x.t) % 4}px;width:${(o.w ?? (x => x.on ? 64 : 70 + hash(x.t) % 18))(x)}%;margin-left:${(o.x ?? (x => hash(x.t + "x") % 7))(x)}%;${o.r ? `rotate:${o.r(x)}deg;` : ""}background:${dim(x)}">
    <span>${esc(short(x.t))}</span>${(o.end ?? (x => x.on ? `<em class="u-paper">${esc(mk(x))}</em>` : ""))(x)}${o.tag ? `<b class="tg u-paper">${esc(x.t)}<small>${x.on ? `reading · ${esc(mk(x))}` : `finished${rate(x) ? ` · ${rate(x)}` : ""}`}</small></b>` : ""}</div>`;
  const standing = () => `<div class="top"><span class="mk u-paper">${esc(mk(now))}</span><i style="background:${cov(now)}"></i></div>`;
  const ifile = (x, i, front) => `<div class="sv"><div class="ic u-paper" style="--d:${i}">
    <small>${x.type}</small><b>${esc(front ? x.t : short(x.t))}</b>${front ? `<span>${x.on ? `reading · ${esc(mk(x))}` : `finished${due(x.date) ? ` · ${due(x.date)}` : ""}`}</span>` : ""}</div></div>`;

  const V0 = {
    touch: {
      group: "one book", name: "touch", note: "baseline. the cover at its real shape, a bookmark slip behind the top with where it's up to, a ribbon hanging out the bottom.",
      hero: BASE,
    },
    ajar: {
      group: "one book", name: "ajar", note: "the cover swung open a little, the page inside has where it's up to in stamp red. hover opens it wider.",
      hero: () => `<div class="hero t rd-ajar"><div class="pg u-paper u-lit"><small>${now.type === "book" ? "read to" : "up to"}</small><b>${esc(mk(now))}</b><span>${esc(short(now.t))}</span></div>
        <div class="cv" style="background:${cov(now)}"></div></div>`,
    },
    edge: {
      group: "one book", name: "fore edge", note: "the book turned a little so the page block shows; the ribbon sticks out of it as deep in as it's read. hover turns it further.",
      hero: () => `<div class="hero t rd-edge"><div class="bx" style="--th:${now.type === "manga" ? 18 : 30}px"><div class="fc" style="background:${cov(now)}"></div>
        <div class="fe"><i class="rb" style="--p:${now.pct || .5}"></i></div></div><span class="cap">${esc(mk(now))}</span></div>`,
    },
    going: {
      group: "one book", name: "on the go", full: true, note: "everything being read at once, covers overlapped down the door, each with its own bookmark poking out the top. hover a cover to pull it forward.",
      hero: () => `<div class="hero t rd-full rd-going">${R.reading.map((x, i) => `<div class="cv" title="${esc(x.t)}" style="--x:${(hash(x.t) % 9 - 4) * 2}px;--r:${(hash(x.t + "r") % 7 - 3) * .8}deg;z-index:${10 - i}">
        <i style="background:${cov(x)}"></i><em class="u-paper">${esc(mk(x))}</em></div>`).join("")}
        <div class="u-label">finished · ${R.finished.length}</div><div class="fl">${R.finished.map(x => `<i style="background:${cov(x)}" title="${esc(x.t)}"></i>`).join("")}</div></div>`,
    },

    stack: {
      group: "pile", name: "bedside stack", full: true, note: "the current book stands on a pile of the rest lying flat, spines out, oldest at the bottom. the ones on the go have a slip sticking out. hover slides the top ones out.",
      hero: () => `<div class="hero t rd-full rd-stack">${standing()}${all.slice(1).map(x => lying(x)).join("")}</div>`,
    },
    spines: {
      group: "bedside stack · round 2", name: "spines only", full: true, note: "no cover standing up: the whole door is the pile. the book on top is the thickest, with its title in serif and the slip.",
      hero: () => `<div class="hero t rd-full rd-stack rd-spines"><div class="bk on lead" title="${esc(now.t)}" style="background:${dim(now)}"><span>${esc(short(now.t))}</span><em class="u-paper">${esc(mk(now))}</em></div>${all.slice(1).map(x => lying(x)).join("")}</div>`,
    },
    faceup: {
      group: "bedside stack · round 2", name: "face up", full: true, note: "the current book lies face up on the pile, seen from above at an angle, the slip sticking out its far end. hover tips it toward you.",
      hero: () => `<div class="hero t rd-full rd-stack rd-faceup"><div class="fu"><div class="pl"><span class="mk u-paper">${esc(mk(now))}</span><i style="background:${cov(now)}"></i></div><div class="bk on" style="height:22px;width:84%;margin-left:4%;background:${dim(now)}"></div></div>${all.slice(1).map(x => lying(x)).join("")}</div>`,
    },
    lean: {
      group: "bedside stack · round 2", name: "leaning", full: true, note: "the current book leans against the side of the pile instead of standing on top, so the pile itself is the tall part.",
      hero: () => `<div class="hero t rd-full rd-stack rd-lean">${all.slice(1).map(x => lying(x, { w: x => x.on ? 44 : 48 + hash(x.t) % 10, x: x => hash(x.t + "x") % 3 })).join("")}<div class="top"><span class="mk u-paper">${esc(mk(now))}</span><i style="background:${cov(now)}"></i></div></div>`,
    },
    messy: {
      group: "bedside stack · round 2", name: "messy", full: true, note: "the same pile, less tidy: every book a little off square, the ones on the go thrown on top most crooked.",
      hero: () => `<div class="hero t rd-full rd-stack rd-messy">${standing()}${all.slice(1).map(x => lying(x, { w: x => 62 + hash(x.t) % 24, x: x => hash(x.t + "x") % 14, r: x => (hash(x.t + "r") % 9 - 4) * (x.on ? .9 : .45) })).join("")}</div>`,
    },
    pull: {
      group: "bedside stack · round 2", name: "pull out", full: true, note: "hover a spine and that book slides out of the pile with its full title on a paper tag, the way the listen crate peeks.",
      hero: () => `<div class="hero t rd-full rd-stack rd-pull">${standing()}${all.slice(1).map(x => lying(x, { tag: true })).join("")}</div>`,
    },
    stickers: {
      group: "bedside stack · round 2", name: "spine stickers", full: true, note: "no slips: each spine has a paper sticker on its end, where it's up to in red for the ones on the go, the rating or the year for finished ones.",
      hero: () => `<div class="hero t rd-full rd-stack rd-stick">${standing()}${all.slice(1).map(x => lying(x, { w: x => 76 + hash(x.t) % 18, end: x => { const v = x.on ? mk(x) : rate(x) || (known(x.date) ? new Date(x.date).getFullYear() : ""); return v ? `<em class="u-paper${x.on ? " on" : ""}">${esc(v)}</em>` : ""; } })).join("")}</div>`,
    },
    tall: {
      group: "bedside stack · round 2", name: "two piles", full: true, note: "the ones on the go in a short pile with the current book standing on it, finished ones in their own taller pile beside it.",
      hero: () => { const go = all.slice(1).filter(x => x.on), done = all.filter(x => !x.on), o = { w: () => 100, x: () => 0 };
        return `<div class="hero t rd-full rd-stack rd-two"><div class="pi">${standing()}${go.map(x => lying(x, { ...o, end: () => "" })).join("")}</div><div class="pi">${done.map(x => lying(x, o)).join("")}</div></div>`; },
    },

    shelf: {
      group: "pile", name: "shelf", full: true, note: "spines upright on shelves that run the height of the door; the ones on the go have a slip poking out the top. empty shelf below is room to grow. hover a spine to tip it out.",
      hero: () => `<div class="hero t rd-full rd-shelf"><div class="sh">${all.map(spine).join("")}</div></div>`,
    },
    faceout: {
      group: "pile", name: "face out", full: true, note: "the shelf, but the current book stands face out at the start of the top shelf, with its slip.",
      hero: () => `<div class="hero t rd-full rd-shelf"><div class="sh"><div class="nk"><div class="fo" style="background:${cov(now)}"><em class="u-paper">${esc(mk(now))}</em></div></div>${all.slice(1).map(spine).join("")}</div></div>`,
    },

    card: {
      group: "paper", name: "library card", full: true, note: "the due-date card in its pocket: on the go ones stamped out, finished ones stamped with the day. the pocket hides the oldest; hover pulls the card up.",
      hero: () => `<div class="hero t rd-full rd-card"><div class="cd u-paper u-lit"><div class="hd"><span>date</span><span>title</span></div>
        ${all.map(x => `<div class="rw"><em style="--r:${(hash(x.t + "s") % 7 - 3) * 1.2}deg;opacity:${.7 + hash(x.t) % 4 * .1}">${x.on ? "out" : due(x.date) || "&nbsp;"}</em><b>${esc(short(x.t))}</b></div>`).join("")}</div>
        <div class="pk u-paper"><small>now reading</small><b>${esc(short(now.t))}</b><span>${esc(mk(now))}</span></div></div>`,
    },
    drawer: {
      group: "paper", name: "card drawer", full: true, note: "a catalog drawer, one typed index card per book, the current one at the front. hover an edge and that card peeks out, like the listen crate.",
      hero: () => { const a = [...all].reverse(); return `<div class="hero t rd-full rd-drawer"><div class="stk">${a.map((x, i) => ifile(x, a.length - 1 - i, i === a.length - 1)).join("")}</div>
        <div class="df"><span class="u-paper">${all.length} cards</span><i></i></div></div>`; },
    },
    mark: {
      group: "paper", name: "bookmark", full: true, note: "the bookmark itself is the door: a tall paper strip with a tassel, printed with what's on the go and what's finished. hover swings the tassel.",
      hero: () => `<div class="hero t rd-full rd-mark"><svg class="ts" viewBox="0 0 60 64" aria-hidden="true"><path d="M30 60 C30 30 27 6 17 6 C7 6 5 20 8 33"/><circle cx="8" cy="34" r="2.4"/><path d="M8 35 l-3.5 17 M8 35 l-1.5 18 M8 35 l0.5 18 M8 35 l2.5 17 M8 35 l4 15.5"/></svg>
        <div class="bm u-paper u-lit"><i class="hole"></i><div class="lb">reading</div>${R.reading.map(x => `<div class="rw"><b>${esc(short(x.t))}</b><em>${esc(mk(x))}</em></div>`).join("")}
        <div class="lb">finished</div>${R.finished.map(x => `<div class="rw"><b>${esc(short(x.t))}</b><span>${rate(x) || due(x.date).slice(3)}</span></div>`).join("")}</div></div>`,
    },

    progress: {
      group: "data first", name: "progress", full: true, note: "no object: what's on the go with how far through, then the finished covers as a grid.",
      hero: () => `<div class="hero t rd-full rd-prog">${R.reading.map(x => `<div class="ar"><i style="background:${cov(x)}"></i><div><b>${esc(short(x.t))}</b><span class="mtr">${x.pct ? `<s style="width:${x.pct * 100}%"></s>` : ""}</span></div><em>${esc(mk(x))}</em></div>`).join("")}
        <div class="u-label">finished · ${R.finished.length}</div><div class="fl">${R.finished.map(x => `<i style="background:${cov(x)}" title="${esc(x.t)}"></i>`).join("")}</div></div>`,
    },
  };

  // the bedside stack got a second round; it and its new takes go first
  const FIRST = ["stack", "spines", "faceup", "lean", "messy", "pull", "stickers", "tall"];
  const V = Object.fromEntries([...FIRST, ...Object.keys(V0).filter(k => !FIRST.includes(k))].map(k => [k, V0[k]]));
  V.stack = { ...V.stack, group: "bedside stack · round 2", name: "bedside stack" };

  // card drawer: same peek as the listen crate. the hovered card rises; near the back there's no room above it,
  // so the cards in front drop instead, by whatever the rise couldn't cover.
  const RISE = 56;
  const settle = stk => stk.querySelectorAll(".ic").forEach(i => { i.style.translate = ""; i.classList.remove("up"); });
  document.addEventListener("pointerover", e => {
    const stk = e.target.closest?.(".rd-drawer .stk"), sv = e.target.closest?.(".rd-drawer .sv:not(:last-child)");
    document.querySelectorAll(".rd-drawer .stk").forEach(settle);
    if (!stk || !sv) return;
    const up = Math.min(RISE, sv.offsetTop), down = RISE - up, i = sv.querySelector(".ic");
    i.style.translate = `0 ${-up}px`; i.classList.add("up");
    for (let n = sv.nextElementSibling; n; n = n.nextElementSibling) n.querySelector(".ic").style.translate = `0 ${down}px`;
  });

  function use(k) {
    const v = V[k] ?? V.touch;
    TOUCH.read = v.hero;
    A.read.s = v.full ? () => ({ items: [] }) : BASE_S;
  }
  return { V, use };
})();
