// Astro integration that publishes the pages carried over from the previous Eleventy site
// (legal pages, ad landing pages, confirmation pages, the versioned community agreement)
// at exactly the URLs they had before, without changing a byte of their HTML.
//
// The previous build's rules, reproduced here:
//   - Root *.html in PASSTHROUGH were copied as-is to /<name>.html AND rendered to /<name>/index.html.
//   - Any other root *.html was rendered to /<name>/index.html, or to its front matter `permalink`.
//   - community-terms/**/index.html was rendered to its `permalink`.
//   - assets/, marketeye-icon.png and og-default.png were copied as-is.
// "Rendered" only stripped the front matter: none of these pages contain template tags.
//
// It also writes dist/_redirects so old blog URLs (/_posts/<file>/) move to /blog/<slug>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { postSlug } from './post-slug.js';

const PASSTHROUGH = [
  'privacy.html',
  'refund-policy.html',
  'membership-billing-terms.html',
  'cancellation-instructions.html',
  'newsletter-signup.html',
  'newsletter-confirmed.html',
  'email-confirmed.html',
  'optin-confirmed.html',
  'trading-essentials-thank-you.html',
];
// Root HTML files Astro now owns (or that are not pages at all).
const SKIP = new Set(['index.html', 'blog.html']);
const ROOT_FILES = ['marketeye-icon.png', 'og-default.png'];

function splitFrontMatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return { body: src, permalink: null };
  const p = m[1].match(/^permalink:\s*["']?([^"'\r\n]+)["']?\s*$/m);
  return { body: src.slice(m[0].length), permalink: p ? p[1].trim() : null };
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}

export function legacyPages() {
  return {
    name: 'marketeye-legacy-pages',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const root = process.cwd();
        const written = [];

        const write = (rel, data) => {
          const dest = path.join(out, rel);
          // Never let a legacy file silently replace a page the new site builds.
          if (fs.existsSync(dest)) throw new Error(`legacy-pages: ${rel} already exists in the Astro build`);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, data);
          written.push(rel);
        };

        const pages = fs.readdirSync(root).filter((f) => f.endsWith('.html') && !SKIP.has(f));
        for (const f of pages) {
          const raw = fs.readFileSync(path.join(root, f), 'utf8');
          const { body, permalink } = splitFrontMatter(raw);
          const name = f.slice(0, -'.html'.length);
          if (PASSTHROUGH.includes(f)) write(f, body);
          write(permalink ? permalink.replace(/^\//, '') : `${name}/index.html`, body);
        }

        for (const file of walk(path.join(root, 'community-terms'))) {
          const { body, permalink } = splitFrontMatter(fs.readFileSync(file, 'utf8'));
          write(permalink ? permalink.replace(/^\//, '') : path.relative(root, file), body);
        }

        // Shared assets: the new site's own files (public/assets) win; legacy files fill in.
        for (const file of walk(path.join(root, 'assets'))) {
          const rel = path.relative(root, file);
          if (!fs.existsSync(path.join(out, rel))) write(rel, fs.readFileSync(file));
        }
        for (const f of ROOT_FILES) write(f, fs.readFileSync(path.join(root, f)));

        // Old blog URLs → new ones. Netlify reads dist/_redirects before netlify.toml rules.
        const posts = fs.readdirSync(path.join(root, '_posts')).filter((f) => f.endsWith('.md'));
        const redirects = posts.map((f) => `/_posts/${f.slice(0, -3)}  /blog/${postSlug(f)}  301`);
        write('_redirects', redirects.join('\n') + '\n');

        logger.info(`published ${written.length} carried-over files`);
      },
    },
  };
}
