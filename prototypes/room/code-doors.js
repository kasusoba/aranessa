/* code door explorations. each variant swaps the code door's hero, and "full" ones drop the project list so the object is the whole door.
   code-door.html lines them all up; index.html?code=<key> tries one in the room. */
const CDOOR = (() => {
  const C = D2.code, P = C.projects, BASE = TOUCH.code, BASE_S = A.code.s;
  const last = C.commits[0], live = fresh(last?.date, 24);
  const day = iso => new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase();
  const ymd = iso => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const total = Object.values(C.perDay).reduce((n, x) => n + x, 0), active = Object.keys(C.perDay).length;
  // a project's picture: its screenshot, or nothing for the blank "next" one
  const pic = p => p.img ? `url('${p.img}') center/cover, #0a0f1c` : "";
  // a stable little tilt per name, so hand placed things don't all sit square
  const tilt = (s, n = 5, k = 1) => (hash(s) % (2 * n + 1) - n) * k;
  // featured vs the rest. feature(n) marks the first n featured for trying out several; past the real ones it adds labelled samples
  const ORIG = P.map(p => ({ ...p })), SAMPLE = [
    { t: "sample one", cat: "sample", d: "a stand-in project so the door can be tried with more featured repos than the snapshot has.", file: "sample-one.md", img: "", url: "" },
    { t: "sample two", cat: "sample", d: "another stand-in, same reason.", file: "sample-two.md", img: "", url: "" },
  ];
  const F = () => P.filter(p => p.featured), R = () => P.filter(p => !p.featured);
  const dir = p => p.file.replace(/\.md$/, "");
  // a picture in the terminal, the way kitty's icat draws one: the screenshot, or the generated gradient for the ones without
  const icat = (p, cls = "") => `<i class="ic ${cls}" style="background:${pic(p) || art(p.t)}"></i>`;
  function feature(n) {
    const real = ORIG.map(p => ({ ...p, featured: false })), shots = real.filter(p => p.img);
    shots.slice(0, n).forEach(p => p.featured = true);
    const all = [...real, ...SAMPLE.slice(0, Math.max(0, n - shots.length)).map(s => ({ ...s, featured: true }))];
    P.splice(0, P.length, ...all.filter(p => p.featured), ...all.filter(p => !p.featured));
  }
  // readable round: commit messages in plain words. "fix: x" becomes ["fixed", "x"], no shas
  const VERB = { fix: "fixed", feat: "added", add: "added", chore: "tidied", refactor: "reworked", docs: "wrote", style: "styled", perf: "sped up" };
  const human = c => { const m = c.msg.match(/^(\w+)(\([^)]*\))?:\s*(.*)$/);
    if (m) return VERB[m[1]] ? [VERB[m[1]], m[3]] : ["changed", `${m[1]}, ${m[3]}`];
    return / add$/.test(c.msg) ? ["added", c.msg.replace(/ add$/, "")] : ["changed", c.msg]; };
  const when = iso => fresh(iso, 24) ? "today" : day(iso);
  const lately = (n, o = {}) => `<ul class="la">${C.commits.slice(0, n).map(c => { const [v, t] = human(c); return `<li><em>${v}</em><span>${o.date ? when(c.date) : ago(c.date)}</span><b>${esc(t)}</b></li>`; }).join("")}</ul>`;
  // a terminal window: title bar with the three lights, the screen under it
  const win = (title, inner, cls = "") => `<div class="hero t cd-full cd-rd ${cls}"><div class="wn"><div class="tb"><i></i><i></i><i></i><span>${title}</span></div><div class="bd">${inner}</div></div></div>`;
  const lab = s => `<div class="lb">${s}</div>`;
  const pcard = (p, o = {}) => `<div class="pc${o.small ? " sm" : ""}" title="${esc(p.d)}">${icat(p, o.small ? "sq" : "")}<div><b>${esc(p.t)}</b><span>${esc(p.cat)}</span>${o.small ? "" : `<p>${esc(p.d)}</p>`}</div></div>`;
  const also = () => R().length ? `<div class="al">also ${R().map(p => `<b>${esc(p.img ? p.t : "more soon")}</b>`).join(", ")}</div>` : "";
  const foot = `<div class="ft2">last change ${ago(last.date)} <i class="cur"></i></div>`;
  // terminal pieces for the tail -f family
  const CUR = `<i class="cur"></i>`;
  const term = (inner, cls = "", style = "") => `<div class="hero t cd-full cd-tail ${cls}"><div class="tm" style="${style}">${inner}</div></div>`;
  const pr = (dir, cmd) => `<div class="pr"><span>${dir}</span> $ ${cmd}</div>`;
  const log = list => list.map(c => `<div class="cm"><em>${c.sha}</em><span>${ago(c.date)}</span><b>${esc(c.msg)}</b></div>`).join("");
  const ls = (list = P) => `<div class="ls">${list.map(p => `<div title="${esc(p.d)}"><b class="${p.featured ? "fs" : p.img ? "" : "nx"}">${dir(p)}/</b><span># ${esc(p.cat)}</span></div>`).join("")}</div>`;
  // git log --graph: dots on one line, long quiet stretches written in
  const graph = list => `<div class="gr">${list.map((c, i) => { const n = list[i + 1], gap = n ? (new Date(c.date) - new Date(n.date)) / 864e5 : 0;
    return `<div class="cm"><em>${c.sha}</em><span>${ago(c.date)}</span><b>${esc(c.msg)}</b></div>${gap > 14 ? `<div class="qt">${ago(new Date(Date.now() - gap * 864e5).toISOString()).replace(" ago", "")} quiet</div>` : ""}`; }).join("")}</div>`;
  // one block per week, oldest first, scaled to the busiest week
  const spark = weeks => {
    const end = new Date(); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() - end.getDay() + 6);
    const n = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => { const x = new Date(end); x.setDate(x.getDate() - (weeks - 1 - w) * 7 - (6 - d)); return C.perDay[x.toLocaleDateString("en-CA")] ?? 0; }).reduce((a, b) => a + b, 0));
    const max = Math.max(1, ...n), lv = n.map(x => x ? Math.max(1, Math.round(x / max * 6)) : 0);
    // three text rows tall, half blocks for the odd steps; empty weeks are a dot on the baseline
    const rows = [2, 1, 0].map(r => lv.map(l => { const f = l - r * 2; return f >= 2 ? "<b>█</b>" : f === 1 ? "<b>▄</b>" : r ? " " : "·"; }).join(""));
    return `<div class="sk"><pre>${rows.join("\n")}</pre><span>${weeks}w ago</span><span>now</span></div>`;
  };
  const cap = `<div class="cd-cap"><b>${esc(last.msg)}</b><span>${last.sha} · ${ago(last.date)}</span></div>`;
  const plist = (o = {}) => `<ul class="cd-pl">${P.map((p, i) => `<li${o.link ? ` data-n="${i}" class="${i ? "" : "on"}"` : ""}><b>${p.featured ? `<s>★</s>` : ""}${esc(p.t)}</b><span>${esc(p.cat)}</span></li>`).join("")}</ul>`;
  // punch holes from a name: 24 columns, one or two holes each
  const holes = s => Array.from({ length: 24 }, (_, c) => { const h = hash(s + c); return [h % 10, (h >> 4) % 10 === h % 10 ? null : (h >> 4) % 12].filter(x => x != null)
    .map(r => `<i style="--c:${c};--r:${r}"></i>`).join(""); }).join("");
  // a 3.5" disk: shutter on top, paper label below. o.stk adds a stamp on the label
  const disk = (p, o = {}) => `<div class="cd-dk${o.cls ? " " + o.cls : ""}"${o.n != null ? ` data-n="${o.n}"` : ""} title="${esc(p.t)}" style="${o.style ?? ""}"><span class="sh"></span>
    <span class="lab u-paper">${p.img ? `<i style="background:${pic(p)}"></i>` : ""}<b${p.img ? "" : ` class="hw"`}>${esc(p.img ? p.t : "next?")}</b>${p.img ? `<em>${esc(p.cat)}</em>` : ""}${p.featured ? `<u>★</u>` : ""}</span></div>`;
  // one month of a wall calendar, commit days ringed in stamp red
  const month = (y, m) => {
    const first = new Date(y, m, 1), n = new Date(y, m + 1, 0).getDate(), today = ymd(new Date());
    const cells = [...Array((first.getDay() + 6) % 7).fill(`<i></i>`), ...Array.from({ length: n }, (_, d) => {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d + 1).padStart(2, "0")}`, c = C.perDay[key];
      return `<i class="${c ? "hit" : ""}${key === today ? " td" : ""}${key > today ? " fut" : ""}" title="${key}${c ? ` · ${c} commit${c > 1 ? "s" : ""}` : ""}" style="--r:${tilt(key, 3, 6)}deg">${d + 1}</i>`; })];
    return `<div class="mo"><div class="mh"><b>${first.toLocaleDateString("en-US", { month: "long" }).toLowerCase()}</b><span>${y}</span></div>
      <div class="dw">${"mtwtfss".split("").map(x => `<span>${x}</span>`).join("")}</div><div class="dg">${cells.join("")}</div></div>`;
  };

  const V0 = {
    touch: {
      group: "screen", name: "touch", note: "baseline. a tiny terminal with the last three commits and the activity heat, the projects underneath.",
      hero: BASE,
    },
    wstack: {
      group: "window · round 5", name: "stacked", full: true, note: "round 4's window as it was: every featured project in a column. with one or two they get the full card, past two they turn into rows (thumbnail, name, kind) so they all fit.",
      hero: () => { const f = F(), small = f.length > 2;
        return win("~/code", `${lab("featured")}${f.map(p => pcard(p, { small })).join("")}${also()}${lab("lately")}${lately(2)}${foot}`); },
    },
    wlead: {
      group: "window · round 5", name: "one big, rest in rows", full: true, note: "the first featured project gets the full card; the other featured ones sit under it as rows with a thumbnail, so the window keeps the same shape however many there are.",
      hero: () => { const [a, ...more] = F();
        return win("~/code", `${lab("featured")}${pcard(a)}${more.length ? `<div class="mr">${more.map(p => pcard(p, { small: true })).join("")}</div>` : ""}${also()}${lab("lately")}${lately(2)}${foot}`, "cd-wlead"); },
    },
    wtabs: {
      group: "window · round 5", name: "tabs", full: true, note: "the window has one tab per featured project under its title bar, like a terminal with several tabs open. the card shows one project at a time; hover a tab to switch. the lately list stays put.",
      hero: () => { const f = F();
        return `<div class="hero t cd-full cd-rd cd-wtabs cd-tune"><div class="wn"><div class="tb"><i></i><i></i><i></i><span>~/code</span></div>${f.length > 1 ? `<div class="tabs">${f.map((p, i) => `<span data-n="${i}" class="${i ? "" : "on"}">${esc(dir(p))}</span>`).join("")}</div>` : ""}
          <div class="bd">${lab(`featured${f.length > 1 ? ` · ${f.length}` : ""}`)}<div class="sw">${f.map((p, i) => `<div class="${i ? "" : "on"}">${pcard(p)}</div>`).join("")}</div>${also()}${lab("lately")}${lately(2)}${foot}</div></div></div>`; },
    },
    wgrid: {
      group: "window · round 5", name: "grid", full: true, note: "the featured screenshots two across with their names, so several read at a glance. the description underneath belongs to whichever one you hover (the first by default).",
      hero: () => { const f = F();
        return `<div class="hero t cd-full cd-rd cd-wgrid cd-tune"><div class="wn"><div class="tb"><i></i><i></i><i></i><span>~/code</span></div><div class="bd">${lab("featured")}
          <div class="gd${f.length > 1 ? " two" : ""}">${f.map((p, i) => `<div data-n="${i}" class="${i ? "" : "on"}">${icat(p)}<b>${esc(p.t)}</b></div>`).join("")}</div>
          <div class="sw">${f.map((p, i) => `<p class="${i ? "" : "on"}"><span>${esc(p.cat)}</span> ${esc(p.d)}</p>`).join("")}</div>${also()}${lab("lately")}${lately(2)}${foot}</div></div></div>`; },
    },
    wcascade: {
      group: "window · round 5", name: "cascade", full: true, note: "each featured project in its own little terminal window, cascaded like a desktop: the first one in front, the others' title bars peeking above it. hover a peeking window to bring it to the front. lately sits in one more window below.",
      hero: () => { const f = F(), n = f.length;
        return `<div class="hero t cd-full cd-rd cd-wcas"><div class="cs">${[...f].reverse().map((p, j) => { const i = n - 1 - j;
          return `<div class="wn${i ? " bk" : ""}" style="--o:${(n - 1 - i) * 22}px;--x:${i * 6}px"><div class="tb"><i></i><i></i><i></i><span>${esc(dir(p))}</span></div><div class="bd">${pcard(p)}</div></div>`; }).join("")}</div>
          <div class="wn lw"><div class="tb"><i></i><i></i><i></i><span>lately</span></div><div class="bd">${lately(2)}${foot}</div></div></div>`; },
    },

    rwin: {
      group: "readable · round 4", name: "window", full: true, note: "the terminal is the window, not the language: title bar and lights, mono labels, a cursor at the end. inside, the featured projects read like every other door (picture, serif name, a line of what it does), then what changed lately in plain words with no shas.",
      hero: () => { const f = F(), small = f.length > 2;
        return win("~/code", `${lab("featured")}${f.map(p => pcard(p, { small })).join("")}${also()}${lab("lately, on this site")}${lately(2)}${foot}`); },
    },
    rsplit: {
      group: "readable · round 4", name: "split, plain", full: true, note: "split kept, but each pane has a plain tab name (featured, lately) instead of a command, and the status bar says it in words.",
      hero: () => { const f = F(), small = f.length > 1;
        return win("~/code", `<div class="pn"><div class="pt">featured</div>${f.map(p => pcard(p, { small })).join("")}${also()}</div>
          <div class="pn"><div class="pt">lately</div>${lately(3)}</div><div class="sb2">${f.length} featured · ${ago(last.date)}</div>`, "cd-rsplit"); },
    },
    rfetch: {
      group: "readable · round 4", name: "fetch, plain", full: true, note: "fetch's layout (picture beside a few labelled lines) with labels anyone can read: what it is, what it does. one block per featured project.",
      hero: () => { const f = F(), small = f.length > 2;
        return win("~/code", `${f.map(p => `<div class="fb">${icat(p, "sq")}<div><b>${esc(p.t)}</b><dl><dt>is a</dt><dd>${esc(p.cat)}</dd></dl></div></div>${small ? "" : `<p class="fdo">${esc(p.d)}</p>`}`).join("")}${also()}${foot}`, "cd-rfetch"); },
    },
    rtime: {
      group: "readable · round 4", name: "timeline", full: true, note: "graph turned plain: the featured projects in a row on top, then a timeline with real dates, a dot per change, the change in plain words, and the long gaps written as \"3 months quiet\".",
      hero: () => { const f = F(), list = C.commits.slice(0, 4);
        return win("~/code", `${lab("featured")}<div class="row${f.length > 1 ? " two" : ""}">${f.map(p => `<div title="${esc(p.d)}">${icat(p)}<b>${esc(p.t)}</b><span>${esc(p.cat)}</span></div>`).join("")}</div>${also()}
          ${lab("timeline")}<div class="tl">${list.map((c, i) => { const [v, t] = human(c), n = list[i + 1], gap = n ? (new Date(c.date) - new Date(n.date)) / 864e5 : 0;
            return `<div class="ev"><span>${when(c.date)}</span><b><em>${v}</em> ${esc(t)}</b></div>${gap > 14 ? `<div class="qt">${Math.round(gap / 30)} months quiet</div>` : ""}`; }).join("")}</div>${foot}`, "cd-rtime"); },
    },
    rbare: {
      group: "readable · round 4", name: "just the screen", full: true, note: "the least terminal of the lot: the window and a cursor, and inside it the same hierarchy as the other doors. the first featured project big, the others as a row of thumbnails, one line of when you last worked on something.",
      hero: () => { const [a, ...more] = F();
        return win("~/code", `${icat(a)}<div class="bt"><b>${esc(a.t)}</b><span>${esc(a.cat)}</span><p>${esc(a.d)}</p></div>
          ${more.length ? `<div class="mr">${more.map(p => pcard(p, { small: true })).join("")}</div>` : ""}${also()}${foot}`, "cd-rbare"); },
    },

    fpanes: {
      group: "featured · round 3", name: "split, a pane each", full: true, note: "split, with a pane per featured project: its screenshot drawn in the terminal (like kitty's icat), name, what it is, the description. the rest and the git log share the last pane. past two featured the panes go compact.",
      hero: () => { const f = F(), small = f.length > 2;
        return term(`${f.map(p => `<div class="pn fp">${pr(dir(p), "icat")}${small ? `<div class="fr">${icat(p, "sq")}<div><b>${esc(p.t)}</b><span># ${esc(p.cat)}</span></div></div>`
          : `${icat(p)}<div><b>${esc(p.t)}</b> <span># ${esc(p.cat)}</span></div><p>${esc(p.d)}</p>`}</div>`).join("")}
          <div class="pn lg">${pr("~/code", "ls")}${ls(R())}${pr("aranessa", "git log")}${log(C.commits)}</div>
          <div class="sb"><b>[code]</b><span>${f.length} featured</span><em>${ago(last.date)}</em></div>`, "cd-split cd-fp"); },
    },
    fwin: {
      group: "featured · round 3", name: "split, a window each", full: true, note: "one tmux window per featured project, listed in the stamp red status bar. the big pane shows the current window's project (screenshot, name, description); hover a window name to switch. the git log pane sits under it.",
      hero: () => { const f = F();
        return `<div class="hero t cd-full cd-tail cd-split cd-fw cd-tune"><div class="tm"><div class="pn fp sw">${f.map((p, i) => `<div class="${i ? "" : "on"}">${pr(dir(p), "cat README.md")}${icat(p)}<div><b>${esc(p.t)}</b> <span># ${esc(p.cat)}</span></div><p>${esc(p.d)}</p></div>`).join("")}</div>
          <div class="pn lg">${pr("aranessa", "git log")}${log(C.commits)}</div>
          <div class="sb">${f.map((p, i) => `<span data-n="${i}" class="${i ? "" : "on"}">${i}:${esc(dir(p))}</span>`).join("")}${R().length ? `<span class="ot">+${R().length}</span>` : ""}</div></div></div>`; },
    },
    fgraph: {
      group: "featured · round 3", name: "graph, featured on top", full: true, note: "graph, under an ls --featured that draws each featured project's screenshot with its name. one featured gets a wide picture, more get a two-across grid. the rest are a line under it.",
      hero: () => { const f = F();
        return term(`${pr("~/code", "ls --featured")}<div class="fg${f.length > 1 ? " two" : ""}">${f.map(p => `<div title="${esc(p.d)}">${icat(p)}<b>${esc(dir(p))}/</b><span>${esc(p.cat)}</span></div>`).join("")}</div>
          ${R().length ? `<div class="ot">+ ${R().map(p => esc(dir(p)) + "/").join("  ")}</div>` : ""}
          ${pr("aranessa", "git log --graph")}${graph(C.commits)}${pr("~", CUR)}`, "cd-graph"); },
    },
    ffetch: {
      group: "featured · round 3", name: "fetch each", full: true, note: "fetch run once per featured project: the screenshot where fetch draws its logo, name, what it is, the repo and the description. the rest as an ls, then a short git log. past two featured the description drops.",
      hero: () => { const f = F(), small = f.length > 2;
        return term(`${f.map(p => `${pr("~/code", `fetch ${esc(dir(p))}`)}<div class="ff">${icat(p, "sq")}<div><b>${esc(p.t)}</b><i>kind</i> ${esc(p.cat)}${p.url ? `<br><i>repo</i> gh/${esc(dir(p))}` : ""}</div></div>${small ? "" : `<p class="fd">${esc(p.d)}</p>`}`).join("")}
          ${R().length ? `${pr("~/code", "ls")}${ls(R())}` : ""}${pr("aranessa", "git log -3")}${log(C.commits.slice(0, 3))}${pr("~", CUR)}`, "cd-ffetch"); },
    },
    fpick: {
      group: "featured · round 3", name: "fetch, switched", full: true, note: "an ls of every project (featured ones starred and first) above a single fetch. hover a name and the fetch switches to that project; it rests on the first featured one.",
      hero: () => `<div class="hero t cd-full cd-tail cd-ffetch cd-tune"><div class="tm">${pr("~/code", "ls")}<div class="ls">${P.map((p, i) => `<div data-n="${i}" class="${i ? "" : "on"}"><b class="${p.featured ? "fs" : p.img ? "" : "nx"}">${dir(p)}/</b><span># ${esc(p.cat)}</span></div>`).join("")}</div>
        ${pr("~/code", "fetch")}<div class="sw">${P.map((p, i) => `<div class="${i ? "" : "on"}">${icat(p, "wd")}<div class="ff"><div><b>${esc(p.t)}</b><i>kind</i> ${esc(p.cat)}</div></div><p class="fd">${esc(p.d)}</p></div>`).join("")}</div>
        ${pr("aranessa", "git log -3")}${log(C.commits.slice(0, 3))}${pr("~", CUR)}</div></div>`,
    },

    tail: {
      group: "tail -f · round 2", name: "tail -f", full: true, note: "round 1: the terminal takes the whole door, the git log with each message in full, a blinking cursor, 14 weeks of activity at the foot.",
      hero: () => term(`${pr("~/aranessa", "git log")}${log(C.commits)}${pr("~", CUR)}<div class="d-heat">${heatDays(C.perDay, 14, 7)}</div>`),
    },
    tls: {
      group: "tail -f · round 2", name: "ls, then log", full: true, note: "the projects first, as an ls of ~/code with what each one is as a comment (the featured one starred), then the git log under it.",
      hero: () => term(`${pr("~/code", "ls")}${ls()}${pr("~/code/aranessa", "git log")}${log(C.commits)}${pr("~", CUR)}`),
    },
    tsplit: {
      group: "tail -f · round 2", name: "split", full: true, note: "a tmux window split in two: the git log on top, the projects below, a stamp red status bar with the session name and the last commit's age.",
      hero: () => term(`<div class="pn">${pr("aranessa", "git log")}${log(C.commits)}</div><div class="pn">${pr("~/code", "ls")}${ls()}${pr("~/code", CUR)}</div>
        <div class="sb"><b>[code]</b><span>0:zsh*</span><em>${ago(last.date)}</em></div>`, "cd-split"),
    },
    tspark: {
      group: "tail -f · round 2", name: "ascii activity", full: true, note: "tail -f with the activity printed the way a terminal would: one block character per week for the last 20 weeks, three lines tall, instead of the square heatmap.",
      hero: () => term(`${pr("~/aranessa", "git log")}${log(C.commits)}${pr("~", "git activity -w 20")}${spark(20)}${pr("~", CUR)}`),
    },
    tgraph: {
      group: "tail -f · round 2", name: "graph", full: true, note: "git log --graph: the commits strung on one line, stamp red dots, and the long quiet stretches between them written in (\"3mo quiet\").",
      hero: () => term(`${pr("~/aranessa", "git log --graph")}${graph(C.commits)}${pr("~", CUR)}`, "cd-graph"),
    },
    trice: {
      group: "tail -f · round 2", name: "wallpaper", full: true, note: "the terminal is see-through over the featured project's screenshot, like a riced desktop. hover clears the glass a little so the wallpaper shows.",
      hero: () => term(`${pr("~/aranessa", "git log")}${log(C.commits)}${pr("~", CUR)}`, "cd-rice", `--wp:url('${P.find(p => p.img).img}')`),
    },
    tfetch: {
      group: "tail -f · round 2", name: "fetch", full: true, note: "opens with a fetch, the way a terminal greets you: a little diamond (the code glyph) beside the projects and the numbers, then a short git log.",
      hero: () => term(`${pr("~", "fetch")}<div class="ft"><pre>${["  /\\  ", " /  \\ ", " \\  / ", "  \\/  "].join("\n")}</pre><div><b>sal<span>@</span>room</b><i>projects</i> ${P.length}<br><i>featured</i> ${F().map(p => esc(p.t)).join(", ")}<br><i>commits</i> ${total}<br><i>active</i> ${active} days</div></div>
        ${pr("~/aranessa", "git log -4")}${log(C.commits.slice(0, 4))}${pr("~", CUR)}`),
    },
    mon: {
      group: "screen", name: "monitor", full: true, note: "a little monitor on a stand showing the featured project, a sticky note on the bezel with the last commit. hover a project below and the screen switches to it.",
      hero: () => `<div class="hero t cd-full cd-mon cd-tune"><div class="mn u-lit"><div class="sc sw">${P.map((p, i) => `<i class="${i ? "" : "on"}${p.img ? "" : " nx"}" style="background:${pic(p) || "#0a0f1c"}">${p.img ? "" : `<span>_</span>`}</i>`).join("")}</div>
        <span class="pi u-paper">${esc(last.msg.replace(/^\w+:\s*/, ""))}</span></div><div class="st"></div>${plist({ link: true })}
        <div class="ds sw">${P.map((p, i) => `<p class="${i ? "" : "on"}">${esc(p.d)}</p>`).join("")}</div></div>`,
    },

    lid: {
      group: "laptop", name: "stickered lid", full: true, note: "the closed laptop seen from above, one die cut sticker per project (the screenshot ones peel, the blank one is paper waiting for a name). hover a sticker to smooth it down.",
      hero: () => `<div class="hero t cd-full cd-lid"><div class="ld">
        ${P.map((p, i) => `<span class="sk${p.img ? "" : " bl u-paper"}${i ? "" : " big"}" title="${esc(p.t)}" style="--r:${[-8, 11, -4][i] ?? 0}deg;--x:${[6, 52, 18][i] ?? 0}%;--y:${[8, 46, 70][i] ?? 0}%">${p.img ? `<i style="background:${pic(p)}"></i>` : `<b>next?</b>`}</span>`).join("")}
        <span class="lg"></span></div>${cap}${plist()}</div>`,
    },
    open: {
      group: "laptop", name: "laptop, open", full: true, note: "the laptop open and facing you, the screen glowing with the git log; the deck below has the project stickers on the palm rest. hover lifts the lid a little further.",
      hero: () => `<div class="hero t cd-full cd-open"><div class="lp2"><div class="lc"><div class="sn">${C.commits.slice(0, 5).map(c => `<div><em>${c.sha}</em> ${esc(c.msg)}</div>`).join("")}<div><span>$</span> <i class="cur"></i></div></div></div>
        <div class="dk"><span class="kb"></span><span class="tp"></span>${P.filter(p => p.img).map((p, i) => `<span class="sk" style="--r:${[-9, 7][i]}deg;${i ? "right:8%" : "left:8%"}"><i style="background:${pic(p)}"></i></span>`).join("")}</div></div>
        ${plist()}${cap}</div>`,
    },

    print: {
      group: "paper", name: "printout", full: true, note: "the git log on fanfold printer paper, sprocket holes down both sides, a perforation between days. it feeds out of a slot at the top; hover pulls a little more out.",
      hero: () => { let prev = ""; return `<div class="hero t cd-full cd-print"><div class="sl"></div><div class="pp u-paper u-lit"><div class="ph">git log · aranessa</div>
        ${C.commits.map(c => { const d = ymd(c.date), cut = prev && d !== prev; prev = d; return `${cut ? `<hr>` : ""}<div class="ln"><em>${day(c.date)}</em><span>${c.sha}</span><b>${esc(c.msg)}</b></div>`; }).join("")}
        <div class="pf">${total} commits · ${active} days · 26 wks</div></div></div>`; },
    },
    cal: {
      group: "paper", name: "calendar", full: true, note: "a desk calendar flipped to this month and the two before, every day with a commit ringed in stamp red, today underlined.",
      hero: () => { const n = new Date(); return `<div class="hero t cd-full cd-cal"><div class="cl u-paper u-lit"><span class="rg"></span>${[0, 1, 2].map(k => { const d = new Date(n.getFullYear(), n.getMonth() - k, 1); return month(d.getFullYear(), d.getMonth()); }).join("")}</div>${cap}</div>`; },
    },
    punch: {
      group: "paper", name: "punch cards", full: true, note: "a deck of punch cards, one per project, the name printed along the top and the holes punched from it. the featured card is stamped. hover a card behind to pull it up.",
      hero: () => `<div class="hero t cd-full cd-punch"><div class="dkk">${[...P].reverse().map((p, j) => { const i = P.length - 1 - j; return `<div class="pc u-paper" style="--i:${i};--r:${tilt(p.t, 2, .8)}deg" title="${esc(p.t)}">
          <div class="pt"><b>${esc(p.t)}</b><span>${esc(p.cat)}</span></div><div class="hl">${holes(p.t)}</div>${p.featured ? `<span class="fs">featured</span>` : ""}</div>`; }).join("")}</div>
        <p class="ds">${esc(P[0].d)}</p>${cap}</div>`,
    },

    disks: {
      group: "disk", name: "floppies", full: true, note: "the projects saved to 3.5\" disks and dropped in a loose pile, each with its paper label; the unnamed one is blank with a pencilled \"next?\". hover a disk to bring it to the top.",
      hero: () => `<div class="hero t cd-full cd-disks"><div class="pl">${P.map((p, i) => disk(p, { style: `--t:${[0, 56, 112][i] ?? 0};--l:${[2, 20, 6][i] ?? 0}%;--r:${[-6, 8, -3][i] ?? 0}deg;z-index:${5 - i}` })).join("")}</div>${cap}${plist()}</div>`,
    },
    dbox: {
      group: "disk", name: "disk box", full: true, note: "a disk box with the projects standing inside, labels peeking over the front; the featured disk leans forward. hover a peeking label to lift that disk out.",
      hero: () => `<div class="hero t cd-full cd-dbox"><div class="bx"><div class="in">${[...P].reverse().map((p, j) => { const i = P.length - 1 - j; return disk(p, { cls: i ? "bk" : "fr", style: `--i:${i}` }); }).join("")}</div>
        <div class="fp"><span>projects</span><b>${P.length}</b></div></div>${cap}${plist()}</div>`,
    },

    act: {
      group: "data first", name: "activity", full: true, note: "no object: the commit heat big, the counts for the last 26 weeks, then the projects as a plain list.",
      hero: () => `<div class="hero t cd-full cd-act"><div class="hb">${heatDays(C.perDay, 18, 7)}</div>
        <div class="nm"><div><b>${total}</b><span>commits</span></div><div><b>${active}</b><span>days</span></div><div><b>${ago(last.date).replace(" ago", "")}</b><span>since last</span></div></div>
        ${plist()}</div>`,
    },
  };

  // anything with data-n inside a .cd-tune switches every .sw (screen) to that index and marks the matching data-n's; leaving puts the featured one back
  const tune = (h, n) => {
    h.querySelectorAll(".sw").forEach(w => [...w.children].forEach((x, i) => x.classList.toggle("on", i === n)));
    h.querySelectorAll("[data-n]").forEach(x => x.classList.toggle("on", +x.dataset.n === n));
  };
  document.addEventListener("pointerover", e => {
    const h = e.target.closest?.(".cd-tune"), t = e.target.closest?.(".cd-tune [data-n]");
    document.querySelectorAll(".cd-tune").forEach(x => x !== h && tune(x, 0));
    if (h && t) tune(h, +t.dataset.n);
  });
  // the newest round goes first
  const FIRST = ["wstack", "wlead", "wtabs", "wgrid", "wcascade", "rwin", "rsplit", "rfetch", "rtime", "rbare", "fpanes", "fwin", "fgraph", "ffetch", "fpick", "tail", "tls", "tsplit", "tspark", "tgraph", "trice", "tfetch"];
  const V = Object.fromEntries([...FIRST, ...Object.keys(V0).filter(k => !FIRST.includes(k))].map(k => [k, V0[k]]));
  function use(k) {
    const v = V[k] ?? V.touch;
    TOUCH.code = v.hero;
    A.code.s = v.full ? () => ({ items: [] }) : BASE_S;
  }
  return { V, use, feature, human, when };
})();
