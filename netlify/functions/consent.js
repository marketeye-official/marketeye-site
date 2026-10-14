export default async (req, context) => {
  if (req.method !== 'POST') {
    return Response.json({ ok: false, error: 'method not allowed' }, { status: 405 });
  }

  const ENDPOINT = process.env.CONSENT_ENDPOINT;
  const TOKEN    = process.env.CONSENT_TOKEN;

  if (!ENDPOINT || !TOKEN) {
    console.error('consent: missing CONSENT_ENDPOINT or CONSENT_TOKEN env var');
    return Response.json({ ok: false, error: 'server misconfigured' }, { status: 500 });
  }

  let d;
  try {
    d = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid body' }, { status: 400 });
  }

  if (!d.email || !d.tos_version) {
    return Response.json({ ok: false, error: 'missing required fields' }, { status: 400 });
  }

  const ip =
    req.headers.get('x-nf-client-connection-ip') ||
    context.ip ||
    '';

  const payload = {
    token:           TOKEN,                    // injected server-side, never from client
    hp:              d.hp || false,
    first_name:      d.first_name      || '',
    last_name:       d.last_name       || '',
    email:           d.email           || '',
    tos_version:     d.tos_version     || '',
    tos_effective:   d.tos_effective   || '',
    tos_accepted_at: d.tos_accepted_at || '',
    tos_method:      d.tos_method      || '',
    terms_url:       d.terms_url       || '',
    page_url:        d.page_url        || '',
    user_agent:      req.headers.get('user-agent') || '',
    ip:              ip
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    const out = await res.json();
    if (!out.ok) {
      console.error('consent: upstream rejected', out.error);
      return Response.json({ ok: false, error: 'upstream error' }, { status: 502 });
    }

    return Response.json({ ok: true });

  } catch (err) {
    console.error('consent: upstream failed', String(err));
    return Response.json({ ok: false, error: 'upstream unreachable' }, { status: 502 });
  }
};