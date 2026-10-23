import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tarkasabha.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/product`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/diligence`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/teams`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/pricing`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/security`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/careers`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/demo`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/feedback`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
