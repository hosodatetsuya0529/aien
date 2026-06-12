import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://aientame.com";
  const [rankings, works] = await Promise.all([
    prisma.workRanking.findMany({ where: { status: "published" }, select: { slug: true, createdAt: true } }),
    prisma.work.findMany({ where: { entries: { some: {} } }, select: { id: true } }),
  ]);
  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.3 },
    ...rankings.map((r) => ({
      url: `${base}/movies/rankings/${r.slug}`,
      lastModified: r.createdAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...works.map((w) => ({
      url: `${base}/movies/works/${w.id}`,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
