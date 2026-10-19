// The whole room as html: a strip of doors, the placeholder that always ends it, and the ledge under it.
// Each door carries its opened view in a <template>, except the one that's open (a page like /listen), rendered in place.
import { userConfig } from "../../config";
import type { RoomData } from "../../lib/room";
import { codeDoor, codeHead, codeView } from "./code";
import { listenDoor, listenHead, listenView } from "./listen";
import { meDoor, meHead, meView } from "./me";
import { playDoor, playHead, playView } from "./play";
import { readDoor, readHead, readView } from "./read";
import { showsDoor, showsHead, showsView } from "./shows";
import { type Aspect, esc, ext, glyph, NAME } from "./util";
import { watchDoor, watchHead, watchView } from "./watch";

// where each door lives: "i" opens at /i, the rest at their own name
export const pathOf = (k: string) => `/${k === "me" ? "i" : k}`;

interface Door {
	k: Aspect;
	head: string;
	door: string;
	view: string;
}

// a door only goes up when its source had something to show
export function doors(D: RoomData, photo: string): Door[] {
	const list: (Door | false)[] = [
		{ k: "me", head: meHead(), door: meDoor(photo), view: meView(photo) },
		!!D.listen.now && { k: "listen", head: listenHead(D.listen), door: listenDoor(D.listen), view: listenView(D.listen) },
		!!D.watch.now && { k: "watch", head: watchHead(D.watch), door: watchDoor(D.watch), view: watchView(D.watch) },
		D.read.reading.length > 0 && { k: "read", head: readHead(), door: readDoor(D.read), view: readView(D.read) },
		!!D.play?.games.length && { k: "play", head: playHead(D.play), door: playDoor(D.play), view: playView(D.play) },
		D.code.projects.length > 0 && { k: "code", head: codeHead(D.code), door: codeDoor(D.code), view: codeView(D.code) },
		D.shows.length > 0 && { k: "shows", head: showsHead(D.shows), door: showsDoor(D.shows), view: showsView(D.shows) },
	];
	return list.filter((d): d is Door => !!d);
}

// on a phone the doors stand on two shelves, top then bottom column by column; each door keeps its cell (--r, --c), so
// one opening over the shelves leaves a gap instead of shifting the rest
const cell = (i: number) => `--r:${(i % 2) + 1};--c:${Math.floor(i / 2) + 1}`;

const box = (d: Door, open: boolean, i: number) => `<div class="box${open ? " on has-xl" : ""}" data-k="${d.k}" style="${cell(i)}">
    <div class="head">${glyph(d.k)}<a class="nm" href="${pathOf(d.k)}">${NAME[d.k]}</a>${d.head}<span class="cue">+</span></div>
    <button class="x" data-close aria-label="close">esc</button>
    <div class="lv lv-s">${d.door}</div>
    ${open ? `<div class="lv-xl">${d.view}</div>` : `<template data-view>${d.view}</template>`}
  </div>`;

// the placeholder that always ends the strip, so it always runs past the screen: a floor plan, the opening leading
// into a room drawn only as a dashed outline with a "?" in it
const end = (i: number) => `<div class="box end-box" aria-hidden="true" style="${cell(i)}"><div class="ed ed-plan pn-up"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" class="pn">
    <path class="wl" d="M4 70 H30 M70 70 H96"/><path class="lf" d="M30 70 L30 30"/><path class="arc" d="M30 30 A40 40 0 0 1 70 70"/><path class="rm" d="M4 70 V-50 H96 V70"/><text class="q" x="50" y="-4">?</text></svg></div></div>`;

// the ledge: the now pill (opens the sticky note) and the socials. a narrow ledge folds the socials into an elsewhere pill
const ledge = () => {
	const { lines, updated } = userConfig.now;
	const date = new Date(updated).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).toLowerCase();
	const links = (sep: string) => userConfig.socials.map((s) => `<a ${ext(s.url)}>${esc(s.name)}</a>`).join(sep);
	return `<div class="ledge" id="ledge">
    <button class="lg" data-pop="now" aria-expanded="false">${glyph("now")} now <i>"${esc(lines[0])}"</i></button>
    <span class="sp"></span>
    <span class="lg links">${glyph("elsewhere")} ${links(" ")}</span>
    <button class="lg elsewhere" data-pop="elsewhere" aria-expanded="false" aria-label="elsewhere">${glyph("elsewhere")} elsewhere</button>
    <div class="pop pop-links" data-for="elsewhere">${links("")}</div>
    <div class="pop bare" data-for="now" style="width:320px"><div style="position:relative;height:280px"><div class="u-small"><div class="u-sticky">${lines.map(esc).join("<br>")}<small>updated ${date}</small></div></div></div></div>
  </div>`;
};

export function renderRoom(D: RoomData, photo: string, open?: string) {
	const list = doors(D, photo);
	return `<section class="concept on" id="c-strip">
  <div class="strip${open ? " has-on" : ""}" id="strip">${list.map((d, i) => box(d, d.k === open, i)).join("")}${end(list.length)}</div>
  ${ledge()}
</section>`;
}
