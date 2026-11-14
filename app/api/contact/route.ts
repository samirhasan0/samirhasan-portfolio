import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { EMAIL } from '@/components/data';

/** Every contact-form enquiry is delivered here (the same address shown on the site). */
const TO = EMAIL; // hello@samirhasan.com

/** Visitors type these fields, so escape them before putting them into the email's HTML. */
const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export async function POST(req: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 503 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { name, company, email, message, reason } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resend reports failures in the result rather than by throwing
    const { error } = await resend.emails.send({
      from: 'Contact Form <noreply@samirhasan.com>',
      to: TO,
      subject: `[Contact] ${reason} — ${name}`,
      replyTo: email,
      html: `
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Company / Role:</strong> ${esc(company) || '—'}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Reason:</strong> ${esc(reason)}</p>
        <hr />
        <p>${esc(message).replace(/\n/g, '<br />')}</p>
      `,
    });
    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
