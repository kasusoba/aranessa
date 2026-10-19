/* sample data only, not yours */
const ALL = ["me", "listen", "watch", "read", "play", "code", "write", "gallery", "shows", "now", "elsewhere", "uses"];
const NAME = { me: "i", listen: "listen", watch: "watch", read: "read", play: "play", code: "code", write: "write", gallery: "gallery", shows: "shows", now: "now", elsewhere: "elsewhere", uses: "uses" };
const GLYPH = {
  me: '<circle cx="10" cy="10" r="6.5"/>',
  code: '<rect x="5.4" y="5.4" width="9.2" height="9.2" rx="1.5" transform="rotate(45 10 10)"/>',
  listen: '<path d="M10 3.5 16 15.5 4 15.5Z"/>',
  watch: '<path fill-rule="evenodd" d="M3 10a7 7 0 1 0 14 0a7 7 0 1 0 -14 0M7.4 10a2.6 2.6 0 1 1 5.2 0a2.6 2.6 0 1 1 -5.2 0"/>',
  read: '<rect x="4" y="4" width="12" height="12" rx="2.5"/>',
  play: '<path d="M8 3h4v5h5v4h-5v5H8v-5H3V8h5z"/>',
  write: '<path d="M3 13a7 7 0 0 1 14 0z"/>',
  gallery: '<circle cx="6" cy="6" r="2.6"/><circle cx="14" cy="6" r="2.6"/><circle cx="6" cy="14" r="2.6"/><circle cx="14" cy="14" r="2.6"/>',
  shows: '<path d="M10 2 12 8 18 10 12 12 10 18 8 12 2 10 8 8z"/>',
  now: '<rect x="3" y="6.5" width="14" height="7" rx="3.5"/>',
  elsewhere: '<circle cx="7" cy="10" r="4.5"/><circle cx="13" cy="10" r="4.5" fill-opacity=".55"/>',
  uses: '<path d="M10 2.5 16.5 6.25v7.5L10 17.5 3.5 13.75v-7.5z"/>',
};
const glyph = k => `<svg class="glyph" viewBox="0 0 20 20">${GLYPH[k]}</svg>`;
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
const art = s => { const h = hash(s) % 360; return `linear-gradient(135deg, hsl(${h} 45% 55%), hsl(${(h + 50) % 360} 50% 22%))`; };
const cover = (s, w, h) => `<div class="cover" style="width:${w}px;height:${h ?? w}px;background:${art(s)}"></div>`;
const stars = n => "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "");
const clock = () => new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Jakarta" }).format(new Date()).toLowerCase();
const EQ = '<span class="eq"><i></i><i></i><i></i></span>';
const heat = (n, s = 8) => `<div class="heat" style="grid-template-rows:repeat(7,${s}px)">${Array.from({ length: n }, (_, i) => { const v = hash("c" + i) % 10; return `<i style="width:${s}px;height:${s}px;${v >= 4 ? `background:color-mix(in srgb, var(--accent) ${v * 10}%, transparent)` : ""}"></i>`; }).join("")}</div>`;

