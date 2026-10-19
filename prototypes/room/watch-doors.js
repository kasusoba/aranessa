/* watch door explorations. each variant swaps the watch door's hero, and "full" ones drop the recent stack so the object is the whole door.
   watch-door.html lines them all up; index.html?watch=<key> tries one in the room. */
const WDOOR = (() => {
  const W = D2.watch, BASE = TOUCH.watch, BASE_S = A.watch.s;
  const day = iso => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso)).replace("/", ".");
  const on = () => fresh(W.now.date);
  const live = () => on() ? " live" : "";
  // what the progress reads as on an object: "e16", "s4e9", "film", "finished"
  const ep = x => x.type === "movie" ? "film" : x.prog === "done" ? "finished" : x.prog;
  // how far through, when the source knows the episode count. films and finished things are whole.
  const pct = x => x.prog === "done" || x.type === "movie" ? 1 : x.total && /^e\d+$/.test(x.prog) ? Math.min(1, parseInt(x.prog.slice(1)) / x.total) : null;
  const ofTotal = x => x.total && /^e\d+$/.test(x.prog) ? `${x.prog} of ${x.total}` : ep(x);
  const recent = n => W.recent.slice(0, n);
  // ticket edges: a half-circle bite out of each side
  const stub = (x, i, extra = "") => `<div class="sb" style="--r:${(hash(x.t + "r") % 7 - 3) * .7}deg;--x:${hash(x.t) % 9 - 4}px;z-index:${60 - i}"><div class="pp u-paper">
    <i style="background:${cov(x)}"></i><div class="tx"><small>${i ? day(x.date) : on() ? "admit one · now" : "admit one"}</small><b>${esc(x.t)}</b><span>${esc(ep(x))}</span></div>${extra}</div></div>`;
  const stamp = x => { const p = pct(x); return p && p < 1 ? `<em class="stp">${Math.round(p * 100)}%</em>` : ""; };
  // a vhs spine seen from the shelf edge; i = 0 is the top of the pile
  const vhs = (x, i) => `<div class="vh${i ? "" : " top"}" style="--x:${hash(x.t) % 7 - 3}px;--r:${(hash(x.t + "r") % 5 - 2) * .3}deg">
    <span class="lb u-paper"><b>${esc(x.t)}</b></span><i style="background:${cov(x)}"></i><small>${!i && on() ? "now" : esc(ep(x))}</small></div>`;
  // a crt showing x. off (dim, "stop") until the door is live or hovered, or always on with cls "on"
  const tv = (x, cls = "", osd = `▶ ${esc(ep(x))}`) => { const p = pct(x);
    return `<div class="tvb ${cls}"><div class="scr"><i style="background:${cov(x)}"></i><span class="nz"></span><span class="osd">${osd}</span><span class="off">■ stop</span>${p ? `<span class="pb"><s style="width:${p * 100}%"></s></span>` : ""}</div>
      <div class="ctl"><b></b><b></b><span class="led"></span></div></div>`; };
  const frames = list => list.map(x => `<div class="fr"><i style="background:${cov(x)}"></i><span>${esc(ep(x))}</span></div>`).join("");

  const V0 = {
    touch: {
      group: "ticket", name: "touch", note: "baseline. the poster at its real shape, an admit-one stub tucked over its corner.",
      hero: BASE,
    },
    tucked: {
      group: "ticket", name: "tucked stubs", note: "baseline, plus the last two stubs tucked behind the poster, sticking out the top. hover fans them.",
      hero: () => {
        const [n, ...old] = recent(3);
        return `<div class="hero t t-watch wd-tuck">${old.map((x, i) => `<span class="old u-paper" style="--n:${i}">admit one · ${esc(x.t)}</span>`).reverse().join("")}
          <i style="background:${cov(n)}"></i><span class="stb u-paper u-lit">ADMIT ONE · ${esc(ep(n).toUpperCase())}</span></div>`;
      },
    },
    stubs: {
      group: "ticket", name: "stub pile", full: true, note: "every watch is a torn stub, newest on top of the pile. tall doors show more stubs. hover straightens the top one.",
      hero: () => `<div class="hero t wd-full wd-stubs${live()}">${recent(16).map((x, i) => stub(x, i, i ? "" : stamp(x))).join("")}</div>`,
    },
    roll: {
      group: "ticket", name: "ticket roll", full: true, note: "a roll of tickets unspooling down the door; the newest is the one about to be torn off. numbered like real ones.",
      hero: () => {
        const list = recent(14).reverse(), N = W.recent.length;
        return `<div class="hero t wd-full wd-roll${live()}"><div class="spool u-paper"></div><div class="strip">${list.map((x, i) => {
          const last = i === list.length - 1;
          return `<div class="tk u-paper"><small>${last && on() ? "admit one · now showing" : "admit one"}</small><b>${esc(x.t)}</b><span>${esc(ofTotal(x))} · ${day(x.date)}</span><em>no. ${String(N - (list.length - 1 - i)).padStart(4, "0")}</em></div>`;
        }).join("")}</div></div>`;
      },
    },

    strip: {
      group: "film strip", name: "film strip", full: true, note: "35mm running down the door, one frame per watch, newest at the top. it runs while watching, or on hover.",
      hero: () => { const f = recent(10).map(x => `<div class="fr"><i style="background:${cov(x)}"></i><span>${esc(ep(x))}</span></div>`).join("");
        return `<div class="hero t wd-full wd-film${live()}"><div class="run">${f}${f}</div></div>`; },
    },
    reel: {
      group: "film", name: "reel", full: true, note: "a reel up top, wound as far as the current show is through; the strip hangs off it with the recent frames, edge-printed.",
      hero: () => {
        const n = W.now, p = pct(n) ?? .5;
        return `<div class="hero t wd-full wd-reel${live()}"><div class="rl"><div class="wound" style="--p:${p}"></div><div class="plate"></div><div class="hub"></div></div>
          <div class="hang">${recent(12).map((x, i) => `<div class="row"><div class="fr"><i style="background:${cov(x)}"></i></div><div class="tx"><b>${esc(x.t)}</b><span>${i ? "" : on() ? "now · " : ""}${esc(ofTotal(x))}</span></div></div>`).join("")}</div></div>`;
      },
    },
    marquee: {
      group: "film", name: "marquee", full: true, note: "the cinema front: letterboard title under a ring of bulbs, the rest in lightbox frames below. bulbs chase while watching, or on hover.",
      hero: () => {
        const n = W.now, words = n.t.toUpperCase().split(/\s+/).slice(0, 6);
        return `<div class="hero t wd-full wd-marq${live()}"><div class="board"><div class="bulbs"></div>
          <small>${on() ? "now showing" : "last showing"}</small><div class="ltr">${words.map(w => `<span>${[...w].map(c => `<i>${esc(c)}</i>`).join("")}</span>`).join("")}</div>
          <small class="ep">${esc(ofTotal(n))}</small></div>
          <div class="lbx">${W.recent.slice(1, 13).map(x => `<i style="background:${cov(x)}" title="${esc(x.t)}"></i>`).join("")}</div></div>`;
      },
    },
    posters: {
      group: "film", name: "poster wall", full: true, note: "the recent posters pasted up and taped, newest on top. hover pulls the top one straight.",
      hero: () => `<div class="hero t wd-full wd-wall">${recent(12).map((x, i) => { const h = hash(x.t + "w");
        return `<div class="ps" style="left:${i % 2 ? 36 - h % 6 : h % 6}%;top:${i * 68 + h % 14}px;--r:${(h % 9 - 4) * 1.1}deg;z-index:${40 - i}"><i style="background:${cov(x)}"></i></div>`; }).join("")}</div>`,
    },

    tapes: {
      group: "home video", name: "tape stack", full: true, note: "vhs spines piled on the floor of the door, newest on top, each with a paper label. hover slides the top one out.",
      hero: () => `<div class="hero t wd-full wd-tapes">${recent(20).map(vhs).join("")}</div>`,
    },
    tape: {
      group: "home video", name: "the tape", note: "one cassette, face on. the reels are wound by how far through it is; they turn while watching, or on hover.",
      hero: () => {
        const n = W.now, p = pct(n) ?? .5;
        return `<div class="hero t wd-tape${live()}"><div class="lab u-paper"><b>${esc(n.t)}</b><span>${esc(ofTotal(n))}</span></div>
          <div class="win"><i class="rl" style="--s:${1 - p}"></i><i class="rl" style="--s:${p}"></i></div><small>sp · t-120</small></div>`;
      },
    },
    bin: {
      group: "home video", name: "rental bin", full: true, note: "the crate, but video cases: covers filed front to back, newest in front. hover an edge and that case peeks out.",
      hero: () => { const a = recent(14).reverse(); return `<div class="hero t wd-full wd-bin"><div class="stk">${a.map((x, i) => `<div class="sv" title="${esc(x.t)}, ${esc(ep(x))}"><i style="background:${cov(x)};--d:${a.length - 1 - i}"></i></div>`).join("")}</div></div>`; },
    },
    telly: {
      group: "telly", name: "telly", note: "a small crt with the poster on its screen and an on-screen display. switched on while watching, or on hover.",
      hero: () => `<div class="hero t wd-tv${live()}">${tv(W.now)}</div>`,
    },
    air: {
      group: "telly", name: "off air", note: "telly, but when nothing's on the screen is static with no signal; it tunes in to the last watch while watching, or on hover.",
      hero: () => `<div class="hero t wd-air${live()}">${tv(W.now)}</div>`,
    },
    channels: {
      group: "telly", name: "channels", full: true, note: "the recent list becomes a channel guide under the set. hover a channel and the telly flicks over to it.",
      hero: () => `<div class="hero t wd-full wd-chan${live()}">${tv(W.now, "", `ch 01 · ${esc(ep(W.now))}`)}<div class="gd">${recent(16).map((x, i) => `<div class="ch${i ? "" : " on"}" data-i="${i}"><em>${pad2(i)}</em><b>${esc(x.t)}</b><span>${esc(ep(x))}</span></div>`).join("")}</div></div>`,
    },
    tvstrip: {
      group: "telly", name: "telly + strip", full: true, note: "both: the set shows the latest, the film strip of everything before it runs underneath. both come on while watching, or on hover.",
      hero: () => `<div class="hero t wd-full wd-tvs${live()}">${tv(W.now)}<div class="wd-film"><div class="run">${frames(W.recent.slice(1, 11))}${frames(W.recent.slice(1, 11))}</div></div></div>`,
    },
    tvwall: {
      group: "telly", name: "shop window", full: true, note: "a wall of sets all on, the latest one big, the rest small. tall doors stack more sets.",
      hero: () => `<div class="hero t wd-full wd-twall${live()}">${recent(15).map((x, i) => tv(x, i ? "on" : "")).join("")}</div>`,
    },
    tvtapes: {
      group: "telly", name: "on the tapes", full: true, note: "the telly sits on the pile of vhs it's been playing, newest tape right under it.",
      hero: () => `<div class="hero t wd-full wd-tvt${live()}">${tv(W.now)}<div class="pile">${W.recent.slice(1, 20).map((x, i) => vhs(x, i + 1)).join("")}</div></div>`,
    },

    edge: {
      group: "film strip", name: "edge print", full: true, note: "the rails carry the title and frame numbers like edge printing on real stock. hover a frame for its title on a paper tag.",
      hero: () => `<div class="hero t wd-full wd-edge"><div class="run">${recent(12).map((x, i) => `<div class="fr" title="${esc(x.t)}"><em>${esc(x.t)}</em><div class="pic"><i style="background:${cov(x)}"></i><b class="u-paper">${esc(x.t)}</b></div><em class="n">${esc(ep(x))} ▸ ${String(W.recent.length - i).padStart(2, "0")}</em></div>`).join("")}</div></div>`,
    },
    hang: {
      group: "film strip", name: "hanging", full: true, note: "one short strip clipped up to dry, cut at the end. a calmer door: fewer frames, and hover sways it.",
      hero: () => `<div class="hero t wd-full wd-hang"><div class="bclip"></div><span class="bwire"></span><div class="sw"><div class="wd-film"><div class="run">${frames(recent(7))}</div></div></div></div>`,
    },
    gate: {
      group: "film strip", name: "in the gate", full: true, note: "the latest frame sits lit in the projector gate, the rest of the strip dark below it. it flickers while watching, or on hover.",
      hero: () => `<div class="hero t wd-full wd-film wd-gate${live()}"><div class="run">${frames(recent(10))}</div></div>`,
    },

    progress: {
      group: "data first", name: "progress", full: true, note: "no object: what's on the go with how far through, then the recent films as a row of posters.",
      hero: () => {
        const seen = new Set(), going = W.recent.filter(x => x.type !== "movie" && x.prog !== "done" && !seen.has(x.t) && seen.add(x.t)).slice(0, 6);
        const films = W.recent.filter(x => x.type === "movie").slice(0, 8);
        return `<div class="hero t wd-full wd-prog"><div class="sum"><b>${W.stats.episodes}</b><span>episodes · 6 mo</span></div>
          ${going.map(x => { const p = pct(x); return `<div class="ar"><i style="background:${cov(x)}"></i><div><b>${esc(x.t)}</b><span class="bar">${p ? `<s style="width:${p * 100}%"></s>` : ""}</span></div><em>${esc(x.prog)}</em></div>`; }).join("")}
          <div class="u-label">films · ${W.stats.movies}</div><div class="fl">${films.map(x => `<i style="background:${cov(x)}" title="${esc(x.t)}"></i>`).join("")}</div></div>`;
      },
    },
  };

  // the old explorations keep their groups, after the two picks and their new takes
  const FIRST = ["telly", "air", "channels", "tvstrip", "tvwall", "tvtapes", "strip", "edge", "hang", "gate"];
  const V = Object.fromEntries([...FIRST, ...Object.keys(V0).filter(k => !FIRST.includes(k))].map(k => [k, V0[k]]));

  // channels: hovering a row tunes the telly to it, through a moment of static; leaving goes back to the latest
  document.addEventListener("pointerover", e => {
    const g = e.target.closest?.(".wd-chan"); if (!g) return;
    const row = e.target.closest(".ch") ?? g.querySelector(".ch[data-i='0']");
    if (row.classList.contains("on")) return;
    const x = W.recent[row.dataset.i], nz = g.querySelector(".nz");
    g.querySelectorAll(".ch").forEach(c => c.classList.toggle("on", c === row));
    nz.classList.add("on"); clearTimeout(g._t);
    g._t = setTimeout(() => {
      g.querySelector(".scr i").style.background = cov(x);
      g.querySelector(".osd").textContent = `ch ${pad2(+row.dataset.i)} · ${ep(x)}`;
      const pb = g.querySelector(".pb s"), p = pct(x); if (pb) pb.style.width = `${(p ?? 0) * 100}%`;
      setTimeout(() => nz.classList.remove("on"), 120);
    }, 140);
  });
  document.addEventListener("pointerout", e => {
    const g = e.target.closest?.(".wd-chan"); if (!g || g.contains(e.relatedTarget)) return;
    g.querySelector(".ch[data-i='0']").dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
  });

  // rental bin: same peek as the listen crate. the hovered case rises; near the back there's no room above it,
  // so the cases in front drop instead, by whatever the rise couldn't cover.
  const RISE = 80;
  const settle = stk => stk.querySelectorAll("i").forEach(i => { i.style.translate = ""; i.classList.remove("up"); });
  document.addEventListener("pointerover", e => {
    const stk = e.target.closest?.(".wd-bin .stk"), sv = e.target.closest?.(".wd-bin .sv:not(:last-child)");
    document.querySelectorAll(".wd-bin .stk").forEach(settle);
    if (!stk || !sv) return;
    const up = Math.min(RISE, sv.offsetTop), down = RISE - up, i = sv.querySelector("i");
    i.style.translate = `0 ${-up}px`; i.classList.add("up");
    for (let n = sv.nextElementSibling; n; n = n.nextElementSibling) n.querySelector("i").style.translate = `0 ${down}px`;
  });

  function use(k) {
    const v = V[k] ?? V.touch;
    TOUCH.watch = v.hero;
    A.watch.s = v.full ? () => ({ items: [] }) : BASE_S;
  }
  return { V, use };
})();
