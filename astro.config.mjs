import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// GitHub project Pages by default; set SITE_URL and BASE_PATH for a custom domain.
export default defineConfig({
  site: process.env.SITE_URL || 'https://ai-club-iit-madras.github.io',
  base: process.env.BASE_PATH || '/website',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
