import type { ReactNode } from 'react'

import { siteMetadata } from '@/seo/siteMetadata'

export const metadata = siteMetadata

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
