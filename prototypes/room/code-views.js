/* code opened-view explorations. each variant swaps XL3.code. they carry everything the real /code page has (every featured project
   big, the rest smaller, each with its screenshot, name, kind, description and github link) plus what changed lately on this site,
   in the door's language: a terminal window as the frame, the room's own voice inside (serif names, plain words, no shas).
   code-view.html lines them up; index.html?codeview=<key> tries one in the room (add &open=code to land on it opened). */
const CVIEW = (() => {
  const C = D2.code, P = C.projects, last = C.commits[0], BASE = XL3.code;
  const F = () => P.filter(p => p.featured), R = () => P.filter(p => !p.featured);
  const dir = p => p.file.replace(/\.md$/, "");
  const shot = p => p.img ? `url('${p.img}') center/cover, #0a0f1c` : art(p.t);
  const gh = p => p.url ? `<a class="gh" ${ext(p.url)}>open on github ↗</a>` : "";
  const name = p => p.img || p.featured ? esc(p.t) : "more soon";

  // the window: title bar with the three lights, the screen under it
  const win = (title, inner, cls = "") => `<div class="cv-win ${cls}"><div class="tb"><i></i><i></i><i></i><span>${title}</span></div><div class="bd">${inner}</div></div>`;
  const lab = s => `<div class="cv-lb">${s}</div>`;
  // a project at three sizes: the hero (picture beside the words), the card (picture over the words), the row (thumbnail + one line)
  const hero = p => `<article class="cv-hero"><i class="sh" style="background:${shot(p)}"></i><div><span class="kd">${esc(p.cat)}</span><h2>${esc(p.t)}</h2><p>${esc(p.d)}</p>${gh(p)}</div></article>`;
  const card = p => `<article class="cv-card"><i class="sh" style="background:${shot(p)}"></i><span class="kd">${esc(p.cat)}</span><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p>${gh(p)}</article>`;
  const row = p => `<a class="cv-row" ${ext(p.url)}><i class="th" style="background:${shot(p)}"></i><div><b>${name(p)}</b><span>${esc(p.cat)}</span></div><p>${esc(p.d)}</p><em>↗</em></a>`;
  const lately = (n = C.commits.length) => `<ul class="cv-la">${C.commits.slice(0, n).map(c => { const [v, t] = CDOOR.human(c); return `<li><em>${v}</em><b>${esc(t)}</b><span>${CDOOR.when(c.date)}</span></li>`; }).join("")}</ul>`;
  const foot = `<div class="cv-ft">last change ${ago(last.date)} <i class="cur"></i></div>`;
  const featured = () => { const [a, ...more] = F(); return `${hero(a)}${more.length ? `<div class="cv-cards n${more.length}">${more.map(card).join("")}</div>` : ""}`; };

  const V0 = {
    editor: {
      group: "baseline", name: "the editor (round 6)", note: "what the room has now: editor tabs per project with a readme each, the git log and the activity heat in a terminal under it.",
      view: () => BASE(),
    },

    win: {
      group: "the window", name: "the window, big", note: "the door's window grown to the opened box. the first featured project as a hero (screenshot beside the words), the other featured ones as cards under it, the rest as rows, then everything that changed lately in plain words.",
      view: () => `<div class="v3 cv">${win("~/code", `${lab("featured")}${featured()}${R().length ? `${lab("also")}<div class="cv-rows">${R().map(row).join("")}</div>` : ""}
        ${lab("lately, on this site")}${lately()}${foot}`)}</div>`,
    },
    split: {
      group: "the window", name: "split", note: "the window split like the split door: featured on the left with every one as a card, the rest and lately in the right pane, a stamp red status bar along the bottom. stacks into one column when narrow.",
      view: () => `<div class="v3 cv">${win("~/code", `<div class="cv-split"><div class="pn"><div class="pt">featured</div>${F().map(card).join("")}</div>
        <div class="pn"><div class="pt">also</div><div class="cv-rows sm">${R().map(row).join("")}</div><div class="pt">lately</div>${lately()}</div></div>
        <div class="sb">${F().length} featured · ${P.length} projects · last change ${ago(last.date)}</div>`, "flush")}</div>`,
    },
    tabs: {
      group: "the window", name: "tabs", note: "a tab per project, featured first with a star. each tab is that project's page: the screenshot wide, the name, what it is, what it does, the link. click a tab to switch; lately runs along the bottom of the window.",
      view: () => `<div class="v3 cv">${win("~/code", `<div class="cv-pick"><div class="cv-tabs">${P.map((p, i) => `<button data-n="${i}" class="${i ? "" : "on"}">${p.featured ? "<s>★</s>" : ""}${name(p)}</button>`).join("")}</div>
        <div class="sw">${P.map((p, i) => `<div class="cv-page${i ? "" : " on"}"><i class="sh" style="background:${shot(p)}"></i><div><span class="kd">${esc(p.cat)}${p.featured ? " · featured" : ""}</span><h2>${name(p)}</h2><p>${esc(p.d)}</p>${gh(p)}</div></div>`).join("")}</div></div>
        <div class="cv-low">${lab("lately, on this site")}${lately(4)}${foot}</div>`, "flush")}</div>`,
    },
    cascade: {
      group: "desktop", name: "cascade", note: "each featured project in its own window, cascaded across the room's surface like a desktop. click a window to bring it to the front. the rest sit minimized in a dock below; lately is its own window.",
      view: () => { const f = F(), n = f.length;
        return `<div class="v3 cv cv-desk"><div class="cv-cas cv-pick" style="--n:${n}">${f.map((p, i) => `<div class="cv-win cw${i ? "" : " on"}" data-n="${i}" style="--i:${i}"><div class="tb"><i></i><i></i><i></i><span>${esc(dir(p))}</span></div><div class="bd">${hero(p)}</div></div>`).join("")}</div>
          <div class="cv-dock">${R().map(p => `<a class="mn" ${ext(p.url)}><i style="background:${shot(p)}"></i><b>${name(p)}</b><span>${esc(p.cat)}</span></a>`).join("")}</div>
          ${win("lately", `${lately()}${foot}`, "lw")}</div>`; },
    },
    list: {
      group: "data first", name: "the list", note: "the plainest: a table with one line per project (picture, name, what it is, what it does, link) under readable column heads. featured lines are taller with the screenshot big and starred. lately under it in the same table style.",
      view: () => `<div class="v3 cv">${win("~/code", `<div class="cv-tbl"><div class="hd"><span></span><span>project</span><span>is a</span><span>what it does</span><span></span></div>
        ${P.map(p => `<a class="ln${p.featured ? " ft" : ""}" ${ext(p.url)}><i style="background:${shot(p)}"></i><b>${p.featured ? "<s>★</s>" : ""}${name(p)}</b><span>${esc(p.cat)}</span><p>${esc(p.d)}</p><em>↗</em></a>`).join("")}</div>
        ${lab("lately, on this site")}${lately()}${foot}`)}</div>`,
    },
  };

  // the newest groups go first; the baseline last
  const V = Object.fromEntries([...Object.keys(V0).filter(k => k !== "editor"), "editor"].map(k => [k, V0[k]]));

  // picking in an opened view is a click (things shouldn't move under the pointer): marks the data-n and switches the .sw to it
  document.addEventListener("click", e => {
    const h = e.target.closest(".cv-pick"), t = e.target.closest(".cv-pick [data-n]");
    if (!h || !t || e.target.closest("a")) return;
    const n = +t.dataset.n;
    h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
    h.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
  });

  function use(k) { XL3.code = (V[k] ?? V.editor).view; }
  return { V, use };
})();
