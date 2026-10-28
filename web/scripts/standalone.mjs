import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");
const dataURI = async (file, mime) =>
  `data:${mime};base64,${(await readFile(path.join(root, file))).toString("base64")}`;
let html = await readFile(path.join(root, "index.html"), "utf8");
const scriptPath = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)[1];
const stylePath = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/)[1];
let js = await readFile(path.join(root, scriptPath), "utf8");
let css = await readFile(path.join(root, stylePath), "utf8");
for (const name of ["forest", "mountains"]) {
  const uri = await dataURI(`photos/${name}.jpg`, "image/jpeg");
  js = js.replaceAll(`/photos/${name}.jpg`, uri);
  css = css.replaceAll(`/photos/${name}.jpg`, uri);
}
const fontPaths = [
  ...new Set(
    [...css.matchAll(/url\(([^)]+)\)/g)]
      .map((m) => m[1].replace(/^['"]|['"]$/g, ""))
      .filter((p) => /\.woff2?$/.test(p)),
  ),
];
for (const file of fontPaths) {
  css = css.replaceAll(
    file,
    await dataURI(file, file.endsWith("woff2") ? "font/woff2" : "font/woff"),
  );
}
html = html.replace(
  /<script[^>]*src="[^"]+"[^>]*><\/script>/,
  () =>
    `<script type="module">${js.replaceAll("</script", "<\\/script")}</script>`,
);
html = html.replace(
  /<link[^>]*href="[^"]+\.css"[^>]*>/,
  () => `<style>${css}</style>`,
);
html = html.replace(
  "/favicon.svg",
  await dataURI("favicon.svg", "image/svg+xml"),
);
const notices = await Promise.all(
  (await readdir(path.join(root, "licenses"))).map(
    async (name) =>
      name + "\n" + (await readFile(path.join(root, "licenses", name), "utf8")),
  ),
);
notices.push(await readFile(path.join(root, "photos/LICENSE"), "utf8"));
html +=
  "\n<!-- Third-party notices\n" +
  notices.join("\n\n").replaceAll("-->", "-- >") +
  "\n-->\n";
await writeFile(path.join(root, "quo-preview.html"), html);
console.log(
  "Standalone preview: dist/quo-preview.html (fonts and photographs included)",
);
