/* opened views, v2: same design language for every aspect (see xl2.css header). sample data only. */
const XL2_SIZE = { now: [320, 280], uses: [360, 420] };
const pad2 = i => String(i + 1).padStart(2, "0");
const keep = (k, html) => html.replace(`class="xl xl-${k}"`, `class="xl xl-${k} u-keep"`);

const XL2 = {
  me: () => keep("me", XL.me()),
  listen: () => keep("listen", XL.listen()),
  code: () => keep("code", XL.code()),

  watch: () => `<div class="u">
    <div class="u-obj">
      <div class="w-hero"><div class="w-poster u-lit" style="background:${art(D.watch[0][0])}"></div>
        <div class="w-stub u-paper u-lit">ADMIT ONE<b>${D.watch[0][0]}</b>${D.watch[0][1].toUpperCase()}<span class="stamp">38%</span></div></div>
      <div><div class="u-label">${glyph("watch")} now showing</div><div class="u-title">${D.watch[0][0]}</div><div class="u-sub">${D.watch[0][1]} · 38% in</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">stubs · lately</div>
      <ul class="u-list">${D.watch.slice(1).map(([t, k, r], i) => `<li><em>${pad2(i)}</em><b>${t}</b><span>${k}</span><i class="st">${stars(r)}</i></li>`).join("")}</ul>
      <div class="u-label">this year</div>
      <div class="u-stats"><div><b>41</b>films</div><div><b>312</b>episodes</div><div><b>9</b>anime</div></div>
      <div class="u-foot">trakt · anilist · letterboxd<br>seat: the left side of the couch</div>
    </div></div>`,

  read: () => `<div class="u">
    <div class="u-obj">
      <div class="r-hero"><div class="r-mark u-paper u-lit">PAGE<b>152</b>of 245</div>
        <div class="r-book u-lit" style="background:${art(D.books[0][0])}">${D.books[0][0]}</div></div>
      <div><div class="u-label">${glyph("read")} currently reading</div><div class="u-title">${D.books[0][0]}</div><div class="u-sub">${D.books[0][1]} · 62%</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">from the page</div>
      <blockquote class="r-quote">"The Beauty of the House is immeasurable; its Kindness infinite."</blockquote>
      <div class="u-label">the shelf · 7 of 20 this year</div>
      <div class="r-spines">${D.books.slice(1).map(([t]) => `<i title="${t}" style="height:${46 + hash(t) % 26}px;background:${art(t)}"></i>`).join("")}</div>
      <ul class="u-list" style="margin-top:14px">${D.books.slice(1).map(([t, a], i) => `<li><em>${pad2(i)}</em><b>${t}</b><i>${a}</i></li>`).join("")}</ul>
      <div class="u-foot">hardcover · 2,140 pages this year</div>
    </div></div>`,

  play: () => `<div class="u">
    <div class="u-obj">
      <div class="p-cart u-lit"><div class="lb" style="background:${art(D.games[0][0])}">${D.games[0][0]}<small>${D.games[0][1].toUpperCase()}</small></div></div>
      <div><div class="u-label">${glyph("play")} continue</div><div class="u-title">${D.games[0][0]}</div><div class="u-sub">${D.games[0][1]} · last played 2 days ago</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">save slots</div>
      <ul class="u-list hov">${D.games.slice(1).map(([t, h], i) => `<li><b>slot ${pad2(i + 1)} · ${t}</b><i>${h}</i></li>`).join("")}</ul>
      <div class="u-label">the pile</div>
      <div class="u-stats"><div><b>47</b>in the backlog</div><div><b>243h</b>this year</div></div>
      <div class="u-hand" style="margin-top:14px">will finish silksong first. surely.</div>
      <div class="u-foot">steam · infinite backlog</div>
    </div></div>`,

  write: () => `<div class="u">
    <div class="u-obj">
      <div class="wr-card u-lit"><small>${D.posts[0][1]}, 2026</small><b>${D.posts[0][0]}</b><p>${D.posts[0][2]}</p></div>
      <div><div class="u-label">${glyph("write")} latest</div><div class="u-sub" style="margin-top:8px">read it · 4 min</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">older</div>
      <ul class="u-list hov">${D.posts.slice(1).map(([t, d], i) => `<li><em>${pad2(i + 1)}</em><b>${t}</b><i>${d}</i></li>`).join("")}</ul>
          </div></div>`,

  gallery: () => `<div class="u">
    <div class="u-obj">
      <figure class="g-print u-paper u-lit" style="margin:0"><i style="background:${art(D.photos[0])}"></i><figcaption>${D.photos[0]}</figcaption></figure>
      <div><div class="u-label">${glyph("gallery")} latest</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">all photos · ${D.photos.length}</div>
      <div class="g-sheet">${D.photos.map((p, i) => `<figure><i style="background:${art(p)}"></i><figcaption>${pad2(i)} ${p}</figcaption></figure>`).join("")}</div>
          </div></div>`,

  shows: () => `<div class="u">
    <div class="u-obj">
      <div class="s-bands">${D.shows.slice(0, 4).map(([a, c]) => `<div class="s-band u-lit" style="background:${art(a)}"><div class="cl"></div><span>${a}</span></div>`).join("")}</div>
      <div><div class="u-label">${glyph("shows")} i was there</div><div class="u-title">14 shows</div><div class="u-sub">5 cities</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">all shows</div>
      <ul class="u-list">${D.shows.map(([a, c, d], i) => `<li><em>${pad2(i)}</em><b>${a}</b><span>${c}</span><i>${d}</i></li>`).join("")}</ul>
      <div class="u-foot">setlist.fm</div>
    </div></div>`,

  now: () => `<div class="u-small"><div class="u-sticky">daydreaming.<br>learning japanese, slowly.<small>updated oct 17</small></div></div>`,
  uses: () => `<div class="u-small">${XL.uses().replace(/^<div class="xl xl-uses">|<\/div>$/g, "")}</div>`,
};
