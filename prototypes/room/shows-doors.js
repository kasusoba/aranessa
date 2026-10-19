/* shows door explorations. each variant swaps the shows door's hero; "full" ones drop the thumbnail list so the object is the whole door.
   shows-door.html lines them all up; index.html?shows=<key> tries one in the room. */
const SDOOR = (() => {
  const S = D2.shows;
  // one night = one venue on one date (a festival day holds several sets), newest first like the sets
  const nights = [];
  for (const s of S) {
    const n = nights.find(x => x.date === s.date && x.venue === s.venue);
    n ? n.acts.push(s) : nights.push({ date: s.date, venue: s.venue, city: s.city, acts: [s] });
  }
  const N = nights[0], top = N.acts[0];
  const city = s => s.city.toLowerCase();
  // dates are stored at utc midnight, read them back in utc
  const fmt = (iso, o) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...o }).format(new Date(iso)).toLowerCase();
  const dots = iso => fmt(iso, { day: "2-digit", month: "2-digit", year: "2-digit" }).replace(/\//g, ".");
  const longd = iso => fmt(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "");
  const dd = iso => fmt(iso, { day: "2-digit" }), mmyy = iso => fmt(iso, { month: "short", year: "2-digit" }).replace(" ", " '");
  const yr = iso => new Date(iso).getUTCFullYear();
  const photo = s => cov({ img: s.img }, s.artist);
  const names = n => n.acts.map(s => esc(s.artist)).join(" / ");
  // setlist.fm lists a festival day's sets in order, the last one is the headliner; skip acts with no photo
  const head = n => [...n.acts].reverse().find(s => s.img) ?? n.acts[n.acts.length - 1];
  // a torn right edge, jittered per ticket so no two tear the same
  const tear = seed => {
    const pts = Array.from({ length: 9 }, (_, i) => `${hash(seed + i) % 4}% ${100 - (i + .5) / 9 * 100}%`);
    return `polygon(3% 0, 100% 0, 100% 100%, 3% 100%, ${pts.join(", ")})`;
  };
  const bars = seed => `background-position:${hash(seed) % 40}px 0`;
  const r = (seed, k = 1) => ((hash(seed) % 7) - 3) * k;

  // a ticket stub: name big, where and when small, a perforated end with the day on it
  const stub = (s, i, o = {}) => `<div class="sd-stub u-paper u-lit" style="--r:${r(s.id, .9)}deg;--x:${r(s.id + "x", 2)}px;z-index:${30 - i};clip-path:${tear(s.id)}${o.style ?? ""}">
    <div class="m"><small>admit one · ga</small><b>${esc(s.artist)}</b><span>${esc(s.venue)}</span></div>
    <div class="st"><em>${dd(s.date)}</em><span>${mmyy(s.date)}</span></div></div>`;
  // the stage setlist: printed big and taped down
  const sheet = (s, o = {}) => `<div class="sd-sheet${o.cls ? " " + o.cls : ""}"><div class="tp"></div><div class="tp b"></div>
    <div class="hd"><span>${esc(s.artist)}</span><span>${dots(s.date)}</span></div><div class="vn">${esc(s.venue)} · ${esc(city(s))}</div>
    <ol>${s.songs.map(t => `<li>${esc(t)}</li>`).join("")}</ol></div>`;

  /* ---- round 2 pieces ---- */
  const oldest = nights[nights.length - 1];
  const poster = (n, o = {}) => `<div class="po u-paper u-lit${o.cls ? " " + o.cls : ""}"${o.attr ?? ""}><i style="background:${photo(head(n))}"></i>
    <em>live</em><b>${names(n)}</b><span>${longd(n.date)}</span><span>${esc(n.venue)} · ${esc(n.city.toLowerCase())}</span></div>`;
  const strap = (txt = "i was there · ") => `<div class="strap"><span>${txt.repeat(4)}</span><span>${txt.repeat(4)}</span></div><div class="sd-clip"></div>`;
  // the inside of a pass: photo, ga, name, date, venue, barcode
  const passIn = (n, cls = "") => { const s = head(n); return `<div class="in u-paper${cls ? " " + cls : ""}"><i style="background:${photo(s)}"></i>
    <em>ga</em><b>${esc(s.artist)}</b><span>${dots(n.date)}</span><span>${esc(n.venue)}</span><i class="bc" style="${bars(s.id)}"></i></div>`; };
  // a woven band's look, shared by every band take
  const hue = n => hash(n.venue + n.date) % 360;
  const woven = n => `${n.acts.map(s => s.artist).join(" ✦ ")} ✦ ${n.city} ${yr(n.date)} ✦ `;
  const band = (n, i, o = {}) => `<div class="wv${o.cls ? " " + o.cls : ""}"${o.n != null ? ` data-n="${o.n}"` : ""} style="--h:${hue(n)};--r:${[-3, 2, -1, 3, -2][i % 5]}deg;z-index:${20 - i};${o.style ?? ""}">
    <span class="fr"></span><span class="tx">${esc(woven(n).repeat(3))}</span><span class="lk"><i></i></span><span class="tl"></span>${o.tag ?? ""}</div>`;
  const bandsCap = () => `<div class="cap"><b>${nights.length} nights</b><span>${S.length} sets · since ${yr(oldest.date)}</span></div>`;

  // the hanging door, with one kind of band (or "mix": each night gets the band it would really have come with)
  const MIX = ["tyv", "sat", "woven"];
  const hangHero = style => {
    let solo = 0;
    const kind = n => style !== "mix" ? style : n.acts.length > 1 ? "rfid" : MIX[solo++ % MIX.length];
    const end = (k, n) => k === "tyv" ? `<span class="ad"><i></i><i></i><i></i></span>`
      : k === "rfid" ? `<span class="rf"><b>${dots(n.date)}</b><i class="bc" style="${bars(n.date)}"></i></span>`
      : k === "sil" ? "" : `<span class="lk"><i></i>${k === "jac" ? `<b>${String(yr(n.date)).slice(2)}</b>` : ""}</span>`;
    const text = (k, n, rep) => k === "tyv" ? `admit one ✦ ${dots(n.date)} ✦ no. ${String(hash(n.venue + n.date) % 100000).padStart(5, "0")} ✦ `.repeat(rep)
      : k === "sat" || k === "sil" ? `${n.acts.map(s => s.artist).join(" · ")} · ${yr(n.date)} · `.repeat(rep)
      : woven(n).repeat(rep);
    return `<div class="hero t sd-full sd-hang sd-tune hs-${style}"><span class="rod"></span><div class="rb">${nights.map((n, i) => { const k = kind(n);
      return `<div class="hb k-${k}${i ? "" : " on"}" data-n="${i}" style="--h:${hue(n)};--l:${[100, 86, 76, 66, 58][i % 5]}%;${k === "pho" ? `--ph:${photo(head(n))};` : ""}">
        ${k === "sat" ? `<span class="db">${dots(n.date)}</span>` : ""}<span class="tx">${esc(text(k, n, 3))}</span>
        <div class="lo"><span class="tx">${esc(text(k, n, 2))}</span>${end(k, n)}<span class="fr"></span></div></div>`; }).join("")}</div>
      <div class="cap sw">${nights.map((n, i) => `<div class="${i ? "" : "on"}"><b>${names(n)}</b><span>${dots(n.date)} · ${esc(n.city.toLowerCase())} · ${n.acts.length > 1 ? `${n.acts.length} sets` : `${n.acts[0].songs.length} songs`}</span></div>`).join("")}</div></div>`;
  };

  const V0 = {
    touch: {
      group: "now", name: "list", note: "baseline: what the door does today, no object, just every set as a line with a generated colour.",
      hero: () => "",
    },

    stubs: {
      group: "ticket stubs", name: "stubs", full: true, note: "every set as a torn stub in a loose pile, the newest on top. hover one to slide it out of the pile.",
      hero: () => `<div class="hero t sd-full sd-stubs"><div class="pile">${S.map((s, i) => stub(s, i)).join("")}</div></div>`,
    },
    ticket: {
      group: "ticket stubs", name: "the ticket", full: true, note: "the latest ticket, whole and tall with the artist photo, its stub torn off and lying a little apart. hover puts the stub back.",
      hero: () => `<div class="hero t sd-full sd-ticket"><div class="tk u-paper u-lit"><i style="background:${photo(top)}"></i>
        <small>admit one</small><b>${esc(top.artist)}</b><span>${longd(top.date)}</span><span>${esc(top.venue)}</span></div>
        <div class="sb u-paper u-lit"><span>ga · no. ${String(S.length).padStart(4, "0")}</span><i class="bc" style="${bars(top.id)}"></i></div>
        <div class="cap">+ ${nights.length - 1} more nights since ${yr(nights[nights.length - 1].date)}</div></div>`,
    },
    stubset: {
      group: "ticket stubs", name: "stub on the setlist", full: true, note: "the setlist from the latest show taped down, its ticket stub dropped across it. hover lifts the stub off.",
      hero: () => `<div class="hero t sd-full sd-stubset">${sheet(top)}${stub(top, 0)}</div>`,
    },

    setlist: {
      group: "paper", name: "setlist", full: true, note: "the stage setlist of the latest show, printed big and gaffer taped to the door like it was to the floor. hover straightens it.",
      hero: () => `<div class="hero t sd-full sd-setlist">${sheet(top)}</div>`,
    },
    poster: {
      group: "paper", name: "gig poster", full: true, note: "the latest night as a gig poster: the photo printed in ink, the name big, the date and venue along the bottom. hover brings the photo's colour back.",
      hero: () => `<div class="hero t sd-full sd-poster"><div class="po u-paper u-lit"><i style="background:${photo(head(N))}"></i>
        <em>live</em><b>${names(N)}</b><span>${longd(N.date)}</span><span>${esc(N.venue)} · ${esc(N.city.toLowerCase())}</span></div></div>`,
    },
    flyers: {
      group: "paper", name: "flyer wall", full: true, note: "a flyer for every night pasted down the door, overlapping, the newest on top; a festival day lists its whole lineup. hover one to bring it up.",
      hero: () => `<div class="hero t sd-full sd-flyers">${nights.map((n, i) => `<div class="fl u-paper u-lit" style="--r:${[-4, 3, -2, 5, -3][i % 5]}deg;--x:${i % 2 ? 22 : 0}%;z-index:${20 - i}">
        <i style="background:${photo(head(n))}"></i><b>${names(n)}</b><span>${dots(n.date)} · ${esc(n.city.toLowerCase())}</span></div>`).join("")}</div>`,
    },

    bands: {
      group: "worn", name: "woven bands", full: true, note: "the wristband done properly: a woven fabric band per night, the name woven in along it, a ridged plastic lock and a frayed cut end. hover tugs one out.",
      hero: () => `<div class="hero t sd-full sd-bands">${nights.map((n, i) => { const h = hash(n.venue + n.date) % 360;
        const txt = `${n.acts.map(s => s.artist).join(" ✦ ")} ✦ ${n.city} ${yr(n.date)} ✦ `;
        return `<div class="wv" style="--h:${h};--r:${[-3, 2, -1, 3, -2][i % 5]}deg;z-index:${20 - i}"><span class="fr"></span><span class="tx">${esc(txt.repeat(3))}</span><span class="lk"><i></i></span><span class="tl"></span></div>`; }).join("")}
        <div class="cap"><b>${nights.length} nights</b><span>${S.length} sets · since ${yr(nights[nights.length - 1].date)}</span></div></div>`,
    },
    pass: {
      group: "worn", name: "lanyard", full: true, note: "laminated passes on one lanyard, the latest in front and the older ones fanned behind it on the same clip. hover swings it.",
      hero: () => `<div class="hero t sd-full sd-pass"><div class="strap"><span>i was there · i was there · i was there · </span><span>i was there · i was there · i was there · </span></div><div class="sd-clip"></div>
        <div class="cards">${nights.slice(0, 3).reverse().map((n, j, a) => { const s = head(n), front = j === a.length - 1;
          return `<div class="lam${front ? " front" : ""}" style="--r:${front ? 0 : (j ? 7 : -8)}deg"><div class="in u-paper"><i style="background:${photo(s)}"></i>
            <em>ga</em><b>${esc(s.artist)}</b><span>${dots(n.date)}</span><span>${esc(n.venue)}</span><i class="bc" style="${bars(s.id)}"></i></div></div>`; }).join("")}</div>
        <div class="cap">+ ${nights.length - 1} older nights</div></div>`,
    },

    /* ---------- gig poster · round 2 ---------- */
    bill: {
      group: "gig poster · round 2", name: "the bill", full: true, note: "one festival-style poster for everything: every act you've seen as the bill, the latest night biggest, smaller the further back, a strip of photos on top.",
      hero: () => `<div class="hero t sd-full sd-bill"><div class="bl u-paper u-lit"><div class="ps">${nights.slice(0, 4).map(n => `<i style="background:${photo(head(n))}"></i>`).join("")}</div>
        <em>i was there</em>${nights.map((n, i) => `<div class="ln" style="--fs:${[30, 23, 19, 15.5, 13.5][i] ?? 12}px"><b>${names(n)}</b><span>${dots(n.date)} · ${esc(n.city.toLowerCase())}</span></div>`).join("")}
        <small>${[...new Set(nights.map(n => n.city.toLowerCase()))].join(" · ")} · ${yr(oldest.date)} to ${yr(N.date)}</small></div></div>`,
    },
    pasted: {
      group: "gig poster · round 2", name: "pasted over", full: true, note: "the latest poster pasted over the older ones, their edges showing around it. the bottom corner has started to peel; hover peels it further to show the poster underneath.",
      hero: () => `<div class="hero t sd-full sd-poster sd-pasted"><div class="stk">${nights.slice(0, 3).reverse().map((n, j, a) => poster(n, { cls: j === a.length - 1 ? "lead" : `under u${a.length - 1 - j}` })).join("")}<span class="fold"></span></div></div>`,
    },
    tabs: {
      group: "gig poster · round 2", name: "tear-off tabs", full: true, note: "a poster with a row of tear-off tabs along the bottom, one per night. hover a tab and the poster becomes that night; one tab is already torn off.",
      hero: () => `<div class="hero t sd-full sd-poster sd-tabs sd-tune"><div class="pw sw">${nights.map((n, i) => poster(n, { cls: i ? "" : "on" })).join("")}</div>
        <div class="tb u-paper">${nights.map((n, i) => `<span data-n="${i}" class="${i ? "" : "on"}">${dots(n.date)} ${esc(head(n).artist)}</span>`).join("")}<span class="gone"></span></div></div>`,
    },
    riso: {
      group: "gig poster · round 2", name: "riso print", full: true, note: "printed in two inks: the photo as a red duotone with a halftone screen, the name in red with the blue ink a little off register.",
      hero: () => `<div class="hero t sd-full sd-poster sd-riso"><div class="po u-paper u-lit"><div class="rs"><i style="background:${photo(head(N))}"></i></div>
        <em>live</em><b>${names(N)}</b><span>${longd(N.date)}</span><span>${esc(N.venue)} · ${esc(N.city.toLowerCase())}</span></div></div>`,
    },

    /* ---------- lanyard · round 2 ---------- */
    flip: {
      group: "lanyard · round 2", name: "flip", full: true, note: "one pass on the lanyard. hover flips it over: the back is printed with every night, like the schedule on the back of a real pass.",
      hero: () => `<div class="hero t sd-full sd-pass sd-flip">${strap()}<div class="cards"><div class="flp"><div class="lam front fr">${passIn(N)}</div>
        <div class="lam bk"><div class="in u-paper"><em>all nights</em>${nights.map(n => `<div class="rw"><span>${dots(n.date)} · ${esc(n.city.toLowerCase())}</span><b>${names(n)}</b></div>`).join("")}</div></div></div></div>
        <div class="cap">hover to turn it over</div></div>`,
    },
    hook: {
      group: "lanyard · round 2", name: "the hook", full: true, note: "a lanyard for every night hung off one hook, each strap its own colour, the passes overlapping down the door with the latest in front. hover one to bring it forward.",
      hero: () => { const W = 156, hx = W / 2, xs = [78, 48, 108, 52, 104], ys = [250, 178, 114, 58, 12];
        return `<div class="hero t sd-full sd-hook"><span class="hk"></span>${nights.map((n, i) => ({ n, i })).reverse().map(({ n, i }) => {
          const cx = xs[i % 5], top = ys[i % 5] + 30, dx = cx - hx, len = Math.hypot(dx, top), ang = Math.atan2(dx, top) * 180 / Math.PI;
          return `<span class="st" style="left:${hx}px;height:${len}px;rotate:${-ang}deg;--h:${hue(n)};z-index:${10 - i}"></span>
            <div class="lam" style="left:${cx - 47}px;top:${top}px;z-index:${10 - i};--r:${[0, -4, 5, -3, 4][i % 5]}deg">${passIn(n)}</div>`; }).join("")}</div>`; },
    },
    passtune: {
      group: "lanyard · round 2", name: "pass, tuned", full: true, note: "one pass on the lanyard over a short list of the nights. hover a night and the pass in the holder becomes that night's.",
      hero: () => `<div class="hero t sd-full sd-pass sd-passtune sd-tune">${strap()}<div class="cards"><div class="lam front"><div class="sw">${nights.map((n, i) => passIn(n, i ? "" : "on")).join("")}</div></div></div>
        <ul>${nights.map((n, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${names(n)}</b><span>${dots(n.date)} · ${esc(n.city.toLowerCase())}</span></li>`).join("")}</ul></div>`,
    },
    lanbands: {
      group: "lanyard · round 2", name: "lanyard + bands", full: true, note: "the latest pass on its lanyard, with the woven bands from every night wrapped around the strap above it.",
      hero: () => `<div class="hero t sd-full sd-pass sd-bands sd-lanbands"><div class="lw">${strap()}<div class="wr">${nights.map((n, i) => band(n, i, { style: `top:${14 + i * 24}px;--r:${[-14, 10, -8, 13, -11][i % 5]}deg` })).join("")}</div></div>
        <div class="cards"><div class="lam front">${passIn(N)}</div></div></div>`,
    },

    /* ---------- woven bands · round 2 ---------- */
    hang: {
      group: "woven bands · round 2", name: "hanging", full: true, note: "the bands hung from a rail like ribbons, the name woven down each one, the heavy lock end lagging behind. brush through them and they swing with your hand's speed (longer ones slower); the caption follows the band you're on.",
      hero: () => hangHero("woven"),
    },
    hjac: {
      group: "hanging · the band itself", name: "jacquard", full: true, note: "a festival jacquard: a diamond border knitted down both edges in a lighter thread, the name in bolder knit letters between little stars, the lock stamped with the year.",
      hero: () => hangHero("jac"),
    },
    hsat: {
      group: "hanging · the band itself", name: "satin", full: true, note: "printed satin ribbon: a glossy sheen running down it, crisp white print, the date in a box at the top. heat-sealed cut end instead of a fray.",
      hero: () => hangHero("sat"),
    },
    htyv: {
      group: "hanging · the band itself", name: "tyvek", full: true, note: "the paper kind you get at the door: flat bright colour, black print with a serial number, creased where it was worn, an adhesive tab with its tear slits at the end instead of a lock.",
      hero: () => hangHero("tyv"),
    },
    hsil: {
      group: "hanging · the band itself", name: "silicone", full: true, note: "a rubber merch band stretched long: matte, rounded, the name debossed into it, a soft rounded end. heavier, so it swings a little slower.",
      hero: () => hangHero("sil"),
    },
    hpho: {
      group: "hanging · the band itself", name: "photo print", full: true, note: "sublimated with the artist's photo the whole way down, under the weave, the name printed over it. the cover art is the colour.",
      hero: () => hangHero("pho"),
    },
    hrfid: {
      group: "hanging · the band itself", name: "rfid tag", full: true, note: "a festival band with its rfid tag: a plastic chip tag at the end printed with the night's date and a barcode, instead of the slide lock.",
      hero: () => hangHero("rfid"),
    },
    hmix: {
      group: "hanging · the band itself", name: "mixed", full: true, note: "a real drawer of bands isn't one kind: festival days get the rfid band, single shows get tyvek or satin, so each night hangs as what you'd actually have been given.",
      hero: () => hangHero("mix"),
    },
    tagged: {
      group: "woven bands · round 2", name: "tagged", full: true, note: "each band with a little paper tag tied to its lock, the date and city written on it, so the bands stay readable at a glance.",
      hero: () => `<div class="hero t sd-full sd-bands sd-tagged">${nights.map((n, i) => band(n, i, { tag: `<span class="tg u-paper" style="--tr:${[6, -5, 4, -7, 5][i % 5]}deg"><b>${dots(n.date)}</b>${esc(n.city.toLowerCase())}</span>` })).join("")}</div>`,
    },
    aged: {
      group: "woven bands · round 2", name: "worn in", full: true, note: "the same bands, but they age: the latest crisp and bright, older ones faded, softer and more frayed, the way a band you never cut off goes.",
      hero: () => `<div class="hero t sd-full sd-bands sd-aged">${nights.map((n, i) => { const a = nights.length > 1 ? i / (nights.length - 1) : 0;
        return band(n, i, { style: `--age:${a.toFixed(2)};filter:saturate(${(1 - a * .65).toFixed(2)}) brightness(${(1 - a * .22).toFixed(2)})` }); }).join("")}${bandsCap()}</div>`,
    },
    bandtune: {
      group: "woven bands · round 2", name: "tuned", full: true, note: "the bands stacked up top, a card for one night underneath (photo, acts, date, venue, how many songs). hover a band to switch the card to its night.",
      hero: () => `<div class="hero t sd-full sd-bands sd-bandtune sd-tune">${nights.map((n, i) => band(n, i, { n: i, cls: i ? "" : "on" })).join("")}
        <div class="cd sw">${nights.map((n, i) => `<div class="${i ? "" : "on"}"><i style="background:${photo(head(n))}"></i><b>${names(n)}</b><span>${longd(n.date)}</span><span>${esc(n.venue)}</span><span>${n.acts.reduce((k, s) => k + s.songs.length, 0)} songs</span></div>`).join("")}</div></div>`,
    },
    loops: {
      group: "woven bands · round 2", name: "loops", full: true, note: "the bands as the closed loops they are once worn, piled up like bangles, each lock with a paper tag naming the night. hover one to lift it off the pile.",
      hero: () => `<div class="hero t sd-full sd-loops">${nights.map((n, i) => `<div class="lw" style="--h:${hue(n)};--r:${[-6, 5, -3, 7, -5][i % 5]}deg;--x:${[0, 10, -8, 6, -4][i % 5]}px;z-index:${20 - i}">
        <span class="lp"></span><span class="lk"><i></i></span><span class="tg u-paper"><b>${esc(head(n).artist)}</b>${dots(n.date)}</span></div>`).join("")}${bandsCap()}</div>`,
    },

    tee: {
      group: "keepsake", name: "tour tee", full: true, note: "the back of a tour shirt, but the tour is yours: every night printed as a tour date, the acts under each.",
      hero: () => `<div class="hero t sd-full sd-tee"><div class="sh u-lit"><div class="pr"><b>i was there</b><em>tour</em>
        <ul>${nights.map(n => `<li><span>${dots(n.date)}</span><span>${esc(n.city)}</span><small>${names(n)}</small></li>`).join("")}</ul></div></div>
        <div class="cap"><b>${nights.length} dates</b><span>${S.length} sets · ${yr(nights[nights.length - 1].date)} to ${yr(N.date)}</span></div></div>`,
    },
    roll: {
      group: "keepsake", name: "camera roll", full: true, note: "a phone's camera roll from the nights: one blurry, stage-lit shot per set (the artist photo standing in for yours), grouped under each night.",
      hero: () => `<div class="hero t sd-full sd-roll"><div class="ph"><div class="sc">${nights.map(n => `<div class="dy"><span>${fmt(n.date, { day: "numeric", month: "short", year: "numeric" })}</span><small>${esc(n.city.toLowerCase())}</small></div>
        <div class="gr">${n.acts.map(s => `<i title="${esc(s.artist)}" style="background:${photo(s)};--h:${hash(s.artist) % 360}"></i>`).join("")}</div>`).join("")}</div></div></div>`,
    },

    log: {
      group: "data first", name: "the log", full: true, note: "no object: a count, then every night as a dated line with its city and acts.",
      hero: () => `<div class="hero t sd-full sd-log"><div class="ct"><b>${nights.length}</b><span>shows · ${S.length} sets</span></div>
        ${nights.map(n => `<div class="rw"><em>${dots(n.date)}</em><span>${esc(n.city.toLowerCase())}</span><b>${names(n)}</b></div>`).join("")}</div>`,
    },
  };

  // round 2 groups go first, each led by the round 1 door it grew from
  const FIRST = ["hang", "hjac", "hsat", "htyv", "hsil", "hpho", "hrfid", "hmix", "poster", "bill", "pasted", "tabs", "riso", "pass", "flip", "hook", "passtune", "lanbands", "bands", "tagged", "aged", "bandtune", "loops"];
  const R2 = { poster: "gig poster · round 2", pass: "lanyard · round 2", bands: "woven bands · round 2", hang: "hanging · the band itself" };
  for (const [k, g] of Object.entries(R2)) V0[k].group = g;
  const V = Object.fromEntries([...FIRST, ...Object.keys(V0).filter(k => !FIRST.includes(k))].map(k => [k, V0[k]]));

  // anything with data-n inside a .sd-tune switches every .sw to that index and marks the matching data-n's; leaving puts the latest back
  const tune = (h, n) => {
    h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
    h.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
  };
  document.addEventListener("pointerover", e => {
    const h = e.target.closest?.(".sd-tune"), t = e.target.closest?.(".sd-tune [data-n]");
    document.querySelectorAll(".sd-tune").forEach(x => x !== h && tune(x, 0));
    if (h && t) tune(h, +t.dataset.n);
  });


  /* hanging bands: each ribbon is a two-segment pendulum hung from the rail. the upper part swings on its own spring (slower the longer
     it is), the lower part with the lock follows it with a lag, so the heavy end whips. brushing the pointer through pushes ribbons
     by the pointer's horizontal speed, more the closer and the lower down it catches them. */
  const RIB = new WeakMap(), live = new Set();
  let raf = 0, last = 0, px = null, pt = 0;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const state = el => {
    let r = RIB.get(el);
    if (!r) RIB.set(el, r = { el, lo: el.querySelector(".lo"), a: 0, v: 0, b: 0, w: 0, i: [...el.parentNode.children].indexOf(el) });
    return r;
  };
  const step = now => {
    const dt = Math.min(.032, (now - last) / 1000 || .016); last = now;
    // contact: a ribbon swinging into its neighbour pushes it, measured where they'd touch (70% down the shorter one)
    for (const r of [...live]) for (const j of [r.i - 1, r.i + 1]) {
      const nb = r.el.parentNode.children[j]; if (!nb) continue;
      const o = state(nb), side = Math.sign(j - r.i), d = Math.min(r.el.offsetHeight, nb.offsetHeight) * 1.56 * .7;
      const xr = r.el.offsetLeft + r.el.offsetWidth / 2 + Math.sin(r.a) * d, xo = nb.offsetLeft + nb.offsetWidth / 2 + Math.sin(o.a) * d;
      const gap = (xo - xr) * side - r.el.offsetWidth * .9;
      if (gap < 0) { const p = -gap * .9 * dt * 60 / d; r.v -= side * p; o.v += side * p; live.add(o); }
    }
    for (const r of live) {
      const len = r.el.offsetHeight * 1.56 || 300;      // whole ribbon, both segments, in px
      const k = 9.8 * 520 / len * (r.el.classList.contains("k-sil") ? .7 : 1), c = 1.5;               // pendulum spring: shorter ribbons swing faster
      r.v += (-k * r.a - c * r.v) * dt; r.a += r.v * dt;
      // the lower segment's angle relative to the upper one: pulled back straight, kicked by the upper's acceleration
      const rel = r.b - r.a;
      r.w += (-60 * rel - 3.2 * (r.w - r.v)) * dt; r.b += r.w * dt;
      r.el.style.rotate = `${r.a}rad`;
      r.lo.style.rotate = `${r.b - r.a}rad`;
      if (Math.abs(r.a) + Math.abs(r.v) + Math.abs(r.b - r.a) + Math.abs(r.w) < 1e-3) { r.a = r.v = r.b = r.w = 0; r.el.style.rotate = r.lo.style.rotate = ""; live.delete(r); }
    }
    raf = live.size ? requestAnimationFrame(step) : 0;
  };
  document.addEventListener("pointermove", e => {
    const hang = e.target.closest?.(".sd-hang");
    if (!hang || still.matches) { px = null; return; }
    const now = performance.now(), vx = px == null ? 0 : (e.clientX - px) / Math.max(8, now - pt) * 1000; // px per second
    px = e.clientX; pt = now;
    if (!vx) return;
    for (const el of hang.querySelectorAll(".hb")) {
      const b = el.getBoundingClientRect(), top = b.top, len = b.height * 1.56;
      const d = Math.abs(e.clientX - (b.left + b.width / 2)), y = (e.clientY - top) / len;
      if (d > 26 || y < 0 || y > 1) continue;
      const r = state(el), f = (1 - d / 26) * (.25 + y);   // a push low down moves it more than one near the rail
      r.v += vx * f * .0009 / (len / 300);
      r.v = Math.max(-2.2, Math.min(2.2, r.v));
      live.add(r);
    }
    if (live.size && !raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  });

  // real data in the door head and the baseline list
  A.shows.live = () => `<span class="muted">${nights.length}</span>`;
  const LIST = () => ({ items: S.map(s => [esc(s.artist), `${esc(city(s))} · ${monthYear(s.date)}`, photo(s)]) });
  function use(k) {
    const v = V[k] ?? V.touch;
    TOUCH.shows = v.hero;
    A.shows.s = v.full ? () => ({ items: [] }) : LIST;
  }
  return { V, use, nights, hang: hangHero };
})();
