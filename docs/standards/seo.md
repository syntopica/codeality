# SEO Standard

## Goal

Every public web project should ship with sensible SEO defaults on day one. The
baseline is not "perfect SEO"; it is "no obvious omissions".

## Mandatory baseline

### Next.js

- Define route-level metadata in the App Router.
- Set `metadataBase`.
- Provide a default title and title template.
- Provide a description.
- Set canonical URL intent.
- Provide `robots.ts`.
- Provide `sitemap.ts`.
- Include Open Graph and Twitter metadata.

### Astro and static sites

- Set a `<title>`.
- Set a description meta tag.
- Set a canonical URL.
- Set Open Graph basics (`og:title`, `og:description`, `og:url`, `og:type`).
- Add `robots.txt`.

### SPA shells (Vite React)

- Set a meaningful document title.
- Set a description meta tag.
- Add `robots.txt` if the app is publicly crawled.
- If the project is SEO-sensitive, prefer SSR/SSG instead of relying on a
  client-only shell.

## Important notes

- Replace `https://example.com` placeholders before production.
- Do not pretend a client-only app has first-class SEO if the business need is
  real SEO.
- For marketing surfaces, prefer Next.js or Astro over SPA-only delivery.
