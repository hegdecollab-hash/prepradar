import type { MetadataRoute } from "next";
import { APP_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/search", "/saved", "/api/"] },
    sitemap: `${APP_URL}/sitemap.xml`,
  };
}
