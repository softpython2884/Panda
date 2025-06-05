
'use server';
import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpSecure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@example.com';

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn(
    'SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS) are not fully configured. Email sending will likely fail.'
  );
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    // do not fail on invalid certs if using a local/test server without proper SSL
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<void> {
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.error('SMTP not configured. Skipping email send.');
    // In a real app, you might want to throw an error or handle this more gracefully
    // For now, we'll just log and prevent sending.
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: smtpFromEmail,
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    // Depending on the error, you might want to retry or alert an admin
    // For now, we re-throw so the caller can handle it if needed, or it gets caught globally.
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string, username?: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
  const verificationLink = appUrl + '/auth/verify-email/' + token;
  const subject = 'Verify your PANDA Account Email';
  const greeting = username ? 'Hello ' + username + ',' : 'Hello,';
  
  const textContent =
    greeting + '\n\n' +
    'Thank you for registering with PANDA!\n' +
    'Please verify your email address by clicking the link below:\n' +
    verificationLink + '\n\n' +
    'If you did not create an account, no further action is required.\n\n' +
    'Thanks,\n' +
    'The PANDA Team';

  const htmlContent =
    '<div style="font-family: Arial, sans-serif; line-height: 1.6;">\n' +
    '  <h2>Welcome to PANDA!</h2>\n' +
    '  <p>' + greeting + '</p>\n' +
    '  <p>Thank you for registering with PANDA! To complete your registration, please verify your email address by clicking the button below:</p>\n' +
    '  <p style="text-align: center;">\n' +
    '    <a href="' + verificationLink + '" style="background-color: #38b26c; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Verify Email Address</a>\n' +
    '  </p>\n' +
    '  <p>If the button doesn\'t work, you can also copy and paste the following link into your browser:</p>\n' +
    '  <p><a href="' + verificationLink + '">' + verificationLink + '</a></p>\n' +
    '  <p>If you did not create an account with PANDA, you can safely ignore this email.</p>\n' +
    '  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />\n' +
    '  <p style="font-size: 0.9em; color: #777;">Thanks,<br />The PANDA Team</p>\n' +
    '</div>';

  await sendEmail({
    to: email,
    subject,
    text: textContent,
    html: htmlContent,
  });
}
