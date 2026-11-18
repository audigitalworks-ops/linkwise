import { NextRequest, NextResponse } from "next/server";
import { getResendClient } from "@/lib/email/client";
import { apiSuccess, apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return apiError("INVALID_INPUT", "Your name is required.", 400);
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return apiError("INVALID_INPUT", "A valid email address is required.", 400);
    }
    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return apiError(
        "INVALID_INPUT",
        "Please provide a message with at least 10 characters.",
        400
      );
    }

    const resend = getResendClient();
    const adminEmail = process.env.ADMIN_EMAIL || "audigitalworks@gmail.com";
    const fromEmail = process.env.EMAIL_FROM || "Linkwise Support <onboarding@resend.dev>";

    if (!resend) {
      console.log(`[Contact Form Simulated] From: ${name} <${email}>: ${message}`);
      return apiSuccess({
        sent: true,
        simulated: true,
        message: "Thank you for reaching out! We will reply to your email shortly.",
      });
    }

    const emailSubject = subject?.trim()
      ? `[Linkwise Support] ${subject.trim()}`
      : `[Linkwise Support] New message from ${name.trim()}`;

    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1A1A18;">
        <div style="border-bottom: 2px solid #1F6F54; padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1F6F54; font-size: 20px;">New Contact Support Request</h2>
          <p style="margin: 4px 0 0; color: #6B6A65; font-size: 13px;">Received via Linkwise Contact Form</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; width: 100px; color: #6B6A65;">From:</td>
            <td style="padding: 8px 0;">${name.trim()} (&lt;${email.trim()}&gt;)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B6A65;">Subject:</td>
            <td style="padding: 8px 0;">${subject?.trim() || "General Inquiry"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6B6A65;">Time:</td>
            <td style="padding: 8px 0;">${new Date().toUTCString()}</td>
          </tr>
        </table>

        <div style="background-color: #FAFAF8; border: 1px solid #E6E4DF; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #6B6A65;">Message:</h4>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${message.trim()}</p>
        </div>

        <div style="font-size: 12px; color: #6B6A65; border-top: 1px solid #E6E4DF; padding-top: 16px;">
          <p style="margin: 0;">You can reply directly to this email to respond to <strong>${name.trim()}</strong> at <strong>${email.trim()}</strong>.</p>
        </div>
      </div>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: [adminEmail],
      replyTo: email.trim(),
      subject: emailSubject,
      html: htmlBody,
    });

    return apiSuccess({
      sent: true,
      message: "Your message has been sent successfully! Our team will get back to you shortly.",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to send contact message.";
    console.error("Error in contact API:", err);
    return apiError("INTERNAL", errorMsg, 500);
  }
}

