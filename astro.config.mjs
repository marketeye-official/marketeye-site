// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { legacyPages } from './tools/legacy-pages.js';

export default defineConfig({
  site: 'https://marketeye.io',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // Thank-you and error pages stay out of search, and so does the tick value calculator
      // (delinked from the nav and footer; the page itself stays live).
      filter: (page) => !/\/(welcome|404|tools\/tick-value-calculator)(\.html)?$/.test(page),
      // Carried-over pages are published outside Astro, so list the indexable ones here.
      // Ad landing pages and confirmation pages are deliberately left out.
      customPages: [
        'https://marketeye.io/privacy/',
        'https://marketeye.io/terms/',
        'https://marketeye.io/refund-policy',
        'https://marketeye.io/membership-billing-terms',
        'https://marketeye.io/cancellation-instructions',
        'https://marketeye.io/community-terms/2026-09-03.1/',
        'https://marketeye.io/newsletter-signup',
      ],
    }),
    legacyPages(),
  ],
});
