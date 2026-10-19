// Watch. Door: a crt telly showing the latest watch over a numbered channel guide; hovering a channel tunes the set
// to it (client/watch.ts). Opened: the set + its guide on top, favorites, reviews as guide rows, the also finished wall.
import type { Progress, RoomData } from "../../lib/room";
import { ago, chips, cov, esc, ext, freshLabel, glyph, monthYear, pad2, sec, types, wall } from "./util";

type Watch = RoomData["watch"];

// what the progress reads as on an object: "e16", "s4e9", "film", "finished"
const ep = (x: Progress) => (x.type === "movie" ? "film" : x.prog === "done" ? "finished" : x.prog);
// how far through, when the source knows the episode count. films and finished things are whole
const pct = (x: Progress) =>
	x.prog === "done" || x.type === "movie" ? 1 : x.total && /^e\d+$/.test(x.prog) ? Math.min(1, parseInt(x.prog.slice(1), 10) / x.total) : null;
const ofTotal = (x: Progress) => (x.total && /^e\d+$/.test(x.prog) ? `${x.prog} of ${x.total}` : ep(x));
// one way to write a rating everywhere: "★8" (reviews come in as "8/10")
const star = (r: string) => (r ? `★${String(r).replace(/\/10$/, "")}` : "");

// what a channel tunes the set to: the picture, the on-screen text, the progress, and (in the view) the caption
const tune = (x: Progress, i: number, caption = false) =>
	`data-bg="${esc(cov(x))}" data-osd="${esc(`ch ${pad2(i)} · ${ep(x)}`)}" data-pct="${pct(x) ?? 0}"${caption ? ` data-title="${esc(x.t)}" data-sub="${esc(`${x.type} · ${ofTotal(x)}`)}"` : ""}`;
// the crt: off (dim, "stop") until the door is live or hovered
const tv = (x: Progress, osd: string) => {
	const p = pct(x);
	return `<div class="tvb"><div class="scr"><i style="background:${cov(x)}"></i><span class="nz"></span><span class="osd">${osd}</span><span class="off">■ stop</span>${p ? `<span class="pb"><s style="width:${p * 100}%"></s></span>` : ""}</div>
      <div class="ctl"><b></b><b></b><span class="led"></span></div></div>`;
};

export const watchHead = (W: Watch) => `<span class="muted">${freshLabel(W.now?.date, "watching")}</span>`;

// the door goes live (set on) while something was watched in the last 3 hours; client/watch.ts checks again
export const watchDoor = (W: Watch) =>
	`<div class="hero t wd-full wd-chan" data-fresh-live="${W.now.date}">${tv(W.now, `ch 01 · ${esc(ep(W.now))}`)}<div class="gd">${W.recent
		.slice(0, 16)
		.map((x, i) => `<div class="ch${i ? "" : " on"}" data-i="${i}" ${tune(x, i)}><em>${pad2(i)}</em><b>${esc(x.t)}</b><span>${esc(ep(x))}</span></div>`)
		.join("")}</div></div>`;

export const watchView = (W: Watch) => {
	const n = W.now;
	const filter = chips("filter", types([...W.recent, ...W.favorites, ...W.reviews, ...W.finished].map((x) => x.type)), "all");
	const guide = `<div class="gd">${W.recent
		.map((x, i) => {
			const p = pct(x);
			return `<a class="ch${i ? "" : " on"}" ${ext(x.url)} data-ti="${i}" ${tune(x, i, true)} data-type="${x.type}"><em>${pad2(i)}</em><b>${esc(x.t)}</b><span>${esc(ep(x))}</span><small>${ago(x.date)}</small>${p ? `<s style="width:${p * 100}%"></s>` : ""}</a>`;
		})
		.join("")}</div>`;
	const favs = sec(
		"favorites",
		`<div class="hrow3" style="padding-top:2px">${W.favorites.map((x) => `<a class="fav" ${ext(x.url)} data-type="${x.type}" title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i><div class="tag u-paper">${esc(x.t)}</div></a>`).join("")}</div>`,
	);
	// reviews written like the channel guide: a row each, two lines of the note, click anywhere for the rest
	const reviews = sec(
		"reviews &amp; notes",
		`<div class="bls">${W.reviews
			.map(
				(r) => `<div class="bl${r.spoiler ? " spoil" : ""}" data-type="${r.type}"><a class="cv" ${ext(r.url)} style="background:${cov(r)}"></a>
          <div class="tx"><div class="hd"><b>${esc(r.t)}</b>${r.r ? `<em>${star(r.r)}</em>` : ""}</div><small>${esc(r.sub)} · ${monthYear(r.date)}</small>
          <div class="note3" data-note>${esc(r.note.trim())}</div><span class="reveal">spoiler · click to reveal</span></div></div>`,
			)
			.join("")}</div>`,
		"data-archive data-cap=6",
	);
	return `<div class="v3 wv-set wv-bl" data-filterable><div class="wv-head"><div class="u-label">${glyph("watch")} ${freshLabel(n.date, "now watching", "last watched · ")}</div>${filter}</div>
    <div class="top" data-tune><div class="tvc">${tv(n, `ch 01 · ${esc(ep(n))}`)}<div class="u-title" data-tt>${esc(n.t)}</div><div class="u-sub" data-ts>${n.type} · ${esc(ofTotal(n))}</div></div>${sec("recently · channel guide", guide)}</div>
    ${favs}
    ${reviews}
    ${sec("also finished", wall(W.finished), "data-archive")}
  </div>`;
};
