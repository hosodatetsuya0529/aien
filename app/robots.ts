import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://aientame.com/sitemap.xml",
    host: "https://aientame.com",
  };
}
