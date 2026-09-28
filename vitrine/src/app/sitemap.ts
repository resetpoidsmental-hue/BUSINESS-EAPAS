import type { MetadataRoute } from "next";
import { getArticles, getFormules } from "@/lib/nocodb";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL || "https://sante-and-co.com";
  const [formules, articles] = await Promise.all([getFormules(), getArticles()]);

  return [
    { url: `${base}/`, priority: 1 },
    { url: `${base}/formules`, priority: 0.9 },
    { url: `${base}/articles`, priority: 0.8 },
    { url: `${base}/recettes`, priority: 0.8 },
    { url: `${base}/contact`, priority: 0.6 },
    ...formules.map((f) => ({ url: `${base}/formules/${f.Slug}`, priority: 0.8 })),
    ...articles.map((a) => ({ url: `${base}/articles/${a.Slug}`, priority: 0.6 })),
  ];
}
