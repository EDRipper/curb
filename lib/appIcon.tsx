import { ImageResponse } from "next/og";
import { loadGeistFont } from "./geistFont";

// shared between app/icon.tsx and app/apple-icon.tsx. apple applies its own
// corner-rounding mask to touch icons, so `rounded` should be false there -
// a pre-rounded icon gets double-rounded (square corners showing through).
export async function renderAppIcon(px: number, rounded: boolean) {
  const font = await loadGeistFont(800);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#18181b",
          borderRadius: rounded ? Math.round(px * 0.19) : 0,
        }}
      >
        <div
          style={{
            display: "flex",
            fontFamily: "Geist Sans",
            fontSize: Math.round(px * 0.625),
            fontWeight: 800,
            color: "#ffcf3f",
          }}
        >
          c
        </div>
      </div>
    ),
    { width: px, height: px, fonts: [font] },
  );
}
