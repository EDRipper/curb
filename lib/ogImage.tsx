import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";
export const ogImageAlt =
  "curb — ship an accessibility fix, prove it with numbers. a hack club ysws.";

// next/og (satori) doesn't understand next/font or tailwind - it needs raw
// ttf/otf bytes handed to it directly. without this, the "sans-serif"
// fallback resolves to whatever font happens to be installed wherever the
// image is rendered, which produced visibly wrong inter-word spacing before
// certain words (confirmed on both local dev and the deployed image).
// fetched once per request from fontsource's cdn mirror of the same
// vercel/geist-sans-font package next/font/google pulls from.
const GEIST_700_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.ttf";
const GEIST_800_URL =
  "https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-800-normal.ttf";

async function loadGeistFonts() {
  const [bold, extrabold] = await Promise.all([
    fetch(GEIST_700_URL).then((r) => r.arrayBuffer()),
    fetch(GEIST_800_URL).then((r) => r.arrayBuffer()),
  ]);
  return [
    { name: "Geist Sans", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Geist Sans", data: extrabold, weight: 800 as const, style: "normal" as const },
  ];
}

export async function renderOgImage() {
  const fonts = await loadGeistFonts();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#fdfaf3",
          color: "#18181b",
          fontFamily: "Geist Sans",
        }}
      >
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            backgroundColor: "#ffcf3f",
            color: "#18181b",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            padding: "10px 20px",
            borderRadius: 999,
            marginBottom: 32,
          }}
        >
          a hack club ysws
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          Ship an accessibility fix. Prove it with numbers.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 700,
            color: "#52525b",
            marginTop: 32,
          }}
        >
          curb-theta.vercel.app
        </div>
      </div>
    ),
    { ...ogImageSize, fonts },
  );
}
