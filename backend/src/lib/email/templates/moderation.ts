import { emailShell, ctaButton, divider } from '../shell.js';

export interface ModerationReportInfo {
  reportId: string;
  contentType: string;
  contentId: string;
  reason: string;
  reporterUsername: string;
  contentExcerpt: string;
  batchCount: number;
  reporterMessage?: string;
}

export function buildModerationEmailHtml(
  report: ModerationReportInfo,
  adminDashboardUrl: string
): string {
  const batchNote =
    report.batchCount > 1
      ? `<p style="margin:0 0 16px;color:#E2A300;font-size:13px;font-weight:600;">
        ⚠ ${report.batchCount} reports have been filed for this content in the last 5 minutes.
       </p>`
      : '';

  const reasonLabel = report.reason.replaceAll('_', ' ');
  const typeLabel = report.contentType.charAt(0).toUpperCase() + report.contentType.slice(1);
  const reviewUrl = `${adminDashboardUrl}/admin?tab=reports&id=${report.reportId}`;
  const excerptTruncated =
    report.contentExcerpt.length > 200
      ? report.contentExcerpt.slice(0, 200) + '…'
      : report.contentExcerpt;

  const contentPreview = report.contentExcerpt
    ? `<p style="margin:0 0 8px;color:#8a8980;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reported content preview</p>
    <p style="margin:0 0 24px;padding:12px 16px;background-color:#222;border-left:3px solid #444;border-radius:4px;color:#E2E1DF;font-size:13px;line-height:1.6;font-style:italic;">
      &ldquo;${excerptTruncated}&rdquo;
    </p>`
    : '';

  const reporterNote = report.reporterMessage
    ? `<p style="margin:0 0 8px;color:#8a8980;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Reporter's message</p>
    <p style="margin:0 0 24px;padding:12px 16px;background-color:#222;border-left:3px solid #5a8a5a;border-radius:4px;color:#E2E1DF;font-size:13px;line-height:1.6;">
      ${report.reporterMessage}
    </p>`
    : '';

  const content = `
    <p style="margin:0 0 8px;color:#E2E1DF;font-size:22px;font-weight:700;letter-spacing:-0.3px;">New report received</p>
    <p style="margin:0 0 24px;color:#8a8980;font-size:14px;line-height:1.5;">
      A piece of content on ESN FM has been reported and requires your review.
    </p>

    ${batchNote}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #2E2E2E;border-radius:6px;overflow:hidden;">
      <tr style="background-color:#222;">
        <td style="padding:12px 16px;color:#8a8980;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Report details</td>
      </tr>
      <tr>
        <td style="padding:16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#8a8980;font-size:12px;width:120px;">Type</td>
              <td style="padding:4px 0;color:#E2E1DF;font-size:13px;">${typeLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8a8980;font-size:12px;">Reason</td>
              <td style="padding:4px 0;color:#E2E1DF;font-size:13px;text-transform:capitalize;">${reasonLabel}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#8a8980;font-size:12px;">Reporter</td>
              <td style="padding:4px 0;color:#E2E1DF;font-size:13px;">@${report.reporterUsername}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${contentPreview}
    ${reporterNote}

    ${ctaButton(reviewUrl, 'Review Report')}

    ${divider()}
    <p style="margin:0;color:#8a8980;font-size:12px;">If the button doesn't work, copy this URL: <a href="${reviewUrl}" style="color:#E2E1DF;">${reviewUrl}</a></p>
  `;

  return emailShell(content);
}
