import type { Metadata } from 'next'

export const siteMetadata: Metadata = (() => {
  const title = 'Engineering Baseline Next.js App'
  const description =
    'Production-ready Next.js baseline with strict TypeScript, accessibility defaults, and SEO foundations.'

  return {
    metadataBase: new URL('https://example.com'),
    title: {
      default: title,
      template: `%s | ${title}`,
    },
    description,
    applicationName: title,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: 'https://example.com',
      siteName: title,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  }
})()
