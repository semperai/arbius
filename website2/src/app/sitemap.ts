import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://arbius.ai'

  const routes = [
    '',
    '/upgrade',
    '/aius',
    '/lp-staking',
    '/models',
    '/team',
    '/media',
    '/playground',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))
}
