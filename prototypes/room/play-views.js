/* play opened-view explorations. each variant swaps XL3.play. there's no real play page yet, so every one carries the same set:
   recently played (hours, last two weeks, last played, achievements), the latest unlocks, most played of all time, the library count.
   play-view.html lines them up; index.html?playview=<key> tries one in the room (add &open=play to land on it opened). */
const PVIEW = (() => {
  const G = D2.games, P = D2.play, now = G[0], live = !!P.live;
  const day = iso => iso ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase() : "";
  const hrsN = m => m < 60 ? "<1" : Math.round(m / 60).toLocaleString();
  const hrs = g => g.mins < 60 ? `${g.mins}m` : `${Math.round(g.mins / 60)}h`;
  const achOf = g => g.ach?.total ? `${g.ach.got}/${g.ach.total}` : "";
  const icon = u => `url('${u}') center/cover, #1d1f25`;
  const head = () => `<div class="wv-head"><div class="u-label">${glyph("play")} ${live ? `<span style="color:var(--gold)">playing</span> ${esc(P.live)}` : `last played · ${ago(now.last)}`}</div></div>`;

  // the door's hand of cases, bigger: the first upright in front, the rest alternating out behind it. data-n ties each to its row
  const fan = (list, w, step, o = {}) => `<div class="pd-fan pv-fan"><div class="fan" style="--w:${w}px">${list.map((g, i) => ({ g, i, r: i ? (i % 2 ? -1 : 1) * Math.ceil(i / 2) * step : 0 })).reverse()
    .map(({ g, i, r }) => `<a class="cs${i ? "" : " on"}" data-n="${i}" ${o.pick ? "" : ext(g.url)} title="${esc(g.t)}" style="--r:${r}deg"><i style="background:${cov(g)}"></i>${o.stk ? `<em class="stk u-paper">${hrs(g)}</em>` : ""}</a>`).join("")}</div></div>`;
  // one line per game: title, hours, when, and an achievements meter where steam has them
  const rows = list => `<ul class="pv-rows">${list.map((g, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${esc(g.t)}</b>
    <span>${hours(g.mins)} · ${ago(g.last)}</span>${g.ach?.total ? `<span class="mtr" title="${achOf(g)} achievements"><s style="width:${g.ach.got / g.ach.total * 100}%"></s></span>` : ""}</li>`).join("")}</ul>`;
  // the detail for one game, one per game stacked in a .sw so hovering a case or a row switches it
  const unlock = a => `<div class="un"><i style="background:${icon(a.icon)}"></i><div><b>${esc(a.title)}</b><span>${esc(a.desc)}</span></div><em>${day(a.at)}</em></div>`;
  const detail = (g, i, o = {}) => `<div class="dt${i ? "" : " on"}${o.paper ? " u-paper u-lit" : ""}">${o.paper ? `<span class="st">${hrsN(g.mins)}<small>hrs</small></span>` : ""}
    <a class="tt" ${ext(g.url)}>${esc(g.t)}</a>
    <div class="nums"><span><b>${hrsN(g.mins)}</b> hrs</span>${g.mins2w ? `<span><b>${hrsN(g.mins2w)}</b> hrs the last two weeks</span>` : ""}</div>
    <small>last played ${day(g.last)} · ${ago(g.last)}</small>
    ${g.ach?.total ? `<div class="u-label">achievements · ${achOf(g)}</div><span class="mtr"><s style="width:${g.ach.got / g.ach.total * 100}%"></s></span>
      ${g.ach.recent.slice(0, 3).map(unlock).join("")}` : `<div class="u-label">achievements</div><p class="none">${g.ach ? "none yet" : "this one has none on steam"}</p>`}</div>`;
  const details = (list, o = {}) => `<div class="pv-dt sw${o.paper ? " onpaper" : ""}">${list.map((g, i) => detail(g, i, o)).join("")}</div>`;
  const unlocks = (n = 8) => sec("latest unlocks", `<div class="pv-un">${P.ach.slice(0, n).map(a => `<div class="un"><i style="background:${icon(a.icon)}"></i><div><b>${esc(a.title)}</b><span>${esc(a.desc)}</span><small>${esc(a.game)} · ${day(a.at)}</small></div></div>`).join("")}</div>`);
  // most played: the cases face out on a shelf, the hours on a sticker
  const most = () => sec("most played", `<div class="pv-shelf">${P.top.map(g => `<a class="mp" ${ext(g.url)} title="${esc(g.t)}"><i class="u-lit" style="background:${cov(g)}"></i><em class="stk u-paper">${hrs(g)}</em><b>${esc(g.t)}</b>${achOf(g) ? `<small>★ ${achOf(g)}</small>` : ""}</a>`).join("")}</div><div class="ledge3"></div>`);
  const foot = () => `<p class="pv-foot">${P.owned} games in the library · ${P.played} played · ${P.unplayed} never played · ${Math.round(P.mins / 60).toLocaleString()} hrs · <a ${ext(P.profile)}>steam profile ↗</a></p>`;
  // the handheld from the door round, big: the screen shows the picked game with its newest unlock as the in-game toast
  const handheld = list => `<div class="pv-hh"><div class="bd u-paper u-lit"><div class="bz"><div class="scr sw${live ? " lit" : ""}">${list.map((g, i) => `<div class="${i ? "" : "on"}" style="background:${cov(g)}">${g.ach?.recent?.[0] ? `<div class="toast"><i style="background:${icon(g.ach.recent[0].icon)}"></i><div><small>achievement unlocked</small><b>${esc(g.ach.recent[0].title)}</b></div></div>` : ""}</div>`).join("")}</div>
    <small><i class="led${live ? " on" : ""}"></i>${live ? "playing" : ago(now.last)}</small></div><div class="ctl"><i class="dp"></i><span class="ab"><i></i><i></i></span></div></div></div>`;

  // the hand behind lately / most played chips; o.paper prints the detail on paper like manual page
  const handTwo = (o = {}) => `<div class="v3 pv pv-hand"><div class="wv-head">${head().replace(/^<div class="wv-head">|<\/div>$/g, "")}${chips("hand", [["lately", "lately"], ["most", "most played"]], "lately")}</div>
        ${[["lately", G], ["most", P.top]].map(([k, L]) => `<div data-pane="hand" data-v="${k}"${k === "lately" ? "" : " hidden"}><div class="pv-tune">${fan(L.slice(0, 7), 128, 9, { stk: k === "most" })}
        <div class="pv-two">${rows(L)}${details(L, o)}</div></div></div>`).join("")}${unlocks()}${foot()}</div>`;

  const V0 = {
    hand: {
      group: "the hand · round 2", name: "the hand", note: "round 1 as it was: the recent cases fanned on top, their list on the left, the picked game's detail on the right. hover a case or a line to pick it.",
      view: () => `<div class="v3 pv pv-hand">${head()}<div class="pv-tune">${fan(G.slice(0, 7), 128, 9)}
        <div class="pv-two">${rows(G)}${details(G)}</div></div>${most()}${unlocks()}${foot()}</div>`,
    },
    manual: {
      group: "the hand · round 2", name: "manual page", note: "the same hand, but the picked game's detail is printed on a paper sheet with its hours stamped in red, so it reads as an object like the rest of the room.",
      view: () => `<div class="v3 pv pv-hand">${head()}<div class="pv-tune">${fan(G.slice(0, 7), 128, 9)}
        <div class="pv-two">${rows(G)}${details(G, { paper: true })}</div></div>${most()}${unlocks()}${foot()}</div>`,
    },
    inline: {
      group: "the hand · round 2", name: "opens in the list", note: "no side panel: click a case or a line and that line opens in place with the detail; the fan above follows. click, not hover, so the list doesn't jump under the pointer.",
      view: () => `<div class="v3 pv pv-inline">${head()}<div class="pv-tune pv-click">${fan(G.slice(0, 7), 128, 9, { pick: true })}
        <ul class="pv-rows open">${G.map((g, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><div class="rh"><b>${esc(g.t)}</b><span>${hours(g.mins)} · ${ago(g.last)}</span></div>${detail(g, 0)}</li>`).join("")}</ul></div>
        ${most()}${unlocks()}${foot()}</div>`,
    },
    pulled: {
      group: "the hand · round 2", name: "pulled out", note: "the picked case comes out of the hand and lies big beside it, with an hours sticker and its achievements stamped on; the notes sit next to it and the list runs underneath in two columns.",
      view: () => `<div class="v3 pv pv-pulled">${head()}<div class="pv-tune"><div class="top">${fan(G.slice(0, 7), 96, 9)}
        <div class="big sw">${G.map((g, i) => `<a class="${i ? "" : "on"}" ${ext(g.url)}><i class="u-lit" style="background:${cov(g)}"></i><em class="stk u-paper">${hours(g.mins)}</em>${achOf(g) ? `<span class="ast">★<br>${achOf(g)}</span>` : ""}</a>`).join("")}</div>
        ${details(G)}</div>${rows(G).replace('class="pv-rows"', 'class="pv-rows cols"')}</div>${most()}${unlocks()}${foot()}</div>`,
    },
    wide: {
      group: "the hand · round 2", name: "the whole hand", note: "all ten recent cases in one wide fan, the picked game's detail centered under it like a caption, then the list in two columns.",
      view: () => `<div class="v3 pv pv-wide">${head()}<div class="pv-tune">${fan(G, 116, 6)}${details(G)}${rows(G).replace('class="pv-rows"', 'class="pv-rows cols"')}</div>${most()}${unlocks()}${foot()}</div>`,
    },
    two: {
      group: "the hand · round 2", name: "lately / most played", note: "chips switch the hand between what's been played lately and the most played of all time, each with its own list and detail. most played stops being a separate shelf.",
      view: () => handTwo(),
    },

    side: {
      group: "the hand · round 1", name: "hand at the side", note: "the fan stays put on the left while the list and the detail run down the right, so the picked case is always in view next to what it says.",
      view: () => `<div class="v3 pv pv-side">${head()}<div class="pv-tune pv-sidegrid"><div class="stick">${fan(G.slice(0, 7), 112, 9)}${details(G)}</div>${rows(G)}</div>${most()}${unlocks()}${foot()}</div>`,
    },
    spread: {
      group: "the hand · round 1", name: "spread on the table", note: "every recent case laid out in a loose row instead of a fan, each with its hours sticker; hover one to slide it up and open its detail underneath.",
      view: () => `<div class="v3 pv pv-spread">${head()}<div class="pv-tune"><div class="row">${G.map((g, i) => `<a class="cs${i ? "" : " on"}" data-n="${i}" ${ext(g.url)} title="${esc(g.t)}" style="--r:${(hash(g.t + "r") % 7 - 3) * 1.4}deg"><i class="u-lit" style="background:${cov(g)}"></i><em class="stk u-paper">${hrs(g)}</em></a>`).join("")}</div>
        ${details(G)}</div>${most()}${unlocks()}${foot()}</div>`,
    },
    hh: {
      group: "handheld", name: "handheld", note: "the handheld from the door rounds as the hero: the screen shows the picked game with its newest unlock as the in-game toast. the saves list and the detail beside it; hover a save to switch.",
      view: () => `<div class="v3 pv pv-hhv">${head()}<div class="pv-tune pv-hhgrid">${handheld(G)}${rows(G)}${details(G)}</div>${most()}${unlocks()}${foot()}</div>`,
    },
    trophy: {
      group: "achievements first", name: "trophy wall", note: "the latest unlocks lead, as big badges with the game and the day. then the hand with its list and detail, and most played.",
      view: () => `<div class="v3 pv pv-trophy">${head()}
        ${sec("latest unlocks", `<div class="pv-badges">${P.ach.slice(0, 10).map(a => `<div class="bg" title="${esc(a.desc)}"><i class="u-lit" style="background:${icon(a.icon)}"></i><b>${esc(a.title)}</b><small>${esc(a.game)} · ${day(a.at)}</small></div>`).join("")}</div>`)}
        <div class="pv-tune" style="margin-top:34px">${fan(G.slice(0, 7), 112, 9)}<div class="pv-two">${rows(G)}${details(G)}</div></div>${most()}${foot()}</div>`,
    },
    log: {
      group: "data first", name: "the log", note: "no object: recently played as a table (hours, last two weeks, last played, achievements), most played as a ranked list, the unlocks as rows.",
      view: () => `<div class="v3 pv pv-log">${head()}
        ${sec("recently played", `<table class="pv-tb"><thead><tr><th></th><th>game</th><th>hrs</th><th>2 wks</th><th>last</th><th>achievements</th></tr></thead><tbody>${G.map(g => `<tr><td><i style="background:${cov({ img: g.header }, g.t)}"></i></td><td><a ${ext(g.url)}>${esc(g.t)}</a></td><td>${hrsN(g.mins)}</td><td>${g.mins2w ? hrsN(g.mins2w) : ""}</td><td>${day(g.last)}</td><td>${achOf(g)}</td></tr>`).join("")}</tbody></table>`)}
        ${sec("most played", `<ul class="u-list cols3" style="display:grid;gap:7px 36px">${P.top.map((g, i) => `<li><em>${String(i + 1).padStart(2, "0")}</em><a ${ext(g.url)}><b>${esc(g.t)}</b></a><i class="gold">${hrsN(g.mins)}h</i></li>`).join("")}</ul>`)}
        ${unlocks(10)}${foot()}</div>`,
    },
  };

  const V = V0;

  // picking: hovering anything with a data-n inside a .pv-tune switches its .sw (detail, screen) and marks the matching
  // cases and rows. it sticks after the pointer leaves, so the detail stays readable
  const pick = (h, n) => {
    h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
    h.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
  };
  document.addEventListener("pointerover", e => {
    const h = e.target.closest?.(".pv-tune:not(.pv-click)"), t = e.target.closest?.(".pv-tune [data-n]");
    if (h && t && h.contains(t)) pick(h, +t.dataset.n);
  });
  // opens in the list: a click picks, except on a link inside the opened detail
  document.addEventListener("click", e => {
    const h = e.target.closest(".pv-click"), t = e.target.closest(".pv-click [data-n]");
    if (!h || !t || e.target.closest(".dt a")) return;
    pick(h, +t.dataset.n);
  });

  function use(k) { XL3.play = (V[k] ?? V.hand).view; }
  return { V, use };
})();
