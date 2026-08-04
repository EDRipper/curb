// next/og (satori) can't use next/font or tailwind - it needs raw ttf/otf
// bytes handed to it directly, or it silently falls back to whatever font
// happens to be installed wherever the image is rendered. fetched from
// fontsource's cdn mirror of the same vercel/geist-sans-font package
// next/font/google already uses for the real site.
const GEIST_URLS: Record<number, string> = {
  700: "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.ttf",
  800: "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-800-normal.ttf",
};

export async function loadGeistFont(weight: 700 | 800) {
  const data = await fetch(GEIST_URLS[weight]).then((r) => r.arrayBuffer());
  return { name: "Geist Sans", data, weight, style: "normal" as const };
}
