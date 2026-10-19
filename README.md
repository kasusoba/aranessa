# aranessa

onesal.me, built as a room: a strip of doors, one per thing (i, listen, watch, read, play, code, shows), with a ledge under it for the small stuff. Open a door to see the whole of that thing; every door also has its own page (`/listen`, `/i`, ...), which is the same room landing with that door open.

The site is static. Everything is fetched once at build time from Last.fm, Trakt, AniList, Hardcover, Steam, setlist.fm and GitHub (see `.env.example`), and rendered to html. In the browser, times stay current and now playing (Last.fm) and now watching (Trakt) are polled live.

## Where things are

- `src/lib/room.ts`: everything the room shows, from the per-source libs in `src/lib/`
- `src/room/render/`: each aspect's door and opened view, as html strings
- `src/room/client/`: the strip, hover and picking behaviour, live polling
- `src/room/room.css`: the room's styles (cut from the prototype), `room-extra.css`: what production adds
- `src/config.ts`: the ledge's now note, socials, the fallback project list
- `prototypes/room/`: the design prototype and every variant explored, kept for reference

## Commands

| Command        | Action                                                          |
| :------------- | :-------------------------------------------------------------- |
| `pnpm dev`     | dev server at `localhost:4321`, api results cached in `.cache/` |
| `pnpm build`   | build the site to `./dist/` (always fetches fresh)              |
| `pnpm preview` | preview the build                                               |
