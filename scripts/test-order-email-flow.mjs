import nodemailer from 'nodemailer';
import { loadScriptEnv } from './_env.mjs';

const env = loadScriptEnv();

const host = env.SMTP_HOST;
const port = Number.parseInt(env.SMTP_PORT ?? '587', 10);
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const secure = env.SMTP_SECURE === 'true';
const fromEmail = (env.ORDER_FROM_EMAIL ?? '').trim();
const fromName = (env.ORDER_FROM_NAME ?? 'CCAM Store').trim();

if (!host || !user || !pass || !fromEmail) {
    console.error('Missing SMTP config in .env.local or .env');
    process.exit(1);
}

const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
});

await transport.verify();

const customerRecipient = user;
const internalRecipient = fromEmail;

const customerInfo = await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: customerRecipient,
    subject: 'CCAM Store — Customer confirmation flow test',
    text: [
        'This is a test of the customer confirmation email flow.',
        '',
        'Items:',
        '- CCAM x PUBLIC WORKS TSHIRT (L) x1',
        '',
        'Total: $45.00',
        'Fulfillment: Ground shipping',
        'Ship to: 123 Test St, Chicago, IL 60608, US',
    ].join('\n'),
});

const internalInfo = await transport.sendMail({
    from: `${fromName} <${fromEmail}>`,
    to: internalRecipient,
    subject: 'CCAM Store — Internal new-order alert flow test',
    text: [
        'This is a test of the internal new-order notification flow.',
        '',
        'Session: cs_test_mock_local',
        'Payment Intent: pi_test_mock_local',
        `Customer: ${customerRecipient}`,
        'Total: $45.00',
        'Fulfillment: Ground shipping',
        'Ship to: 123 Test St, Chicago, IL 60608, US',
        '',
        'Items:',
        '- CCAM x PUBLIC WORKS TSHIRT (L) x1',
    ].join('\n'),
});

console.log('customer_email_to:', customerRecipient);
console.log('customer_message_id:', customerInfo.messageId);
console.log('internal_email_to:', internalRecipient);
console.log('internal_message_id:', internalInfo.messageId);
