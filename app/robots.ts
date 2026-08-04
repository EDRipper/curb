import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/review", "/api", "/login", "/logout", "/login-error"],
    },
    sitemap: "https://curb-theta.vercel.app/sitemap.xml",
  };
}
