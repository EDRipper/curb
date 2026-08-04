import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "curb — ship an accessibility fix, prove it with numbers",
    short_name: "curb",
    description:
      "A Hack Club YSWS: fix real web accessibility issues, prove the improvement with an automated audit score delta.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfaf3",
    theme_color: "#18181b",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
