export const prerender = false;

import type { APIRoute } from 'astro';
import { resend, AUDIENCE_ID, FROM_EMAIL, SITE_URL } from '../../../lib/resend';
import { buildPostNotificationEmail } from '../../../lib/email-templates';

export const POST: APIRoute = async ({ request }) => {
  // Verify secret
  const authHeader = request.headers.get('authorization');
  const secret = process.env.NEWSLETTER_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { slug, title, description, banner } = await request.json();

    if (!slug || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: slug, title' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get all subscribers
    const { data } = await resend.contacts.list({ audienceId: AUDIENCE_ID });
    const contacts = data?.data ?? [];

    if (contacts.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: 'No subscribers' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const post = { slug, title, description: description ?? '', banner: banner ?? '' };

    // Send to all subscribers in batches of 50
    let totalSent = 0;
    const batchSize = 50;

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      const emails = batch.map((contact: any) => {
        const unsubscribeUrl = `${SITE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(contact.email)}`;
        return {
          from: FROM_EMAIL,
          to: contact.email,
          subject: `Nuevo post: ${title}`,
          html: buildPostNotificationEmail(post, unsubscribeUrl),
        };
      });

      await resend.batch.send(emails);
      totalSent += batch.length;
    }

    return new Response(
      JSON.stringify({ sent: totalSent }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Failed to send newsletter' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
