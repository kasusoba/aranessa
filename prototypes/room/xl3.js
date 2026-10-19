/* round 6 views: every feature of the real listen / watch / code pages, each aspect with its own composition. */
const ARCHIVE_CAP3 = 18;
const chips = (group, items, on) => `<div class="chips3" data-group="${group}">${items.map(([v, l]) => `<button data-v="${v}" class="${v === on ? "on" : ""}">${l}</button>`).join("")}</div>`;
const types = list => ["all", ...["anime", "manga", "movie", "show", "book"].filter(t => list.includes(t))].map(t => [t, t]);
const sec = (label, body, extra = "") => `<section class="sec" data-sec ${extra}><div class="u-label">${label}</div><div class="body">${body}</div><div class="empty">nothing here yet</div></section>`;
const slip = (r, cls) => `<div class="${cls} u-lit${r.spoiler ? " spoil" : ""}" data-type="${r.type}">
  ${cls.startsWith("slip") ? `<a ${ext(r.url)} style="background:${cov(r)}"></a>` : ""}<div style="min-width:0;flex:1">
  ${r.r ? `<span class="st">${esc(r.r)}</span>` : ""}<b>${esc(r.t)}</b><small>${esc(r.sub)} · ${monthYear(r.date)}</small>
  <div class="note3" data-note>${esc(r.note?.trim())}</div></div><button class="reveal" data-reveal>spoiler · click to reveal</button></div>`;
const wall = list => `<div class="wallp">${list.map(x => `<a ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i style="background:${cov(x)}"></i>${x.r ? `<b>★${esc(x.r)}</b>` : ""}</a>`).join("")}</div>`;

