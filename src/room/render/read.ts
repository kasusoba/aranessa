// Read. Door: the bedside stack, the current book standing on everything else lying flat; hover a spine and it slides
// out with its full title on a paper tag. Opened: the pile stays on the left, the rest scrolls on the right, and
// hovering anything puts that book on top of the pile (client/read.ts).
import type { Progress, RoomData } from "../../lib/room";
import { ago, chips, cov, esc, ext, glyph, hash, monthYear, sec, types } from "./util";

type Read = RoomData["read"];
type Shelved = { t: string; img: string; url: string; type: string; date?: string; r?: string; prog?: string; on?: boolean };

// object-printed titles drop the subtitle: "Sapiens: A Graphic History, ..." is "Sapiens"
const short = (t: string) => t.split(/: | - | \(/)[0].trim();
// where it's up to, as written on a bookmark: "78%", "ch 132"
const mk = (x: { type: string; prog?: string }) => (x.type === "book" ? (x.prog ?? "") : (x.prog ?? "").replace(/^ch/, "ch "));
// anilist gives undated entries the epoch; those have no date to print
const known = (iso?: string): iso is string => !!iso && new Date(iso).getFullYear() > 1971;
const due = (iso?: string) =>
	known(iso) ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "2-digit", timeZone: "Asia/Jakarta" }).format(new Date(iso)).toLowerCase() : "";
const rate = (x: { r?: string }) => (x.r ? `★${String(x.r).replace(/\/\d+$/, "")}` : "");
// one way to write a rating: "★8" for the /10 scale; books rated out of 5 keep their scale
const star = (r: string) => (r ? `★${String(r).replace(/\/10$/, "")}` : "");
// anilist notes open with the time they were written; the subtitle already has the month
const note = (n: string) => n.trim().replace(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}\s*/, "");
const dim = (x: Shelved) => `linear-gradient(rgba(0,0,0,.42), rgba(0,0,0,.42)), ${cov(x)}`;
// everything on the shelf once: what's being read (newest first), then everything finished, newest first. reviewed
// ones count too (the data keeps them out of "finished" so the view doesn't list them twice)
const shelf = (R: Read): Shelved[] => {
	const seen = new Set<string>();
	const done = [...R.finished, ...R.reviews].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
	return [...R.reading.map((x) => ({ ...x, on: true })), ...done].filter((x) => !seen.has(x.t) && seen.add(x.t));
};

export const readHead = () => `<span class="live">reading</span>`;

export const readDoor = (R: Read) => {
	const now = R.reading[0];
	const lying = (x: Shelved) => `<div class="bk${x.on ? " on" : ""}" title="${esc(x.t)}" style="height:${x.type === "manga" ? 15 : 20 + (hash(x.t) % 4)}px;width:${x.on ? 64 : 70 + (hash(x.t) % 18)}%;margin-left:${hash(`${x.t}x`) % 7}%;background:${dim(x)}">
    <span>${esc(short(x.t))}</span>${x.on ? `<em class="u-paper">${esc(mk(x))}</em>` : ""}<b class="tg u-paper">${esc(x.t)}<small>${x.on ? `reading · ${esc(mk(x))}` : `finished${rate(x) ? ` · ${rate(x)}` : ""}`}</small></b></div>`;
	return `<div class="hero t rd-full rd-stack rd-pull"><div class="top"><span class="mk u-paper">${esc(mk(now))}</span><i style="background:${cov(now)}"></i></div>${shelf(R)
		.slice(1)
		.map(lying)
		.join("")}</div>`;
};

