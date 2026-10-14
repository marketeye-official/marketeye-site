// Weekly homepage refresh for the Astro site. Validates the new week's data, backs up the
// current data files, then writes:
//   src/data/hero-chart.svg  (animated hero chart, made by tools/hero-chart.js)
//   src/data/week.json       (Pre-Trade Prep calendar + Circle card highlights)
// Run `npm run build` afterwards to regenerate the site.
//
// Usage: node tools/update-week.js <hero.svg> <week.json>
// week.json example:
// {
//   "weekOf": "Oct 19",
//   "rows": [
//     {"day": "Mon 19", "event": "No major US releases", "badge": "Quiet", "level": "quiet"},
//     {"day": "Wed 21", "event": "CPI and Core CPI", "badge": "8:30 ET", "level": "hot", "bold": true}
//   ],
//   "highlights": [
//     {"label": "Wed · CPI", "time": "8:30 ET"},
//     {"label": "Thu · Retail Sales", "time": "Morning"}
//   ]
// }
// level: "quiet" | "mid" | "hot". Keep rows to 3–5 and highlights to 2.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [heroPath, weekPath] = process.argv.slice(2);
if (!heroPath || !weekPath) { console.error('Usage: node tools/update-week.js <hero.svg> <week.json>'); process.exit(1); }

const hero = fs.readFileSync(heroPath, 'utf8').trim();
const week = JSON.parse(fs.readFileSync(weekPath, 'utf8'));
const fail = (m) => { console.error(m); process.exit(1); };

if (!hero.startsWith('<svg class="hero-chart"') || !hero.endsWith('</svg>')) fail('hero.svg is not a hero chart from tools/hero-chart.js');
if (typeof week.weekOf !== 'string' || !week.weekOf) fail('week.json needs weekOf');
if (!Array.isArray(week.rows) || week.rows.length < 1 || week.rows.length > 6) fail('week.json needs 1–6 rows');
if (!Array.isArray(week.highlights) || week.highlights.length < 1) fail('week.json needs highlights');
for (const r of week.rows) {
  if (!r.day || !r.event || !r.badge) fail('each row needs day, event and badge');
  if (!['quiet', 'mid', 'hot'].includes(r.level)) fail(`row "${r.event}" has level "${r.level}"; use quiet, mid or hot`);
}
for (const h of week.highlights) if (!h.label || !h.time) fail('each highlight needs label and time');

const clean = {
  weekOf: week.weekOf,
  rows: week.rows.map(({ day, event, badge, level, bold }) => ({ day, event, badge, level, ...(bold ? { bold: true } : {}) })),
  highlights: week.highlights.slice(0, 2).map(({ label, time }) => ({ label, time })),
};

const dataDir = path.join(root, 'src', 'data');
const stamp = new Date().toISOString().slice(0, 10);
const backupDir = path.join(root, 'backups', 'weekly', stamp);
fs.mkdirSync(backupDir, { recursive: true });
for (const f of ['hero-chart.svg', 'week.json']) fs.copyFileSync(path.join(dataDir, f), path.join(backupDir, f));

fs.writeFileSync(path.join(dataDir, 'hero-chart.svg'), hero + '\n');
fs.writeFileSync(path.join(dataDir, 'week.json'), JSON.stringify(clean, null, 2) + '\n');
console.log(`Updated src/data for the week of ${clean.weekOf}. Previous files backed up to backups/weekly/${stamp}/. Now run: npm run build`);
