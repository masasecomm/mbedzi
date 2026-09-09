const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function onRequestPost(context) {
  const request = context.request;
  const recipient = context.env.FORM_SUBMIT_EMAIL;
  const formData = await request.formData();
  const token = formData.get('cf-turnstile-response');

  if (typeof recipient !== 'string' || recipient.trim() === '') {
    return new Response(JSON.stringify({ error: 'Contact service is not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (typeof token !== 'string' || token.length === 0 || token.length > 2048) {
    return new Response(JSON.stringify({ error: 'Security check required.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const verification = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: context.env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') || '',
    }),
  });
  const result = await verification.json();

  if (!verification.ok || !result.success || result.action !== 'contact') {
    return new Response(JSON.stringify({ error: 'Security check failed.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const forwarded = new FormData();
  for (const [key, value] of formData.entries()) {
    if (key !== 'cf-turnstile-response') forwarded.append(key, value);
  }
  forwarded.append('_subject', 'New KeywordCatch contact form message');
  forwarded.append('_captcha', 'false');
  forwarded.append('_template', 'table');

  const delivery = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
    method: 'POST',
    body: forwarded,
    headers: { Accept: 'application/json' },
  });

  if (!delivery.ok) {
    return new Response(JSON.stringify({ error: 'Message could not be delivered.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}