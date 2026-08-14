import 'server-only';
import { Resend } from 'resend';

import { env } from '@/lib/env';

/**
 * Emails a contact enquiry to the company.
 *
 * **Never throws.** The submission is already saved by the time this runs, and
 * an enquiry that reached the database is not lost because an email provider
 * had a bad minute. Failures are reported to the caller so they can be logged,
 * not surfaced to the visitor — from their side the message did arrive.
 *
 * No-ops when the provider is not configured, which is the case locally and in
 * CI.
 */
export interface ContactNotification {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
}

export async function notifyContact(
  submission: ContactNotification,
): Promise<{ sent: boolean; reason?: string }> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.COMPANY_EMAIL) {
    return { sent: false, reason: 'email not configured' };
  }

  try {
    const resend = new Resend(env.RESEND_API_KEY);

    const { error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: env.COMPANY_EMAIL,
      // So a reply goes to the enquirer rather than to the company itself.
      replyTo: submission.email,
      subject: submission.subject
        ? `Contact: ${submission.subject}`
        : `Contact from ${submission.name}`,
      text: [
        `Name:    ${submission.name}`,
        `Email:   ${submission.email}`,
        `Phone:   ${submission.phone ?? '—'}`,
        `Subject: ${submission.subject ?? '—'}`,
        '',
        submission.message,
        '',
        `Submission #${submission.id}`,
      ].join('\n'),
    });

    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : 'unknown',
    };
  }
}