const D = {
  tracks: [["Long Season", "Fishmans"], ["Weird Fishes/Arpeggi", "Radiohead"], ["Motion Sickness", "Phoebe Bridgers"], ["Nobody", "Mitski"], ["Mabataki", "Hitsujibungaku"], ["Night Flight", "Fishmans"], ["Reckoner", "Radiohead"], ["Kyoto", "Phoebe Bridgers"], ["Washing Machine Heart", "Mitski"], ["Seventeen", "Sharon Van Etten"]],
  top: [["Fishmans", 64], ["Radiohead", 51], ["Mitski", 38], ["Hitsujibungaku", 30], ["Phoebe Bridgers", 22]],
  watch: [["Dorohedoro", "s2 · e04", 0], ["Perfect Days", "film", 4.5], ["Frieren", "anime · finished", 5], ["Severance", "s2 · e10", 4], ["Past Lives", "film", 4.5], ["Aftersun", "film", 5], ["Mushishi", "anime · s1", 4.5], ["Fallen Leaves", "film", 4], ["Ping Pong", "anime · finished", 5]],
  books: [["Piranesi", "Susanna Clarke"], ["Klara and the Sun", "Kazuo Ishiguro"], ["Stoner", "John Williams"], ["Norwegian Wood", "Haruki Murakami"], ["Kitchen", "Banana Yoshimoto"], ["Blindsight", "Peter Watts"], ["The Remains of the Day", "Kazuo Ishiguro"], ["Convenience Store Woman", "Sayaka Murata"]],
  games: [["Hollow Knight: Silksong", "23.4h"], ["Balatro", "112h"], ["Outer Wilds", "31h"], ["Celeste", "18h"], ["Disco Elysium", "44h"], ["Tunic", "15h"]],
  projects: [["tmsync", "web extension", "auto track what you watch on streaming sites to trakt"], ["chrollo", "discord bot", "channel photos and videos to google photos"], ["aranessa", "this site", "the room you're standing in"], ["trying to make more", "i think", "fr"]],
  commits: [["aranessa", "log non-ok trakt history responses", "today"], ["aranessa", "stop caching rate-limited tmdb posters", "1d"], ["aranessa", "hardcover add", "2d"], ["aranessa", "abstract-shape nav icons", "4d"]],
  posts: [["on keeping a site like a room", "oct 02", "i keep rearranging this place the way i rearrange my actual room: not because it's wrong, but because i changed."], ["why i track everything", "aug 14", "scrobbles, episodes, pages. not for numbers, more like leaving a trail i can walk back on."], ["tmsync, a year later", "may 30", "what i'd do differently and what i'm weirdly proud of."], ["notes from a concert in the rain", "mar 21", "my shoes never recovered."]],
  photos: ["kyoto, rain", "desk at 2am", "concert blur", "the cat", "sunset from the bus", "cheap ramen", "old film roll", "morning window", "train window", "festival lights"],
  shows: [["Hitsujibungaku", "jakarta", "mar 2026"], ["Mitski", "singapore", "nov 2025"], ["Fishmans", "tokyo", "jul 2025"], ["Phoebe Bridgers", "jakarta", "feb 2025"], ["Radiohead", "tokyo", "oct 2024"]],
  socials: ["github", "anilist", "last.fm", "trakt", "letterboxd", "hardcover", "ib", "setlist.fm"],
  uses: [["laptop", "macbook air m3"], ["keyboard", "hhkb type-s"], ["headphones", "wh-1000xm5"], ["editor", "neovim, sometimes"], ["tea", "too much"]],
};