const XL3 = {
  me: () => XL2.me(), write: () => XL2.write(), gallery: () => XL2.gallery(), shows: () => XL2.shows(), now: () => XL2.now(), uses: () => XL2.uses(),

  listen: () => {
    const L = D2.listen;
    const period = p => {
      const d = L.periods[p];
      return `<div data-pane="period" data-v="${p}" ${p === DEFAULT_PERIOD2 ? "" : "hidden"}>
        ${sec("top albums", `<div class="l-crate">${d.albums.map(a => `<a class="al" ${ext(a.url)} title="${esc(a.name)}, ${esc(a.artist)}"><i class="u-lit" style="background:${cov(a)}"></i><span class="sticker">${a.plays}</span><small>${esc(a.name)}</small></a>`).join("")}</div>`)}
        <div class="cols3">
          ${sec("top artists", `<ul class="u-list">${d.artists.map((a, i) => `<li style="align-items:center"><em>${pad2(i)}</em><span class="pin" style="background:${cov(a)}"></span><a ${ext(a.url)}><b>${esc(a.name.toLowerCase())}</b></a><i class="gold">${a.plays}</i></li>`).join("")}</ul>`)}
          ${sec("top tracks", `<ul class="u-list">${d.tracks.map((t, i) => `<li><em>${pad2(i)}</em><a ${ext(t.url)} style="min-width:0"><b style="display:block">${esc(t.name.toLowerCase())}</b><span>${esc(t.artist.toLowerCase())}</span></a><i class="gold">${t.plays}</i></li>`).join("")}</ul>`)}
        </div></div>`;
    };
    return `<div class="v3">
      <div class="l-head"><a class="l-lp" ${ext(L.now.url)}><div class="disc${L.now.live ? "" : " still"}"></div><div class="sl u-lit" style="background:${cov(L.now)}"></div></a>
        <div style="min-width:0"><div class="u-label">${glyph("listen")} ${L.now.live ? `<span style="color:var(--gold)">now playing</span> ${EQ}` : `last played · ${ago(L.now.date)}`}</div><div class="u-title">${esc(L.now.name)}</div><div class="u-sub">${esc(L.now.artist)}${L.now.album ? ` · ${esc(L.now.album)}` : ""}</div></div></div>
      ${sec("recently", `<div class="hrow3">${L.recent.map(t => `<a class="l-sleeve" ${ext(t.url)} title="${esc(t.name)}, ${esc(t.artist)}"><i class="u-lit" style="background:${cov(t, t.artist + t.name)}"></i><b>${esc(t.name)}</b><span>${ago(t.date)}</span></a>`).join("")}</div>`)}
      <div style="margin-top:30px">${chips("period", PERIODS2, DEFAULT_PERIOD2)}</div>
      ${PERIODS2.filter(([p]) => L.periods[p]).map(([p]) => period(p)).join("")}
      ${sec("loved", `<ul class="u-list cols3" style="display:grid;gap:7px 36px">${L.loved.map(t => `<li><em class="heart">♥</em><a ${ext(t.url)} style="display:flex;gap:12px;min-width:0"><b>${esc(t.name.toLowerCase())}</b><span>${esc(t.artist.toLowerCase())}</span></a></li>`).join("")}</ul>`)}
    </div>`;
  },

  watch: () => {
    const W = D2.watch, n = W.now;
    const all = [...W.recent, ...W.favorites, ...W.reviews, ...W.finished].map(x => x.type);
    return `<div class="v3" data-filterable>
      <div class="w-top">
        <a class="w-hero" ${ext(n.url)}><div class="w-poster u-lit" style="background:${cov(n)}"></div>
          <div class="w-stub u-paper u-lit">ADMIT ONE<b>${esc(n.t)}</b>${esc(n.prog.toUpperCase())}${n.total && /^e\d/.test(n.prog) ? `<span class="stamp">${Math.round(parseInt(n.prog.slice(1)) / n.total * 100)}%</span>` : ""}</div></a>
        <div style="flex:1;min-width:220px"><div class="u-label">${glyph("watch")} ${fresh(n.date) ? `<span style="color:var(--gold)">now watching</span>` : `last watched · ${ago(n.date)}`}</div><div class="u-title">${esc(n.t)}</div><div class="u-sub">${n.type} · ${esc(n.prog)}</div>
          <div class="u-stats" style="margin-top:20px"><div><b>${W.stats.movies}</b>films · 6 mo</div><div><b>${W.stats.episodes}</b>episodes · 6 mo</div><div><b>${W.stats.anime}</b>anime finished</div></div></div>
      </div>
      <div style="margin-top:30px">${chips("filter", types(all), "all")}</div>
      ${sec("recently", `<div class="film">${W.recent.map(x => `<a class="frame" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i style="background:${cov(x)}"><em>${esc(x.prog)}</em></i><small>${ago(x.date)}</small></a>`).join("")}</div>`)}
      ${sec("favorites", `<div class="hrow3" style="padding-top:2px">${W.favorites.map(x => `<a class="fav" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i><div class="tag u-paper">${esc(x.t)}</div></a>`).join("")}</div>`)}
      ${sec("reviews &amp; notes", `<div class="slips">${W.reviews.map(r => slip(r, "slip u-paper")).join("")}</div>`, "data-archive data-cap=6")}
      ${sec("also finished", wall(W.finished), "data-archive")}
    </div>`;
  },

  read: () => {
    const R = D2.read, year = new Date().getFullYear();
    const all = [...R.reading, ...R.favorites, ...R.reviews, ...R.finished].map(x => x.type);
    const thisYear = [...R.reviews, ...R.finished].filter(x => new Date(x.date).getFullYear() === year).length;
    return `<div class="v3" data-filterable>
      <div class="u-label">${glyph("read")} reading</div>
      <div class="r-desk" style="margin-top:6px">${R.reading.map(b => `<a class="r-item" ${ext(b.url)} data-type="${b.type}">
        <div class="r-hero"><div class="r-mark u-paper u-lit">${b.type === "book" ? `AT<b>${esc(b.prog)}</b>` : `CH<b>${esc(b.prog.replace(/^ch/, ""))}</b>`}</div><div class="r-book u-lit" style="background:${cov(b)}"></div></div>
        <div class="tt">${esc(b.t)}</div><div class="au">${b.type} · ${ago(b.date)}</div>${b.pct ? `<div class="barline"><i style="width:${b.pct * 100}%"></i></div>` : ""}</a>`).join("")}</div>
      <div style="margin-top:30px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">${chips("filter", types(all), "all")}${thisYear ? `<span class="u-hand" style="font-size:20px">${thisYear} finished this year</span>` : ""}</div>
      ${R.favorites.length ? sec("favorites", `<div class="hrow3" style="padding-top:2px">${R.favorites.map(x => `<a class="fav" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i><div class="tag u-paper">${esc(x.t)}</div></a>`).join("")}</div>`) : ""}
      ${sec("reviews &amp; notes", `<div class="slips">${R.reviews.map(r => slip(r, "cardr")).join("")}</div>`, "data-archive data-cap=6")}
      ${sec("finished", `<div class="shelf3">${R.finished.map(x => `<a class="sp" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}" style="height:${120 + hash(x.t) % 50}px;--c:${cov(x)}"><span>${esc(x.t)}</span>${x.r ? `<em>★${esc(x.r)}</em>` : ""}</a>`).join("")}</div><div class="ledge3"></div>`)}
    </div>`;
  },

  play: () => {
    const G = D2.games;
    return `<div class="v3">
    <div class="u-label">${glyph("play")} recently played</div>
    <div class="carts">${G.map((g, i) => `<a class="one${i ? "" : " cur"}" ${ext(g.url)}><div class="p-cart u-lit"><div class="lb" style="background:${cov(g)}"></div></div><b>${esc(g.t)}</b><span>${hours(g.mins)} · ${ago(g.last)}</span></a>`).join("")}</div>
    ${sec("playtime", `<ul class="u-list hov">${G.map((g, i) => `<li class="${i ? "" : "on"}"><b>${esc(g.t)}</b><span>${ago(g.last)}</span><i>${hours(g.mins)}</i></li>`).join("")}</ul>`)}
    </div>`;
  },

  code: () => {
    const C = D2.code, P = C.projects;
    return `<div class="xl xl-code u-keep ed3">
      <div class="etabs">${P.map((p, i) => `<span data-tab="${i}" class="${i ? "" : "on"}">${p.featured ? `<b class="fstar">★</b>` : ""}${p.file}</span>`).join("")}</div>
      ${P.map((p, i) => `<div class="readme${i ? "" : " on"}" data-readme="${i}"><div class="shot${p.img ? " real" : ""}" style="background:${p.img ? `url('${p.img}') center/cover, #0a0f1c` : art(p.t)}"></div>
        <div><h1>${esc(p.t)}</h1><span class="cat">${esc(p.cat)}</span><p>${esc(p.d)}</p><a ${ext(p.url)}>open on github ↗</a></div></div>`).join("")}
      <div class="term"><div class="row"><span class="pr">sal@room</span> ~/aranessa $ git log --oneline -${C.commits.length}</div>
        ${C.commits.map(c => `<div class="row"><span style="color:#f0c674">${c.sha}</span> ${esc(c.msg)} <span style="color:#4b587a">· ${ago(c.date)}</span></div>`).join("")}
        <div class="row" style="margin-top:10px"><span class="pr">sal@room</span> ~ $ activity --weeks 26</div><div style="margin-top:6px">${heatDays(C.perDay)}</div></div></div>`;
  },
};