export const readView = (R: Read) => {
	const now = R.reading[0];
	const year = new Date().getFullYear();
	const all = shelf(R);
	const thisYear = [...R.reviews, ...R.finished].filter((x) => known(x.date) && new Date(x.date).getFullYear() === year).length;

	// what hovering puts on top of the pile: its cover, the bookmark slip, the caption (data-ago adds "· 3h ago" in the browser)
	const lift = (x: Shelved, slip: string, sub: string, agoIso = "") =>
		`data-ti data-bg="${esc(cov(x))}" data-slip="${esc(slip)}" data-title="${esc(short(x.t))}" data-sub="${esc(sub)}"${agoIso ? ` data-sub-ago="${agoIso}"` : ""}`;
	const reading = (x: Shelved) => lift(x, mk(x), `${x.type} · ${mk(x)}`, x.date ?? "");
	const finished = (x: Shelved) => lift(x, x.r ? star(x.r) : "done", `${x.type} · finished${due(x.date) ? ` ${due(x.date)}` : ""}`);

	const filter = chips("filter", types([...R.reading, ...R.favorites, ...R.reviews, ...R.finished].map((x) => x.type)), "all");
	const going = R.reading
		.map(
			(x: Progress) => `<a class="rg" ${ext(x.url)} data-type="${x.type}" ${reading(x)}><i style="background:${cov(x)}"></i>
    <div><b>${esc(x.t)}</b><small>${x.type} · ${esc(mk(x))} · ${ago(x.date)}</small>${x.pct ? `<span class="mtr"><s style="width:${x.pct * 100}%"></s></span>` : ""}</div></a>`,
		)
		.join("");
	const favs = R.favorites.length
		? sec(
				"favorites",
				`<div class="hrow3" style="padding-top:2px">${R.favorites.map((x) => `<a class="fav" ${ext(x.url)} data-type="${x.type}" ${lift(x, "♥", `${x.type} · favorite`)} title="${esc(x.t)}"><i class="u-lit" style="background:${cov(x)}"></i><div class="tag u-paper">${esc(x.t)}</div></a>`).join("")}</div>`,
			)
		: "";
	// reviews as guide rows, the way the watch view settled: cover, serif title, rating, two lines, click anywhere for the rest
	const reviews = sec(
		"reviews &amp; notes",
		`<div class="bls">${R.reviews
			.map(
				(r) => `<div class="bl${r.spoiler ? " spoil" : ""}" data-type="${r.type}" ${lift(r, r.r ? star(r.r) : "done", `${r.sub} · ${monthYear(r.date)}`)}><a class="cv" ${ext(r.url)} style="background:${cov(r)}"></a>
    <div class="tx"><div class="hd"><b>${esc(r.t)}</b>${r.r ? `<em>${star(r.r)}</em>` : ""}</div><small>${esc(r.sub)} · ${monthYear(r.date)}</small>
    <div class="note3" data-note>${esc(note(r.note))}</div><span class="reveal">spoiler · click to reveal</span></div></div>`,
			)
			.join("")}</div>`,
		"data-archive data-cap=6",
	);
	const done = sec(
		"finished",
		`<div class="wallp">${R.finished.map((x) => `<a ${ext(x.url)} data-type="${x.type}" ${finished(x)} title="${esc(x.t)}"><i style="background:${cov(x)}"></i>${x.r ? `<b>★${esc(x.r)}</b>` : ""}</a>`).join("")}</div>`,
		"data-archive",
	);
	// the pile from the door, grown: the current book standing on everything else lying flat
	const lying = (x: Shelved) => `<a class="bk${x.on ? " on" : ""}" ${ext(x.url)} data-type="${x.type}" ${x.on ? reading(x) : finished(x)} style="height:${x.type === "manga" ? 22 : 28 + (hash(x.t) % 5)}px;width:${x.on ? 66 : 72 + (hash(x.t) % 18)}%;margin-left:${hash(`${x.t}x`) % 7}%;background:${dim(x)}">
    <span>${esc(short(x.t))}</span>${x.on ? `<em class="u-paper">${esc(mk(x))}</em>` : x.r ? `<em class="rt">${esc(rate(x))}</em>` : ""}
    <b class="tg u-paper">${esc(x.t)}<small>${x.on ? `reading · ${esc(mk(x))}` : `finished${due(x.date) ? ` · ${due(x.date)}` : ""}`}</small></b></a>`;
	const pile = `<div class="pl">
    <div class="stand"><span class="mk u-paper" data-sm>${esc(mk(now))}</span><a class="cv u-lit" ${ext(now.url)} data-sc style="background:${cov(now)}"></a></div>
    ${all.slice(1).map(lying).join("")}</div>`;

	return `<div class="v3 rv rv-lean wv-bl" data-filterable><div class="wv-head"><div class="u-label">${glyph("read")} reading · ${R.reading.length} on the go</div>${filter}</div>
    <div class="lay" data-lean data-home-bg="${esc(cov(now))}" data-home-slip="${esc(mk(now))}" data-home-tt="${esc(short(now.t))}" data-home-ts="${esc(`${now.type} · ${mk(now)}`)}" data-home-ago="${now.date}">
      <div class="sd">${pile}<div class="cap"><div class="u-title" data-tt>${esc(short(now.t))}</div><div class="u-sub" data-ts>${now.type} · ${esc(mk(now))} · ${ago(now.date)}</div></div></div>
      <div class="main">
        ${sec("on the go", `<div class="rgs">${going}</div>`)}${thisYear ? `<span class="u-hand rv-yr">${thisYear} finished this year</span>` : ""}
        ${favs}
        ${reviews}
        ${done}
      </div>
    </div>
  </div>`;
};
