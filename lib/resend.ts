// Envoie un email via Resend. Nécessite la variable d'environnement
// RESEND_API_KEY (créée depuis le compte Resend > API Keys).
// Options : adresse de réponse (les envois partent d'une adresse qui ne
// reçoit rien) et pièces jointes (contenu en base64).
export async function envoyerEmail(
  to: string,
  subject: string,
  html: string,
  options: { replyTo?: string; attachments?: { filename: string; content: string }[] } = {}
) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'Movement Practice Bordeaux <onboarding@resend.dev>',
      to,
      subject,
      html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      ...(options.attachments?.length ? { attachments: options.attachments } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Échec envoi email à ${to}: ${detail}`);
  }
}
