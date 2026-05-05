import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl().replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
