# Quo for the web

An interactive browser version of Quo. The native SwiftUI application remains in the parent directory.

## Just see it

Open `dist/quo-preview.html` in a modern browser after building. This single file includes the app, all 12 fonts, and sample photographs; no server or installation is needed to use it. It is produced by `npm run build` and can be shared as a file. Browser storage is specific to the browser and origin; standalone-file storage behavior can vary across browsers. Export a backup before moving the file or changing browsers.

## Develop

Requires Node.js 20.19+ or 22.12+ (validated on Node 24).

```sh
cd web # from the Quo repository root
npm ci --cache /workspace/.npm-cache
npm run dev
```

For a normal local checkout, `npm ci` without the cache option is sufficient. Vite prints the address to open. The development server listens on all interfaces so a cloud host can forward its port; bind it to localhost if you run it on an untrusted network.

```sh
npm run build     # Production site in dist/ plus a standalone HTML preview
npm run preview   # Serve the production build
npm test          # Library behavior tests
npm run test:e2e  # Desktop/mobile Chromium browser tests
```

The browser tests use `/usr/bin/chromium`; set `CHROMIUM_PATH` to another installed Chromium executable if needed. Their Vite server starts automatically.

## Try it

- Create folders with **New folder**, then use the **+** next to a folder to add notebooks.
- Add, edit, move, search, favorite, and delete quotes. Remove a notebook without deleting its quotes.
- Choose from 12 locally bundled font families, six backgrounds, or upload a photo. Photos are resized and stored in this browser.
- Change alignment and background dimming. Preview text that automatically fits small, medium, large, and extra-large layouts.
- Open **Explore widgets** or **Preview widget** to export a PNG, including custom dimensions from 150–2000 pixels.
- Use the **…** beside “Your little corner” to export/import a library backup.

This website previews widget designs and downloads images. Browsers cannot install native Apple widgets; use the SwiftUI app for that. The website and native app have separate storage. There is no backend, account, analytics, or cloud sync. Clearing browser data removes your saved library, so export important quotes. Storage failures are displayed instead of claiming a save succeeded.

## Included assets

The sample mountain/forest photographs are from [Start Bootstrap Grayscale](https://github.com/StartBootstrap/startbootstrap-grayscale), with its license in `public/photos/LICENSE`. The 12 font families are locally bundled from Fontsource: DM Sans, Lora, Playfair Display, Cormorant Garamond, Libre Baskerville, Inter, Montserrat, Caveat, Space Mono, Bitter, Spectral, and Nunito. Their upstream license files ship with the npm packages; the corresponding notices are copied to `public/licenses` for distribution. Icons are from Lucide (ISC license). Sample quotation attributions are illustrative, with disputed attributions marked.