/* a small version of each aspect's object, shown at the top of its door */
const HINT = {
  me: () => `<div class="hero hint"><div class="h-me"><div class="tp"></div><div class="bd"><div class="ph" style="background:${art("sal")}"></div><div class="ls"><i></i><i></i><i></i></div></div><div class="sg">sal</div></div></div>`,
  listen: () => `<div class="hero hint"><div class="h-listen"><div class="disc"></div><div class="sl" style="background:${art(D2.listen.now.artist)}"></div></div></div>`,
  watch: () => `<div class="hero hint"><div class="h-watch"><i class="u-lit" style="background:${art(D2.watch.now.title)}"></i><div class="stb u-paper u-lit">ADMIT ONE<br>${D2.watch.now.sub.toUpperCase()}</div></div></div>`,
  read: () => `<div class="hero hint"><div class="h-read"><div class="mk u-paper">${D2.read.reading[0].page}</div><div class="bk u-lit" style="background:${art(D2.read.reading[0].t)}"></div></div></div>`,
  play: () => `<div class="hero hint"><div class="h-play"><div class="p-cart u-lit"><div class="lb" style="background:${art(D.games[0][0])}"></div></div></div></div>`,
  code: () => `<div class="hero hint"><div class="h-code"><div class="tb"><i></i><i></i><i></i></div><div class="ln" style="width:60%;background:#c792ea"></div><div class="ln" style="width:80%;background:#82aaff"></div><div class="ln" style="width:45%;background:#c3e88d"></div></div></div>`,
  write: () => `<div class="hero hint"><div class="h-write u-lit"><b>${D.posts[0][0]}</b></div></div>`,
  gallery: () => `<div class="hero hint"><div class="h-gallery"><div class="pl u-paper"><i style="background:${art(D.photos[1])}"></i></div><div class="pl u-paper"><i style="background:${art(D.photos[0])}"></i></div></div></div>`,
  shows: () => `<div class="hero hint"><div class="h-shows s-bands">${D.shows.slice(0, 3).map(([a]) => `<div class="s-band" style="background:${art(a)}"><div class="cl"></div><span>${a}</span></div>`).join("")}</div></div>`,
};

