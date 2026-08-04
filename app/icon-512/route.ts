import { renderAppIcon } from "@/lib/appIcon";

// not the special icon.tsx/apple-icon.tsx convention on purpose - those are
// auto-wired into <link rel="icon">, and browsers don't need a 512px
// favicon. this exists only to give manifest.ts a properly sized icon for
// "add to home screen" on android, which wants 192/512px and would
// otherwise have to upscale the 32px favicon into a blurry mess.
export async function GET() {
  return renderAppIcon(512, true);
}
