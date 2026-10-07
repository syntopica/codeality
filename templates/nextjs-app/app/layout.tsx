import { siteMetadata } from '@/seo/siteMetadata'
import type { RootLayoutProps } from '@/types/RootLayoutProps'

export const metadata = siteMetadata

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