/* interactions inside the views: chips, filters, notes, spoilers, show all, editor tabs */
(() => {
  function refilter(root, v) {
    root.querySelectorAll("[data-type]").forEach(el => el.classList.toggle("off", v !== "all" && el.dataset.type !== v));
    root.querySelectorAll("[data-sec]").forEach(s => {
      const items = s.querySelectorAll("[data-type]");
      s.classList.toggle("is-empty", items.length > 0 && [...items].every(i => i.classList.contains("off")));
    });
    capArchive(root);
  }
  function capArchive(root) {
    root.querySelectorAll("[data-archive]").forEach(s => {
      const cap = +s.dataset.cap || ARCHIVE_CAP3, items = [...s.querySelectorAll(".body > * > [data-type]")];
      const vis = items.filter(i => !i.classList.contains("off"));
      items.forEach(i => i.classList.remove("extra"));
      vis.forEach((i, n) => i.classList.toggle("extra", n >= cap));
      let b = s.querySelector("[data-showall]");
      if (!b) { s.querySelector(".body").insertAdjacentHTML("beforeend", `<button class="more3" data-showall></button>`); b = s.querySelector("[data-showall]"); }
      b.hidden = vis.length <= cap;
      b.textContent = s.classList.contains("all") ? "show less" : `show all (${vis.length})`;
    });
    markLong(root);
  }
  // a note that runs past its clamp fades out and gets a visible "read more"; short ones show whole.
  // measured again on resize, since the opened box is still growing when the view first lands
  function markLong(root) {
    root.querySelectorAll("[data-note]").forEach(n => {
      if (!n.offsetParent || n.classList.contains("open")) return;
      const long = n.scrollHeight > n.clientHeight + 2;
      n.classList.toggle("long", long);
      const b = n.nextElementSibling?.matches("[data-more]") ? n.nextElementSibling : null;
      if (b) b.hidden = !long;
      else if (long) n.insertAdjacentHTML("afterend", `<button class="nmore" data-more>read more</button>`);
    });
  }
  document.addEventListener("click", e => {
    const root = e.target.closest(".v3, .ed3"); if (!root) return;
    const chip = e.target.closest(".chips3 button");
    if (chip) {
      const g = chip.parentElement;
      g.querySelectorAll("button").forEach(b => b.classList.toggle("on", b === chip));
      if (g.dataset.group === "filter") refilter(root, chip.dataset.v);
      else root.querySelectorAll(`[data-pane="${g.dataset.group}"]`).forEach(p => p.hidden = p.dataset.v !== chip.dataset.v);
      return;
    }
    // a spoiler comes off with a click anywhere on it; after that a click anywhere on a long review opens or closes it
    const sp = e.target.closest(".spoil");
    if (sp && !e.target.closest("a")) { sp.classList.remove("spoil"); return markLong(root); }
    const note = !e.target.closest("a, .chips3") && e.target.closest("[data-type]")?.querySelector("[data-note].long");
    if (note) { const o = note.classList.toggle("open"), b = note.nextElementSibling; if (b?.matches("[data-more]")) b.textContent = o ? "show less" : "read more"; return; }
    const all = e.target.closest("[data-showall]"); if (all) { all.closest("[data-archive]").classList.toggle("all"); return capArchive(root); }
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      root.querySelectorAll("[data-tab]").forEach(t => t.classList.toggle("on", t === tab));
      root.querySelectorAll("[data-readme]").forEach(r => r.classList.toggle("on", r.dataset.readme === tab.dataset.tab));
    }
  });
  // archive cap needs to run once a view is in the dom
  const sizer = new ResizeObserver(es => es.forEach(e => markLong(e.target)));
  new MutationObserver(() => document.querySelectorAll(".v3[data-filterable]:not([data-init])").forEach(r => { r.dataset.init = ""; capArchive(r); sizer.observe(r); }))
    .observe(document.body, { childList: true, subtree: true });
})();

