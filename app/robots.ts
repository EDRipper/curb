import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/review", "/api", "/login", "/logout", "/login-error"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
