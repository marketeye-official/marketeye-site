# MarketEye.io website

Marketing site for MarketEye, a free futures trading education community (Circle: learn.marketeye.io).
Built with [Astro](https://astro.build) as a fully static site.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Local dev server with live reload at http://localhost:4321 |
| `npm run build` | Build the static site into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## Structure

```
public/            Files copied as-is (logo, favicon, AI images, robots.txt)
src/layouts/       BaseLayout.astro: <head>/SEO tags, header, footer, sticky CTA, site scripts
src/components/    Header, Footer, Quiz (the 5-question hero quiz)
src/pages/         One file per URL: index.astro (/), futures-trading.astro (/futures-trading)
src/styles/        global.css (brand tokens and shared components)
src/data/          hero-chart.svg + week.json (refreshed weekly), teach-chart.svg, home-schema.json
tools/             Weekly refresh scripts
```

## Weekly refresh (Sundays)

A scheduled Claude task pulls MES 15-minute bars and the week's US economic calendar from TradingView, then:

```
node tools/hero-chart.js bars.json hero.svg      # bars.json: {"o":[],"h":[],"l":[],"c":[]}
node tools/update-week.js hero.svg week.json     # writes src/data/, backs up to backups/weekly/
npm run build
```

It also saves a Pre-Trade Prep post in Circle as a draft for review. Nothing is published or deployed automatically.

## Content rules

- Education only: no price levels, trade calls, income claims, or capital/funding language.
- No founder name or photo. Experience is "36+ years of combined trading experience."
- Images are AI-generated (Canva) and must never be presented as members or testimonials.
- Every page includes the risk disclosure via the shared footer.

## Before launch

- [ ] Connect the quiz form (`src/components/Quiz.astro`, `submit()`) to the email platform/Zapier that sends the Circle invite and tags the member.
- [ ] Add Google Tag Manager in `BaseLayout.astro` (placeholder comment in `<head>`); map `quiz_start`, `quiz_complete`, `generate_lead`, `cta_click` to GA4, Meta and TikTok.
- [ ] Cookie consent banner with Google Consent Mode.
- [ ] 301 redirects from current marketeye.io URLs (`public/_redirects` on Netlify/Cloudflare).
- [ ] Remaining pages: /welcome, /mentorship, /about, legal pages, blog, /tools/tick-value-calculator, 404.
- [ ] Attorney review of disclosures; confirm testimonials and stats.
