# Quo

## Browser preview

The interactive website is in [`web/`](web/README.md). Open the generated `web/dist/quo-preview.html` in your browser to try it without installing anything, or run `npm ci` and `npm run dev` from `web/`. It includes folders, notebooks, photo backgrounds, 12 fonts, and widget image exports. Build with `npm run build` to regenerate the standalone file.

A local-first iPhone and iPad quote library built with SwiftUI and WidgetKit. Requires iOS/iPadOS 17+ and Xcode 15+.

- Organize quotes into folders and notebooks; search by text or author.
- Edit quotes, move them between notebooks, and delete them. Removing a folder/notebook preserves its quotes in Unfiled.
- Import a background with the system Photos picker. Images are resized to 1600 pixels and stored as JPEGs in shared local storage.
- Search and preview fonts installed on iOS. This is not the Google Docs font catalog; no fonts or photos are sent to a server.
- Preview widget proportions and choose text alignment and background darkening.
- Add independent configurable small, medium, large, or supported iPad extra-large widgets. Text size adapts to the available area; extremely long text can become small or truncate at the layout limit.

## Run on a Mac

1. Install Xcode and XcodeGen (`brew install xcodegen`).
2. In `project.yml`, replace `com.example` bundle identifiers with your own and set `QUO_APP_GROUP` to your registered App Group, such as `group.com.yourcompany.Quo`. Use the same group for both targets.
3. Run `xcodegen generate` from this directory and open `Quo.xcodeproj`.
4. Choose your signing team for Quo and QuoWidgets. Enable the matching App Groups capability for both App IDs in your Apple developer account. The generated entitlements and Info.plist use `QUO_APP_GROUP`.
5. Select the Quo scheme and an iPhone/iPad simulator or device, then Run.
6. Save a quote, long-press the Home Screen, add a Quo widget, then long-press it and choose Edit Widget to select a quote. Repeat to display different quotes independently.

Apple defines available widget sizes; apps cannot create arbitrary pixel-sized Home Screen widgets. These widgets target the Home Screen, not Lock Screen accessory widgets. Widget refresh timing is managed by iOS.

## Tests and validation

On a Mac, generate the project, then run (adjust the simulator name to an installed device):

```sh
xcodebuild -project Quo.xcodeproj -scheme Quo -destination 'platform=iOS Simulator,name=iPhone 16' test
```

The XCTest suite covers file/photo persistence, folder deletion without quote loss, and corrupt-file handling. The Linux authoring environment does not have Xcode or an Apple SDK; compilation, XCTest execution, and device rendering have not been validated there.

Manual device checks: create folders and notebooks; save and reopen a quote; import a photo; change fonts; preview all sizes; configure two widgets with different quotes; edit and delete a selected quote; verify widget refresh and missing-quote states. Check large Dynamic Type and VoiceOver, and inspect long quotes on all supported widget families.

## Storage and scope

The App Group contains `Library/quotes.json` and UUID-named JPEG files. Writes to the library are atomic. The app writes; widgets read the shared files. A missing App Group or corrupt library is reported rather than silently resetting data. No account, backend, credentials, or network access is needed at runtime. This version has no iCloud sync, export, custom font import, nested folders, or automated unused-photo cleanup. Unused photos remain on disk, and deleting the app can remove its data. Back up important quotes separately.
