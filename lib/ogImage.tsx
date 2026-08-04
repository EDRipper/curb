import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";
export const ogImageAlt =
  "curb — ship an accessibility fix, prove it with numbers. a hack club ysws.";

export function renderOgImage() {
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
          fontFamily: "sans-serif",
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
            color: "#52525b",
            marginTop: 32,
          }}
        >
          curb-theta.vercel.app
        </div>
      </div>
    ),
    { ...ogImageSize },
  );
}
