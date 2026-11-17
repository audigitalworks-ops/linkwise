import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface WeeklyReportEmailData {
  recipientEmail: string;
  recipientName?: string;
  siteName: string;
  siteUrl: string;
  healthScore: number;
  pagesScanned: number;
  orphanCount: number;
  brokenCount: number;
  suggestionsReady: number;
  linksApplied: number;
}

/**
 * Generates an accessible, clean HTML email template for the weekly link health report.
 */
export function renderWeeklyReportHtml(data: WeeklyReportEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const reportUrl = `${appUrl}/app/report`;
  const suggestionsUrl = `${appUrl}/app/suggestions`;

  const healthRating =
    data.healthScore >= 80
      ? "Good"
      : data.healthScore >= 60
      ? "Needs Attention"
      : "Poor";

  const ratingColor =
    data.healthScore >= 80
      ? "#1F6F54"
      : data.healthScore >= 60
      ? "#B45309"
      : "#B42318";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Link Health Report - ${data.siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAFAF8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1A1A18; line-height: 1.5;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E6E4DF; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 28px; border-bottom: 1px solid #E6E4DF; background-color: #FFFFFF;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <span style="font-size: 16px; font-weight: 700; color: #1F6F54; letter-spacing: -0.02em;">Linkwise</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #6B6A65;">Weekly Report</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding: 28px 28px 20px 28px;">
              <h1 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1A1A18; letter-spacing: -0.01em;">
                Weekly Health Summary for ${data.siteName}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #6B6A65;">
                Site: <a href="${data.siteUrl}" style="color: #1F6F54; text-decoration: none;">${data.siteUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Health Score Banner -->
          <tr>
            <td style="padding: 0 28px 24px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAFAF8; border: 1px solid #E6E4DF; border-radius: 6px; padding: 20px;">
                <tr>
                  <td>
                    <span style="font-size: 11px; font-weight: 600; color: #6B6A65; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 4px;">Overall Health Score</span>
                    <div style="font-size: 36px; font-weight: 700; color: #1A1A18; line-height: 1;">
                      ${data.healthScore}<span style="font-size: 18px; font-weight: 500; color: #6B6A65;">/100</span>
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 4px; background-color: #FFFFFF; border: 1px solid #E6E4DF; color: ${ratingColor};">
                      ${healthRating}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Metrics Grid -->
          <tr>
            <td style="padding: 0 28px 28px 28px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="padding-right: 8px; padding-bottom: 16px;">
                    <div style="border: 1px solid #E6E4DF; border-radius: 6px; padding: 14px; background-color: #FFFFFF;">
                      <span style="font-size: 11px; color: #6B6A65; text-transform: uppercase; font-weight: 600; display: block;">Opportunities Ready</span>
                      <span style="font-size: 22px; font-weight: 700; color: #1F6F54; display: block; margin-top: 4px;">${data.suggestionsReady}</span>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px; padding-bottom: 16px;">
                    <div style="border: 1px solid #E6E4DF; border-radius: 6px; padding: 14px; background-color: #FFFFFF;">
                      <span style="font-size: 11px; color: #6B6A65; text-transform: uppercase; font-weight: 600; display: block;">Links Applied This Week</span>
                      <span style="font-size: 22px; font-weight: 700; color: #1A1A18; display: block; margin-top: 4px;">${data.linksApplied}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="padding-right: 8px;">
                    <div style="border: 1px solid #E6E4DF; border-radius: 6px; padding: 14px; background-color: #FFFFFF;">
                      <span style="font-size: 11px; color: #6B6A65; text-transform: uppercase; font-weight: 600; display: block;">Orphan Pages</span>
                      <span style="font-size: 22px; font-weight: 700; color: ${data.orphanCount > 0 ? "#B45309" : "#1A1A18"}; display: block; margin-top: 4px;">${data.orphanCount}</span>
                    </div>
                  </td>
                  <td width="50%" style="padding-left: 8px;">
                    <div style="border: 1px solid #E6E4DF; border-radius: 6px; padding: 14px; background-color: #FFFFFF;">
                      <span style="font-size: 11px; color: #6B6A65; text-transform: uppercase; font-weight: 600; display: block;">Broken Links</span>
                      <span style="font-size: 22px; font-weight: 700; color: ${data.brokenCount > 0 ? "#B42318" : "#1A1A18"}; display: block; margin-top: 4px;">${data.brokenCount}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 28px 32px 28px;" align="center">
              <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #1F6F54;">
                    <a href="${suggestionsUrl}" style="font-size: 13px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 10px 20px; display: inline-block;">
                      Review & Apply Suggestions
                    </a>
                  </td>
                  <td style="width: 12px;"></td>
                  <td align="center" style="border-radius: 6px; border: 1px solid #E6E4DF; background-color: #FFFFFF;">
                    <a href="${reportUrl}" style="font-size: 13px; font-weight: 600; color: #1A1A18; text-decoration: none; padding: 10px 20px; display: inline-block;">
                      View Full Report
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 28px; border-top: 1px solid #E6E4DF; background-color: #FAFAF8; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #6B6A65;">
                You are receiving this automated weekly email because weekly reports are enabled for your site on Linkwise.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #6B6A65;">
                Manage preferences in <a href="${appUrl}/app/settings" style="color: #1F6F54; text-decoration: underline;">Site Settings</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a weekly report email using the Resend SDK.
 */
export async function sendWeeklyReportEmail(
  data: WeeklyReportEmailData
): Promise<{ success: boolean; id?: string; error?: string; skipped?: boolean }> {
  const resend = getResendClient();
  const fromEmail = process.env.EMAIL_FROM || "Linkwise <onboarding@resend.dev>";
  const replyTo = process.env.EMAIL_REPLY_TO || "audigitalworks@gmail.com";

  if (!resend) {
    // If RESEND_API_KEY is not configured in local environment, log gracefully
    console.info(
      `[Resend Demo Mode] Weekly report email simulated for ${data.recipientEmail} (${data.siteName}): Health Score ${data.healthScore}`
    );
    return { success: true, id: `mock_${Date.now()}`, skipped: true };
  }

  try {
    const html = renderWeeklyReportHtml(data);
    const result = await resend.emails.send({
      from: fromEmail,
      to: [data.recipientEmail],
      replyTo,
      subject: `Weekly Link Health Report: ${data.siteName} (${data.healthScore}/100)`,
      html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, id: result.data?.id };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed sending email via Resend";
    return { success: false, error: message };
  }
}

