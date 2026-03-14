export const prerender = false;

import type { APIRoute } from 'astro';
import { resend, AUDIENCE_ID } from '../../../lib/resend';

export const GET: APIRoute = async ({ url }) => {
  const email = url.searchParams.get('email')?.trim().toLowerCase();

  if (!email) {
    return new Response(buildPage('Email no proporcionado.', true), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    // List contacts to find the matching one
    const { data } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const contact = data?.data?.find((c: any) => c.email === email);

    if (contact) {
      await resend.contacts.remove({
        id: contact.id,
        audienceId: AUDIENCE_ID,
      });
    }

    return new Response(
      buildPage('Te desuscribiste del newsletter. Lamentamos verte partir.', false),
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch {
    return new Response(
      buildPage('Ocurrió un error. Intentá de nuevo más tarde.', true),
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
};

function buildPage(message: string, isError: boolean): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Newsletter — selagueo</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center; background:#0a0a0a; color:#e5e5e5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
  .card { text-align:center; max-width:400px; padding:40px 24px; }
  .icon { font-size:48px; margin-bottom:16px; }
  h1 { font-size:20px; font-weight:600; margin:0 0 12px; }
  p { font-size:14px; color:#a3a3a3; margin:0 0 24px; line-height:1.6; }
  a { color:#FF9A2E; text-decoration:none; font-size:14px; }
  a:hover { text-decoration:underline; }
</style>
</head>
<body>
<div class="card">
  <div class="icon">${isError ? '⚠️' : '👋'}</div>
  <h1>${message}</h1>
  <p>${isError ? '' : 'Si fue un error, siempre podés volver a suscribirte.'}</p>
  <a href="https://selagueo.com">← Volver a selagueo.com</a>
</div>
</body>
</html>`;
}
