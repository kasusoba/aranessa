// The "i" aspect. Door: the id card with the verbs stamped on it, hanging from its clip (it swings as the strip scrolls,
// client/me.ts). Opened: the badge on the desk, the line and the time as notes beside it. Socials live on the ledge.
import { BASE, glyph } from "./util";

// the line from the home page, verb by verb. a verb links to its door when the room has one
const WHATEVER: [string, string?][] = [["make"], ["play", "play"], ["listen to", "listen"], ["watch", "watch"], ["read", "read"], ["write", "write"], ["code", "code"], ["draw", "draw"], ["share", "gallery"]];
const verb = ([v, k]: [string, string?], cls: string) =>
	`<span class="${cls}"${k && (BASE as readonly string[]).includes(k) ? ` data-go="${k}"` : ""}>${v}</span>`;

// a signature drawn as one stroke: s, a, a tall looped l, then a flourish back under the name
const SIG = `<svg class="sig" viewBox="0 0 160 72" aria-label="sal"><path pathLength="1" d="M4 54C18 42 38 8 30 9C20 11 17 26 29 32C42 38 31 56 15 51
  M40 39C46 28 59 26 56 37C53 47 42 47 46 38C50 30 60 32 58 42C57 49 63 48 69 41
  C79 29 94 -1 83 2C72 5 70 35 74 48C77 57 85 54 91 45
  C101 33 121 31 112 41C100 55 40 67 10 61C42 64 112 58 156 33"/></svg>`;

const card = (photo: string, egg = false) => `<div class="card u-paper u-lit">
  <div class="top"><span>RESIDENT</span><span>No. 0001</span></div>
  <i class="m-photo"${egg ? " data-egg-trigger" : ""} style="background-image:url('${photo}')"></i>
  <b>sal</b>
  <small>does</small>
  <div class="stk">${WHATEVER.map((w) => verb(w, "s")).join("")}</div><div class="does">whatever.</div>
  ${SIG}<div class="code"></div></div>`;

export const meHead = () => `<span data-clock>--:--</span>`;
export const meDoor = (photo: string) => `<div class="m-badge" data-swing><div class="clip"></div>${card(photo)}</div>`;
export const meView = (photo: string) => `<div class="v3 mo mo-desk">
  <div class="obj"><div class="m-badge big"><div class="clip"></div>${card(photo, true)}</div></div>
  <div class="notes">
    <div class="u-label">${glyph("me")} hey</div><div class="u-title">i'm sal.</div>
    <p class="mo-line">${WHATEVER.map((w) => `<span class="ln">i ${verb(w, "v")} whatever.</span>`).join(" ")}</p>
    <div class="u-label">right now</div><div class="mo-pres"><span data-clock>--:--</span> in <span class="nosy">nosy</span></div>
  </div></div>`;
