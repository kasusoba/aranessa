/* read opened-view explorations. each variant swaps XL3.read; every one keeps the real page's features:
   type filter, reading with progress, favorites, reviews (expand + spoiler reveal), finished (show all).
   read-view.html lines them up; index.html?readview=<key> tries one in the room (add &open=read to land on it opened). */
const RVIEW = (() => {
  const R = D2.read, BASE = XL3.read, now = R.reading[0], year = new Date().getFullYear();
  // the same object-printed text as the doors: "Sapiens", "78%", "ch 132"
  const short = t => t.split(/: | - | \(/)[0].trim();
  const mk = x => x.type === "book" ? x.prog : x.prog.replace(/^ch/, "ch ");
  const known = iso => iso && new Date(iso).getFullYear() > 1971;
  const due = iso => known(iso) ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase() : "";
  // one way to write a rating: "★8" for the /10 scale; books rated out of 5 keep their scale so a 4 doesn't read as bad
  const star = r => r ? `★${String(r).replace(/\/10$/, "")}` : "";
  // anilist notes open with the time they were written; the subtitle already has the month
  const note = r => r.note.trim().replace(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}\s*/, "");
  const dim = x => `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.42)), ${cov(x)}`;
  const seen = new Set();
  const all = [...R.reading.map(x => ({ ...x, on: true })), ...R.finished].filter(x => !seen.has(x.t) && seen.add(x.t));
  const thisYear = [...R.reviews, ...R.finished].filter(x => known(x.date) && new Date(x.date).getFullYear() === year).length;

  const filter = () => chips("filter", types([...R.reading, ...R.favorites, ...R.reviews, ...R.finished].map(x => x.type)), "all");
  const head = () => `<div class="wv-head"><div class="u-label">${glyph("read")} reading · ${R.reading.length} on the go</div>${filter()}</div>`;
  const favRow = () => R.favorites.length ? sec("favorites", `<div class="hrow3" style="padding-top:2px">${R.favorites.map((x, i) => `<a class="fav" ${ext(x.url)} data-type="${x.type}" data-src="f" data-ti="${i}" title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i><div class="tag u-paper">${esc(x.t)}</div></a>`).join("")}</div>`) : "";
  // reviews as guide rows, the way the watch view settled: cover, serif title, rating, two lines, click anywhere for the rest
  const blurb = (r, i) => `<div class="bl${r.spoiler ? " spoil" : ""}" data-type="${r.type}" data-src="v" data-ti="${i}"><a class="cv" ${ext(r.url)} style="background:${cov(r)}"></a>
    <div class="tx"><div class="hd"><b>${esc(r.t)}</b>${r.r ? `<em>${star(r.r)}</em>` : ""}</div><small>${esc(r.sub)} · ${monthYear(r.date)}</small>
    <div class="note3" data-note>${esc(note(r))}</div><span class="reveal">spoiler · click to reveal</span></div></div>`;
  const reviews = (body = blurb, wrap = "bls") => sec("reviews &amp; notes", `<div class="${wrap}">${R.reviews.map(body).join("")}</div>`, "data-archive data-cap=6");
  const finished = (body = `<div class="wallp">${R.finished.map((x, i) => `<a ${ext(x.url)} data-type="${x.type}" data-src="d" data-ti="${i}" title="${esc(x.t)}"><i style="background:${cov(x)}"></i>${x.r ? `<b>★${esc(x.r)}</b>` : ""}</a>`).join("")}</div>`) => sec("finished", body, "data-archive");
  const goingRows = () => R.reading.map((x, i) => `<a class="rg" ${ext(x.url)} data-type="${x.type}" data-src="r" data-ti="${i}"><i style="background:${cov(x)}"></i>
    <div><b>${esc(x.t)}</b><small>${x.type} · ${esc(mk(x))} · ${ago(x.date)}</small>${x.pct ? `<span class="mtr"><s style="width:${x.pct * 100}%"></s></span>` : ""}</div></a>`).join("");
  const yearNote = () => thisYear ? `<span class="u-hand rv-yr">${thisYear} finished this year</span>` : "";

  // the bedside pile from the door, grown: the current book standing on everything else lying flat.
  // hover a book and it slides out with its full title on a paper tag
  const lying = (x, i) => `<a class="bk${x.on ? " on" : ""}" ${ext(x.url)} data-type="${x.type}" data-src="p" data-ti="${i}" style="height:${x.type === "manga" ? 22 : 28 + hash(x.t) % 5}px;width:${x.on ? 66 : 72 + hash(x.t) % 18}%;margin-left:${hash(x.t + "x") % 7}%;background:${dim(x)}">
    <span>${esc(short(x.t))}</span>${x.on ? `<em class="u-paper">${esc(mk(x))}</em>` : x.r ? `<em class="rt">★${esc(x.r)}</em>` : ""}
    <b class="tg u-paper">${esc(x.t)}<small>${x.on ? `reading · ${esc(mk(x))}` : `finished${due(x.date) ? ` · ${due(x.date)}` : ""}`}</small></b></a>`;
  const pile = (cap = true) => `<div class="pl">
    <div class="stand"><span class="mk u-paper" data-sm>${esc(mk(now))}</span><a class="cv u-lit" ${ext(now.url)} data-sc style="background:${cov(now)}"></a></div>
    ${all.slice(1).map((x, i) => lying(x, i + 1)).join("")}${cap ? `<div class="floor"></div>` : ""}</div>`;

  const V = {
    pile: {
      group: "the pile", name: "the pile", note: "the door's bedside stack, big: the current book standing on everything else, which is also the finished list (hover a spine to pull it out). beside it, what's on the go with how far through. reviews are guide rows like the watch view.",
      view: () => `<div class="v3 rv rv-pile wv-bl" data-filterable>${head()}
        <div class="top"><div class="pw">${pile()}</div>
          <div class="sd"><div class="u-title">${esc(short(now.t))}</div><div class="u-sub">${now.type} · ${esc(mk(now))} · ${ago(now.date)}</div>
            ${sec("on the go", `<div class="rgs">${goingRows()}</div>`)}${yearNote()}</div></div>
        ${favRow()}
        ${reviews()}
      </div>`,
    },
    lean: {
      group: "the pile", name: "the pile, browsed", note: "the pile stays put on the left while the rest scrolls on the right. hover anything (on the go, a favorite, a review, a finished one, a spine) and that book goes up on top of the pile.",
      view: () => `<div class="v3 rv rv-lean wv-bl" data-filterable>${head()}
        <div class="lay" data-lean>
          <div class="sd">${pile(false)}<div class="cap"><div class="u-title" data-tt>${esc(short(now.t))}</div><div class="u-sub" data-ts>${now.type} · ${esc(mk(now))} · ${ago(now.date)}</div></div></div>
          <div class="main">
            ${sec("on the go", `<div class="rgs">${goingRows()}</div>`)}${yearNote()}
            ${favRow()}
            ${reviews()}
            ${finished()}
          </div>
        </div>
      </div>`,
    },

    spreads: {
      group: "open books", name: "open books", note: "each thing on the go lies open: the cover on the left page, where it's up to on the right, and the page edges thicker on the read side. reviews are index cards, finished is the round 6 shelf.",
      view: () => `<div class="v3 rv rv-spread" data-filterable>${head()}
        ${sec("on the go", `<div class="sps">${R.reading.map(x => { const p = x.pct || 0;
          return `<a class="sp2 u-lit" ${ext(x.url)} data-type="${x.type}"><i class="lp" style="background:${cov(x)}"></i><div class="rp u-paper"><small>${x.type} · ${ago(x.date)}</small><b>${esc(x.t)}</b><em>${esc(mk(x))}</em>
            ${p ? `<span class="mtr"><s style="width:${p * 100}%"></s></span>` : ""}</div><span class="pe" style="--p:${p}"></span></a>`; }).join("")}</div>`)}${yearNote()}
        ${favRow()}
        ${reviews(r => `<div class="ixc u-paper u-lit${r.spoiler ? " spoil" : ""}" data-type="${r.type}"><div class="hd"><b>${esc(r.t)}</b>${r.r ? `<em>${star(r.r)}</em>` : ""}</div>
          <small>${esc(r.sub)} · ${monthYear(r.date)}</small><div class="note3" data-note>${esc(note(r))}</div><button class="reveal" data-reveal>spoiler · click to reveal</button></div>`, "ixs")}
        ${finished(`<div class="shelf3">${R.finished.map(x => `<a class="sp" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}" style="height:${120 + hash(x.t) % 50}px;--c:${cov(x)}"><span>${esc(x.t)}</span>${x.r ? `<em>★${esc(x.r)}</em>` : ""}</a>`).join("")}</div><div class="ledge3"></div>`)}
      </div>`,
    },

    card: {
      group: "paper", name: "library card", note: "the door's due-date card, full size: every book on one card, the ones on the go stamped out, finished ones stamped with the day and rated in the margin. reviews are catalog cards filed behind it.",
      view: () => `<div class="v3 rv rv-card" data-filterable>${head()}
        <div class="top">
          ${sec("every book", `<div class="cdr"><div class="r hd"><span>date</span><span>title</span><span></span></div>${all.map(x => `<a class="r" ${ext(x.url)} data-type="${x.type}"><em style="--r:${(hash(x.t + "s") % 7 - 3) * 1.1}deg;opacity:${.7 + hash(x.t) % 4 * .1}">${x.on ? "out" : due(x.date) || "&nbsp;"}</em><b>${esc(x.t)}</b><span>${x.on ? esc(mk(x)) : x.r ? `★${esc(x.r)}` : ""}</span></a>`).join("")}</div>`, "data-archive data-cap=12 data-card")}
          <div class="pk u-paper u-lit"><small>now reading</small><a class="cv" ${ext(now.url)} style="background:${cov(now)}"></a><b>${esc(short(now.t))}</b><span>${esc(mk(now))} · ${ago(now.date)}</span></div>
        </div>
        ${yearNote()}
        ${favRow()}
        ${reviews(r => `<div class="ixc u-paper u-lit${r.spoiler ? " spoil" : ""}" data-type="${r.type}"><div class="hd"><b>${esc(r.t)}</b>${r.r ? `<em>${star(r.r)}</em>` : ""}</div>
          <small>${esc(r.sub)} · ${monthYear(r.date)}</small><div class="note3" data-note>${esc(note(r))}</div><button class="reveal" data-reveal>spoiler · click to reveal</button></div>`, "ixs")}
      </div>`,
    },

    shelf: {
      group: "baseline", name: "the desk (round 6)", note: "baseline: the books on the go with bookmarks, reviews as paper cards, finished on a shelf.",
      view: () => BASE(),
    },
    log: {
      group: "data first", name: "the log", note: "no object: on the go as progress rows, reviews as guide rows, and finished as a plain list by year with the date and rating.",
      view: () => { const g = {}; R.finished.forEach(x => (g[known(x.date) ? new Date(x.date).getFullYear() : "undated"] ??= []).push(x));
        return `<div class="v3 rv rv-log wv-bl" data-filterable>${head()}
        ${sec("on the go", `<div class="rgs two">${goingRows()}</div>`)}${yearNote()}
        ${favRow()}
        ${reviews()}
        ${finished(`<div>${Object.entries(g).map(([y, l]) => `<div class="grp"><div class="mo">${y}</div><ul class="u-list">${l.map(x => `<li data-type="${x.type}"><em>${due(x.date).slice(0, 6) || "·"}</em><a ${ext(x.url)}><b>${esc(x.t)}</b></a><span>${x.type}</span><i class="gold">${x.r ? `★${esc(x.r)}` : ""}</i></li>`).join("")}</ul></div>`).join("")}</div>`)}
      </div>`; },
    },
  };

  // the pile, browsed: hovering anything with a data-ti puts that book on top of the pile; leaving goes back to the current book
  const SRC = { r: R.reading, f: R.favorites, v: R.reviews, d: R.finished, p: all };
  const slipOf = (s, x) => s === "r" || x.on ? mk(x) : s === "f" ? "♥" : x.r ? star(x.r) : "done";
  const subOf = (s, x) => s === "r" || x.on ? `${x.type} · ${mk(x)} · ${ago(x.date)}` : s === "v" ? `${x.sub} · ${monthYear(x.date)}` : s === "f" ? `${x.type} · favorite` : `${x.type} · finished${due(x.date) ? ` ${due(x.date)}` : ""}`;
  function lift(g, el) {
    const s = el.dataset.src, x = SRC[s][+el.dataset.ti], c = g.querySelector("[data-sc]");
    if (g._on === el) return; g._on = el;
    c.classList.add("swap");
    clearTimeout(g._t);
    g._t = setTimeout(() => {
      c.style.background = cov(x); c.classList.remove("swap");
      g.querySelector("[data-sm]").textContent = slipOf(s, x);
      g.querySelector("[data-tt]").textContent = short(x.t);
      g.querySelector("[data-ts]").textContent = subOf(s, x);
    }, 120);
  }
  document.addEventListener("pointerover", e => {
    const g = e.target.closest?.("[data-lean]"), el = e.target.closest?.("[data-ti]");
    if (g && el && g.contains(el)) lift(g, el);
  });
  document.addEventListener("pointerout", e => {
    const g = e.target.closest?.("[data-lean]");
    if (g && !g.contains(e.relatedTarget)) lift(g, g.querySelector("[data-src='r'][data-ti='0']"));
  });

  function use(k) { XL3.read = (V[k] ?? V.shelf).view; }
  return { V, use };
})();
