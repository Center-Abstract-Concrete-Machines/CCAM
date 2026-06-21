// Run with: node scripts/test-smtp.mjs
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Parse .env manually (no external deps needed)
const envPath = resolve(process.cwd(), '.env');
const envVars = Object.fromEntries(
    readFileSync(envPath, 'utf8')
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => {
            const idx = line.indexOf('=');
            return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
        })
);

const host = envVars.SMTP_HOST;
const port = parseInt(envVars.SMTP_PORT ?? '465', 10);
const user = envVars.SMTP_USER;
const pass = envVars.SMTP_PASS;
const secure = envVars.SMTP_SECURE === 'true';
const fromEmail = envVars.ORDER_FROM_EMAIL;
const fromName = envVars.ORDER_FROM_NAME ?? 'CCAM Store';

if (!host || !user || !pass || !fromEmail) {
    console.error('Missing SMTP config in .env — check SMTP_HOST, SMTP_USER, SMTP_PASS, ORDER_FROM_EMAIL');
    process.exit(1);
}

console.log(`Connecting to ${host}:${port} as ${user} (secure: ${secure})…`);

const transport = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

try {
    await transport.verify();
    console.log('SMTP connection verified ✓');
} catch (err) {
    console.error('SMTP connection failed:', err.message);
    process.exit(1);
}

const info = await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: fromEmail,
    subject: 'CCAM Store — SMTP test',
    text: 'If you received this, order confirmation emails are working.',
});

console.log('Test email sent ✓');
console.log('Message ID:', info.messageId);