/* "touch" door heroes: the plain image at its own shape + one detail. code, write, shows stay bare. */
const TOUCH = {
  listen: () => `<div class="hero t t-listen"><div class="disc"></div><div class="sl" style="background:${cov(D2.listen.now)}"></div></div>`,
  watch: () => `<div class="hero t t-watch"><i style="background:${cov(D2.watch.now)}"></i><span class="stb u-paper u-lit">ADMIT ONE · ${esc(D2.watch.now.prog.toUpperCase())}</span></div>`,
  read: () => { const b = D2.read.reading[0]; return `<div class="hero t t-read"><span class="mk u-paper">${esc(b.prog.replace(/^ch/, ""))}</span><i style="background:${cov(b)}"></i><span class="rb"></span></div>`; },
  play: () => `<div class="hero t t-play u-lit"><i style="background:${cov(D2.games[0])}"></i></div>`,
  // code: a tiny terminal with the latest commits and the last few months of activity
  code: () => `<div class="d-term">${D2.code.commits.slice(0, 3).map(c => `<div><em>${c.sha}</em> ${esc(c.msg)}</div>`).join("")}
    <div class="d-heat">${heatDays(D2.code.perDay, 14, 7)}</div></div>`,
  gallery: () => `<div class="hero t t-gallery u-paper u-lit"><i style="background:${art(D.photos[0])}"></i><span>${D.photos[0]}</span></div>`,
};

/* doors on real data: what each one says in a line, and the stack of thumbnails under the hero */
if (D2) {
  const L = D2.listen, W = D2.watch, R = D2.read, G = D2.games;
  Object.assign(A.listen, {
    live: () => L.now.live ? `<span class="live">now</span> ${EQ}` : `<span class="muted">${ago(L.now.date)}</span>`,
    s: () => ({ items: L.recent.map(t => [esc(t.name), esc(t.artist), cov(t, t.artist + t.name)]) }),
  });
  Object.assign(A.watch, {
    live: () => fresh(W.now.date) ? `<span class="live">watching</span>` : `<span class="muted">${ago(W.now.date)}</span>`,
    s: () => ({ items: W.recent.slice(1).map(x => [esc(x.t), `${x.type} · ${esc(x.prog)}`, cov(x), "tall"]) }),
  });
  Object.assign(A.read, {
    live: () => `<span class="live">reading</span>`,
    s: () => ({ items: [...R.reading.slice(1).map(x => [esc(x.t), `${x.type} · ${esc(x.prog)}`, cov(x), "tall"]), ...R.finished.map(x => [esc(x.t), `${x.type} · finished`, cov(x), "tall"])] }),
  });
  Object.assign(A.play, {
    live: () => fresh(G[0].last) ? `<span class="live">playing</span>` : `<span class="muted">${ago(G[0].last)}</span>`,
    s: () => { const max = Math.max(...G.map(g => g.mins)); return { items: G.map(g => [esc(g.t), `${hours(g.mins)} · ${ago(g.last)}<span class="d-bar"><i style="width:${g.mins / max * 100}%"></i></span>`, cov({ img: g.header }, g.t), "banner"]) }; },
  });
  A.me.s = () => ({ items: [] });
  Object.assign(A.code, {
    live: () => `<span class="muted">${ago(D2.code.commits[0]?.date)}</span>`,
    s: () => ({ items: D2.code.projects.map(p => [esc(p.t), `${esc(p.cat)}<small class="d-desc">${esc(p.d)}</small>`, p.img ? `url('${p.img}') center/cover, #0a0f1c` : "", p.img ? "banner" : ""]) }),
  });
}
