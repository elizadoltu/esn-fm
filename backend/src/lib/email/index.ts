/**
 * Email sending utility.
 * Uses Resend API when RESEND_API_KEY is set; falls back to console logging.
 *
 * Primary sending address : set via EMAIL_FROM env var
 * Support reply-to alias  : support@elizadoltuofficial.net
 */

const FROM = process.env.EMAIL_FROM;
const REPLY_TO = 'support@elizadoltuofficial.net';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to, subject, html }),
    });
  } else {
    console.log(`[email] To: ${to} | Subject: ${subject}`);
  }
}

export type { ModerationReportInfo } from './templates/moderation.js';
export { buildModerationEmailHtml } from './templates/moderation.js';
export { buildDigestEmailHtml } from './templates/digest.js';
export { buildReportActionEmailHtml } from './templates/reportAction.js';
export { buildAccountDeletionEmailHtml } from './templates/accountDeletion.js';
