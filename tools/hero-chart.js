// Builds the animated hero chart from MES OHLC bars.
// The candles rise from the bottom-left, run behind the quiz card and end just outside
// its top-right corner (card right edge is x=1296 in a 1440-wide frame centered on the 1200px layout).
//
// Usage: node tools/hero-chart.js <bars.json> <out.svg> [cardTop=112] [height=860]
// bars.json: {"o":[...],"h":[...],"l":[...],"c":[...]}  (oldest first; about 60 bars works best)
import fs from 'node:fs';
const [barsPath, outPath, cardTopArg, heightArg] = process.argv.slice(2);
if (!barsPath || !outPath) { console.error('Usage: node tools/hero-chart.js <bars.json> <out.svg> [cardTop] [height]'); process.exit(1); }
const { o, h, l, c } = JSON.parse(fs.readFileSync(barsPath, 'utf8'));
const n = c.length;
if (!n || [o, h, l].some(a => !Array.isArray(a) || a.length !== n)) { console.error('bars.json needs o, h, l, c arrays of equal length'); process.exit(1); }

const cardTop = Number(cardTopArg || 112), H = Number(heightArg || 860), W = 1440;
const x0 = 40, x1 = 1316, step = (x1 - x0) / n, bw = step * 0.6;
const lo = Math.min(...l), hi = Math.max(...h);
const yTop = cardTop - 8, yBot = H - 50;
const y = v => +(yTop + (hi - v) / (hi - lo || 1) * (yBot - yTop)).toFixed(1);
const cx = i => +(x0 + i * step + step / 2).toFixed(1);

let s = `<svg class="hero-chart" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">`;
for (let gy = 0; gy <= H; gy += 60) s += `<line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="#00C8FF" stroke-opacity="0.05"/>`;
for (let gx = 0; gx <= W; gx += 60) s += `<line x1="${gx}" x2="${gx}" y1="0" y2="${H}" stroke="#00C8FF" stroke-opacity="0.05"/>`;
const hex = (hx, hy, r, cls, dl) => {
  const p = [...Array(6)].map((_, k) => { const a = Math.PI / 180 * (60 * k - 30); return (hx + r * Math.cos(a)).toFixed(1) + ',' + (hy + r * Math.sin(a)).toFixed(1); }).join(' ');
  return `<polygon class="${cls}" points="${p}" fill="none" stroke="#2B72E8" stroke-opacity="0.35" stroke-width="1.5" style="animation-delay: ${dl}s"/>`;
};
s += hex(70, cardTop + 20, 50, 'hexa', 0) + hex(150, cardTop - 40, 28, 'hexb', 2) + hex(1380, H - 160, 56, 'hexb', 1) + hex(1300, H - 70, 32, 'hexa', 3) + hex(1400, cardTop + 260, 30, 'hexa', 4);
for (let i = 0; i < n; i++) {
  const x = cx(i), up = c[i] >= o[i], col = up ? '#00C8FF' : '#5033C3';
  const t = y(Math.max(o[i], c[i])), b = y(Math.min(o[i], c[i]));
  s += `<g class="cdl" style="animation-delay: ${(i * 0.07).toFixed(2)}s"><line x1="${x}" x2="${x}" y1="${y(h[i])}" y2="${y(l[i])}" stroke="${col}" stroke-width="1.5"/><rect x="${(x - bw / 2).toFixed(1)}" y="${t}" width="${bw.toFixed(1)}" height="${Math.max(2, b - t).toFixed(1)}" rx="1.5" fill="${col}"/></g>`;
}
const sm = c.map((_, i) => { const a = c.slice(Math.max(0, i - 4), i + 1); return a.reduce((p, q) => p + q, 0) / a.length; });
s += `<path class="trend" d="M${sm.map((v, i) => `${cx(i)} ${y(v)}`).join(' L')}" fill="none" stroke="#7FE3FF" stroke-width="3" stroke-linecap="round" pathLength="1"/>`;
const ex = cx(n - 1), ey = y(c[n - 1]);
const last = c[n - 1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
s += `<line x1="${ex - 140}" x2="${ex + 14}" y1="${ey}" y2="${ey}" stroke="#00C8FF" stroke-opacity="0.45" stroke-dasharray="4 6"/>`;
s += `<g class="pulse"><circle cx="${ex}" cy="${ey}" r="7" fill="#00C8FF"/></g>`;
s += `<rect x="${ex + 16}" y="${ey - 15}" width="100" height="30" rx="6" fill="#00C8FF"/><text x="${ex + 66}" y="${ey + 5}" text-anchor="middle" fill="#04091C" font-size="14" font-weight="700" font-family="JetBrains Mono, monospace">${last}</text>`;
s += `<text x="${ex + 16}" y="${ey - 24}" fill="#8A9BBF" font-size="12" font-family="JetBrains Mono, monospace">MES · 15m</text>`;
s += `<defs><linearGradient id="sweepg" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#00C8FF" stop-opacity="0"/><stop offset="0.5" stop-color="#00C8FF" stop-opacity="0.16"/><stop offset="1" stop-color="#00C8FF" stop-opacity="0"/></linearGradient></defs><rect class="sweep" x="-260" y="0" width="260" height="${H}" fill="url(#sweepg)"/>`;
s += `</svg>`;
fs.writeFileSync(outPath, s);
console.log(`hero chart: ${n} bars, last close ${last}, end point (${ex}, ${ey})`);
