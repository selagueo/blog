import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
export const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? '';
export const FROM_EMAIL = process.env.NEWSLETTER_FROM ?? 'José Lagos <newsletter@selagueo.com>';
export const SITE_URL = 'https://selagueo.com';
