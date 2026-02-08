import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://objective-ai.io";

  const staticRoutes = [
    "",
    "/functions",
    "/functions/create",
    "/profiles",
    "/profiles/train",
    "/ensembles",
    "/ensembles/create",
    "/ensemble-llms",
    "/ensemble-llms/create",
    "/chat",
    "/vector",
    "/people",
    "/information",
    "/faq",
    "/legal",
    "/sdk-first",
    "/vibe-native",
    "/docs",
    "/account/keys",
    "/account/credits",
    "/legal/terms",
    "/legal/privacy",
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.8,
  }));
}
