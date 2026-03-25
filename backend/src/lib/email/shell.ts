export function emailShell(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#131313;font-family:system-ui,-apple-system,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#131313;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:32px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="padding-right:8px;vertical-align:middle;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2E1DF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </td>
            <td style="color:#E2E1DF;font-size:18px;font-weight:700;letter-spacing:-0.3px;vertical-align:middle;">ESN FM</td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background-color:#1A1A1A;border:1px solid #2E2E2E;border-radius:8px;padding:36px 32px;">
          ${content}
        </td></tr>

        <!-- Footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;color:#8a8980;font-size:12px;line-height:1.6;">
            This is an automated message from ESN FM.<br>
            Reply to this email to contact the support team.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
    <tr>
      <td style="background-color:#E2E1DF;border-radius:6px;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;color:#131313;font-size:14px;font-weight:600;text-decoration:none;border-radius:6px;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

export function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td style="border-top:1px solid #2E2E2E;"></td></tr>
  </table>`;
}
