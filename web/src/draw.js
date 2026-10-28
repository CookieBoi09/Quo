import { backgrounds } from "./library";
const imageCache = new Map();
function getImage(url) {
  if (!imageCache.has(url))
    imageCache.set(
      url,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => {
          imageCache.delete(url);
          reject(new Error("This background image could not be loaded."));
        };
        image.src = url;
      }),
    );
  return imageCache.get(url);
}
export function wrapText(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (ctx.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line);
          line = "";
        }
        for (const char of Array.from(word)) {
          if (line && ctx.measureText(line + char).width > maxWidth) {
            lines.push(line);
            line = char;
          } else line += char;
        }
      } else if (line && ctx.measureText(line + " " + word).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line += (line ? " " : "") + word;
    }
    lines.push(line);
  }
  return lines;
}
export async function drawQuote(canvas, quote, width, height) {
  const bg =
    backgrounds.find((b) => b.id === quote.background) || backgrounds[1];
  const font = quote.font || "Lora";
  await document.fonts.load(`400 24px "${font}"`);
  await document.fonts.load('400 12px "Lora"');
  const image =
    quote.photo || bg.image ? await getImage(quote.photo || bg.image) : null;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, width, height);
  if (image) {
    const scale = Math.max(width / image.width, height / image.height);
    ctx.drawImage(
      image,
      (width - image.width * scale) / 2,
      (height - image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
    if (!quote.photo) {
      ctx.fillStyle =
        quote.background === "forest"
          ? "rgba(12,48,32,.36)"
          : "rgba(30,58,65,.18)";
      ctx.fillRect(0, 0, width, height);
    }
  } else {
    // Gentle paper texture, kept deterministic so previews and exports match.
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.035;
    for (let i = 0; i < 2200; i++) {
      const x = (i * 167.73) % width,
        y = (i * 311.91) % height;
      ctx.fillRect(x, y, 0.7, 0.7);
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = `rgba(0,0,0,${quote.darkness || 0})`;
  ctx.fillRect(0, 0, width, height);
  const ink = image || quote.darkness > 0.32 ? "#fffdf5" : bg.ink;
  const padding = Math.min(width, height) * 0.12;
  const maxWidth = width - padding * 2;
  const authorSize = Math.max(8, Math.min(width, height) * 0.035);
  const authorGap = Math.min(width, height) * 0.07;
  ctx.font = `400 ${authorSize}px "Lora"`;
  const authorLines = quote.author
    ? wrapText(ctx, quote.author.toUpperCase(), maxWidth)
    : [];
  const authorHeight = authorLines.length * authorSize * 1.4;
  const text = quote.text || "A little space for\nsomething meaningful.";
  let fontSize =
    Math.min(width, height) *
    (font === "Cormorant Garamond" || font === "Caveat" ? 0.115 : 0.088);
  let lines;
  do {
    ctx.font = `400 ${fontSize}px "${font}"`;
    lines = wrapText(ctx, text, maxWidth);
    if (
      lines.length * fontSize * 1.38 + authorHeight + authorGap <=
      height - padding * 2
    )
      break;
    fontSize -= 0.5;
  } while (fontSize > 2);
  const totalHeight =
    lines.length * fontSize * 1.38 +
    (quote.author ? authorGap + authorHeight : 0);
  let y = (height - totalHeight) / 2 + fontSize * 0.8;
  ctx.textAlign = quote.align || "center";
  const x =
    quote.align === "left"
      ? padding
      : quote.align === "right"
        ? width - padding
        : width / 2;
  ctx.fillStyle = ink;
  ctx.font = `400 ${fontSize}px "${font}"`;
  for (const line of lines) {
    ctx.fillText(line, x, y);
    y += fontSize * 1.38;
  }
  if (quote.author) {
    ctx.font = `400 ${authorSize}px "Lora"`;
    ctx.globalAlpha = 0.78;
    y += authorGap - fontSize * 0.6;
    for (const line of authorLines) {
      ctx.fillText(line, x, y);
      y += authorSize * 1.4;
    }
    ctx.globalAlpha = 1;
  }
}
export async function exportQuote(quote, width, height) {
  const canvas = document.createElement("canvas");
  await drawQuote(canvas, quote, width, height);
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not create this image. Please try again.");
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `quo-${width}x${height}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export async function readPhoto(file) {
  if (!file.type.startsWith("image/"))
    throw new Error("Please choose an image file.");
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Please choose a photo smaller than 20 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = await getImage(url);
    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
    imageCache.delete(url);
  }
}
