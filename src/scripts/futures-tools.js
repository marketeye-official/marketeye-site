// Contract specs and the interactive futures tools: tick value calculator,
// position size calculator and the market-hours clock. Each init function
// wires up the markup rendered by its component in src/components/tools/.

// Per CME Group contract specifications.
export const SPEC = {
  ES: { name: 'ES', pointValue: 50, tick: 0.25, tickValue: 12.5 },
  MES: { name: 'MES', pointValue: 5, tick: 0.25, tickValue: 1.25 },
  NQ: { name: 'NQ', pointValue: 20, tick: 0.25, tickValue: 5 },
  MNQ: { name: 'MNQ', pointValue: 2, tick: 0.25, tickValue: 0.5 },
};

const money = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (el) => { const v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : 0; };
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');
const $ = (id) => document.getElementById(id);

export function initTickCalculator() {
  if (!$('tc-contract')) return;
  let unit = 'points';
  const tc = { c: $('tc-contract'), a: $('tc-amount'), q: $('tc-qty'), out: $('tc-out'), sub: $('tc-sub'), pts: $('tc-unit-points'), tks: $('tc-unit-ticks') };
  function calc() {
    const s = SPEC[tc.c.value], amt = num(tc.a), qty = Math.max(1, Math.floor(num(tc.q)) || 1);
    const ticks = unit === 'points' ? Math.round(amt / s.tick) : Math.round(amt);
    tc.out.textContent = money(ticks * s.tickValue * qty);
    const lead = unit === 'points'
      ? amt + ' ' + (amt === 1 ? 'point' : 'points') + ' = ' + plural(ticks, 'tick')
      : plural(ticks, 'tick') + ' (' + (ticks * s.tick) + ' points)';
    tc.sub.textContent = lead + ' × ' + money(s.tickValue) + ' × ' + plural(qty, 'contract');
  }
  function setUnit(u) {
    if (u === unit) return;
    const s = SPEC[tc.c.value], amt = num(tc.a);
    tc.a.value = u === 'ticks' ? Math.round(amt / s.tick) : amt * s.tick;
    tc.a.step = u === 'ticks' ? '1' : '0.25';
    unit = u;
    tc.pts.setAttribute('aria-pressed', String(u === 'points'));
    tc.tks.setAttribute('aria-pressed', String(u === 'ticks'));
    calc();
  }
  [tc.c, tc.a, tc.q].forEach((el) => el.addEventListener('input', calc));
  tc.pts.addEventListener('click', () => setUnit('points'));
  tc.tks.addEventListener('click', () => setUnit('ticks'));
  calc();
}

export function initSizeCalculator() {
  if (!$('ps-risk')) return;
  const ps = { r: $('ps-risk'), s: $('ps-stop'), c: $('ps-contract'), box: $('ps-result'), out: $('ps-out'), sub: $('ps-sub') };
  function calc() {
    const spec = SPEC[ps.c.value], risk = num(ps.r), stop = Math.round(num(ps.s));
    if (!risk || !stop) {
      ps.box.classList.add('warn'); ps.out.textContent = '—';
      ps.sub.textContent = 'Enter a max risk above $0 and a stop of at least 1 tick.';
      return;
    }
    const perContract = stop * spec.tickValue;
    const n = Math.floor(risk / perContract);
    if (n < 1) {
      ps.box.classList.add('warn');
      ps.out.textContent = '0 contracts';
      ps.sub.textContent = 'One ' + spec.name + ' contract would risk ' + money(perContract) + ', which is more than your ' + money(risk) + ' limit. A micro contract or a closer stop in your plan would fit.';
      return;
    }
    ps.box.classList.remove('warn');
    ps.out.textContent = plural(n, 'contract');
    ps.sub.textContent = 'Each contract risks ' + plural(stop, 'tick') + ' × ' + money(spec.tickValue) + ' = ' + money(perContract) + '. Total risk: ' + money(n * perContract) + '.';
  }
  [ps.r, ps.s, ps.c].forEach((el) => el.addEventListener('input', calc));
  calc();
}

// CME equity index futures, regular weekly schedule, US Eastern time. Holidays not included.
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function nowET() {
  const o = {};
  new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).forEach((p) => { o[p.type] = p.value; });
  const h = parseInt(o.hour, 10) % 24, m = parseInt(o.minute, 10);
  const time = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(new Date());
  return { day: DAYS.indexOf(o.weekday), mins: h * 60 + m, label: o.weekday + ' ' + time + ' ET' };
}
function marketStatus(t) {
  const d = t.day, m = t.mins, OPEN = 18 * 60, CLOSE = 17 * 60;
  if (d === 6) return ['closed', 'Closed for the weekend', 'Futures reopen Sunday at 6:00 PM ET.'];
  if (d === 0) return m >= OPEN ? ['open', 'Open', 'The new trading week started at 6:00 PM ET.'] : ['closed', 'Closed for the weekend', 'Futures reopen today at 6:00 PM ET.'];
  if (d === 5 && m >= CLOSE) return ['closed', 'Closed for the weekend', 'Futures reopen Sunday at 6:00 PM ET.'];
  if (d >= 1 && d <= 4 && m >= CLOSE && m < OPEN) return ['break', 'Daily break', 'Trading resumes at 6:00 PM ET.'];
  const cash = m >= 9 * 60 + 30 && m < 16 * 60;
  return ['open', cash ? 'Open · US cash session' : 'Open',
    cash ? 'The stock market is also open, so volume is usually highest now.' : (d === 5 ? 'The market closes for the weekend at 5:00 PM ET.' : 'Next daily break at 5:00 PM ET.')];
}

export function initMarketClock() {
  if (!$('clk-light')) return;
  const light = $('clk-light'), st = $('clk-state'), det = $('clk-detail'), wk = $('clk-week');
  const cls = ['partial-start', '', '', '', '', 'partial-end', 'closed'];
  function render() {
    const t = nowET(), s = marketStatus(t);
    light.className = 'light ' + s[0];
    st.textContent = s[1];
    det.textContent = "It's " + t.label + '. ' + s[2];
    wk.innerHTML = DAYS.map((d, i) => '<div class="' + (i === t.day ? 'today' : '') + '"><span class="bar ' + cls[i] + '"></span>' + d + '</div>').join('');
  }
  render();
  setInterval(render, 30000);
}
