/* real data for listen / watch / read / play / code / shows, from snapshot.js (see snapshot.mjs). the other aspects still use the sample data in aspects.js. */
const PERIODS2 = [["7day", "7d"], ["1month", "30d"], ["3month", "90d"], ["6month", "180d"], ["12month", "year"], ["overall", "all"]];
const DEFAULT_PERIOD2 = "3month";

if (typeof SNAP === "undefined") document.body.insertAdjacentHTML("afterbegin", `<p style="position:fixed;z-index:999;inset:auto 16px 16px;padding:12px 16px;border-radius:10px;background:#b23a3a;color:#fff">snapshot.js is missing. run <code>node prototypes/room/snapshot.mjs</code></p>`);
const D2 = typeof SNAP === "undefined" ? null : SNAP;

const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ext = url => url ? `href="${esc(url)}" target="_blank" rel="noreferrer"` : "";
// a real cover when there is one, the generated gradient underneath while it loads (or if it fails)
const cov = (o, seed) => {
  const layers = [o?.img, o?.img2].filter(Boolean).map(u => `url('${u.replace(/['"\s]/g, c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))}') center/cover no-repeat`);
  return [...layers, art(seed ?? o?.t ?? o?.name ?? "")].join(", ");
};
const ago = iso => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso)) / 1000;
  return s < 60 ? "just now" : s < 3600 ? `${s / 60 | 0}m ago` : s < 86400 ? `${s / 3600 | 0}h ago` : s < 604800 ? `${s / 86400 | 0}d ago`
    : s < 2592000 ? `${s / 604800 | 0}w ago` : s < 31536000 ? `${s / 2592000 | 0}mo ago` : `${s / 31536000 | 0}y ago`;
};
const fresh = (iso, h = 3) => iso && Date.now() - new Date(iso) < h * 3600e3;
const monthYear = iso => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toLowerCase();
const hours = m => { const h = Math.round(m / 60); return h === 1 ? "1 hr" : `${h.toLocaleString()} hrs`; };

// commit heatmap from per-day counts, oldest week first
const heatDays = (perDay, weeks = 26, s = 10) => {
  const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - start.getDay() - (weeks - 1) * 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    const key = d.toLocaleDateString("en-CA"), n = perDay[key] ?? 0, future = d > new Date();
    return `<i title="${key}${n ? ` · ${n} commit${n > 1 ? "s" : ""}` : ""}" style="width:${s}px;height:${s}px;${future ? "opacity:0" : n ? `background:color-mix(in srgb, var(--accent) ${Math.min(100, 35 + n * 20)}%, transparent)` : ""}"></i>`;
  });
  return `<div class="heat" style="grid-template-rows:repeat(7,${s}px)">${cells.join("")}</div>`;
};

if (D2) {
  // steam: portrait library art first, the wide header as a fallback layer underneath
  for (const g of [...D2.games, ...(D2.play?.top ?? []), ...(D2.play?.ach ?? [])]) { g.header = g.img; g.img = g.img.replace("header.jpg", "library_600x900.jpg"); g.img2 = g.header; }
  D.socials = D2.socials.map(([n]) => n);
}

// shows: setlist.fm sets marked "i was there". the wristbands keep their generated colours, the list gets the real photo + setlist
if (D2?.shows?.length) {
  const S = D2.shows;
  D.shows = S.map(s => [s.artist, s.city.toLowerCase(), monthYear(s.date)]);
  const nights = new Set(S.map(s => s.venue + s.date)).size, cities = new Set(S.map(s => s.city)).size;
  XL2.shows = () => `<div class="u">
    <div class="u-obj">
      <div class="s-bands">${S.slice(0, 4).map(s => `<div class="s-band u-lit" style="background:${art(s.artist)}"><div class="cl"></div><span>${esc(s.artist)}</span></div>`).join("")}</div>
      <div><div class="u-label">${glyph("shows")} i was there</div><div class="u-title">${nights} show${nights === 1 ? "" : "s"}</div><div class="u-sub">${S.length} sets · ${cities} cit${cities === 1 ? "y" : "ies"}</div></div>
    </div>
    <div class="u-notes">
      <div class="u-label">all shows</div>
      <ul class="u-list s-list">${S.map((s, i) => `<li><details><summary><em>${pad2(i)}</em><span class="s-ph" style="background:${cov({ img: s.img }, s.artist)}"></span><b>${esc(s.artist)}</b><span>${esc(s.city.toLowerCase())}</span><i>${monthYear(s.date)}</i></summary>
        <div class="s-set"><div class="s-where">${esc(s.venue)}${s.tour ? ` · ${esc(s.tour)}` : ""} · <a ${ext(s.url)}>setlist.fm ↗</a></div>
        ${s.songs.length ? `<ol>${s.songs.map(t => `<li>${esc(t)}</li>`).join("")}</ol>` : `<div class="muted">no setlist yet</div>`}</div></details></li>`).join("")}</ul>
      <div class="u-foot">setlist.fm</div>
    </div></div>`;
}