/* each aspect: what it says in a line (head), small stack items, medium personality, large detail */
const A = {
  me: {
    live: () => `<span data-clock>${clock()}</span>`,
    s: () => ({ hero: `<div class="hero" style="height:120px;background:${art("sal")}"></div>`, items: [["hey, i'm sal", "i make whatever"], [`<span data-clock>${clock()}</span>`, `in <span class="nosy">nosy</span>`]] }),
    m: () => `<div style="width:72px;height:72px;border-radius:18px;background:${art("sal")};flex:none"></div>
      <div class="meta"><div class="t1">hey, i'm <span style="color:var(--accent)">sal</span></div><div class="muted small" style="margin-top:4px">i make whatever. <span data-clock>${clock()}</span> in <span class="nosy">nosy</span></div></div>`,
    l: () => `<div class="big">hey, i'm <span style="color:var(--accent)">sal</span></div>
      <p style="max-width:34em">i make whatever. i play whatever. i listen to whatever. i watch whatever. i read whatever. i write whatever. i code whatever. i draw whatever. i share whatever.</p>
      <div class="stats"><div class="stat"><b data-clock>${clock()}</b><span>in <span class="nosy">nosy</span></span></div><div class="stat"><b>412</b><span>songs this week</span></div><div class="stat"><b>7</b><span>books this year</span></div><div class="stat"><b>14</b><span>shows attended</span></div></div>
      <div class="h">elsewhere</div><div class="tags">${D.socials.map(s => `<a href="#">${s}</a>`).join("")}</div>`,
  },
  listen: {
    live: () => `<span class="live">now</span> ${EQ}`,
    s: () => ({ hero: `<div class="hero" style="aspect-ratio:1;background:${art(D.tracks[0][1])}"></div>`, items: D.tracks.map(([t, a]) => [t, a, art(a)]) }),
    m: () => `<div class="vinyl"><div class="disc"></div><div class="sleeve" style="background:${art(D.tracks[0][1])}"></div></div>
      <div class="meta"><div class="t1">${D.tracks[0][0]}</div><div class="muted">${D.tracks[0][1]}</div><div class="muted small" style="margin-top:6px">412 this week</div></div>`,
    l: () => `<div class="hrow">${cover(D.tracks[0][1], 96)}<div><div class="big">${D.tracks[0][0]}</div><div class="muted">${D.tracks[0][1]} · now playing ${EQ}</div></div></div>
      <div class="stats"><div class="stat"><b>412</b><span>scrobbles this week</span></div><div class="stat"><b>38d</b><span>streak</span></div><div class="stat"><b>14</b><span>shows</span></div></div>
      <div class="cols2"><div><div class="h">on repeat this week</div><ul class="list">${D.top.map(([a, n]) => `<li style="display:block"><div style="display:flex"><span class="t">${a}</span><span class="r">${n}</span></div><div class="barline" style="margin-top:3px"><i style="width:${n / 64 * 100}%"></i></div></li>`).join("")}</ul></div>
      <div><div class="h">just played</div><ul class="list">${D.tracks.slice(1, 7).map(([t, a], i) => `<li>${cover(a, 30)}<div><div class="t">${t}</div><div class="muted small">${a}</div></div><span class="r">${(i + 1) * 9}m</span></li>`).join("")}</ul></div></div>`,
  },
  watch: {
    live: () => `<span class="live">watching</span>`,
    s: () => ({ hero: `<div class="hero" style="aspect-ratio:2/3;background:${art(D.watch[0][0])}"></div>`, items: D.watch.map(([t, k]) => [t, k, art(t), "tall"]) }),
    m: () => `<div class="ticket"><div class="tl"><small>ADMIT ONE · NOW SHOWING</small><div class="tt">${D.watch[0][0]}</div><small style="margin-top:4px">${D.watch[0][1]}</small><div class="barline"><i style="width:38%"></i></div></div><div class="stub">No. 0412</div></div>`,
    l: () => `<div class="hrow">${cover(D.watch[0][0], 70, 104)}<div style="flex:1"><div class="big">${D.watch[0][0]}</div><div class="muted">${D.watch[0][1]} · 38%</div><div class="barline" style="max-width:300px"><i style="width:38%"></i></div></div></div>
      <div class="stats"><div class="stat"><b>41</b><span>films this year</span></div><div class="stat"><b>312</b><span>episodes</span></div><div class="stat"><b>9</b><span>anime done</span></div></div>
      <div class="h">lately</div><ul class="list">${D.watch.slice(1).map(([t, k, r]) => `<li>${cover(t, 30, 44)}<div><div class="t">${t}</div><div class="muted small">${k}</div></div><span class="r stars">${stars(r)}</span></li>`).join("")}</ul>`,
  },
  read: {
    live: () => `<span class="live">reading</span>`,
    s: () => ({ hero: `<div class="hero" style="aspect-ratio:2/3;background:${art(D.books[0][0])}"></div>`, items: D.books.map(([t, a]) => [t, a, art(t), "tall"]) }),
    m: () => `<div class="book" style="background:${art(D.books[0][0])}"><div class="rib"></div>${D.books[0][0]}</div>
      <div class="meta"><div class="t1">${D.books[0][0]}</div><div class="muted">${D.books[0][1]}</div><div class="barline"><i style="width:62%"></i></div>
      <div class="spines">${D.books.slice(1).map(([t]) => `<i style="height:${26 + hash(t) % 14}px;background:${art(t)}"></i>`).join("")}<span class="muted small" style="margin-left:6px">7 / 20</span></div></div>`,
    l: () => `<div class="hrow">${cover(D.books[0][0], 70, 104)}<div style="flex:1"><div class="big">${D.books[0][0]}</div><div class="muted">${D.books[0][1]} · 62%</div><div class="barline" style="max-width:300px"><i style="width:62%"></i></div></div></div>
      <div class="stats"><div class="stat"><b>7<span style="font-size:16px;color:var(--muted)"> / 20</span></b><span>2026 goal</span></div><div class="stat"><b>2,140</b><span>pages</span></div></div>
      <div class="h">the shelf</div><div style="display:flex;gap:10px;flex-wrap:wrap">${D.books.slice(1).map(([t]) => `<div title="${t}">${cover(t, 56, 84)}</div>`).join("")}</div>`,
  },
  play: {
    live: () => `<span class="live">playing</span>`,
    s: () => ({ hero: `<div class="hero" style="aspect-ratio:16/9;background:${art(D.games[0][0])}"></div>`, items: D.games.map(([t, h]) => [t, h, art(t), "wide"]) }),
    m: () => `<div class="cart"><div class="lb" style="background:${art(D.games[0][0])}">${D.games[0][0]}</div></div>
      <div class="meta"><div class="t1">${D.games[0][0]}</div><div class="muted">${D.games[0][1]} · 47 in the backlog</div></div>`,
    l: () => `<div class="hrow">${cover(D.games[0][0], 140, 66)}<div><div class="big" style="font-size:30px">${D.games[0][0]}</div><div class="muted">${D.games[0][1]} · last 2 days ago</div></div></div>
      <div class="stats"><div class="stat"><b>47</b><span>in the backlog (oops)</span></div><div class="stat"><b>243h</b><span>this year</span></div></div>
      <div class="h">recently</div><ul class="list">${D.games.slice(1).map(([t, h]) => `<li>${cover(t, 56, 26)}<span class="t">${t}</span><span class="r">${h}</span></li>`).join("")}</ul>`,
  },
  code: {
    live: () => `<span class="muted">today</span>`,
    s: () => ({ items: D.projects.map(([t, c]) => [t, c, art(t)]) }),
    m: () => `<div class="meta">${heat(91)}<div class="small" style="margin-top:12px;color:var(--strong)">${D.commits[0][1]}</div><div class="muted small">${D.projects.slice(0, 3).map(p => p[0]).join(" · ")}</div></div>`,
    l: () => `<div class="big">things i made</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;margin-top:14px">${D.projects.map(([t, c, d]) => `<a href="#" style="display:block;padding:12px;border-radius:12px;background:var(--surface2);border:1px solid var(--line);text-decoration:none;color:var(--text)"><b style="color:var(--strong);font-weight:500;display:block">${t}</b><span class="muted small">${c}</span><div class="small" style="margin-top:6px">${d}</div></a>`).join("")}</div>
      <div class="h">last 26 weeks</div>${heat(182, 10)}
      <div class="h">latest commits</div><ul class="list">${D.commits.map(([r, m, w]) => `<li><span class="muted">${r}</span><span class="t">${m}</span><span class="r">${w}</span></li>`).join("")}</ul>`,
  },
  write: {
    live: () => `<span class="muted">${D.posts[0][1]}</span>`,
    s: () => ({ items: D.posts.map(([t, d]) => [t, d]) }),
    m: () => `<div class="paper"><div class="muted small" style="padding-left:26px;color:#8a7f6a">${D.posts[0][1]}</div><div class="pt">${D.posts[0][0]}</div><p>${D.posts[0][2]}</p></div>`,
    l: () => `<div class="big">writing, sometimes</div>${D.posts.map(([t, d, x]) => `<div class="post"><span class="muted small">${d}</span><b>${t}</b><div>${x}</div></div>`).join("")}`,
  },
  gallery: {
    live: () => `<span class="muted">${D.photos.length}</span>`,
    s: () => ({ hero: `<div class="hero" style="aspect-ratio:4/5;background:${art(D.photos[0])}"></div>`, items: D.photos.map(p => [p, "", art(p)]) }),
    m: () => `<div class="photos">${D.photos.map(p => `<i style="background:${art(p)};border-bottom-color:#f2ede4"></i>`).join("")}</div>`,
    l: () => `<div class="big">things i saw</div><div class="gal" style="margin-top:14px">${D.photos.map(p => `<figure><i style="background:${art(p)}"></i><figcaption>${p}</figcaption></figure>`).join("")}</div>`,
  },
  shows: {
    live: () => `<span class="muted">14</span>`,
    s: () => ({ items: D.shows.map(([a, c, d]) => [a, `${c} · ${d}`, art(a)]) }),
    m: () => `<div class="meta"><div class="t1" style="font-size:44px">14 <span class="muted" style="font-size:18px">shows</span></div>
      ${D.shows.slice(0, 2).map(([a, c, d]) => `<div class="band" style="background:${art(a)}"><span>${a}</span><span>${c} · ${d}</span></div>`).join("")}</div>`,
    l: () => `<div class="big">i was there</div><div class="stats"><div class="stat"><b>14</b><span>shows</span></div><div class="stat"><b>5</b><span>cities</span></div></div>
      <ul class="list">${D.shows.map(([a, c, d]) => `<li>${cover(a, 30)}<span class="t">${a}</span><span class="muted">${c}</span><span class="r">${d}</span></li>`).join("")}</ul>`,
  },
  now: {
    live: () => `<span class="muted">oct</span>`,
    s: () => ({ items: [["fixing my sleep", "not really"], ["learning", "japanese, slowly"], ["building", "this room"]] }),
    m: () => `<div class="meta"><div class="t1" style="font-style:italic">"daydreaming."</div><div class="muted small" style="margin-top:8px">updated oct 17 · learning japanese, slowly</div></div>`,
    l: () => `<div class="big">now</div><p>what i'm up to this month, like a status note on the fridge.</p><ul class="list"><li><span class="muted">sleep</span><span class="t">fixing it. not really.</span></li><li><span class="muted">learning</span><span class="t">japanese, slowly</span></li><li><span class="muted">building</span><span class="t">this room</span></li></ul>`,
  },
  elsewhere: {
    live: () => `<span class="muted">${D.socials.length}</span>`,
    s: () => ({ items: D.socials.map(s => [s, ""]) }),
    m: () => `<div class="tags">${D.socials.map(s => `<a href="#">${s}</a>`).join("")}</div>`,
    l: () => `<div class="big">elsewhere</div><div class="tags" style="margin-top:14px">${D.socials.map(s => `<a href="#">${s}</a>`).join("")}</div>`,
  },
  uses: {
    live: () => ``,
    s: () => ({ items: D.uses.map(([k, v]) => [v, k]) }),
    m: () => `<ul class="leaders">${D.uses.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("")}</ul>`,
    l: () => `<div class="big">what i use</div><ul class="leaders" style="margin-top:14px;max-width:420px">${D.uses.map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join("")}</ul>`,
  },
};

function box(k, prefix, force) {
  const s = A[k].s();
  const items = s.items.map(([t, sub, bg, shape]) => `<div class="it ${shape || ""}">${bg ? `<div class="th ${shape || ""}" style="background:${bg}"></div>` : ""}<div class="tx"><b>${t}</b>${sub ? `<span>${sub}</span>` : ""}</div></div>`).join("");
  return `<div class="box${force ? " force-l" : ""}" data-k="${k}" ${prefix ? `style="view-transition-name:${prefix}-${k}"` : ""}>
    <div class="head">${glyph(k)}<span class="nm">${NAME[k]}</span>${A[k].live()}<span class="cue">+</span></div>
    <button class="x" data-close>esc</button>
    <div class="lv lv-s${s.items.some(i => i[2]) ? " thumbs" : ""}">${(typeof hintFor === "function" && hintFor(k)) || s.hero || ""}${items}</div>
    <div class="lv lv-m">${A[k].m()}</div>
    <div class="lv lv-l">${A[k].l()}</div>
  </div>`;
}
