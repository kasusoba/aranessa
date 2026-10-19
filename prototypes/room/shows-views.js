/* shows opened-view explorations. each variant swaps XL3.shows. there's no real shows page yet, so the set comes from the data:
   every night (date, venue, city, the sets in it), each set's setlist (songs, tour, the setlist.fm link), the artist photo, the counts.
   shows-view.html lines them up; index.html?showsview=<key> tries one in the room (add &open=shows to land on it opened). */
const SVIEW = (() => {
  const S = D2.shows, N = SDOOR.nights;
  // dates are stored at utc midnight, read them back in utc
  const fmt = (iso, o) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(new Date(iso)).toLowerCase();
  const dots = iso => fmt(iso, { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".");
  const longd = iso => fmt(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");
  const yr = iso => new Date(iso).getUTCFullYear();
  const city = n => esc(n.city.toLowerCase());
  const photo = s => cov({ img: s.img }, s.artist);
  // setlist.fm lists a festival day's sets in order, the last one is the headliner; skip acts with no photo
  const headliner = n => [...n.acts].reverse().find(s => s.img) ?? n.acts[n.acts.length - 1];
  const names = n => n.acts.map(s => esc(s.artist)).join(" / ");
  const r = (seed, k = 1) => ((hash(seed) % 7) - 3) * k;
  const many = n => n.acts.length > 1 ? `${n.acts.length} sets, one day` : `${n.acts[0].songs.length} songs`;
  const hue = n => hash(n.venue + n.date) % 360;   // the same hue the door gives the night's band

  // the future, faked: more() pads SDOOR.nights (the same array the door's rail reads) with older sample nights, each one real
  // set re-dated, and can add one big sample festival day. every sample says "sample" in its venue
  const REAL = N.slice();
  function more(count = REAL.length, fest = false) {
    N.length = 0; N.push(...REAL);
    const oldest = new Date(REAL[REAL.length - 1].date);
    for (let i = 0; N.length < count; i++) {
      const s = S[i % S.length], d = new Date(oldest); d.setUTCDate(d.getUTCDate() - 47 * (i + 1));
      const iso = d.toISOString(), venue = `sample ${["hall", "arena", "club", "park"][i % 4]}`;
      N.push({ date: iso, venue, city: s.city, acts: [{ ...s, id: s.id + "s" + i, date: iso, venue }] });
    }
    if (fest) {
      const iso = "2026-03-14T00:00:00.000Z", venue = "sample fest grounds";
      N.splice(1, 0, { date: iso, venue, city: "Jakarta", acts: [...S, ...S.slice(0, 3)].slice(0, 10).map((s, i) => ({ ...s, id: s.id + "f" + i, date: iso, venue, tour: "" })) });
    }
  }

  const head = () => {
    const sets = N.flatMap(n => n.acts), songs = sets.reduce((t, s) => t + s.songs.length, 0), cities = [...new Set(N.map(n => n.city.toLowerCase()))];
    return `<div class="shv-head"><div class="u-label">${glyph("shows")} i was there · last ${ago(N[0].date)}</div>
    <div class="u-title">${N.length} nights</div><div class="u-sub">${sets.length} sets · ${songs} songs · ${cities.join(", ")} · since ${yr(N[N.length - 1].date)}</div></div>`;
  };

  // the door's rail of bands (mixed kinds), without the door's caption and its hover-resets-on-leave
  // (cap keeps the door's caption, the picked night's acts / date / city under the rail)
  const rail = (o = {}) => { const h = SDOOR.hang("mix").replace(" sd-tune", ""); return o.cap ? h : h.replace(/<div class="cap sw">[\s\S]*$/, "</div>"); };
  // one band off the rail, lying flat: the same ribbon turned on its side, kept still
  const tpl = document.createElement("template");
  const lay = (i, cls = "") => {
    tpl.innerHTML = rail();
    const b = tpl.content.querySelector(`.hb[data-n="${i}"]`);
    b.classList.remove("on"); b.removeAttribute("data-n");
    return `<div class="sd-hang shv-lay${cls ? " " + cls : ""}" data-still style="--t:${-90 + r(N[i].date, .6)}deg">${b.outerHTML}</div>`;
  };

  // a stage setlist taped down, with a small print of the artist pinned in the corner
  const sheet = s => `<div class="shv-sheet u-lit" style="--r:${r(s.id, .5)}deg"><span class="tp"></span><span class="tp b"></span>
    ${s.img ? `<i class="ph" style="background:${photo(s)}"></i>` : ""}
    <div class="hd"><b>${esc(s.artist)}</b><span>${dots(s.date)}</span></div>
    <div class="vn">${esc(s.venue)}${s.tour ? ` · ${esc(s.tour)}` : ""}</div>
    ${s.songs.length ? `<ol>${s.songs.map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : `<p class="none">no setlist yet</p>`}
    <a class="sf" ${ext(s.url)}>${s.songs.length} songs · setlist.fm ↗</a></div>`;
  const nightHead = n => `<div class="nh"><b>${longd(n.date)}</b><span>${esc(n.venue)} · ${city(n)} · ${many(n)} · ${ago(n.date)}</span></div>`;
  // o.fan stacks a festival day's setlists in one overlapping hand instead of a row (hover one to bring it to the front)
  const night = (n, i, o = {}) => `<div class="shv-night${o.on ? " on" : ""}"${o.n ? ` data-n="${i}"` : ""}>${o.lay ? lay(i, o.lay) : ""}${o.head === false ? "" : nightHead(n)}
    <div class="sheets${o.fan ? " fan" : ""}">${n.acts.map((s, j) => o.fan ? sheet(s).replace('style="', `style="--i:${j};z-index:${10 - j};`) : sheet(s)).join("")}</div></div>`;
  const sw = (fn, cls = "") => `<div class="sw${cls ? " " + cls : ""}">${N.map((n, i) => `<div class="${i ? "" : "on"}">${fn(n, i)}</div>`).join("")}</div>`;
  // a rail holding only some of the nights (by index), so a long run of nights can be split over several rails
  const railOf = (idx, cls = "") => {
    tpl.innerHTML = rail();
    const hbs = tpl.content.querySelectorAll(".hb");
    return `<div class="hero t sd-full sd-hang hs-mix${cls ? " " + cls : ""}"><span class="rod"></span><div class="rb">${idx.map(i => hbs[i].outerHTML).join("")}</div></div>`;
  };
  const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
  // a night beside the rail: setlists in a row up to three, past that one overlapping hand that squeezes to fit the column
  const nightB = (n, i) => night(n, i, { fan: n.acts.length > 3 }).replace('class="sheets fan"', `class="sheets fan" style="--k:${n.acts.length - 1}"`);
  const bb = (cls, left) => `<div class="v3 shv shv-rail shv-bb ${cls}">${head()}<div class="shv-tune bs">${left}${sw(nightB, "rt")}</div></div>`;

  const R2 = "the rail, big · round 2", R3 = "bigger + beside · room to grow";
  const V = {
    bb: {
      group: R3, name: "bigger + beside", note: "the two picks combined: wristband-scale bands on the left, the picked night's setlists beside them. a night with more than three sets turns into one overlapping hand that squeezes to fit. try the nights toggle to see where the one rail runs out.",
      view: () => bb("shv-b1", rail()),
    },
    bscroll: {
      group: R3, name: "rail scrolls", note: "one rail, as long as it needs: the newest bands in view, older ones off to the right, scroll the rail sideways (a fade and a count say there's more).",
      view: () => bb("shv-bscroll", `<div><div class="rbox">${rail()}</div><p class="more">${N.length} nights · older to the right →</p></div>`),
    },
    byear: {
      group: R3, name: "a rail a year", note: "year chips over the rail; each year hangs on its own rail, the newest year up first. switching years picks that year's latest night.",
      view: () => { const ys = [...new Set(N.map(n => String(yr(n.date))))];
        return bb("shv-byear", `<div>${chips("year", ys.map(y => [y, y]), ys[0])}${ys.map(y => `<div data-pane="year" data-v="${y}"${y === ys[0] ? "" : " hidden"}>${railOf(range(0, N.length).filter(i => String(yr(N[i].date)) === y))}</div>`).join("")}</div>`); },
    },
    bbox: {
      group: R3, name: "rail + the box", note: "only the latest six bands hang; every older night is kept in a box under the rail as a short list with its band's colour. hover a line or a band, either picks the night. the rail never grows.",
      view: () => bb("shv-bbox", `<div>${railOf(range(0, Math.min(6, N.length)))}${N.length > 6 ? `<div class="bx"><div class="u-label">in the box · ${N.length - 6}</div><ul>${N.slice(6).map((n, j) => `<li data-n="${j + 6}"><i style="--h:${hue(n)}"></i><b>${dots(n.date)}</b><span>${names(n)}</span></li>`).join("")}</ul></div>` : ""}</div>`),
    },
    brack: {
      group: R3, name: "the rack", note: "the rail repeats as a rack: six bands to a rail, newest rail on top, as many rails as it takes. the setlists beside stay in view while you scroll down the rack.",
      view: () => bb("shv-brack", `<div>${range(0, Math.ceil(N.length / 6)).map(k => railOf(range(k * 6, Math.min(N.length, k * 6 + 6)))).join("")}</div>`),
    },

    rail: {
      group: R2, name: "the rail, big", note: "the door's rail grown wide, every night's band hanging off it (still swings when you brush it). hover a band to pick that night: its date and venue, then each set's setlist taped below, with the artist print in the corner. sticks after the pointer leaves.",
      view: () => `<div class="v3 shv shv-rail">${head()}<div class="shv-tune">${rail()}${sw(n => night(n))}</div></div>`,
    },
    tug: {
      group: R2, name: "tugged", note: "the same rail, but the picked band hangs lower than the rest, like it got a tug, and the door's caption sits right under it (acts, date, city) so it's clear which band you're on before the setlists start.",
      view: () => `<div class="v3 shv shv-rail shv-tug">${head()}<div class="shv-tune">${rail({ cap: true })}${sw(n => night(n, 0, { head: false }))}</div></div>`,
    },
    big: {
      group: R2, name: "bigger bands", note: "the bands at wristband scale instead of door scale: wider, longer, the print readable from the view. the rail fills the width and the setlists follow below.",
      view: () => `<div class="v3 shv shv-rail shv-big">${head()}<div class="shv-tune">${rail()}${sw(n => night(n))}</div></div>`,
    },
    beside: {
      group: R2, name: "setlists beside", note: "the rail on the left, the picked night's setlists right next to it instead of under it, so picking and reading sit in one screen without scrolling past the rail.",
      view: () => `<div class="v3 shv shv-rail shv-beside">${head()}<div class="shv-tune bs">${rail()}${sw(n => night(n))}</div></div>`,
    },
    sticky: {
      group: R2, name: "rail stays up", note: "the rail shrinks a little and sticks to the top while the setlists scroll under it, so you can pick another night from anywhere on the page.",
      view: () => `<div class="v3 shv shv-rail shv-sticky">${head()}<div class="shv-tune"><div class="st">${rail()}</div>${sw(n => night(n))}</div></div>`,
    },
    fan: {
      group: R2, name: "festival hand", note: "the rail as is, but a festival day's setlists come as one overlapping hand of sheets (hover one to pull it to the front) instead of a row, so a four-set day stays as compact as a one-set night.",
      view: () => `<div class="v3 shv shv-rail shv-fan">${head()}<div class="shv-tune">${rail()}${sw(n => night(n, 0, { fan: true }))}</div></div>`,
    },
    down: {
      group: "the rail · round 1", name: "taken down", note: "the rail sits short at the top; click a band and it comes off (its spot on the rail goes empty) and lies across that night's setlists like it was dropped on them.",
      view: () => `<div class="v3 shv shv-down">${head()}<div class="shv-tune shv-click">${rail()}${sw((n, i) => night(n, i, { lay: "big" }))}</div></div>`,
    },
    side: {
      group: "the rail · round 1", name: "rail at the side", note: "the rail stays put on the left with a short index of nights under it; every night runs down the right with all its setlists. hovering a night lights its band, clicking a band or an index line scrolls to it.",
      view: () => `<div class="v3 shv shv-side">${head()}<div class="shv-tune shv-mark grid"><div class="stick">${rail()}
        <ul class="ix">${N.map((n, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${dots(n.date)}</b><span>${names(n)}</span></li>`).join("")}</ul></div>
        <div>${N.map((n, i) => night(n, i, { n: true, on: !i })).join("")}</div></div></div>`,
    },

    wall: {
      group: "paper", name: "setlist wall", note: "no picking: every night laid out down the page, its band lying across the top and its setlists taped up under it, newest first. everything at once, you just scroll.",
      view: () => `<div class="v3 shv shv-wall">${head()}${N.map((n, i) => night(n, i, { lay: "wide" })).join("")}</div>`,
    },
    book: {
      group: "paper", name: "scrapbook", note: "one page per night, the dates as chips. a page has the headliner's photo stuck on, the band taped across it, a line in the margin, and the setlists written out in columns.",
      view: () => `<div class="v3 shv shv-book">${head()}<div style="margin-top:24px">${chips("night", N.map((n, i) => [String(i), dots(n.date)]), "0")}</div>
        ${N.map((n, i) => { const h = headliner(n); return `<div data-pane="night" data-v="${i}"${i ? " hidden" : ""}><div class="pg u-paper u-lit">
          <div class="l"><div class="pr" style="--r:${r(h.id, .8)}deg"><i style="background:${photo(h)}"></i><span class="tp"></span></div>${lay(i, "tape")}
            <p class="mg">${city(n)}, ${n.acts.length > 1 ? `${n.acts.length} acts in one day` : `${n.acts[0].songs.length} songs`}</p></div>
          <div class="rt"><small>${longd(n.date)} · ${esc(n.venue)}</small>${n.acts.map(s => `<div class="act"><b>${esc(s.artist)}</b><span>${s.tour ? esc(s.tour) + " · " : ""}${s.songs.length} songs · <a ${ext(s.url)}>setlist.fm ↗</a></span>
            ${s.songs.length ? `<ol>${s.songs.map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : `<p class="none">no setlist yet</p>`}</div>`).join("")}</div></div></div>`; }).join("")}</div>`,
    },

    r6: {
      group: "now", name: "round 6", note: "baseline: what the opened shows box does today. four bands and the counts beside a list of every set; each line opens to its setlist.",
      view: () => XL2.shows(),
    },
  };

  // picking: hovering anything with a data-n inside a .shv-tune switches its .sw and marks the matching bands and lines. it sticks
  // after the pointer leaves. .shv-click picks on click instead, and .shv-mark (rail at the side) scrolls to the night on click
  const pick = (h, n) => {
    h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
    h.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
  };
  document.addEventListener("pointerover", e => {
    const h = e.target.closest?.(".shv-tune:not(.shv-click)"), t = e.target.closest?.(".shv-tune [data-n]");
    if (h && t && h.contains(t)) pick(h, +t.dataset.n);
  });
  document.addEventListener("click", e => {
    const h = e.target.closest(".shv-tune"), t = e.target.closest(".shv-tune [data-n]");
    // a rail a year: a year chip picks that year's newest night (its rail is already shown by xl3's chip handler)
    const yc = e.target.closest(".shv-byear .chips3 button");
    if (yc) { const v = yc.closest(".v3"), b = v.querySelector(`[data-pane="year"][data-v="${yc.dataset.v}"] [data-n]`); if (b) pick(v.querySelector(".shv-tune"), +b.dataset.n); return; }
    if (!h || !t || e.target.closest("a")) return;
    if (h.matches(".shv-click")) pick(h, +t.dataset.n);
    if (h.matches(".shv-mark") && t.closest(".stick")) h.querySelector(`.shv-night[data-n="${t.dataset.n}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  // a band lying flat doesn't swing: keep the door's pointer push away from it
  document.addEventListener("pointermove", e => { if (e.target.closest?.("[data-still]")) e.stopImmediatePropagation(); }, true);

  function use(k) { XL3.shows = (V[k] ?? V.rail).view; }
  return { V, use, more };
})();
