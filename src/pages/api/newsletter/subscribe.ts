export const prerender = false;

import type { APIRoute } from 'astro';
import { resend, AUDIENCE_ID, FROM_EMAIL, SITE_URL } from '../../../lib/resend';
import { buildWelcomeEmail } from '../../../lib/email-templates';
import { verifyTurnstile } from '../../../lib/turnstile';

// Simple in-memory rate limiting (per serverless invocation lifetime)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 10_000; // 10 seconds between requests per IP

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const lastRequest = rateLimitMap.get(ip);
    const now = Date.now();
    if (lastRequest && now - lastRequest < RATE_LIMIT_MS) {
      return new Response(
        JSON.stringify({ error: 'Demasiados intentos. Esperá unos segundos.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    rateLimitMap.set(ip, now);

    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const turnstileToken = body.turnstileToken;

    // Validate Turnstile CAPTCHA
    if (!turnstileToken) {
      return new Response(
        JSON.stringify({ error: 'Verificación de seguridad requerida.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const turnstileValid = await verifyTurnstile(turnstileToken);
    if (!turnstileValid) {
      return new Response(
        JSON.stringify({ error: 'Verificación de seguridad fallida. Recargá la página e intentá de nuevo.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Email inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add contact to Resend Audience
    const { error: contactError } = await resend.contacts.create({
      email,
      audienceId: AUDIENCE_ID,
    });

    if (contactError) {
      // Check if already subscribed
      if (contactError.message?.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'Ya estás suscripto/a' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Error al suscribirse. Intentá de nuevo.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Send welcome email
    const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
    const html = buildWelcomeEmail(unsubscribeUrl);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Bienvenido/a al newsletter de selagueo.com',
      html,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: 'Error interno. Intentá de nuevo.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
