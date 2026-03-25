import { emailShell, ctaButton } from '../shell.js';
import type { ModerationReportInfo } from './moderation.js';

export function buildDigestEmailHtml(reports: ModerationReportInfo[], adminDashboardUrl: string): string {
  const rows = reports
    .map(
      (r) => `<tr>
        <td style="padding:8px 12px;color:#E2E1DF;font-size:13px;border-bottom:1px solid #2E2E2E;">${r.contentType}</td>
        <td style="padding:8px 12px;color:#E2E1DF;font-size:13px;border-bottom:1px solid #2E2E2E;text-transform:capitalize;">${r.reason.replaceAll('_', ' ')}</td>
        <td style="padding:8px 12px;color:#8a8980;font-size:13px;border-bottom:1px solid #2E2E2E;">@${r.reporterUsername}</td>
      </tr>`
    )
    .join('');

  const reviewUrl = `${adminDashboardUrl}/admin?tab=reports`;

  const content = `
    <p style="margin:0 0 8px;color:#E2E1DF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Moderation digest</p>
    <p style="margin:0 0 24px;color:#8a8980;font-size:14px;line-height:1.5;">
      ${reports.length} report${reports.length === 1 ? '' : 's'} received in the last hour.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #2E2E2E;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background-color:#222;">
          <th style="padding:10px 12px;text-align:left;color:#8a8980;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Type</th>
          <th style="padding:10px 12px;text-align:left;color:#8a8980;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reason</th>
          <th style="padding:10px 12px;text-align:left;color:#8a8980;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reporter</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    ${ctaButton(reviewUrl, 'Review Reports')}
  `;

  return emailShell(content);
}
