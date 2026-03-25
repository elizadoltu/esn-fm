import { emailShell, divider } from '../shell.js';

export function buildAccountDeletionEmailHtml(
  displayName: string,
  reason: string,
  customMessage?: string
): string {
  const reasonLabel = reason.replaceAll('_', ' ');

  const content = `
    <p style="margin:0 0 8px;color:#E2E1DF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Your account has been removed</p>
    <p style="margin:0 0 24px;color:#8a8980;font-size:14px;line-height:1.5;">
      Hi ${displayName}, your ESN FM account has been permanently deleted by a platform administrator.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #2E2E2E;border-radius:6px;overflow:hidden;">
      <tr style="background-color:#222;">
        <td style="padding:12px 16px;color:#8a8980;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reason</td>
      </tr>
      <tr>
        <td style="padding:16px;color:#E2E1DF;font-size:14px;text-transform:capitalize;">${reasonLabel}</td>
      </tr>
    </table>

    ${customMessage ? `
    <p style="margin:0 0 8px;color:#8a8980;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Additional message from the admin team</p>
    <p style="margin:0 0 24px;padding:12px 16px;background-color:#222;border-left:3px solid #444;border-radius:4px;color:#E2E1DF;font-size:13px;line-height:1.6;">
      ${customMessage}
    </p>` : ''}

    ${divider()}
    <p style="margin:0;color:#8a8980;font-size:12px;line-height:1.6;">
      If you believe this was a mistake, reply to this email to contact the support team.
    </p>
  `;

  return emailShell(content);
}
