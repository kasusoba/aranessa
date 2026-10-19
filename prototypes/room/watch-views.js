/* watch opened-view explorations. each variant swaps XL3.watch; every one keeps the real page's features:
   type filter, recently with progress, favorites, reviews (expand + spoiler reveal), also finished (show all), plus the now + stats.
   watch-view.html lines them up; index.html?watchview=<key> tries one in the room (add &open=watch to land on it opened). */
const WVIEW = (() => {
  const W = D2.watch, BASE = XL3.watch;
  const tz = { timeZone: "Asia/Jakarta" };
  const fmt = (o, iso) => new Intl.DateTimeFormat("en-GB", { ...o, ...tz }).format(new Date(iso)).toLowerCase();
  const day = iso => fmt({ day: "2-digit", month: "2-digit" }, iso).replace("/", ".");
  const wk = iso => fmt({ weekday: "short" }, iso);
  const hm = iso => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }, iso);
  const month = iso => fmt({ month: "long", year: "numeric" }, iso);
  // same reading of progress as the doors: "e16", "s4e9", "film", "finished", and how far through when it's known
  const ep = x => x.type === "movie" ? "film" : x.prog === "done" ? "finished" : x.prog;
  const pct = x => x.prog === "done" || x.type === "movie" ? 1 : x.total && /^e\d+$/.test(x.prog) ? Math.min(1, parseInt(x.prog.slice(1)) / x.total) : null;
  const ofTotal = x => x.total && /^e\d+$/.test(x.prog) ? `${x.prog} of ${x.total}` : ep(x);
  const pctLabel = x => { const p = pct(x); return x.type === "movie" ? "film" : p === 1 ? "done" : p ? `${Math.round(p * 100)}%` : esc(x.prog); };

  // one way to write a rating everywhere: "★8", the same as the also finished wall (reviews come in as "8/10")
  const star = r => r ? `★${String(r).replace(/\/10$/, "")}` : "";
  const n = () => W.now;
  const nowLabel = () => `${glyph("watch")} ${fresh(n().date) ? `<span style="color:var(--gold)">now watching</span>` : `last watched · ${ago(n().date)}`}`;
  const stats = () => `<div class="u-stats"><div><b>${W.stats.movies}</b>films · 6 mo</div><div><b>${W.stats.episodes}</b>episodes · 6 mo</div><div><b>${W.stats.anime}</b>anime finished</div></div>`;
  const filter = () => chips("filter", types([...W.recent, ...W.favorites, ...W.reviews, ...W.finished].map(x => x.type)), "all");
  const head = () => `<div class="wv-head"><div class="u-label">${nowLabel()}</div>${filter()}</div>`;
  const reviews = (body, wrap = "slips") => sec("reviews &amp; notes", `<div class="${wrap}">${W.reviews.map(body).join("")}</div>`, "data-archive data-cap=6");
  const finished = (body = wall(W.finished)) => sec("also finished", body, "data-archive");
  const favRow = () => sec("favorites", `<div class="hrow3" style="padding-top:2px">${W.favorites.map(x => `<a class="fav" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i><div class="tag u-paper">${esc(x.t)}</div></a>`).join("")}</div>`);
  // a review that isn't the round 6 slip; the reveal button has to stay a direct child of the .spoil element
  const rv = (r, cls, cover = true) => `<div class="wvr ${cls}${r.spoiler ? " spoil" : ""}" data-type="${r.type}">
    ${cover ? `<a class="cv" ${ext(r.url)} style="background:${cov(r)}"></a>` : ""}<div class="tx">
    ${r.r ? `<span class="st">${esc(r.r)}</span>` : ""}<b>${esc(r.t)}</b><small>${esc(r.sub)} · ${monthYear(r.date)}</small>
    <div class="note3" data-note>${esc(r.note)}</div></div><button class="reveal" data-reveal>spoiler · click to reveal</button></div>`;
  // the door's crt. "on" lights it for good; otherwise it's on while watching or while the box is hovered
  const tv = (x, cls = "", osd = `▶ ${esc(ep(x))}`) => { const p = pct(x);
    return `<div class="tvb ${cls}"><div class="scr"><i style="background:${cov(x)}"></i><span class="nz"></span><span class="osd">${osd}</span><span class="off">■ stop</span>${p ? `<span class="pb"><s style="width:${p * 100}%"></s></span>` : ""}</div>
      <div class="ctl"><b></b><b></b><span class="led"></span></div></div>`; };
  // recently grouped by month, for the listings and the log
  const byMonth = (list, row) => { const g = {}; list.forEach((x, i) => (g[month(x.date)] ??= []).push(row(x, i)));
    return Object.entries(g).map(([m, rows]) => `<div class="grp"><div class="mo">${m}</div>${rows.join("")}</div>`).join(""); };

  // the set + its channel guide (round 1's top). every row that can tune the set says where it comes from (data-src) and which one (data-ti)
  const guide = () => `<div class="gd">${W.recent.map((x, i) => { const p = pct(x);
    return `<a class="ch${i ? "" : " on"}" ${ext(x.url)} data-src="r" data-ti="${i}" data-type="${x.type}"><em>${pad2(i)}</em><b>${esc(x.t)}</b><span>${esc(ep(x))}</span><small>${ago(x.date)}</small>${p ? `<s style="width:${p * 100}%"></s>` : ""}</a>`; }).join("")}</div>`;
  const setTv = () => `${tv(n(), "", `ch 01 · ${esc(ep(n()))}`)}<div class="u-title" data-tt>${esc(n().t)}</div><div class="u-sub" data-ts>${n().type} · ${esc(ofTotal(n()))}</div>`;
  const setTop = () => `<div class="top" data-tune><div class="tvc">${setTv()}</div>${sec("recently · channel guide", guide())}</div>`;
  // a review opened to read in full: in its own spot when there's room, or right under its row when there isn't
  const reading = r => `<div class="hd"><b>${esc(r.t)}</b>${r.r ? `<span class="st">${esc(r.r)}</span>` : ""}</div>
    <small>${esc(r.sub)} · ${monthYear(r.date)}${r.url ? ` · <a ${ext(r.url)}>open ↗</a>` : ""}</small><div class="cn">${esc(r.note)}</div><span class="reveal">spoiler · click to reveal</span>`;
  const rvRow = (r, i, on) => `<div class="rr${on ? " on" : ""}" data-rv="${i}" data-src="v" data-ti="${i}" data-type="${r.type}"><span class="st">${esc(r.r) || "·"}</span>
    <div><b>${esc(r.t)}</b><small>${esc(r.sub)} · ${monthYear(r.date)}</small></div>${r.spoiler ? `<em>spoiler</em>` : ""}</div>`;

  const V = {
    blurbs: {
      group: "the set · round 2", name: "guide blurbs", note: "reviews written like the channel guide: a row each with the rating, the poster and the first two lines. click anywhere on one to read the rest; a spoiler stays hidden until you click it.",
      view: () => `<div class="v3 wv-set wv-bl" data-filterable>${head()}${setTop()}
        ${favRow()}
        ${reviews(r => `<div class="bl${r.spoiler ? " spoil" : ""}" data-type="${r.type}"><a class="cv" ${ext(r.url)} style="background:${cov(r)}"></a>
          <div class="tx"><div class="hd"><b>${esc(r.t)}</b>${r.r ? `<em>${star(r.r)}</em>` : ""}</div><small>${esc(r.sub)} · ${monthYear(r.date)}</small>
          <div class="note3" data-note>${esc(r.note.trim())}</div><span class="reveal">spoiler · click to reveal</span></div></div>`, "bls")}
        ${finished()}
      </div>`,
    },
    subs: {
      group: "the set · round 2", name: "subtitles", note: "each review is a still from what it's about, with the note running along the bottom as subtitles. click a still to read all of it; spoilers are scrambled until clicked.",
      view: () => `<div class="v3 wv-set wv-sub" data-filterable>${head()}${setTop()}
        ${favRow()}
        ${reviews(r => `<div class="sb${r.spoiler ? " spoil" : ""}" data-type="${r.type}"><div class="still" style="background:${cov(r)}">${r.r ? `<span class="rt">${esc(r.r)}</span>` : ""}
          <div class="note3" data-note>${esc(r.note)}</div><span class="reveal">spoiler · click to reveal</span></div>
          <div class="cp"><b>${esc(r.t)}</b><small>${esc(r.sub)} · ${monthYear(r.date)}</small></div></div>`, "sbs")}
        ${finished()}
      </div>`,
    },
    reader: {
      group: "the set · round 2", name: "reader", note: "reviews as a list like the channel guide; the one you pick opens beside it on a sheet, whole, no clamping. on a narrow screen it opens under its row instead.",
      view: () => `<div class="v3 wv-set wv-rd" data-filterable>${head()}${setTop()}
        ${favRow()}
        ${sec("reviews &amp; notes", `<div class="rl">${W.reviews.map((r, i) => rvRow(r, i, !i)).join("")}</div>
          <div class="home" data-read-home><div class="rcap u-paper u-lit${W.reviews[0].spoiler ? " spoil" : ""}" data-read>${reading(W.reviews[0])}</div></div>`, "data-archive data-cap=8 data-reader")}
        ${finished()}
      </div>`,
    },
    tuned: {
      group: "the set · round 2", name: "it all tunes the set", note: "the set stays put on the left while everything else scrolls on the right. hover anything (a channel, a favorite, a review, a finished one) and the set flicks to it; click a review and it plays under the set as the caption.",
      view: () => `<div class="v3 wv-set wv-tn" data-filterable>${head()}
        <div class="lay" data-tune data-reader>
          <div class="side">${setTv()}<div class="home" data-read-home><div class="tcap" data-read hidden></div></div><div class="sst">${stats()}</div></div>
          <div class="main">
            ${sec("recently · channel guide", guide())}
            ${sec("favorites", `<div class="hrow3 pf">${W.favorites.map((x, i) => `<a ${ext(x.url)} data-src="f" data-ti="${i}" data-type="${x.type}" title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i></a>`).join("")}</div>`)}
            ${sec("reviews &amp; notes", `<p class="hint3">click one to read it under the set</p><div class="rl">${W.reviews.map((r, i) => rvRow(r, i)).join("")}</div>`, "data-archive data-cap=8")}
            ${finished(`<div class="wallp">${W.finished.map((x, i) => `<a ${ext(x.url)} data-src="d" data-ti="${i}" data-type="${x.type}" title="${esc(x.t)}"><i style="background:${cov(x)}"></i>${x.r ? `<b>★${esc(x.r)}</b>` : ""}</a>`).join("")}</div>`)}
          </div>
        </div>
      </div>`,
    },

    set: {
      group: "telly", name: "the set (round 1)", note: "the door's telly, grown up. the recent list is the channel guide beside it, with how far through each one is. hover a channel and the set tunes over to it.",
      view: () => `<div class="v3 wv-set" data-filterable>${head()}${setTop()}
        ${favRow()}
        ${reviews(r => slip(r, "slip u-paper"))}
        ${finished()}
      </div>`,
    },
    guide: {
      group: "telly", name: "listings", note: "a folded tv guide on the table: recently printed as listings by month with the time it was on, favorites as the always-on column, reviews cut out like newspaper clippings.",
      view: () => `<div class="v3 wv-guide" data-filterable>${head()}
        <div class="top">${tv(n())}<div><div class="u-title">${esc(n().t)}</div><div class="u-sub">${n().type} · ${esc(ofTotal(n()))}</div><div style="margin-top:18px">${stats()}</div></div></div>
        <div class="sheet u-paper u-lit"><div class="mast"><span>listings</span><span>${W.recent.length} programmes · since ${day(W.recent.at(-1).date)}</span></div>
          <div class="cols">
            ${sec("recently", `<div class="ls">${byMonth(W.recent, x => `<a class="li" ${ext(x.url)} data-type="${x.type}"><span class="when"><b>${wk(x.date)} ${day(x.date)}</b>${hm(x.date)}</span><span class="what"><b>${esc(x.t)}</b><small>${x.type} · ${esc(ofTotal(x))}</small></span><em>${pctLabel(x)}</em></a>`)}</div>`)}
            ${sec("always on · favorites", `<div class="fl">${W.favorites.map((x, i) => `<a ${ext(x.url)} data-type="${x.type}"><em>${pad2(i)}</em><i style="background:${cov(x)}"></i><b>${esc(x.t)}</b></a>`).join("")}</div>`)}
          </div></div>
        ${reviews(r => rv(r, "cut u-paper", false), "clips")}
        ${finished()}
      </div>`,
    },
    cabinet: {
      group: "telly", name: "the cabinet", note: "home video: the set on its cabinet, recently as cassettes with the reels wound by how far through, favorites as clamshell cases, reviews as sleeve inserts, the finished pile as a shelf of spines.",
      view: () => `<div class="v3 wv-cab" data-filterable>${head()}
        <div class="top">${tv(n())}<div><div class="u-title">${esc(n().t)}</div><div class="u-sub">${n().type} · ${esc(ofTotal(n()))}</div><div style="margin-top:18px">${stats()}</div></div></div>
        <div class="plank"></div>
        ${sec("recently", `<div class="hrow3 cass">${W.recent.map((x, i) => { const p = pct(x) ?? .5;
          return `<a class="cs" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><div class="sh u-lit"><div class="lab u-paper"><i style="background:${cov(x)}"></i><div><b>${esc(x.t)}</b><span>${esc(ofTotal(x))}</span></div></div>
            <div class="win"><s style="--s:${1 - p}"></s><s style="--s:${p}"></s></div></div><small>${i ? ago(x.date) : fresh(x.date) ? "in the deck" : ago(x.date)}</small></a>`; }).join("")}</div>`)}
        ${sec("favorites", `<div class="hrow3 cases">${W.favorites.map(x => `<a class="case u-lit" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i style="background:${cov(x)}"></i></a>`).join("")}</div>`)}
        ${reviews(r => slip(r, "slip u-paper ins"))}
        ${finished(`<div class="vsh">${W.finished.map(x => `<a ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}" style="height:${150 + hash(x.t) % 3 * 6}px"><i style="background:${cov(x)}"></i><span class="u-paper">${esc(x.t)}</span>${x.r ? `<em>★${esc(x.r)}</em>` : ""}</a>`).join("")}</div>`)}
      </div>`,
    },
    window: {
      group: "telly", name: "shop window", note: "recently as a shop window of sets, all switched on, the latest one big. hover a set and it crackles.",
      view: () => `<div class="v3 wv-win" data-filterable>${head()}
        <div class="ttl"><div><div class="u-title">${esc(n().t)}</div><div class="u-sub">${n().type} · ${esc(ofTotal(n()))}</div></div>${stats()}</div>
        ${sec("recently", `<div class="pane">${W.recent.map((x, i) => `<a class="tvi" ${ext(x.url)} data-type="${x.type}" data-zap>${tv(x, "on")}<b>${esc(x.t)}</b><small>${!i && fresh(x.date) ? "on now" : ago(x.date)}</small></a>`).join("")}</div>`)}
        ${favRow()}
        ${reviews(r => slip(r, "slip u-paper"))}
        ${finished()}
      </div>`,
    },

    program: {
      group: "cinema", name: "program", note: "baseline (round 6): the poster with the stub tucked on it, recently as a film strip, favorites tagged, reviews as paper slips.",
      view: () => BASE(),
    },
    stubs: {
      group: "cinema", name: "stub book", note: "the latest is a full ticket, the recent ones torn stubs, favorites taped up, and every review written on the back of a ticket.",
      view: () => { const x = n(), p = pct(x);
        return `<div class="v3 wv-stub" data-filterable>${head()}
        <a class="tkt u-paper u-lit" ${ext(x.url)}><i style="background:${cov(x)}"></i><div class="m"><small>admit one · ${fresh(x.date) ? "now showing" : `${wk(x.date)} ${day(x.date)}`}</small><b>${esc(x.t)}</b><span>${x.type} · ${esc(ofTotal(x))}</span></div>
          <div class="sb"><span>no. ${String(W.recent.length).padStart(4, "0")}</span>${p && p < 1 ? `<em>${Math.round(p * 100)}%</em>` : ""}</div></a>
        <div style="margin-top:26px">${stats()}</div>
        ${sec("recently", `<div class="torn">${W.recent.slice(1).map(x => `<a class="tn u-paper" ${ext(x.url)} data-type="${x.type}" style="--r:${(hash(x.t) % 7 - 3) * .8}deg"><small>${day(x.date)}</small><b>${esc(x.t)}</b><span>${esc(ofTotal(x))}</span></a>`).join("")}</div>`)}
        ${sec("favorites", `<div class="hrow3 taped">${W.favorites.map(x => `<a ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}" style="--r:${(hash(x.t + "t") % 7 - 3) * .9}deg"><i class="u-lit" style="background:${cov(x)}"></i></a>`).join("")}</div>`)}
        ${reviews(r => rv(r, "back u-paper"))}
        ${finished()}
      </div>`; },
    },

    gate: {
      group: "film", name: "in the gate", note: "one strip across the top: the latest lit up big in the projector gate, the rest running off to the right, edge-printed. favorites as mounted slides.",
      view: () => `<div class="v3 wv-gate" data-filterable>${head()}
        ${sec("recently", `<div class="strip35">${W.recent.map((x, i) => `<a class="fr${i ? "" : " g"}" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><em>${esc(x.t)}</em><i style="background:${cov(x)}"></i><small>${esc(ep(x))} ▸ ${day(x.date)}</small></a>`).join("")}</div>`)}
        <div class="ttl"><div><div class="u-title">${esc(n().t)}</div><div class="u-sub">${n().type} · ${esc(ofTotal(n()))}</div></div>${stats()}</div>
        ${sec("favorites", `<div class="hrow3 slides">${W.favorites.map(x => `<a class="sl u-paper u-lit" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i style="background:${cov(x)}"></i><span>${esc(x.t)}</span></a>`).join("")}</div>`)}
        ${reviews(r => slip(r, "slip u-paper"))}
        ${finished()}
      </div>`,
    },

    log: {
      group: "data first", name: "the log", note: "no object, for contrast: a dated log with progress bars, favorites as a list, reviews and the finished pile as text.",
      view: () => `<div class="v3 wv-log" data-filterable>${head()}
        <div class="ttl"><div><div class="u-title">${esc(n().t)}</div><div class="u-sub">${n().type} · ${esc(ofTotal(n()))}</div></div>${stats()}</div>
        <div class="cols">
          ${sec("recently", `<div class="tb">${byMonth(W.recent, x => { const p = pct(x);
            return `<a ${ext(x.url)} data-type="${x.type}"><span class="d">${day(x.date)}</span><b>${esc(x.t)}</b><span class="k">${x.type} · ${esc(ep(x))}</span><span class="pg">${p ? `<s style="width:${p * 100}%"></s>` : ""}</span></a>`; })}</div>`)}
          ${sec("favorites", `<div class="fl">${W.favorites.map(x => `<a ${ext(x.url)} data-type="${x.type}"><i style="background:${cov(x)}"></i><b>${esc(x.t)}</b><span>${x.type}</span></a>`).join("")}</div>`)}
        </div>
        ${reviews(r => rv(r, "row", false), "rows")}
        ${finished(`<div class="ft">${W.finished.map(x => `<a ${ext(x.url)} data-type="${x.type}"><b>${esc(x.t)}</b><span>${x.type}</span>${x.r ? `<em>★${esc(x.r)}</em>` : ""}</a>`).join("")}</div>`)}
      </div>`,
    },
  };

  // the set: hovering anything with data-ti tunes the telly to it through a moment of static; leaving goes back to
  // the pinned one (a review being read), or the latest
  const SRC = { r: W.recent, f: W.favorites, v: W.reviews, d: W.finished };
  const osd = (s, x, i) => s === "r" ? `ch ${pad2(i)} · ${ep(x)}` : s === "f" ? "♥ favorite" : s === "v" ? `review${x.r ? ` · ${star(x.r)}` : ""}` : `finished${x.r ? ` · ★${x.r}` : ""}`;
  const subOf = (s, x) => s === "r" ? `${x.type} · ${ofTotal(x)}` : s === "v" ? `${x.sub} · ${monthYear(x.date)}` : `${x.type} · ${s === "f" ? "favorite" : "finished"}`;
  function tune(g, el) {
    const s = el.dataset.src ?? "r", i = +el.dataset.ti, x = SRC[s][i], nz = g.querySelector(".nz");
    g.querySelectorAll("[data-ti]").forEach(c => c.classList.toggle("on", c === el));
    const cap = g.querySelector("[data-read]"); if (cap && g._pin) cap.classList.toggle("away", el !== g._pin);
    nz.classList.add("on"); clearTimeout(g._t);
    g._t = setTimeout(() => {
      g.querySelector(".scr i").style.background = cov(x);
      g.querySelector(".osd").textContent = osd(s, x, i);
      const pb = g.querySelector(".pb"), p = s === "r" ? pct(x) : null;
      if (pb) { pb.style.visibility = p ? "" : "hidden"; pb.firstChild.style.width = `${(p ?? 0) * 100}%`; }
      g.querySelector("[data-tt]").textContent = x.t;
      g.querySelector("[data-ts]").textContent = subOf(s, x);
      setTimeout(() => nz.classList.remove("on"), 120);
    }, 140);
  }
  const home = g => g._pin ?? g.querySelector("[data-src='r'][data-ti='0']");
  document.addEventListener("pointerover", e => {
    const g = e.target.closest?.("[data-tune]"), row = e.target.closest?.("[data-ti]");
    if (g && row && g.contains(row) && !row.classList.contains("on")) tune(g, row);
    // shop window: a short burst of static on the set under the pointer
    const z = e.target.closest?.("[data-zap]");
    if (z && !z.contains(e.relatedTarget)) { const nz = z.querySelector(".nz"); nz.classList.add("on"); setTimeout(() => nz.classList.remove("on"), 220); }
  });
  document.addEventListener("pointerout", e => {
    const g = e.target.closest?.("[data-tune]");
    if (g && !g.contains(e.relatedTarget) && !home(g).classList.contains("on")) tune(g, home(g));
  });

  // reader: clicking a review row opens it whole, beside the list (or under the set) when there's room, under its row when there isn't
  document.addEventListener("click", e => {
    const row = e.target.closest("[data-rv]"); if (!row || e.target.closest("a")) return;
    const host = row.closest("[data-reader]"), cap = host.querySelector("[data-read]"), r = W.reviews[row.dataset.rv];
    const narrow = row.closest(".v3").clientWidth < 640;
    if (narrow && cap.previousElementSibling === row && !cap.hidden) { cap.hidden = true; row.classList.remove("on"); return; }
    cap.innerHTML = reading(r); cap.hidden = false; cap.classList.remove("away"); cap.scrollTop = 0;
    cap.classList.toggle("spoil", !!r.spoiler);
    host.querySelectorAll("[data-rv]").forEach(x => x.classList.toggle("on", x === row));
    narrow ? row.after(cap) : host.querySelector("[data-read-home]").append(cap);
    if (host.matches("[data-tune]")) { host._pin = row; tune(host, row); }
  });

  function use(k) { XL3.watch = (V[k] ?? V.program).view; }
  return { V, use };
})();
