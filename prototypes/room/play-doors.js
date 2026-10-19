/* play door explorations. each variant swaps the play door's hero, and "full" ones drop the banner list so the object is the whole door.
   play-door.html lines them all up; index.html?play=<key> tries one in the room. */
const PDOOR = (() => {
  const G = D2.games, BASE = TOUCH.play, BASE_S = A.play.s;
  const now = G[0], live = fresh(now.last);
  // object-printed playtime: "125h", or minutes under an hour
  const hrs = g => g.mins < 60 ? `${g.mins}m` : `${Math.round(g.mins / 60)}h`;
  // a save file's clock: "125:24"
  const clk = g => `${g.mins / 60 | 0}:${String(g.mins % 60).padStart(2, "0")}`;
  const day = iso => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase();
  const total = Math.round(G.reduce((n, g) => n + g.mins, 0) / 60);
  const wide = g => cov({ img: g.header }, g.t);
  // a grey cartridge with the portrait art as its label; o.stk puts a paper sticker on it
  const cart = (g, o = {}) => `<div class="pd-cart" title="${esc(g.t)} · ${hours(g.mins)}" style="${o.style ?? ""}"><i style="background:${cov(g)}"></i>${o.stk ? `<em class="stk u-paper">${hrs(g)}</em>` : ""}</div>`;
  const kase = (g, r, o = {}) => `<div class="cs"${o.n != null ? ` data-n="${o.n}"` : ""} title="${esc(g.t)} · ${hours(g.mins)}" style="--r:${r}deg"><i style="background:${cov(g)}"></i>${o.stk ? `<em class="stk u-paper">${hrs(g)}</em>` : ""}</div>`;
  const P = D2.play;
  // a hand of cases: the first one in front and upright, the rest alternate left and right behind it, further out the further back
  const fan = (list, step, o = {}) => list.map((g, i) => ({ g, i, r: i ? (i % 2 ? -1 : 1) * Math.ceil(i / 2) * step : 0 })).reverse()
    .map(({ g, i, r }) => kase(g, r, { n: o.link ? i : null, stk: o.stk })).join("");
  const ach = g => g.ach?.got ? `${g.ach.got}/${g.ach.total}` : "";
  // a handheld: o.screens are what the screen can show (index matches the data-n of whatever tunes it), o.under is printed on the body
  const handheld = o => `<div class="bd u-paper u-lit${o.wide ? " wide" : ""}">
    <div class="bz"><div class="scr sw${live ? " lit" : ""}">${o.screens.map((x, i) => `<div class="${i ? "" : "on"}" style="background:${x.bg}">${x.over ?? ""}</div>`).join("")}</div>
      <small><i class="led${live ? " on" : ""}"></i>${live ? "playing" : ago(now.last)}</small></div>
    ${o.wide ? ctl : ""}${o.under}${o.wide ? "" : ctl}${o.wide ? "" : `<i class="spk"></i>`}</div>`;
  const ctl = `<div class="ctl"><i class="dp"></i><span class="ab"><i></i><i></i></span></div>`;
  const saves = (list, o = {}) => `<ul>${list.map((g, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${esc(g.t)}</b><em>${o.ach && ach(g) ? `${ach(g)} · ` : ""}${hrs(g)}</em></li>`).join("")}</ul>`;

  const V0 = {
    touch: {
      group: "cartridge", name: "touch", note: "baseline. the cartridge with the current game as its label, the banner list underneath.",
      hero: BASE,
    },
    slot: {
      group: "cartridge", name: "slotted", note: "the current cartridge sits in the console, the power light on in stamp red while it's being played. hover lifts it half out.",
      hero: () => `<div class="hero t pd-slot">${cart(now)}<div class="con"><i class="led${live ? " on" : ""}"></i><span>${live ? "playing" : "power"}</span></div></div>`,
    },
    stack: {
      group: "cartridge", name: "stack", full: true, note: "every recent cartridge standing in a pile, the newest in front, a paper sticker with hours on each. hover a back one to lift it out, like the listen crate.",
      hero: () => `<div class="hero t pd-full pd-stack"><div class="pl">${[...G].reverse().map(g => cart(g, { stk: true, style: `--x:${(hash(g.t) % 7 - 3) * 2}px;--r:${(hash(g.t + "r") % 5 - 2) * 1.2}deg` })).join("")}</div>
        <div class="cap"><b>${esc(now.t)}</b><span>${hours(now.mins)} · ${ago(now.last)}</span></div></div>`,
    },
    loose: {
      group: "cartridge", name: "loose", full: true, note: "cartridges tossed down the door at odd angles, newest on top, each with its hours sticker. hover one to straighten it and bring it up.",
      hero: () => `<div class="hero t pd-full pd-loose">${G.map((g, i) => cart(g, { stk: true, style: `--t:${[0, 33, 62][i] ?? 0}%;--l:${[0, 22, 4][i] ?? 0}%;--r:${[-7, 9, -3][i] ?? 0}deg;z-index:${5 - i}` })).join("")}</div>`,
    },

    box: {
      group: "case", name: "box art", note: "the current game's box art at its real shape with a round store sticker of the hours on it. hover peels the sticker straight.",
      hero: () => `<div class="hero t pd-box"><i style="background:${cov(now)}"></i><span class="tag u-paper"><b>${Math.round(now.mins / 60)}</b>hrs</span></div>`,
    },
    ajar: {
      group: "case", name: "case, ajar", note: "the case swung a little open, the disc inside printed with the name and hours. hover opens it wider.",
      hero: () => `<div class="hero t pd-ajar"><div class="tray"><div class="dsc"><b>${esc(now.t)}</b><em>${hours(now.mins)}</em></div></div><div class="cv" style="background:${cov(now)}"></div></div>`,
    },

    hh: {
      group: "handheld · round 2", name: "handheld", full: true, note: "round 1 on the fuller data: the last six games as saves, with achievements where steam has them. hover a save to switch the screen to it.",
      hero: () => `<div class="hero t pd-full pd-hh pd-tune">${handheld({ screens: G.slice(0, 6).map(g => ({ bg: cov(g) })), under: saves(G.slice(0, 6), { ach: true }) })}</div>`,
    },
    hhwide: {
      group: "handheld · round 2", name: "sideways", full: true, note: "the wide kind of handheld, so the screen takes steam's wide banner art as it is. controls under the screen, saves printed below.",
      hero: () => `<div class="hero t pd-full pd-hh pd-tune">${handheld({ wide: true, screens: G.slice(0, 7).map(g => ({ bg: wide(g) })), under: saves(G.slice(0, 7)) })}</div>`,
    },
    hhcart: {
      group: "handheld · round 2", name: "cart in the back", full: true, note: "the current game's cartridge sticks out of the slot on top. hover a save and both the cartridge label and the screen switch to it.",
      hero: () => `<div class="hero t pd-full pd-hh pd-cartin pd-tune"><div class="pd-cart"><span class="sw">${G.slice(0, 6).map((g, i) => `<i class="${i ? "" : "on"}" style="background:${cov(g)}"></i>`).join("")}</span></div>
        ${handheld({ screens: G.slice(0, 6).map(g => ({ bg: cov(g) })), under: saves(G.slice(0, 6)) })}</div>`,
    },
    hhach: {
      group: "handheld · round 2", name: "unlocked", full: true, note: "the screen shows the newest achievement as the toast you get in game, over that game's art. the body lists the latest unlocks; hover one to put it on the screen.",
      hero: () => { const A2 = P.ach.slice(0, 6); return `<div class="hero t pd-full pd-hh pd-tune">${handheld({
        screens: A2.map(a => ({ bg: cov(a), over: `<div class="toast"><i style="background:url('${a.icon}') center/cover"></i><div><small>achievement unlocked</small><b>${esc(a.title)}</b></div></div>` })),
        under: `<ul>${A2.map((a, i) => `<li data-n="${i}" class="${i ? "" : "on"}" title="${esc(a.desc)}"><b>${esc(a.title)}</b><em>${day(a.at)}</em></li>`).join("")}</ul>` })}</div>`; },
    },
    hhfan: {
      group: "handheld · round 2", name: "handheld + fan", full: true, note: "both picks at once: the recent cases fanned behind the handheld, poking out over its top. hover a case or a save and the screen switches to it.",
      hero: () => `<div class="hero t pd-full pd-hh pd-hhfan pd-tune"><div class="fan">${fan(G.slice(0, 5), 11, { link: true })}</div>
        ${handheld({ screens: G.slice(0, 5).map(g => ({ bg: cov(g) })), under: saves(G.slice(0, 5)) })}</div>`,
    },

    fan: {
      group: "fanned · round 2", name: "fanned", full: true, note: "round 1 on the fuller data: the three latest cases fanned, a plain list of the last six below with hours and when.",
      hero: () => `<div class="hero t pd-full pd-fan"><div class="fan">${fan(G.slice(0, 3), 14)}</div>
        <ul>${G.slice(0, 6).map(g => `<li><b>${esc(g.t)}</b><span>${hours(g.mins)} · ${ago(g.last)}</span></li>`).join("")}</ul></div>`,
    },
    fanstk: {
      group: "fanned · round 2", name: "stickered", full: true, note: "a wider hand of five, each case with a paper hours sticker; the front one gets a stamp with its achievements.",
      hero: () => `<div class="hero t pd-full pd-fan"><div class="fan five">${fan(G.slice(0, 5), 10, { stk: true })}${ach(now) ? `<span class="ast">${ach(now)}</span>` : ""}</div>
        <div class="cap"><b>${esc(now.t)}</b><span>${hours(now.mins)} · ${ago(now.last)}</span></div></div>`,
    },
    fan2: {
      group: "fanned · round 2", name: "two hands", full: true, note: "two fans: what's been played lately, and the most played of all time with the hours on each.",
      hero: () => `<div class="hero t pd-full pd-fan pd-fan2"><div class="u-label">lately</div><div class="fan">${fan(G.slice(0, 5), 10)}</div>
        <div class="u-label">most played</div><div class="fan">${fan(P.top.slice(0, 5), 10, { stk: true })}</div></div>`,
    },
    fanlog: {
      group: "fanned · round 2", name: "fan + backlog", full: true, note: "the latest three fanned on top of the rest of the library: a pile of case edges for every game, the never played ones stamped. hover the pile to straighten it.",
      hero: () => `<div class="hero t pd-full pd-fan pd-fanlog"><div class="fan">${fan(G.slice(0, 3), 14)}</div>
        <div class="cap"><b>${esc(now.t)}</b><span>${hours(now.mins)} · ${ago(now.last)}</span></div>
        <div class="pile" style="--n:${P.owned}"><span class="st">${P.unplayed}<small>never played</small></span></div>
        <div class="tot"><span>${P.played} played</span><span>${Math.round(P.mins / 60).toLocaleString()} hrs</span></div></div>`,
    },
    fanlink: {
      group: "fanned · round 2", name: "fan, linked", full: true, note: "five cases fanned over the list of the same five. hover a case and its line lights up, hover a line and its case comes up.",
      hero: () => `<div class="hero t pd-full pd-fan pd-tune pd-fanlink"><div class="fan five">${fan(G.slice(0, 5), 10, { link: true })}</div>
        <ul>${G.slice(0, 5).map((g, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${esc(g.t)}</b><span>${hours(g.mins)} · ${ago(g.last)}${ach(g) ? ` · ★${ach(g)}` : ""}</span></li>`).join("")}</ul></div>`,
    },

    mc: {
      group: "save data", name: "memory card", full: true, note: "a memory card with its paper label written up as a save list: icon, game, the save's clock and the day it was last saved.",
      hero: () => `<div class="hero t pd-full pd-mc"><div class="sh"><div class="cd"><div class="lb u-paper"><div class="hd"><b>memory card</b><small>${G.length} saves</small></div>
        ${G.map(g => `<div class="sv"><i style="background:${cov(g)}"></i><div><b>${esc(g.t)}</b><span>${clk(g)} · ${day(g.last)}</span></div></div>`).join("")}</div><div class="pins"></div></div></div></div>`,
    },

    tc: {
      group: "paper", name: "time card", full: true, note: "a punch clock time card: one line per game, the last day it was played stamped in red, hours on the right, a pencilled total. it sits in the rack; hover pulls it up.",
      hero: () => `<div class="hero t pd-full pd-tc"><div class="cd u-paper u-lit"><div class="hd">time card</div><div class="cl"><span>game</span><span>in</span><span>hrs</span></div>
        ${G.map(g => `<div class="rw"><b>${esc(g.t)}</b><em style="--r:${(hash(g.t + "s") % 7 - 3) * 1.4}deg">${day(g.last)}</em><span>${Math.round(g.mins / 60) || "<1"}</span></div>`).join("")}
        <div class="tt">${total} hrs</div></div><div class="pk"></div></div>`,
    },

    hours: {
      group: "data first", name: "hours", full: true, note: "no object: each game's banner with its hours big and a bar against the most played.",
      hero: () => { const max = Math.max(...G.map(g => g.mins)); return `<div class="hero t pd-full pd-hrs">${G.map(g => `<div class="rw"><i style="background:${wide(g)}"></i>
        <div class="nb"><b>${Math.round(g.mins / 60) || "<1"}<small>hrs</small></b><span>${ago(g.last)}</span></div><span class="d-bar"><i style="width:${g.mins / max * 100}%"></i></span></div>`).join("")}</div>`; },
    },
  };

  // anything with data-n inside a .pd-tune switches every .sw (screen, cart label) to that index and marks the matching data-n's;
  // leaving puts the latest back
  const tune = (h, n) => {
    h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
    h.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
  };
  document.addEventListener("pointerover", e => {
    const h = e.target.closest?.(".pd-tune"), t = e.target.closest?.(".pd-tune [data-n]");
    document.querySelectorAll(".pd-tune").forEach(x => x !== h && tune(x, 0));
    if (h && t) tune(h, +t.dataset.n);
  });

  // the two round 2 groups go first
  const FIRST = ["hh", "hhwide", "hhcart", "hhach", "hhfan", "fan", "fanstk", "fan2", "fanlog", "fanlink"];
  const V = Object.fromEntries([...FIRST, ...Object.keys(V0).filter(k => !FIRST.includes(k))].map(k => [k, V0[k]]));

  function use(k) {
    const v = V[k] ?? V.touch;
    TOUCH.play = v.hero;
    A.play.s = v.full ? () => ({ items: [] }) : BASE_S;
  }
  return { V, use };
})();
