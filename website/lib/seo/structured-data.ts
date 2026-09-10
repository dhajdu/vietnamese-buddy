// lib/seo/structured-data.ts
import { BASE_URL } from './metadata'

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'My App', // TODO: replace
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Company', // TODO: replace
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`, // TODO: replace
    sameAs: [
      // TODO: add social profile URLs
    ],
  }
}

export function articleSchema(article: {
  title: string
  description: string
  url: string
  imageUrl: string
  datePublished: string
  dateModified: string
  authorName: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.imageUrl,
    url: article.url,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: { '@type': 'Person', name: article.authorName },
  }
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
