import type { MetadataRoute } from 'next'

const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://tarkasabha.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/workspaces',
          '/decisions',
          '/history',
          '/chat',
          '/personas',
          '/providers',
          '/invite/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
