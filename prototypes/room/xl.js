/* expanded ("xl") views: one per aspect, each its own object. sample data only. */
const XL_SIZE = { me: [720, 600], listen: [1040, 660], watch: [1040, 0], read: [1040, 680], play: [820, 600], code: [960, 0], write: [720, 0], gallery: [1200, 0], shows: [760, 520], now: [340, 300], uses: [360, 420], elsewhere: [480, 280] };
const UNI_SIZE = { now: [420, 250], uses: [420, 280], elsewhere: [460, 200], shows: [620, 460] };
const sha = s => (hash(s) * 2654435761 >>> 0).toString(16).padStart(8, "0").slice(0, 7);

const XL = {
  me: () => `<div class="xl xl-me">
    <div class="idcard"><div class="idtop"><span>RESIDENT</span><span>No. 0001</span></div>
      <div class="idbody"><div class="idphoto" style="background:${art("sal")}"></div>
        <div class="fields"><span>name</span><b>sal</b><span>does</span><b>makes whatever</b><span>local time</span><b data-clock>${clock()}</b>
          <span>based in</span><b class="nosy">nosy</b><span>into</span><b>music, film, books, games, code</b></div></div>
      <div class="sig">sal</div></div>
    <p class="lede" style="max-width:34em;margin:0">i make whatever. i play whatever. i listen to whatever. i watch whatever. i read whatever. i write whatever. i code whatever. i draw whatever. i share whatever.</p>
    <div class="stamps">${D.socials.map(s => `<a href="#">${s}</a>`).join("")}</div></div>`,

  listen: () => `<div class="xl xl-listen">
    <div class="gate-front"><div class="lp"><div class="disc"></div><div class="sl" style="background:${art(D.tracks[0][1])}"></div></div>
      <div class="np"><small>NOW PLAYING ${EQ}</small><div class="ttl">${D.tracks[0][0]}</div><div style="color:#a9a196;margin-top:4px">${D.tracks[0][1]}</div></div></div>
    <div class="gate-back">
      <div class="side">SIDE A · JUST PLAYED</div>
      <ol class="tracks">${D.tracks.slice(1, 8).map(([t, a], i) => `<li><em>A${i + 1}</em><div><b>${t}</b><br><span>${a}</span></div><i>${(i + 1) * 9}m</i></li>`).join("")}</ol>
      <div class="side">SIDE B · ON REPEAT THIS WEEK</div>
      <ol class="tracks">${D.top.map(([a, n], i) => `<li><em>B${i + 1}</em><b>${a}</b><i>${n} plays</i></li>`).join("")}</ol>
      <div class="liner">412 SCROBBLES THIS WEEK · 38 DAY STREAK · 14 SHOWS<br>CAT. NO. SAL-0412 · ALL TRACKS PLAYED TOO LOUD</div>
    </div></div>`,

  watch: () => `<div class="xl xl-watch">
    <div class="marquee">NOW SHOWING</div>
    <div class="screen"><div class="poster" style="background:${art(D.watch[0][0])}"></div>
      <div><div class="ttl">${D.watch[0][0]}</div><div style="color:#b49c86;margin-top:6px">${D.watch[0][1]} · 38% in</div><div class="reel"><i style="width:38%"></i></div>
        <div class="wstats"><div><b>41</b>films</div><div><b>312</b>episodes</div><div><b>9</b>anime</div></div></div></div>
    <div class="wlabel">STUBS</div>
    <div class="stubs">${D.watch.slice(1).map(([t, k, r]) => `<div class="stub2"><div class="a"><small>${k.toUpperCase()}</small><b>${t}</b></div><div class="b">${stars(r)}</div></div>`).join("")}</div></div>`,

  read: () => `<div class="xl xl-read"><div class="spread">
    <div class="page"><div class="run">currently reading</div><div class="ttl">${D.books[0][0]}</div><div class="by">${D.books[0][1]}</div>
      <blockquote>"The Beauty of the House is immeasurable; its Kindness infinite."</blockquote>
      <div class="prog">page 152 of 245<div class="barline"><i style="width:62%"></i></div></div><div class="folio">152</div></div>
    <div class="page"><div class="run">the shelf, 2026</div>
      <div class="woodshelf">${D.books.slice(1).map(([t]) => `<i style="background:${art(t)};height:${150 + hash(t) % 50}px">${t}</i>`).join("")}</div>
      <div class="goal">7 of 20 this year. on track, ish.</div><div style="flex:1"></div><div class="folio">153</div></div>
  </div></div>`,

  play: () => `<div class="xl xl-play"><div class="ptitle">SELECT SAVE</div>
    ${D.games.map(([t, h], i) => `<button class="slot${i ? "" : " on"}"><span class="cur">▶</span><div><b>${i ? `SLOT ${i + 1}` : "CONTINUE"} · ${t}</b><span>${h} played${i ? "" : " · last 2 days ago"}</span></div><div class="sa" style="background:${art(t)}"></div></button>`).join("")}
    <div class="pfoot"><span>BACKLOG 47</span><span>TOTAL 243H</span><span>ESC TO QUIT</span></div></div>`,

  code: () => {
    const L = [
      `<span class="c">// things i made. more coming, probably</span>`,
      `<span class="k">export const</span> <span class="p">projects</span> = {`,
      ...D.projects.flatMap(([t, c, d]) => [`  <span class="p">${/\s/.test(t) ? `"${t}"` : t}</span>: {`, `    kind: <span class="s">"${c}"</span>,`, `    does: <span class="s">"${d}"</span>,`, `  },`]),
      `};`, ``,
      `<span class="k">export const</span> <span class="p">streak</span> = <span class="n">12</span>; <span class="c">// days. don't look at the gaps</span>`,
    ];
    return `<div class="xl xl-code"><div class="etabs"><span class="on">projects.ts</span><span>activity.log</span><span>todo.md</span></div>
      <div class="ed">${L.map(l => `<div><span>${l || " "}</span></div>`).join("")}</div>
      <div class="term"><div class="row"><span class="pr">sal@room</span> ~/aranessa $ git log --oneline -4</div>
        ${D.commits.map(([r, m]) => `<div class="row"><span style="color:#f0c674">${sha(m)}</span> ${m}</div>`).join("")}
        <div class="row" style="margin-top:10px"><span class="pr">sal@room</span> ~ $ activity --weeks 26</div><div style="margin-top:6px">${heat(182, 10)}</div></div></div>`;
  },

  write: () => `<div class="xl xl-write"><div class="nb">
    <div class="nbdate">${D.posts[0][1]}, 2026</div><h1>${D.posts[0][0]}</h1>
    <p>${D.posts[0][2]} the shelf moved twice this month. the desk faces the window now. this site is the same: every time it feels like a page instead of a place, i move something.</p>
    <p>anyway. the lamp is on. come in.</p>
    <div class="nbh">older pages</div>${D.posts.slice(1).map(([t, d]) => `<div class="nbi"><b>${t}</b><span>${d}</span></div>`).join("")}
  </div></div>`,

  gallery: () => `<div class="xl xl-gallery"><div class="wall">${D.photos.map((p, i) => `<figure class="pol" style="margin:0 0 24px"><i style="background:${art(p)};aspect-ratio:${["4/5", "1/1", "3/4", "4/3"][hash(p) % 4]}"></i><figcaption>${p}</figcaption></figure>`).join("")}</div></div>`,

  shows: () => `<div class="xl xl-shows"><div class="scount">14 <span>shows · 5 cities · 1 ruined pair of shoes</span></div>
    <div class="bands">${D.shows.map(([a, c, d]) => `<div class="wb" style="background:${art(a)}"><div class="clasp"></div><span>${a}</span><span>${c} · ${d}</span></div>`).join("")}</div></div>`,

  now: () => `<div class="xl xl-now"><div class="sticky2">daydreaming.<br>learning japanese, slowly.<br>building this room.<small>stuck on the fridge · oct 17</small></div></div>`,

  uses: () => `<div class="xl xl-uses"><div class="receipt"><div class="ct">SAL'S ROOM<br>THINGS I USE</div><hr>
    ${D.uses.map(([k, v]) => `<div class="ri"><span>${k}</span><b>${v}</b></div>`).join("")}<hr><div class="ri"><span>TOTAL</span><b>worth it</b></div>
    <div class="ct" style="margin-top:10px">thank you, come again</div></div></div>`,

  elsewhere: () => `<div class="xl xl-elsewhere"><div class="big" style="font-size:28px">elsewhere</div><div class="stamps" style="margin-top:14px">${D.socials.map(s => `<a href="#">${s}</a>`).join("")}</div></div>`,
};

const UNI = k => `<div class="xl xl-u"><div class="eyebrow">${glyph(k)} ${NAME[k]}</div>${A[k].l()}</div>`;
