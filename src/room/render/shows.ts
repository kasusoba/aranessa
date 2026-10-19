// Shows. Every night hangs as the wristband it came with (festival days the rfid band, single shows tyvek, satin or woven),
// swinging off a rail when brushed (client/shows.ts). Door: the rail with a caption that follows the hovered band.
// Opened: the latest six bands at wristband scale, older nights in a box under the rail, the picked night's setlists beside.
import type { Show } from "../../lib/room";
import { ago, cov, esc, ext, fmt, glyph, hash } from "./util";

// one night = one venue on one date (a festival day holds several sets), newest first like the sets
interface Night {
	date: string;
	venue: string;
	city: string;
	acts: Show[];
}
export const nightsOf = (S: Show[]) => {
	const nights: Night[] = [];
	for (const s of S) {
		const n = nights.find((x) => x.date === s.date && x.venue === s.venue);
		if (n) n.acts.push(s);
		else nights.push({ date: s.date, venue: s.venue, city: s.city, acts: [s] });
	}
	return nights;
};

// dates are stored at utc midnight, read them back in utc
const dots = (iso: string) => fmt(iso, { day: "2-digit", month: "2-digit", year: "2-digit" }, "UTC").replace(/\//g, ".");
const longd = (iso: string) => fmt(iso, { weekday: "short", day: "numeric", month: "short", year: "numeric" }, "UTC").replace(",", "");
const yr = (iso: string) => new Date(iso).getUTCFullYear();
const photo = (s: Show) => cov({ img: s.img }, s.artist);
const names = (n: Night) => n.acts.map((s) => esc(s.artist)).join(" / ");
const hue = (n: Night) => hash(n.venue + n.date) % 360;
const bars = (seed: string) => `background-position:${hash(seed) % 40}px 0`;
const r = (seed: string, k = 1) => ((hash(seed) % 7) - 3) * k;

// each night's band, in order. a festival day gets the rfid band, single shows take turns between tyvek, satin and woven
const MIX = ["tyv", "sat", "woven"];
const KIND: Record<string, string> = { tyv: "k-tyv", sat: "k-sat", woven: "k-woven", rfid: "k-rfid" };
const bands = (N: Night[]) => {
	let solo = 0;
	const woven = (n: Night) => `${n.acts.map((s) => s.artist).join(" ✦ ")} ✦ ${n.city} ${yr(n.date)} ✦ `;
	const text = (k: string, n: Night, rep: number) =>
		k === "tyv"
			? `admit one ✦ ${dots(n.date)} ✦ no. ${String(hash(n.venue + n.date) % 100000).padStart(5, "0")} ✦ `.repeat(rep)
			: k === "sat"
				? `${n.acts.map((s) => s.artist).join(" · ")} · ${yr(n.date)} · `.repeat(rep)
				: woven(n).repeat(rep);
	const end = (k: string, n: Night) =>
		k === "tyv"
			? `<span class="ad"><i></i><i></i><i></i></span>`
			: k === "rfid"
				? `<span class="rf"><b>${dots(n.date)}</b><i class="bc" style="${bars(n.date)}"></i></span>`
				: `<span class="lk"><i></i></span>`;
	return N.map((n, i) => {
		const k = n.acts.length > 1 ? "rfid" : MIX[solo++ % MIX.length];
		return `<div class="hb ${KIND[k]}${i ? "" : " on"}" data-n="${i}" style="--h:${hue(n)};--l:${[100, 86, 76, 66, 58][i % 5]}%;">
        ${k === "sat" ? `<span class="db">${dots(n.date)}</span>` : ""}<span class="tx">${esc(text(k, n, 3))}</span>
        <div class="lo"><span class="tx">${esc(text(k, n, 2))}</span>${end(k, n)}<span class="fr"></span></div></div>`;
	});
};
const rail = (hbs: string[], tune = "", after = "") =>
	`<div class="hero t sd-full sd-hang${tune} hs-mix"><span class="rod"></span><div class="rb">${hbs.join("")}</div>${after}</div>`;

export const showsHead = (S: Show[]) => `<span class="muted">${nightsOf(S).length}</span>`;

export const showsDoor = (S: Show[]) => {
	const N = nightsOf(S);
	const cap = `<div class="cap sw">${N.map((n, i) => `<div class="${i ? "" : "on"}"><b>${names(n)}</b><span>${dots(n.date)} · ${esc(n.city.toLowerCase())} · ${n.acts.length > 1 ? `${n.acts.length} sets` : `${n.acts[0].songs.length} songs`}</span></div>`).join("")}</div>`;
	return rail(bands(N), " sd-tune", cap);
};

export const showsView = (S: Show[]) => {
	const N = nightsOf(S);
	const hbs = bands(N);
	const sets = N.flatMap((n) => n.acts);
	const songs = sets.reduce((t, s) => t + s.songs.length, 0);
	const cities = [...new Set(N.map((n) => n.city.toLowerCase()))];
	const many = (n: Night) => (n.acts.length > 1 ? `${n.acts.length} sets, one day` : `${n.acts[0].songs.length} songs`);
	// a stage setlist taped down, with a small print of the artist pinned in the corner
	const sheet = (s: Show, fan = "") => `<div class="shv-sheet u-lit" style="${fan}--r:${r(s.id, 0.5)}deg"><span class="tp"></span><span class="tp b"></span>
    ${s.img ? `<i class="ph" style="background:${photo(s)}"></i>` : ""}
    <div class="hd"><b>${esc(s.artist)}</b><span>${dots(s.date)}</span></div>
    <div class="vn">${esc(s.venue)}${s.tour ? ` · ${esc(s.tour)}` : ""}</div>
    ${s.songs.length ? `<ol>${s.songs.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>` : `<p class="none">no setlist yet</p>`}
    <a class="sf" ${ext(s.url)}>${s.songs.length} songs · setlist.fm ↗</a></div>`;
	// a night beside the rail: setlists in a row up to three, past that one overlapping hand that squeezes to fit the column
	const night = (n: Night) => {
		const fan = n.acts.length > 3;
		return `<div class="shv-night"><div class="nh"><b>${longd(n.date)}</b><span>${esc(n.venue)} · ${esc(n.city.toLowerCase())} · ${many(n)} · ${ago(n.date)}</span></div>
    <div class="sheets${fan ? ` fan" style="--k:${n.acts.length - 1}` : ""}">${n.acts.map((s, j) => sheet(s, fan ? `--i:${j};z-index:${10 - j};` : "")).join("")}</div></div>`;
	};
	const box =
		N.length > 6
			? `<div class="bx"><div class="u-label">in the box · ${N.length - 6}</div><ul>${N.slice(6)
					.map((n, j) => `<li data-n="${j + 6}"><i style="--h:${hue(n)}"></i><b>${dots(n.date)}</b><span>${names(n)}</span></li>`)
					.join("")}</ul></div>`
			: "";
	return `<div class="v3 shv shv-rail shv-bb shv-bbox"><div class="shv-head"><div class="u-label">${glyph("shows")} i was there · last ${ago(N[0].date)}</div>
    <div class="u-title">${N.length} nights</div><div class="u-sub">${sets.length} sets · ${songs} songs · ${cities.map(esc).join(", ")} · since ${yr(N[N.length - 1].date)}</div></div>
    <div class="shv-tune bs"><div>${rail(hbs.slice(0, 6))}${box}</div><div class="sw rt">${N.map((n, i) => `<div class="${i ? "" : "on"}">${night(n)}</div>`).join("")}</div></div></div>`;
};
