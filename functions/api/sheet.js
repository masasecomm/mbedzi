export async function onRequestGet(context) {
  const sourceUrl = context.env.GOOGLE_SHEET_URL;
  const requestedGid = new URL(context.request.url).searchParams.get('gid');
  const allowedGids = new Set(['779817175', '1273884144', '726175016']);

  if (typeof sourceUrl !== 'string' || sourceUrl.trim() === '') {
    return new Response(JSON.stringify({ error: 'Sheet source is not configured.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  let source;
  try {
    source = new URL(sourceUrl);
    if (requestedGid && allowedGids.has(requestedGid)) source.searchParams.set('gid', requestedGid);
  } catch {
    return new Response(JSON.stringify({ error: 'Sheet source is invalid.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  if (source.protocol !== 'https:' || !source.hostname.endsWith('google.com')) {
    return new Response(JSON.stringify({ error: 'Only an HTTPS Google source is allowed.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const upstream = await fetch(source, {
    cf: { cacheTtl: 50, cacheEverything: true },
    headers: { Accept: 'text/csv, application/json' },
  });

  if (!upstream.ok) {
    return new Response(JSON.stringify({ error: 'The sheet could not be read.' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const headers = new Headers(upstream.headers);
  headers.set('Cache-Control', 'public, max-age=50, s-maxage=50');
  headers.delete('set-cookie');
  return new Response(upstream.body, { status: 200, headers });
}
