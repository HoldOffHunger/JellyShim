<h1 align="center">JellyShim</h1>
<h3 align="center">A folder-first web client for <a href="https://jellyfin.org">Jellyfin</a> music libraries</h3>

---

JellyShim is a fork of [jellyfin-web](https://github.com/jellyfin/jellyfin-web) for people whose music already lives in a tidy folder tree, like `Style/Band/Album/01 - Song.mp3`. Instead of Jellyfin's album-and-artist views, which are built from tags, you browse your music the way it sits on disk, like a file explorer that can play things. Jellyfin's good parts stay: streaming to any device, transcoding, playlists and Instant Mix recommendations.

It's a drop-in replacement for the web client. Your Jellyfin server, library, users and settings stay as they are, and you can switch back at any time.

## What's different from Jellyfin Web

- **Music opens as folders.** The music library always opens as a folder listing. The album-based Music view is left out of menus, the toolbar and the home screen.
- **Folders open, Play is its own button.** Clicking a folder card opens it. Playing it is a separate button in the card's corner, so you never start a 3,000-song genre by accident.
- **Songs-only folders open as a track list.** A folder holding only songs (an album) opens straight into a track list, with multi-disc albums ordered by their disc folders.
- **Instant Mix on every folder.** Recommendations sit beside Play All and Shuffle on every folder, and in the ⋮ menu of plain folders.
- **MilkDrop visualizer.** An optional [Butterchurn](https://github.com/jberg/butterchurn) visualizer (MilkDrop, the classic Winamp visualizer, in WebGL) fills the Now Playing screen. It's off by default. Turn it on under **Settings → Playback → Show the music visualizer on Now Playing**.
- **TV remote Pause key restored.** The physical Pause button on LG and Samsung remotes is mapped again, which Jellyfin 12.0 had dropped (the same fix as upstream jellyfin-web#8501).

## Requirements

- A running Jellyfin server, version 12.x (JellyShim is based on jellyfin-web 12.1).
- [Node.js](https://nodejs.org/en/download) and npm, to build it.
- For the visualizer: a browser with WebGL 2. It isn't used on iPhone and iPad, where Safari's Web Audio breaks playback speed.

## Build

```sh
git clone https://github.com/HoldOffHunger/JellyShim.git
cd JellyShim
npm install
npm run build:production
```

The built client is in `dist/`.

## Install

Point your Jellyfin server at the `dist/` folder instead of its own web client. Either:

- **Start Jellyfin with** `--webdir [PATH-TO-JELLYSHIM]/dist`, or set the environment variable `JELLYFIN_WEB_DIR=[PATH-TO-JELLYSHIM]/dist`, or
- **Swap the folder:** stop Jellyfin, rename the server's `jellyfin-web` folder to `jellyfin-web.original`, put a link (or a copy) named `jellyfin-web` pointing at JellyShim's `dist/`, then start Jellyfin. With a link, every new build goes live without touching the server again.

To go back, undo whichever you did and restart Jellyfin.

Jellyfin's phone and TV apps load the web client from your server, so they pick up JellyShim too.

### Setting up the music library

JellyShim works best when the music library's folders *are* your organisation:

1. Lay the library out as `Style/Band/Album/song` (any depth works).
2. In the library's settings, local tags only (turning off online metadata lookups) makes scanning a big library much faster.

## Reaching it from outside your home (optional)

The safest way is a tunnel. Don't open a port on your router.

1. **Cloudflare Tunnel** (free): in the Cloudflare dashboard, create a tunnel, install its connector on the Jellyfin machine, and add a route (public hostname) such as `[YOUR-SUBDOMAIN].[YOUR-DOMAIN]` pointing to `http://localhost:8096`. It has to be `http`, since Jellyfin's default port doesn't speak HTTPS.
2. **Cloudflare Access** in front of it: a self-hosted application for that hostname, with a policy allowing only your email addresses and a one-time PIN login. Set this up *before* the route, so the address is never open.

Then Jellyfin's own login sits behind Cloudflare's. The native Jellyfin apps can't get past an Access login page, so outside the house, use a browser.

## Development

```sh
npm start              # dev server on http://localhost:8080
npm run build:development
npm run lint
```

See the upstream [Contributing Guide](./CONTRIBUTING.md) for the code base and tech stack. Changes made for JellyShim are marked with `// JellyShim:` comments, which keeps them easy to find when merging upstream releases.

## Credits and licence

JellyShim is built on [jellyfin-web](https://github.com/jellyfin/jellyfin-web) by the Jellyfin project and its [contributors](./CONTRIBUTORS.md), and is licensed under the GNU General Public License v2.0, like the original. The visualizer uses [Butterchurn](https://github.com/jberg/butterchurn) and [butterchurn-presets](https://github.com/jberg/butterchurn-presets) (MIT).

JellyShim is not affiliated with or endorsed by the Jellyfin project.
