/* placeholder aspects, only here to test how the strip scales to 12 doors. sample data only. */
Object.assign(NAME, { draw: "draw", places: "places", links: "links" });
Object.assign(GLYPH, {
  draw: '<path d="M4 16 L4 12 L13 3 L17 7 L8 16Z"/>',
  places: '<path d="M10 2.5a5.5 5.5 0 0 1 5.5 5.5c0 4-5.5 9.5-5.5 9.5S4.5 12 4.5 8A5.5 5.5 0 0 1 10 2.5z"/>',
  links: '<rect x="2.5" y="7" width="9" height="6" rx="3"/><rect x="8.5" y="7" width="9" height="6" rx="3" fill-opacity=".55"/>',
});
const EXTRA = {
  draw: { live: "3 new", items: ["kaiman, again", "the cat, sleeping", "a hand study", "train window", "self portrait (bad)", "a chair"] },
  places: { live: "12", items: ["kyoto", "tokyo", "singapore", "bandung", "yogyakarta", "osaka"] },
  links: { live: "24", items: ["a good essay on rooms", "dorohedoro art book scans", "css container queries", "a lamp i want", "setlist archive tool", "fishmans live 1998"] },
};
for (const [k, e] of Object.entries(EXTRA)) {
  A[k] = {
    live: () => `<span class="muted">${e.live}</span>`,
    s: () => ({ items: e.items.map((t, i) => [t, k === "links" ? "saved " + (i + 1) + "d ago" : "", k === "links" ? null : art(k + t)]) }),
    m: () => ``, l: () => ``,
  };
  XL3[k] = () => `<div class="u"><div class="u-obj"><div><div class="u-label">${glyph(k)} ${k}</div><div class="u-title">${e.items[0]}</div><div class="u-sub">placeholder aspect, for testing 12 doors</div></div></div>
    <div class="u-notes"><div class="u-label">all</div><ul class="u-list">${e.items.map((t, i) => `<li><em>${pad2(i)}</em><b>${t}</b></li>`).join("")}</ul></div></div>`;
}
const BIG = ["me", "listen", "watch", "read", "play", "code", "shows", "write", "gallery", "draw", "places", "links"];
