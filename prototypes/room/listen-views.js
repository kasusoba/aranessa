/* listen opened-view explorations. each variant swaps XL3.listen. every one keeps the real listen page's features:
   now / last played, recently, period chips (7d 30d 90d 180d year all) switching top albums / artists / tracks, loved.
   listen-view.html lines them up; index.html?listenview=<key> tries one in the room (add &open=listen to land on it opened). */
const LVIEW = (() => {
  const L = D2.listen, BASE = XL3.listen;
  const plays = [L.now, ...L.recent];
  const hm = iso => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
  const day = iso => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase();
  const lo = s => esc(String(s ?? "").toLowerCase());
  const periods = PERIODS2.filter(([p]) => L.periods[p]);
  const label = p => PERIODS2.find(([k]) => k === p)?.[1] ?? p;
  const head = (extra = "") => `<div class="wv-head"><div class="u-label">${glyph("listen")} ${L.now.live ? `<span style="color:var(--gold)">now playing</span> ${EQ}` : `last played · ${ago(L.now.date)}`}</div>${extra}</div>`;
  const periodChips = () => chips("period", periods.map(([p, l]) => [p, l]), DEFAULT_PERIOD2);
  // one pane per period; the period chips show one at a time (xl3.js)
  const panes = body => periods.map(([p]) => `<div data-pane="period" data-v="${p}"${p === DEFAULT_PERIOD2 ? "" : " hidden"}>${body(L.periods[p], p)}</div>`).join("");

  // recently, as listening sessions: consecutive plays from the same album fold under one cover, days get a header
  const sessions = () => {
    const out = [];
    plays.forEach(t => {
      const g = out.at(-1);
      if (g && g.album === t.album && g.artist === t.artist) g.tracks.push(t);
      else out.push({ album: t.album, artist: t.artist, img: t.img, url: t.url, tracks: [t] });
    });
    return out;
  };
  const recently = (o = {}) => {
    let d = "";
    return sec("recently", `<div class="lv-sess${o.one ? " one" : ""}">${sessions().map(g => {
      const dd = day(g.tracks[0].date), dh = dd !== d ? `<div class="dh">${dd}</div>` : ""; d = dd;
      return `${dh}<div class="ss"${o.tag ? ` data-c="${o.tag(g)}"` : ""}><i class="u-lit" style="background:${cov(g, g.artist + g.album)}"></i><div><b>${esc(g.album || g.tracks[0].name)}</b><small>${lo(g.artist)}</small>
        <ol>${g.tracks.map((t, i) => `<li><a ${ext(t.url)}>${esc(t.name)}</a><em>${i === 0 && t === L.now && t.live ? "now" : hm(t.date)}</em></li>`).join("")}</ol></div></div>`;
    }).join("")}</div>`);
  };
  const artists = (d, o = {}) => sec("top artists", `<ul class="u-list">${d.artists.map((a, i) => `<li style="align-items:center"${o.tag ? ` data-c="${o.tag(a)}"` : ""}><em>${pad2(i)}</em><span class="pin" style="background:${cov(a)}"></span><a ${ext(a.url)}><b>${lo(a.name)}</b></a><i class="gold">${a.plays}</i></li>`).join("")}</ul>`);
  const tracks = (d, o = {}) => sec("top tracks", `<ul class="u-list">${d.tracks.map((t, i) => `<li${o.tag ? ` data-c="${o.tag(t)}"` : ""}><em>${pad2(i)}</em><a ${ext(t.url)} style="min-width:0"><b style="display:block">${lo(t.name)}</b><span>${lo(t.artist)}</span></a><i class="gold">${t.plays}</i></li>`).join("")}</ul>`);
  const loved = (o = {}) => sec("loved", `<ul class="u-list${o.one ? "" : " cols3"}" style="display:grid;gap:7px 36px">${L.loved.map(t => `<li${o.tag ? ` data-c="${o.tag(t)}"` : ""}><em class="heart">♥</em><a ${ext(t.url)} style="display:flex;gap:12px;min-width:0"><b>${lo(t.name)}</b><span>${lo(t.artist)}</span></a></li>`).join("")}</ul>`);
  const foot = () => `<p class="pv-foot">scrobbled on last.fm</p>`;

  // the door's crate, big: the first album stands in front, the rest show their top edges behind it, d = how far back
  const crate = (list, w) => `<div class="ld-crate lv-crate" style="--fw:${w}px;--n:${list.length - 1}"><div class="stk">${list.map((a, i) => ({ a, i })).reverse()
    .map(({ a, i }) => `<div class="sv${i ? "" : " on"}" data-n="${i}" title="${esc(a.name)}, ${esc(a.artist)}"><i style="background:${cov(a)};--d:${Math.min(i, 10)}"></i></div>`).join("")}</div></div>`;
  // the picked album pulled out: the sleeve with its record sliding out the side, then the notes
  const pulled = (list, p) => `<div class="lv-pull sw">${list.map((a, i) => `<div class="pl${i ? "" : " on"}">
    <a class="sl" ${ext(a.url)}><span class="rc"><i style="background:${cov(a)}"></i></span><i class="u-lit" style="background:${cov(a)}"></i><em class="sticker">${a.plays}</em></a>
    <div class="tx"><div class="u-label">no. ${i + 1} · ${label(p)}</div><a class="u-title" ${ext(a.url)}>${esc(a.name)}</a><div class="u-sub">${esc(a.artist)}</div>
      <div class="nums"><b>${a.plays}</b> plays</div></div></div>`).join("")}</div>`;
  const albumRows = list => `<ol class="lv-rows">${list.map((a, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><em>${pad2(i)}</em><b>${esc(a.name)}</b><span>${lo(a.artist)}</span><i class="gold">${a.plays}</i></li>`).join("")}</ol>`;

  // browsed: anything hovered on the right goes to the front of the crate on the left. covers live in a registry by index
  let REG = [];
  const tag = x => (REG.push({ bg: cov(x, x.artist ? x.artist + (x.album ?? x.name) : x.name), t: x.album ?? x.name, s: x.artist ?? "" }), REG.length - 1);

  const V = {
    crate: {
      group: "the crate", name: "the crate, big", note: "the door's crate grown: the period's top albums filed in it, number one in front. hover an edge or a line and that album comes up out of the crate and lies pulled out beside it, record sliding out the side.",
      view: () => `<div class="v3 lsv">${head(periodChips())}
        ${panes((d, p) => `<div class="lv-tune lv-big">${crate(d.albums, 230)}<div class="rt">${pulled(d.albums, p)}${albumRows(d.albums)}</div></div>
          <div class="cols3">${artists(d)}${tracks(d)}</div>`)}
        ${recently()}${foot()}</div>`,
    },
    browse: {
      group: "the crate", name: "the crate, browsed", note: "the crate sticks on the left and everything else runs down the right: recently, the chart, loved. hover anything and its cover goes to the front of the crate with a caption, like the pile in read.",
      view: () => {
        REG = [];
        const first = tag({ name: L.now.album, artist: L.now.artist, img: L.now.img });
        const edges = [...new Map(plays.map(t => [t.album, { name: t.album, artist: t.artist, img: t.img }])).values()];
        ["3month", "overall"].forEach(p => L.periods[p]?.albums.forEach(a => edges.length < 12 && !edges.some(e => e.name === a.name) && edges.push(a)));
        return `<div class="v3 lsv lv-browse">${head()}<div class="lay" data-browse>
          <div class="sd">${crate(edges, 230).replace('class="sv on"', `class="sv on front"`)}<div class="cap"><div class="u-title">${esc(REG[first].t)}</div><div class="u-sub">${lo(REG[first].s)}</div></div></div>
          <div class="main">${recently({ one: true, tag: g => tag({ ...g, name: g.album }) })}
            <div style="margin-top:34px">${periodChips()}</div>
            ${panes(d => `${sec("top albums", `<ol class="lv-rows">${d.albums.map((a, i) => `<li data-c="${tag({ ...a, album: a.name })}"><em>${pad2(i)}</em><a ${ext(a.url)}><b>${esc(a.name)}</b></a><span>${lo(a.artist)}</span><i class="gold">${a.plays}</i></li>`).join("")}</ol>`)}
              ${artists(d, { tag: a => tag({ ...a, artist: "artist" }) })}${tracks(d, { tag })}`)}
            ${loved({ one: true, tag })}${foot()}</div></div></div>`;
      },
    },
    deck: {
      group: "turntable", name: "on the deck", note: "the last played record sits on a turntable (spins while live, or on hover), with the session it was part of as the tracklist beside it. the chart below as covers with play stickers.",
      view: () => {
        const s = sessions()[0];
        return `<div class="v3 lsv">${head()}<div class="lv-deck">
          <a class="tt${L.now.live ? " live" : ""}" ${ext(L.now.url)}><span class="plat"><span class="rec"><i style="background:${cov(L.now)}"></i></span></span><span class="arm"><b></b></span><span class="rpm">33</span></a>
          <div class="dk"><div class="u-title">${esc(L.now.name)}</div><div class="u-sub">${esc(L.now.artist)} · ${esc(L.now.album)}</div>
            <div class="u-label" style="margin-top:22px">this session · ${day(s.tracks[0].date)}</div>
            <ol class="lv-tl">${s.tracks.slice().reverse().map(t => `<li class="${t === L.now ? "on" : ""}"><a ${ext(t.url)}>${esc(t.name)}</a><em>${hm(t.date)}</em></li>`).join("")}</ol></div></div>
          ${recently()}
          <div style="margin-top:34px">${periodChips()}</div>
          ${panes(d => `${sec("top albums", `<div class="l-crate">${d.albums.map(a => `<a class="al" ${ext(a.url)} title="${esc(a.name)}, ${esc(a.artist)}"><i class="u-lit" style="background:${cov(a)}"></i><span class="sticker">${a.plays}</span><small>${esc(a.name)}</small></a>`).join("")}</div>`)}
            <div class="cols3">${artists(d)}${tracks(d)}</div>`)}
          ${loved()}${foot()}</div>`;
      },
    },
    wall: {
      group: "face out", name: "the wall", note: "the chart as a record store wall: albums face out, sized by plays (the top two take double space), artists as round pins along the bottom rail. recently is a strip of sleeves on top.",
      view: () => `<div class="v3 lsv">${head()}
        ${sec("recently", `<div class="hrow3">${sessions().map(g => `<a class="l-sleeve" ${ext(g.url)} title="${esc(g.album)}, ${esc(g.artist)}"><i class="u-lit" style="background:${cov(g, g.artist + g.album)}"></i><b>${esc(g.album)}</b><span>${g.tracks.length} · ${hm(g.tracks.at(-1).date)}</span></a>`).join("")}</div>`)}
        <div style="margin-top:34px">${periodChips()}</div>
        ${panes(d => `${sec("top albums", `<div class="lv-wall">${d.albums.map((a, i) => `<a class="${i < 2 ? "big" : ""}" ${ext(a.url)} title="${esc(a.name)}, ${esc(a.artist)}"><i class="u-lit" style="background:${cov(a)}"></i><span class="sticker">${a.plays}</span><small><b>${esc(a.name)}</b>${lo(a.artist)}</small></a>`).join("")}</div>`)}
          ${sec("top artists", `<div class="lv-pins">${d.artists.map(a => `<a ${ext(a.url)} title="${esc(a.name)}"><i style="background:${cov(a)}"></i><b>${lo(a.name)}</b><em>${a.plays}</em></a>`).join("")}</div><div class="ledge3"></div>`)}
          ${tracks(d)}`)}
        ${loved()}${foot()}</div>`,
    },
    r6: {
      group: "for comparison", name: "round 6", note: "the current opened view as it is: sleeve + record head, recently as sleeves, chips, top albums as a grid with stickers, artists and tracks, loved.",
      view: () => BASE(),
    },
    log: {
      group: "data first", name: "the log", note: "no object: recently as a timestamped table, the chart as ranked rows with play bars, loved as a list.",
      view: () => {
        const bars = (list, f) => { const max = Math.max(...list.map(x => x.plays)); return `<ol class="lv-log">${list.map((x, i) => `<li><em>${pad2(i)}</em><a ${ext(x.url)}>${f(x)}</a><span class="bar"><s style="width:${x.plays / max * 100}%"></s></span><i class="gold">${x.plays}</i></li>`).join("")}</ol>`; };
        return `<div class="v3 lsv">${head()}
          ${sec("recently", `<table class="lv-tb"><tbody>${plays.map(t => `<tr><td>${day(t.date)} ${hm(t.date)}</td><td><a ${ext(t.url)}>${esc(t.name)}</a></td><td>${lo(t.artist)}</td><td>${esc(t.album)}</td></tr>`).join("")}</tbody></table>`)}
          <div style="margin-top:34px">${periodChips()}</div>
          ${panes(d => `${sec("top albums", bars(d.albums, a => `<b>${esc(a.name)}</b> <span>${lo(a.artist)}</span>`))}
            <div class="cols3">${sec("top artists", bars(d.artists, a => `<b>${lo(a.name)}</b>`))}${sec("top tracks", bars(d.tracks, t => `<b>${lo(t.name)}</b> <span>${lo(t.artist)}</span>`))}</div>`)}
          ${loved()}${foot()}</div>`;
      },
    },
  };

  // lift: the picked sleeve rises out of the crate by part of its width; near the back there's no room above it,
  // so the sleeves in front drop instead. sticky, so the pulled-out album stays readable
  const lift = (crateEl, n) => {
    const svs = [...crateEl.querySelectorAll(".sv")], rise = crateEl.querySelector(".sv:last-child i").offsetWidth * .42;
    svs.forEach(s => { s.querySelector("i").style.translate = ""; s.classList.toggle("on", +s.dataset.n === n); });
    const sv = svs.find(s => +s.dataset.n === n);
    if (!sv || !n) return;
    const up = Math.min(rise, sv.offsetTop), down = rise - up;
    sv.querySelector("i").style.translate = `0 ${-up}px`;
    for (let x = sv.nextElementSibling; x; x = x.nextElementSibling) x.querySelector("i").style.translate = `0 ${down}px`;
  };
  document.addEventListener("pointerover", e => {
    const h = e.target.closest?.(".lv-tune"), t = e.target.closest?.(".lv-tune [data-n]");
    if (h && t) {
      const n = +t.dataset.n;
      h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
      h.querySelectorAll(".lv-rows [data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
      lift(h.querySelector(".lv-crate"), n);
    }
    // browsed: the hovered thing's cover replaces the front sleeve, and its name the caption
    const b = e.target.closest?.("[data-browse]"), c = e.target.closest?.("[data-browse] [data-c]");
    if (b && c) {
      const r = REG[+c.dataset.c]; if (!r) return;
      const f = b.querySelector(".front i");
      if (f.dataset.c === c.dataset.c) return;
      f.dataset.c = c.dataset.c; f.style.background = r.bg;
      f.animate([{ translate: "0 -30px", opacity: .4 }, { translate: "0 0", opacity: 1 }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
      b.querySelector(".cap").innerHTML = `<div class="u-title">${esc(r.t)}</div><div class="u-sub">${lo(r.s)}</div>`;
      b.querySelectorAll("[data-c].on").forEach(x => x.classList.remove("on")); c.classList.add("on");
    }
  });

  function use(k) { XL3.listen = (V[k] ?? V.crate).view; }
  return { V, use };
})();
