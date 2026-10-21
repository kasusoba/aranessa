// Listen. Door: the "peek" crate, the albums behind the recent plays filed back to front (client/listen.ts lifts the
// hovered one). Opened: the crate grown, holding the period's top albums; hover an edge or a line and that album comes out.
import type { ListenData, ListenItem, ListenTrack } from "../../lib/listen";
import { ago, chips, cov, DEFAULT_PERIOD, esc, ext, fmt, glyph, hm, PERIODS, pad2, sec } from "./util";

const lo = (s: string) => esc(String(s ?? "").toLowerCase());
const day = (iso: string) => fmt(iso, { day: "2-digit", month: "short" });

// the albums behind the recent plays, newest first, topped up with the top albums of the longer periods
const albums = (L: ListenData, n: number) => {
	const seen = new Set<string>();
	const out: { name: string; artist: string; img: string }[] = [];
	const add = (a: { name: string; artist: string; img: string }) => {
		if (a.name && !seen.has(a.name)) {
			seen.add(a.name);
			out.push(a);
		}
	};
	[L.now, ...L.recent].forEach((t) => add({ name: t.album, artist: t.artist, img: t.img }));
	["7day", "1month", "3month", "overall"].forEach((p) => L.periods[p]?.albums.forEach(add));
	return out.slice(0, n);
};

// the door head says how long ago, until client/live.ts sees something playing
export const listenHead = (L: ListenData) => `<span class="muted" data-np-head>${ago(L.now?.date)}</span>`;

// the crate: sleeves back to front, the front one last; only the front album and a peeking one show their paper label
export const listenDoor = (L: ListenData) => {
	const a = albums(L, 14).reverse();
	return `<div class="hero t ld-full ld-crate ld-peek"><div class="stk">${a
		.map((x, i) => `<div class="sv" title="${esc(x.name)}, ${esc(x.artist)}"><i style="background:${cov(x)};--d:${a.length - 1 - i}"><b class="u-paper">${lo(x.name)}</b></i></div>`)
		.join("")}</div></div>`;
};

export const listenView = (L: ListenData) => {
	const plays = [L.now, ...L.recent];
	const periods = PERIODS.filter(([p]) => L.periods[p]);
	const label = (p: string) => PERIODS.find(([k]) => k === p)?.[1] ?? p;
	const panes = (body: (d: ListenData["periods"][string], p: string) => string) =>
		periods.map(([p]) => `<div data-pane="period" data-v="${p}"${p === DEFAULT_PERIOD ? "" : " hidden"}>${body(L.periods[p], p)}</div>`).join("");

	// recently, as listening sessions: consecutive plays from the same album fold under one cover, days get a header
	const sessions: { album: string; artist: string; img: string; url: string; tracks: ListenTrack[] }[] = [];
	for (const t of plays) {
		const g = sessions.at(-1);
		if (g && g.album === t.album && g.artist === t.artist) g.tracks.push(t);
		else sessions.push({ album: t.album, artist: t.artist, img: t.img, url: t.url, tracks: [t] });
	}
	let d = "";
	// a track that was playing when the site was built carries data-np-built, so client/live.ts can hide it while
	// it's still the one playing (the live row on top shows it)
	const recently = sec(
		"recently",
		`<div class="lv-sess"><div class="ss np" data-np-row hidden></div>${sessions
			.map((g) => {
				const dd = day(g.tracks[0].date);
				const dh = dd !== d ? `<div class="dh">${dd}</div>` : "";
				d = dd;
				return `${dh}<div class="ss"><i class="u-lit" style="background:${cov(g, g.artist + g.album)}"></i><div><b>${esc(g.album || g.tracks[0].name)}</b><small>${lo(g.artist)}</small>
        <ol>${g.tracks.map((t) => `<li${t === L.now && t.live ? ` data-np-built="${esc(t.name)}"` : ""}><a ${ext(t.url)}>${esc(t.name)}</a><em>${hm(t.date)}</em></li>`).join("")}</ol></div></div>`;
			})
			.join("")}</div>`,
	);
	const artists = (d: ListenData["periods"][string]) =>
		sec("top artists", `<ul class="u-list">${d.artists.map((a, i) => `<li style="align-items:center"><em>${pad2(i)}</em><span class="pin" style="background:${cov(a)}"></span><a ${ext(a.url)}><b>${lo(a.name)}</b></a><i class="gold">${a.plays}</i></li>`).join("")}</ul>`);
	const tracks = (d: ListenData["periods"][string]) =>
		sec("top tracks", `<ul class="u-list">${d.tracks.map((t, i) => `<li><em>${pad2(i)}</em><a ${ext(t.url)} style="min-width:0"><b style="display:block">${lo(t.name)}</b><span>${lo(t.artist)}</span></a><i class="gold">${t.plays}</i></li>`).join("")}</ul>`);

	// the door's crate, big: the first album stands in front, the rest show their top edges behind it
	const crate = (list: ListenItem[], w: number) =>
		`<div class="ld-crate lv-crate" style="--fw:${w}px;--n:${list.length - 1}"><div class="stk">${list
			.map((a, i) => ({ a, i }))
			.reverse()
			.map(({ a, i }) => `<div class="sv${i ? "" : " on"}" data-n="${i}" title="${esc(a.name)}, ${esc(a.artist)}"><i style="background:${cov(a)};--d:${Math.min(i, 10)}"></i></div>`)
			.join("")}</div></div>`;
	// the picked album pulled out: the sleeve with its record sliding out the side, then the notes
	const pulled = (list: ListenItem[], p: string) =>
		`<div class="lv-pull sw">${list
			.map(
				(a, i) => `<div class="pl${i ? "" : " on"}">
    <a class="sl" ${ext(a.url)}><span class="rc"><i style="background:${cov(a)}"></i></span><i class="u-lit" style="background:${cov(a)}"></i><em class="sticker">${a.plays}</em></a>
    <div class="tx"><div class="u-label">no. ${i + 1} · ${label(p)}</div><a class="u-title" ${ext(a.url)}>${esc(a.name)}</a><div class="u-sub">${esc(a.artist)}</div>
      <div class="nums"><b>${a.plays}</b> plays</div></div></div>`,
			)
			.join("")}</div>`;
	const rows = (list: ListenItem[]) =>
		`<ol class="lv-rows">${list.map((a, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><em>${pad2(i)}</em><b>${esc(a.name)}</b><span>${lo(a.artist)}</span><i class="gold">${a.plays}</i></li>`).join("")}</ol>`;

	return `<div class="v3 lsv"><div class="wv-head"><div class="u-label">${glyph("listen")} <span data-np-view>last played · ${ago(L.now?.date)}</span></div>${chips("period", periods, DEFAULT_PERIOD)}</div>
    ${panes((d, p) => `<div class="lv-tune lv-big">${crate(d.albums, 230)}<div class="rt">${pulled(d.albums, p)}${rows(d.albums)}</div></div>
      <div class="cols3">${artists(d)}${tracks(d)}</div>`)}
    ${recently}<p class="pv-foot">scrobbled on last.fm</p></div>`;
};
