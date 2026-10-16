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
src/pages/         One file per URL: index.astro (/), futures-trading.astro (/futures-trading)
src/styles/        global.css (brand tokens and shared components)
src/data/          hero-chart.svg + week.json (refreshed weekly), teach-chart.svg, home-schema.json
tools/             Weekly refresh scripts, plus legacy-pages.js (see below)
netlify/functions/ consent.js (records form consent)
netlify.toml       Netlify build settings and redirects
preview/           Preview landing pages from the LP builder (published to GitHub Pages, never to marketeye.io)
```

## Pages carried over from the previous site

The legal pages, ad landing pages, confirmation pages and the versioned community agreement are
hand-written HTML files that sit at the repo root (and in `community-terms/`). `tools/legacy-pages.js`
publishes them unchanged at the same URLs the old Eleventy site used:

- `<name>.html` → `/<name>/` (for example `ret-macro-v6.html` → `/ret-macro-v6/`), or the `permalink:` in its front matter
- The pages in its `PASSTHROUGH` list are also published at `/<name>.html`
- `assets/`, `marketeye-icon.png` and `og-default.png` are copied as-is

Keep `assets/` and `MarketEye-Logo-1.03c-Gradient-horizontal.png` where they are: the landing pages load images
from this repo's `main` branch on GitHub, and the preview workflow copies `assets/`.
Never edit a versioned community agreement in place; add a new version folder and update the redirect in `netlify.toml`.

## Previews

Pushes to the `redesign` branch build a Netlify branch preview at `redesign--<netlify-site-name>.netlify.app`,
and the draft pull request (marketeye-official/marketeye-site#2) gets its own Deploy Preview link.
Only `main` deploys to marketeye.io, so merging that pull request is the launch.

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

- [ ] Test one real quiz signup on the Netlify preview (consent log row + Make.com scenario + Circle invite). The quiz uses the live LP form in `src/components/signup/` and sends `quiz_*` fields and `signup_source: homepage_quiz` with the registration.
- [ ] In GTM, add triggers for the new events if wanted: `quiz_start`, `quiz_answer`, `quiz_complete`, `cta_click`, `consent_update` (signup conversions already arrive as `free_member_signup`).
