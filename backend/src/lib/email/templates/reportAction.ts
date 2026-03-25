import { emailShell, divider } from '../shell.js';

const ACTION_LABELS: Record<string, string> = {
  warning: 'Warning issued',
  content_removed: 'Content removed',
  account_suspended: 'Account suspended',
  other: 'Action taken',
};

export function buildReportActionEmailHtml(
  displayName: string,
  contentType: string,
  policyViolation: string,
  actionType: string,
  adminMessage?: string
): string {
  const actionLabel = ACTION_LABELS[actionType] ?? actionType.replaceAll('_', ' ');
  const violationLabel = policyViolation.replaceAll('_', ' ');
  const typeLabel = contentType.charAt(0).toUpperCase() + contentType.slice(1);

  const content = `
    <p style="margin:0 0 8px;color:#E2E1DF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Action taken on your content</p>
    <p style="margin:0 0 24px;color:#8a8980;font-size:14px;line-height:1.5;">
      Hi ${displayName}, a moderator has reviewed a report about your content and taken action.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #2E2E2E;border-radius:6px;overflow:hidden;">
      <tr style="background-color:#222;">
        <td style="padding:12px 16px;color:#8a8980;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Details</td>
      </tr>
      <tr>
        <td style="padding:16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#8a8980;font-size:12px;width:140px;">Content type</td>
              <td style="padding:4px 0;color:#E2E1DF;font-size:13px;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8a8980;font-size:12px;">Policy violated</td>
              <td style="padding:4px 0;color:#E2E1DF;font-size:13px;text-transform:capitalize;">${violationLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8a8980;font-size:12px;">Action taken</td>
              <td style="padding:4px 0;color:#E2A300;font-size:13px;font-weight:600;text-transform:capitalize;">${actionLabel}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${adminMessage ? `
    <p style="margin:0 0 8px;color:#8a8980;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Message from the moderation team</p>
    <p style="margin:0 0 24px;padding:12px 16px;background-color:#222;border-left:3px solid #444;border-radius:4px;color:#E2E1DF;font-size:13px;line-height:1.6;">
      ${adminMessage}
    </p>` : ''}

    ${divider()}
    <p style="margin:0;color:#8a8980;font-size:12px;line-height:1.6;">
      The identity of the reporter is kept confidential. If you believe this action was made in error, reply to this email to contact our support team.
    </p>
  `;

  return emailShell(content);
}
