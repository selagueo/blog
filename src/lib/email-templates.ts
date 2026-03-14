const SITE_URL = 'https://selagueo.com';

function emailWrapper(content: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="padding:0 0 32px 0;">
  <a href="${SITE_URL}" style="color:#FF9A2E;font-size:20px;font-weight:600;text-decoration:none;letter-spacing:-0.5px;">selagueo</a>
</td></tr>

<!-- Content -->
${content}

<!-- Footer -->
<tr><td style="padding:40px 0 0 0;border-top:1px solid #222;">
  <p style="margin:0;font-size:12px;color:#666;line-height:1.6;">
    Recibís este email porque te suscribiste al newsletter de selagueo.com<br>
    <a href="${unsubscribeUrl}" style="color:#666;text-decoration:underline;">Desuscribirse</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildWelcomeEmail(unsubscribeUrl: string): string {
  const content = `
<tr><td style="padding:0 0 24px 0;">
  <h1 style="margin:0;font-size:28px;font-weight:600;color:#e5e5e5;line-height:1.3;">
    Bienvenido/a al newsletter 👋
  </h1>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
  <p style="margin:0;font-size:16px;color:#a3a3a3;line-height:1.6;">
    Gracias por suscribirte. Vas a recibir un email cada vez que publique algo nuevo en el blog — cosas sobre lo que estoy haciendo, leyendo, pensando y aprendiendo.
  </p>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
  <p style="margin:0;font-size:16px;color:#a3a3a3;line-height:1.6;">
    Nada de spam, solo contenido genuino.
  </p>
</td></tr>
<tr><td style="padding:8px 0 0 0;">
  <a href="${SITE_URL}/blog" style="display:inline-block;padding:12px 28px;background-color:#FF9A2E;color:#111;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
    Ir al blog &rarr;
  </a>
</td></tr>`;

  return emailWrapper(content, unsubscribeUrl);
}

export interface PostData {
  title: string;
  description: string;
  banner: string;
  slug: string;
}

export function buildPostNotificationEmail(post: PostData, unsubscribeUrl: string): string {
  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const bannerUrl = post.banner.startsWith('http') ? post.banner : `${SITE_URL}${post.banner}`;

  const content = `
<tr><td style="padding:0 0 8px 0;">
  <p style="margin:0;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:1px;font-weight:500;">
    Nuevo post
  </p>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
  <h1 style="margin:0;font-size:28px;font-weight:600;color:#e5e5e5;line-height:1.3;">
    ${post.title}
  </h1>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
  <a href="${postUrl}" style="display:block;text-decoration:none;">
    <img src="${bannerUrl}" alt="${post.title}" width="600" style="width:100%;height:auto;border-radius:12px;display:block;" />
  </a>
</td></tr>
<tr><td style="padding:0 0 24px 0;">
  <p style="margin:0;font-size:16px;color:#a3a3a3;line-height:1.6;">
    ${post.description}
  </p>
</td></tr>
<tr><td style="padding:8px 0 0 0;">
  <a href="${postUrl}" style="display:inline-block;padding:12px 28px;background-color:#FF9A2E;color:#111;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
    Leer post &rarr;
  </a>
</td></tr>`;

  return emailWrapper(content, unsubscribeUrl);
}
