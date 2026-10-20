// Code. A terminal window is the frame, the room's own voice is inside: serif project names, plain descriptions, and what
// changed lately on this site in plain words ("fixed ...", no shas). Door: the first featured project as a full card, the
// other featured ones as rows. Opened: the same window grown, every featured project big, the rest as rows, then lately.
import type { Commit, Project, RoomData } from "../../lib/room";
import { ago, art, esc, ext, fmt, fresh } from "./util";

type Code = RoomData["code"];

// commit messages in plain words: "fix: x" is ["fixed", "x"]
const VERB: Record<string, string> = { fix: "fixed", feat: "added", add: "added", chore: "tidied", refactor: "reworked", docs: "wrote", style: "styled", perf: "sped up" };
const human = (c: Commit): [string, string] => {
	const m = c.msg.match(/^(\w+)(\([^)]*\))?:\s*(.*)$/);
	if (m) return VERB[m[1]] ? [VERB[m[1]], m[3]] : ["changed", `${m[1]}, ${m[3]}`];
	return / add$/.test(c.msg) ? ["added", c.msg.replace(/ add$/, "")] : ["changed", c.msg];
};
// "today" within a day, else the date; kept current in the browser like ago()
const when = (iso: string) => `<time datetime="${iso}" data-when>${fresh(iso, 24) ? "today" : fmt(iso, { day: "2-digit", month: "short" })}</time>`;
const featured = (C: Code) => C.projects.filter((p) => p.featured);
const rest = (C: Code) => C.projects.filter((p) => !p.featured);
const shot = (p: Project) => (p.img ? `url('${p.img}') center/cover, #0a0f1c` : art(p.t));

export const codeHead = (C: Code) => `<span class="muted">${ago(C.commits[0]?.date)}</span>`;

export const codeDoor = (C: Code) => {
	const [a, ...more] = featured(C);
	const R = rest(C);
	const lab = (s: string) => `<div class="lb">${s}</div>`;
	const card = (p: Project, small = false) =>
		`<div class="pc${small ? " sm" : ""}" title="${esc(p.d)}"><i class="ic${small ? " sq" : ""}" style="background:${p.img ? `url('${p.img}') center/cover, #0a0f1c` : art(p.t)}"></i><div><b>${esc(p.t)}</b><span>${esc(p.cat)}</span>${small ? "" : `<p>${esc(p.d)}</p>`}</div></div>`;
	const last = C.commits[0];
	return `<div class="hero t cd-full cd-rd cd-wlead"><div class="wn"><div class="tb"><i></i><i></i><i></i><span>~/code</span></div><div class="bd">
    ${lab("featured")}${card(a)}${more.length ? `<div class="mr">${more.map((p) => card(p, true)).join("")}</div>` : ""}
    ${R.length ? `<div class="al">also ${R.map((p) => `<b>${esc(p.t)}</b>`).join(", ")}</div>` : ""}
    ${
			last
				? `${lab("lately")}<ul class="la">${C.commits
						.slice(0, 2)
						.map((c) => {
							const [v, t] = human(c);
							return `<li><em>${v}</em><span>${ago(c.date)}</span><b>${esc(t)}</b></li>`;
						})
						.join("")}</ul><div class="ft2">last change ${ago(last.date)} <i class="cur"></i></div>`
				: ""
		}</div></div></div>`;
};

export const codeView = (C: Code) => {
	const [a, ...more] = featured(C);
	const R = rest(C);
	const last = C.commits[0];
	const lab = (s: string) => `<div class="cv-lb">${s}</div>`;
	// the repo, and the homepage named by where it goes ("chrome web store", "onesal.me")
	const where = (u: string) => {
		const h = new URL(u).hostname.replace(/^www\./, "");
		return /chromewebstore\.google\.com|chrome\.google\.com/.test(h) ? "chrome web store" : /addons\.mozilla\.org/.test(h) ? "firefox add-ons" : h;
	};
	const gh = (p: Project) =>
		[p.url ? `<a class="gh" ${ext(p.url)}>open on github ↗</a>` : "", p.site ? `<a class="gh" ${ext(p.site)}>${esc(where(p.site))} ↗</a>` : ""].filter(Boolean).join(" ");
	// a project at three sizes: the hero (picture beside the words), the card (picture over the words), the row (thumbnail + one line)
	const hero = (p: Project) => `<article class="cv-hero"><i class="sh" style="background:${shot(p)}"></i><div><span class="kd">${esc(p.cat)}</span><h2>${esc(p.t)}</h2><p>${esc(p.d)}</p>${gh(p)}</div></article>`;
	const card = (p: Project) => `<article class="cv-card"><i class="sh" style="background:${shot(p)}"></i><span class="kd">${esc(p.cat)}</span><h3>${esc(p.t)}</h3><p>${esc(p.d)}</p>${gh(p)}</article>`;
	const row = (p: Project) => `<a class="cv-row" ${ext(p.url)}><i class="th" style="background:${shot(p)}"></i><div><b>${esc(p.t)}</b><span>${esc(p.cat)}</span></div><p>${esc(p.d)}</p><em>↗</em></a>`;
	const lately = `<ul class="cv-la">${C.commits
		.map((c) => {
			const [v, t] = human(c);
			return `<li><em>${v}</em><b>${esc(t)}</b><span>${when(c.date)}</span></li>`;
		})
		.join("")}</ul>`;
	return `<div class="v3 cv"><div class="cv-win"><div class="tb"><i></i><i></i><i></i><span>~/code</span></div><div class="bd">
    ${lab("featured")}${hero(a)}${more.length ? `<div class="cv-cards n${more.length}">${more.map(card).join("")}</div>` : ""}
    ${R.length ? `${lab("also")}<div class="cv-rows">${R.map(row).join("")}</div>` : ""}
    ${last ? `${lab("lately, on this site")}${lately}<div class="cv-ft">last change ${ago(last.date)} <i class="cur"></i></div>` : ""}</div></div></div>`;
};
