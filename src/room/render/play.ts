// Play. Door: five cases fanned over the list of the same five; hover a case and its line lights up, hover a line and its
// case comes up. Opened: the hand with chips switching it between what's been played lately and the most played of all
// time, each with its list and the picked game's detail; then the latest unlocks and the library count.
import type { Game, RoomData } from "../../lib/room";
import { ago, chips, cov, esc, ext, fmt, freshLabel, glyph, hours, sec } from "./util";

type Play = NonNullable<RoomData["play"]>;

const day = (iso: string | null) => (iso ? fmt(iso, { day: "2-digit", month: "short" }) : "");
const hrsN = (m: number) => (m < 60 ? "<1" : Math.round(m / 60).toLocaleString());
// object-printed playtime: "125h", or minutes under an hour
const hrs = (g: Game) => (g.mins < 60 ? `${g.mins}m` : `${Math.round(g.mins / 60)}h`);
const achOf = (g: Game) => (g.ach?.total ? `${g.ach.got}/${g.ach.total}` : "");
const icon = (u: string) => `url('${u}') center/cover, #1d1f25`;

export const playHead = (P: Play) => `<span class="muted">${freshLabel(P.games[0].last, "playing")}</span>`;

// a hand of cases: the first one in front and upright, the rest alternate left and right behind it, further out the further back
const fanOrder = (list: Game[], step: number) => list.map((g, i) => ({ g, i, r: i ? (i % 2 ? -1 : 1) * Math.ceil(i / 2) * step : 0 })).reverse();

export const playDoor = (P: Play) => {
	const G = P.games.slice(0, 5);
	return `<div class="hero t pd-full pd-fan pd-tune pd-fanlink"><div class="fan five">${fanOrder(G, 10)
		.map(({ g, i, r }) => `<div class="cs" data-n="${i}" title="${esc(g.t)} · ${hours(g.mins)}" style="--r:${r}deg"><i style="background:${cov(g)}"></i></div>`)
		.join("")}</div>
    <ul>${G.map((g, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${esc(g.t)}</b><span>${hours(g.mins)} · ${ago(g.last)}${achOf(g) ? ` · ★${achOf(g)}` : ""}</span></li>`).join("")}</ul></div>`;
};

export const playView = (P: Play) => {
	const fan = (list: Game[], w: number, step: number, stk: boolean) =>
		`<div class="pd-fan pv-fan"><div class="fan" style="--w:${w}px">${fanOrder(list, step)
			.map(({ g, i, r }) => `<a class="cs${i ? "" : " on"}" data-n="${i}" ${ext(g.url)} title="${esc(g.t)}" style="--r:${r}deg"><i style="background:${cov(g)}"></i>${stk ? `<em class="stk u-paper">${hrs(g)}</em>` : ""}</a>`)
			.join("")}</div></div>`;
	// one line per game: title, hours, when, and an achievements meter where steam has them
	const rows = (list: Game[]) =>
		`<ul class="pv-rows">${list
			.map(
				(g, i) => `<li data-n="${i}" class="${i ? "" : "on"}"><b>${esc(g.t)}</b>
    <span>${hours(g.mins)} · ${ago(g.last)}</span>${g.ach?.total ? `<span class="mtr" title="${achOf(g)} achievements"><s style="width:${(g.ach.got / g.ach.total) * 100}%"></s></span>` : ""}</li>`,
			)
			.join("")}</ul>`;
	const unlock = (a: { title: string; desc: string; icon: string; at: string }) =>
		`<div class="un"><i style="background:${icon(a.icon)}"></i><div><b>${esc(a.title)}</b><span>${esc(a.desc)}</span></div><em>${day(a.at)}</em></div>`;
	// the detail for one game, one per game stacked in a .sw so hovering a case or a row switches it
	const detail = (g: Game, i: number) => `<div class="dt${i ? "" : " on"}">
    <a class="tt" ${ext(g.url)}>${esc(g.t)}</a>
    <div class="nums"><span><b>${hrsN(g.mins)}</b> hrs</span>${g.mins2w ? `<span><b>${hrsN(g.mins2w)}</b> hrs the last two weeks</span>` : ""}</div>
    <small>last played ${day(g.last)} · ${ago(g.last)}</small>
    ${
			g.ach?.total
				? `<div class="u-label">achievements · ${achOf(g)}</div><span class="mtr"><s style="width:${(g.ach.got / g.ach.total) * 100}%"></s></span>
      ${g.ach.recent.slice(0, 3).map(unlock).join("")}`
				: `<div class="u-label">achievements</div><p class="none">${g.ach ? "none yet" : "this one has none on steam"}</p>`
		}</div>`;
	const unlocks = sec(
		"latest unlocks",
		`<div class="pv-un">${P.ach
			.slice(0, 8)
			.map((a) => `<div class="un"><i style="background:${icon(a.icon)}"></i><div><b>${esc(a.title)}</b><span>${esc(a.desc)}</span><small>${esc(a.game)} · ${day(a.at)}</small></div></div>`)
			.join("")}</div>`,
	);
	const foot = `<p class="pv-foot">${P.owned} games in the library · ${P.played} played · ${P.unplayed} never played · ${Math.round(P.mins / 60).toLocaleString()} hrs · <a ${ext(P.profile)}>steam profile ↗</a></p>`;

	return `<div class="v3 pv pv-hand"><div class="wv-head"><div class="u-label">${glyph("play")} ${freshLabel(P.games[0].last, "playing", "last played · ")}</div>${chips("hand", [["lately", "lately"], ["most", "most played"]], "lately")}</div>
    ${(
			[
				["lately", P.games],
				["most", P.top],
			] as const
		)
			.map(
				([k, L]) => `<div data-pane="hand" data-v="${k}"${k === "lately" ? "" : " hidden"}><div class="pv-tune">${fan(L.slice(0, 7), 128, 9, k === "most")}
    <div class="pv-two">${rows(L)}<div class="pv-dt sw">${L.map(detail).join("")}</div></div></div></div>`,
			)
			.join("")}${unlocks}${foot}</div>`;
};
