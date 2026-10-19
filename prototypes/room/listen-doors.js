/* listen door explorations. each variant swaps the listen door's hero, and "full" ones drop the recent stack so the object is the whole door.
   listen-door.html lines them all up; index.html?listen=<key> tries one in the room. */
const LDOOR = (() => {
  const L = D2.listen, BASE = TOUCH.listen, BASE_S = A.listen.s;
  const hm = iso => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso));
  const day = iso => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso)).replaceAll("/", ".");
  const plays = () => [L.now, ...L.recent];
  const live = () => L.now.live ? " live" : "";
  const loved = new Set(L.loved.map(t => (t.artist + "|" + t.name).toLowerCase()));
  // the albums behind the recent plays, newest first, topped up with the top albums of the longer periods
  const albums = n => {
    const seen = new Set(), out = [];
    const add = a => { if (a.name && !seen.has(a.name)) { seen.add(a.name); out.push(a); } };
    plays().forEach(t => add({ name: t.album, artist: t.artist, img: t.img }));
    ["7day", "1month", "3month", "overall"].forEach(p => L.periods[p]?.albums.forEach(add));
    return out.slice(0, n);
  };
  const rec = (cls = "rec") => `<div class="${cls}"><i style="background:${cov(L.now)}"></i></div>`;
  const nowTag = () => `<span class="tag u-paper">${L.now.live ? "now" : ago(L.now.date)}</span>`;
  // crate: sleeves back to front; each one but the front sits in a slot flexbox sizes (listen-doors.css)
  const crate = (cls, slots, after = "") => `<div class="hero t ld-full ld-crate ${cls}"><div class="stk">${slots.join("")}</div>${after}</div>`;
  const sleeve = (x, d, inner = "") => `<div class="sv"><i style="background:${cov(x)};--d:${d}">${inner}</i></div>`;
  // a jewel case seen from its spine; i = 0 is the top of the pile
  const cd = (a, i, extra = "", style = "") => `<div class="cd${i ? "" : " top"}" style="background:${cov(a)};--x:${hash(a.name) % 9 - 4}px;--r:${(hash(a.name + "r") % 5 - 2) * .35}deg;${style}">
    <span>${esc(a.name)}</span>${!i && L.now.live ? `<small class="nw">now</small>` : `<small>${extra || esc(a.artist)}</small>`}</div>`;
  // albums by when they were played: the latest session, then the rest of the week, then the month
  const sections = () => {
    const seen = new Set(), pick = list => list.filter(a => a.name && !seen.has(a.name) && seen.add(a.name));
    const d0 = day(L.now.date);
    return [
      ["latest", pick(plays().filter(t => day(t.date) === d0).map(t => ({ name: t.album, artist: t.artist, img: t.img })))],
      ["7d", pick(L.periods["7day"]?.albums ?? []).slice(0, 5)],
      ["30d", pick(L.periods["1month"]?.albums ?? []).slice(0, 5)],
    ].filter(([, l]) => l.length);
  };

  const V = {
    touch: {
      group: "hero + recent", name: "touch", note: "baseline. the sleeve at its real shape, the disc peeking over the top.",
      hero: BASE,
    },
    ambient: {
      group: "hero + recent", name: "touch, lit", note: "baseline, but the cover bleeds a soft glow into the door. cover art stays the only free color.",
      hero: () => `<div class="hero t t-listen ld-amb"><i class="glow" style="background:${cov(L.now)}"></i><div class="disc"></div><div class="sl" style="background:${cov(L.now)}"></div></div>`,
    },
    record: {
      group: "hero + recent", name: "the record", note: "no sleeve, just the disc with the cover as its label. spins while live, or on hover.",
      hero: () => `<div class="hero t ld-rec${live()}">${rec()}<span class="hole"></span></div>`,
    },
    deck: {
      group: "hero + recent", name: "deck", note: "a turntable from above. the arm sits on the record while live, parked otherwise; hover drops it.",
      hero: () => `<div class="hero t ld-tt${live()}"><div class="plat">${rec()}</div><div class="arm"><b></b></div><span class="rpm">33</span></div>`,
    },
    single: {
      group: "hero + recent", name: "die-cut single", note: "a paper 45 sleeve; the label shows through the hole. hover slides the record out the top.",
      hero: () => `<div class="hero t ld-45${live()}">${rec()}<div class="slv u-paper u-lit"><span>${L.now.live ? "now playing" : "last played"}</span><b>${esc(L.now.name)}</b></div></div>`,
    },

    tape: {
      group: "other objects", name: "mixtape", full: true, note: "a cassette labelled by hand, and its j-card is the tracklist of recent plays.",
      hero: () => `<div class="hero t ld-full ld-tape${live()}">
        <div class="shell"><div class="lab u-paper"><span class="hd">${esc(L.now.album || L.now.name)}</span><div class="win"><i class="reel"></i><i class="reel"></i></div><small>A</small></div></div>
        <div class="jcard u-paper u-lit"><div class="sp" style="background:${cov(L.now)}"></div><div class="tl"><div class="hh">side a · ${day(L.now.date)}</div>
          <ol>${plays().map((t, i) => `<li><b>${esc(t.name.toLowerCase())}</b><span>${i === 0 && L.now.live ? "now" : hm(t.date)}</span></li>`).join("")}</ol></div></div>
      </div>`,
    },
    receipt: {
      group: "other objects", name: "receipt", full: true, note: "the scrobble log printed out, grouped by artist. loved tracks get a stamp-red heart.",
      hero: () => {
        let last = "";
        const rows = plays().map((t, i) => {
          const g = t.artist !== last ? `<div class="grp">${esc(t.artist)}</div>` : ""; last = t.artist;
          const h = loved.has((t.artist + "|" + t.name).toLowerCase()) ? `<s>♥</s>` : "";
          return `${g}<div class="r"><em>${i === 0 && L.now.live ? "now" : hm(t.date)}</em><b>${esc(t.name.toLowerCase())}</b>${h}</div>`;
        }).join("");
        return `<div class="hero t ld-full ld-rcpt"><div class="pp u-paper u-lit">
          <div class="c">the room · listen</div><div class="c">${day(L.now.date)}</div><hr>
          <div class="rows">${rows}</div>
          <hr><div class="r tot"><b>plays</b><em>${plays().length}</em></div><div class="bc"></div></div></div>`;
      },
    },
    crate: {
      group: "crate", name: "crate", full: true, note: "albums filed front to back, newest in front. tall doors show more edges. hover tips the front one.",
      hero: () => { const a = albums(14).reverse(); return crate("", a.map((x, i) => sleeve(x, a.length - 1 - i)), nowTag()); },
    },
    bin: {
      group: "crate", name: "bin", full: true, note: "the crate gets its front panel, stamped. only the top halves rise above it; hover lifts the front sleeve out.",
      hero: () => { const a = albums(14).reverse(); return crate("ld-bin", a.map((x, i) => sleeve(x, a.length - 1 - i)), `<div class="bin u-paper u-lit"><span class="stp">listen</span><small>${a.length} in the crate</small></div>`); },
    },
    dividers: {
      group: "crate", name: "dividers", full: true, note: "paper dividers split the crate by when: latest session, the week, the month. their tabs stick up above the sleeves.",
      hero: () => {
        const slots = [];
        sections().reverse().forEach(([label, list], gi) => {
          slots.push({ div: label, gi });
          list.slice().reverse().forEach(x => slots.push(x));
        });
        return crate("ld-div", slots.map((x, i) => x.div ? `<div class="sv dv"><i class="u-paper" style="--d:${slots.length - 1 - i}"><b style="left:${[58, 30, 4][x.gi]}%">${x.div}</b></i></div>` : sleeve(x, slots.length - 1 - i)), nowTag());
      },
    },
    labels: {
      group: "crate", name: "labelled edges", full: true, note: "every edge carries a little paper label with the album name, so the peeking stack can be read.",
      hero: () => { const a = albums(14).reverse(); return crate("ld-lab", a.map((x, i) => sleeve(x, a.length - 1 - i, `<b class="u-paper">${esc(x.name.toLowerCase())}</b>`)), nowTag()); },
    },
    peek: {
      group: "crate", name: "peek", full: true, note: "labelled edges, but only the front album and the one peeking carry a label. hover an edge and that album peeks out; the front one is always showing, so it stays put.",
      hero: () => { const a = albums(14).reverse(); return crate("ld-peek", a.map((x, i) => `<div class="sv" title="${esc(x.name)}, ${esc(x.artist)}"><i style="background:${cov(x)};--d:${a.length - 1 - i}"><b class="u-paper">${esc(x.name.toLowerCase())}</b></i></div>`)); },
    },

    stack: {
      group: "cd stack", name: "cd stack", full: true, note: "jewel cases piled on the floor of the door, last played on top. more history, taller pile.",
      hero: () => `<div class="hero t ld-full ld-cds">${albums(20).map((a, i) => cd(a, i)).join("")}</div>`,
    },
    tower: {
      group: "cd stack", name: "rack", full: true, note: "a cd tower: cases slotted between two rails from the top down, the last played one pulled out.",
      hero: () => `<div class="hero t ld-full ld-cds ld-tower"><div class="rails"></div>${albums(24).map((a, i) => cd(a, i)).join("")}</div>`,
    },
    weighed: {
      group: "cd stack", name: "weighed", full: true, note: "thickness is plays over 90 days, so the heavy rotation sinks to the bottom and one-offs sit on top.",
      hero: () => {
        const p = [...(L.periods["3month"]?.albums ?? [])].sort((x, y) => y.plays - x.plays).slice(0, 16);
        return `<div class="hero t ld-full ld-cds ld-heavy">${p.map(a => cd(a, 1, `${a.plays}`, `height:${Math.round(16 + 7 * Math.log2(a.plays))}px`)).join("")}</div>`;
      },
    },
    ontop: {
      group: "cd stack", name: "disc on top", full: true, note: "the disc that's playing lies on top of the pile, out of its case. it spins while live, or on hover.",
      hero: () => `<div class="hero t ld-full ld-cds ld-ontop${live()}"><div class="cdisc"><div class="d"><div class="s"><i style="background:${cov(L.now)}"></i></div></div></div>${albums(20).map((a, i) => cd(a, i + 1)).join("")}</div>`,
    },
    faceup: {
      group: "cd stack", name: "face up", full: true, note: "the top case lies face up, so the cover shows in perspective; everything under it is spines.",
      hero: () => `<div class="hero t ld-full ld-cds ld-face"><div class="fu"><i style="background:${cov(L.now)}"></i></div>${albums(20).map((a, i) => cd(a, i)).join("")}</div>`,
    },
    messy: {
      group: "cd stack", name: "messy pile", full: true, note: "singles, albums and box sets of different sizes, stacked carelessly. same data, more of a person.",
      hero: () => `<div class="hero t ld-full ld-cds ld-messy">${albums(20).map((a, i) => { const h = hash(a.name + "m");
        return cd(a, i, "", `--x:${h % 17 - 8}px;--r:${(h % 7 - 3) * .7}deg;width:${82 + h % 19}%;height:${20 + h % 3 * 5}px;align-self:${["flex-start", "center", "flex-end"][h % 3]}`); }).join("")}</div>`,
    },
    shelf: {
      group: "other objects", name: "shelf, face-out", full: true, note: "spines on the shelf, and what's playing leans face-out in front, like a record store.",
      hero: () => {
        const [now, ...rest] = albums(9);
        return `<div class="hero t ld-full ld-shelf"><div class="row">${rest.map(a => `<div class="sp" style="background:${cov(a)}"><span>${esc(a.name)}</span></div>`).join("")}</div>
          <div class="face${live()}"><div class="disc"></div><i style="background:${cov(now)}"></i></div></div>`;
      },
    },

    week: {
      group: "data first", name: "this week's crate", full: true, note: "a small copy of the opened view: top albums for 7 days, play counts as stickers.",
      hero: () => `<div class="hero t ld-full ld-grid"><div class="u-label">top · 7d</div><div class="g">${L.periods["7day"].albums.map(a => `<i style="background:${cov(a)}"><b>${a.plays}</b></i>`).join("")}</div></div>`,
    },
    chart: {
      group: "data first", name: "chart", full: true, note: "a number and the artists behind it. no object at all, for comparison.",
      hero: () => {
        const p = L.periods["1month"], max = Math.max(...p.artists.map(a => a.plays));
        const total = p.albums.reduce((s, a) => s + a.plays, 0);
        return `<div class="hero t ld-full ld-chart"><div class="sum"><b>${total}</b><span>plays · 30d</span></div>
          ${p.artists.map(a => `<div class="ar"><i style="background:${cov(a)}"></i><div><b>${esc(a.name.toLowerCase())}</b><span class="bar"><s style="width:${a.plays / max * 100}%"></s></span></div><em>${a.plays}</em></div>`).join("")}</div>`;
      },
    },
  };

  // peek: the hovered sleeve rises out of the crate. near the back there's no room above it, so the sleeves in front drop
  // instead, by whatever the rise couldn't cover. the slots never move, only the sleeves inside them.
  const RISE = 64;
  const settle = stk => stk.querySelectorAll("i").forEach(i => { i.style.translate = ""; i.classList.remove("up"); });
  document.addEventListener("pointerover", e => {
    const stk = e.target.closest?.(".ld-peek .stk"), sv = e.target.closest?.(".ld-peek .sv:not(:last-child)");
    document.querySelectorAll(".ld-peek .stk").forEach(settle);
    if (!stk || !sv) return;
    const up = Math.min(RISE, sv.offsetTop), down = RISE - up, i = sv.querySelector("i");
    i.style.translate = `0 ${-up}px`; i.classList.add("up");
    for (let n = sv.nextElementSibling; n; n = n.nextElementSibling) n.querySelector("i").style.translate = `0 ${down}px`;
  });

  function use(k) {
    const v = V[k] ?? V.touch;
    TOUCH.listen = v.hero;
    A.listen.s = v.full ? () => ({ items: [] }) : BASE_S;
  }
  return { V, use };
})();
