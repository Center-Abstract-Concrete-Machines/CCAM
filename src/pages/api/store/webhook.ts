export const prerender = false;

import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import { getStripeServerClient } from '@utils/stripeServer';

const stripe = getStripeServerClient();

const smtpHost = import.meta.env.SMTP_HOST;
const smtpPort = Number.parseInt(import.meta.env.SMTP_PORT ?? '587', 10);
const smtpUser = import.meta.env.SMTP_USER;
const smtpPass = import.meta.env.SMTP_PASS;
const smtpSecure = import.meta.env.SMTP_SECURE === 'true';
const orderFromEmail =
    import.meta.env.ORDER_FROM_EMAIL?.trim() || 'store@ccam.world';
const orderFromName = import.meta.env.ORDER_FROM_NAME ?? 'CCAM Store';
const internalOrderEmailRaw =
    import.meta.env.ORDER_NOTIFICATION_EMAILS ??
    import.meta.env.ORDER_NOTIFICATION_EMAIL ??
    orderFromEmail;
const internalOrderEmails = internalOrderEmailRaw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);

const canSendOrderEmail =
    Boolean(smtpHost) &&
    Number.isFinite(smtpPort) &&
    Boolean(smtpUser) &&
    Boolean(smtpPass) &&
    Boolean(orderFromEmail);

const mailTransport = canSendOrderEmail
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    })
    : null;

async function updatePaymentIntentMetadata(
    paymentIntentId: string,
    metadataUpdates: Record<string, string>
) {
    const current = await stripe.paymentIntents.retrieve(paymentIntentId);
    await stripe.paymentIntents.update(paymentIntentId, {
        metadata: {
            ...current.metadata,
            ...metadataUpdates,
        },
    });
}

async function decrementInventoryIfTracked(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.metadata.inventoryTracked !== 'true') {
        return;
    }
    if (paymentIntent.metadata.inventoryAdjusted === 'true') {
        return;
    }

    const productId = paymentIntent.metadata.productId;
    const priceId = paymentIntent.metadata.priceId;
    const quantity = Number.parseInt(paymentIntent.metadata.quantity ?? '1', 10);
    const inventoryLevel = paymentIntent.metadata.inventoryLevel;

    if ((!productId && !priceId) || Number.isNaN(quantity) || quantity < 1) {
        console.error('Invalid inventory metadata on payment intent:', paymentIntent.id);
        return;
    }

    if (inventoryLevel === 'price' && priceId) {
        const inventoryPrice = await stripe.prices.retrieve(priceId);
        const inventoryValue = inventoryPrice.metadata.inventory_count;
        const inventoryCount = Number.parseInt(inventoryValue ?? '', 10);

        if (Number.isNaN(inventoryCount) || inventoryCount < 0) {
            console.error('Invalid inventory_count metadata on price:', priceId);
            return;
        }

        if (quantity > inventoryCount) {
            console.error('Payment succeeded but variant inventory is insufficient:', {
                paymentIntentId: paymentIntent.id,
                priceId,
                requested: quantity,
                available: inventoryCount,
            });

            await updatePaymentIntentMetadata(paymentIntent.id, {
                inventoryAdjusted: 'failed_insufficient',
            });
            return;
        }

        await stripe.prices.update(priceId, {
            metadata: {
                ...inventoryPrice.metadata,
                inventory_count: String(inventoryCount - quantity),
            },
        });

        await updatePaymentIntentMetadata(paymentIntent.id, {
            inventoryAdjusted: 'true',
        });
        return;
    }

    if (!productId) {
        console.error('Missing productId for product-level inventory decrement');
        return;
    }

    const product = await stripe.products.retrieve(productId);
    const inventoryCount = Number.parseInt(
        product.metadata.inventory_count ?? '',
        10
    );

    if (Number.isNaN(inventoryCount) || inventoryCount < 0) {
        console.error('Invalid inventory_count metadata on product:', productId);
        return;
    }

    if (quantity > inventoryCount) {
        console.error('Payment succeeded but inventory is insufficient:', {
            paymentIntentId: paymentIntent.id,
            productId,
            requested: quantity,
            available: inventoryCount,
        });

        await updatePaymentIntentMetadata(paymentIntent.id, {
            inventoryAdjusted: 'failed_insufficient',
        });
        return;
    }

    await stripe.products.update(productId, {
        metadata: {
            ...product.metadata,
            inventory_count: String(inventoryCount - quantity),
        },
    });

    await updatePaymentIntentMetadata(paymentIntent.id, {
        inventoryAdjusted: 'true',
    });
}

async function decrementProductInventory(productId: string, quantity: number) {
    const product = await stripe.products.retrieve(productId);
    const inventoryValue = product.metadata.inventory_count;
    if (!inventoryValue) {
        return { tracked: false, name: product.name };
    }

    const inventoryCount = Number.parseInt(inventoryValue, 10);
    if (Number.isNaN(inventoryCount) || inventoryCount < 0) {
        throw new Error(`Invalid inventory_count on product ${productId}`);
    }

    if (quantity > inventoryCount) {
        throw new Error(
            `Insufficient inventory for ${product.name}. Requested ${quantity}, available ${inventoryCount}`
        );
    }

    await stripe.products.update(productId, {
        metadata: {
            ...product.metadata,
            inventory_count: String(inventoryCount - quantity),
        },
    });

    return { tracked: true, name: product.name };
}

async function decrementPriceInventory(priceId: string, quantity: number) {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const inventoryValue = price.metadata.inventory_count;
    if (!inventoryValue) {
        const product = price.product as Stripe.Product;
        if (!product?.id) {
            return { tracked: false };
        }
        await decrementProductInventory(product.id, quantity);
        return { tracked: true };
    }

    const inventoryCount = Number.parseInt(inventoryValue, 10);
    if (Number.isNaN(inventoryCount) || inventoryCount < 0) {
        throw new Error(`Invalid inventory_count on price ${priceId}`);
    }

    if (quantity > inventoryCount) {
        throw new Error(
            `Insufficient inventory for price ${priceId}. Requested ${quantity}, available ${inventoryCount}`
        );
    }

    await stripe.prices.update(priceId, {
        metadata: {
            ...price.metadata,
            inventory_count: String(inventoryCount - quantity),
        },
    });

    return { tracked: true };
}

async function resolveOrderRecipientEmail(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.receipt_email) {
        return paymentIntent.receipt_email;
    }

    if (!paymentIntent.latest_charge) {
        return null;
    }

    const charge =
        typeof paymentIntent.latest_charge === 'string'
            ? await stripe.charges.retrieve(paymentIntent.latest_charge)
            : paymentIntent.latest_charge;

    return charge.billing_details.email ?? null;
}

async function sendOrderConfirmationEmail(paymentIntent: Stripe.PaymentIntent) {
    if (!canSendOrderEmail || !mailTransport) {
        console.log('Skipping order confirmation email: SMTP not configured');
        return;
    }

    if (paymentIntent.metadata.confirmationEmailSent === 'true') {
        return;
    }

    const recipientEmail = await resolveOrderRecipientEmail(paymentIntent);
    if (!recipientEmail) {
        console.log('Skipping order confirmation email: no customer email found');
        return;
    }

    const productName = paymentIntent.metadata.productName ?? 'Order';
    const variantLabel =
        paymentIntent.metadata.variantLabel ?? paymentIntent.metadata.variantSize;
    const lineTitle = variantLabel
        ? `${productName} (${variantLabel})`
        : productName;
    const quantity = paymentIntent.metadata.quantity ?? '1';
    const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: paymentIntent.currency.toUpperCase(),
    }).format(paymentIntent.amount / 100);

    await mailTransport.sendMail({
        from: `${orderFromName} <${orderFromEmail}>`,
        to: recipientEmail,
        subject: `Order confirmation: ${lineTitle}`,
        text: `Thanks for your order from CCAM.\n\nProduct: ${lineTitle}\nQuantity: ${quantity}\nTotal: ${total}\n\nWe'll follow up with shipping details soon.`,
    });
    await updatePaymentIntentMetadata(paymentIntent.id, {
        confirmationEmailSent: 'true',
    });
}

async function sendCartConfirmationEmail(
    recipientEmail: string,
    currency: string,
    totalAmount: number,
    lineItems: Array<{ name: string; quantity: number }>,
    shipping: { method: string; address: string | null } | null
) {
    if (!canSendOrderEmail || !mailTransport) {
        console.log('Skipping order confirmation email: SMTP not configured');
        return;
    }

    const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(totalAmount / 100);

    const lines = lineItems
        .map((line) => `- ${line.name} x${line.quantity}`)
        .join('\n');

    const shippingSection = shipping
        ? `\nFulfillment: ${shipping.method}${shipping.address ? `\nShip to: ${shipping.address}` : ''}\n`
        : '';

    await mailTransport.sendMail({
        from: `${orderFromName} <${orderFromEmail}>`,
        to: recipientEmail,
        subject: 'Order confirmation — CCAM',
        text: `Thanks for your order from CCAM.\n\nItems:\n${lines}\n\nTotal: ${total}${shippingSection}\nWe'll be in touch soon.`,
    });
}

async function sendInternalOrderNotificationEmail(params: {
    subject: string;
    text: string;
}) {
    if (!canSendOrderEmail || !mailTransport) {
        console.log('Skipping internal order notification email: SMTP not configured');
        return;
    }

    if (internalOrderEmails.length === 0) {
        console.log('Skipping internal order notification email: no recipient configured');
        return;
    }

    await mailTransport.sendMail({
        from: `${orderFromName} <${orderFromEmail}>`,
        to: internalOrderEmails.join(', '),
        subject: params.subject,
        text: params.text,
    });
}

async function sendInternalCartOrderNotificationEmail(params: {
    session: Stripe.Checkout.Session;
    lineItems: Array<{ name: string; quantity: number }>;
    shipping: { method: string; address: string | null } | null;
}) {
    const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: (params.session.currency ?? 'usd').toUpperCase(),
    }).format((params.session.amount_total ?? 0) / 100);

    const lines = params.lineItems
        .map((line) => `- ${line.name} x${line.quantity}`)
        .join('\n');

    const shippingSection = params.shipping
        ? `\nFulfillment: ${params.shipping.method}${params.shipping.address ? `\nShip to: ${params.shipping.address}` : ''}\n`
        : '\nFulfillment: not provided\n';

    const customerEmail = params.session.customer_details?.email ?? 'unknown';
    const sessionId = params.session.id;
    const paymentIntentId =
        typeof params.session.payment_intent === 'string'
            ? params.session.payment_intent
            : params.session.payment_intent?.id ?? 'unknown';

    await sendInternalOrderNotificationEmail({
        subject: `New store order: ${sessionId}`,
        text: `A new paid store order was received.\n\nSession: ${sessionId}\nPayment Intent: ${paymentIntentId}\nCustomer: ${customerEmail}\nTotal: ${total}${shippingSection}\nItems:\n${lines}`,
    });
}

async function sendInternalSingleOrderNotificationEmail(params: {
    paymentIntent: Stripe.PaymentIntent;
}) {
    const { paymentIntent } = params;
    const productName = paymentIntent.metadata.productName ?? 'Order';
    const variantLabel =
        paymentIntent.metadata.variantLabel ?? paymentIntent.metadata.variantSize;
    const lineTitle = variantLabel
        ? `${productName} (${variantLabel})`
        : productName;
    const quantity = paymentIntent.metadata.quantity ?? '1';
    const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: paymentIntent.currency.toUpperCase(),
    }).format(paymentIntent.amount / 100);
    const customerEmail = await resolveOrderRecipientEmail(paymentIntent);

    await sendInternalOrderNotificationEmail({
        subject: `New direct order: ${paymentIntent.id}`,
        text: `A new paid direct order was received.\n\nPayment Intent: ${paymentIntent.id}\nCustomer: ${customerEmail ?? 'unknown'}\nProduct: ${lineTitle}\nQuantity: ${quantity}\nTotal: ${total}`,
    });
}

async function resolveCheckoutShippingInfo(session: Stripe.Checkout.Session) {
    const shippingRate = session.shipping_cost?.shipping_rate;
    const shippingRateObj = shippingRate
        ? (typeof shippingRate === 'string'
            ? await stripe.shippingRates.retrieve(shippingRate)
            : shippingRate as Stripe.ShippingRate)
        : null;
    const shippingMethodName = shippingRateObj?.display_name ?? null;
    const isPickup = shippingMethodName?.toLowerCase().includes('pickup');

    const addr = session.shipping_details?.address;
    const shippingAddress = addr && !isPickup
        ? [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country]
            .filter(Boolean)
            .join(', ')
        : null;

    return shippingMethodName
        ? { method: shippingMethodName, address: shippingAddress }
        : null;
}

export const POST: APIRoute = async ({ request }) => {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
        return new Response('Missing stripe-signature header', { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            import.meta.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response('Webhook signature verification failed', {
            status: 400,
        });
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const sessionEvent = event.data.object as Stripe.Checkout.Session;
            const session = await stripe.checkout.sessions.retrieve(
                sessionEvent.id,
                {
                    expand: [
                        'line_items.data.price',
                        'line_items.data.price.product',
                        'payment_intent',
                    ],
                }
            );

            if (session.mode !== 'payment' || session.payment_status !== 'paid') {
                break;
            }

            const paymentIntentId =
                typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id;

            if (!paymentIntentId) {
                break;
            }

            const paymentIntent = await stripe.paymentIntents.retrieve(
                paymentIntentId
            );

            if (paymentIntent.metadata.cartProcessed === 'true') {
                break;
            }

            const lineItems =
                session.line_items?.data.map((lineItem) => {
                    const product = lineItem.price?.product as Stripe.Product | null;
                    const sourcePriceId = product?.metadata.sourcePriceId ?? lineItem.price?.metadata.sourcePriceId;
                    const inventoryLevel = product?.metadata.inventoryLevel ?? lineItem.price?.metadata.inventoryLevel;
                    const variantLabel =
                        product?.metadata.variantLabel ??
                        product?.metadata.variantSize ??
                        lineItem.price?.metadata.variantLabel ??
                        lineItem.price?.metadata.variantSize ??
                        '';
                    return {
                        productId: product?.id ?? null,
                        sourcePriceId: sourcePriceId || null,
                        inventoryLevel: inventoryLevel || 'product',
                        name: lineItem.description ?? product?.name ?? 'Item',
                        variantLabel,
                        quantity: lineItem.quantity ?? 1,
                    };
                }) ?? [];

            for (const line of lineItems) {
                if (line.inventoryLevel === 'price' && line.sourcePriceId) {
                    await decrementPriceInventory(line.sourcePriceId, line.quantity);
                } else if (line.productId) {
                    await decrementProductInventory(line.productId, line.quantity);
                }
            }

            const recipientEmail = session.customer_details?.email;
            const shippingInfo = await resolveCheckoutShippingInfo(session);
            if (recipientEmail) {
                const isRegistration = session.metadata?.isRegistration === 'true';

                if (isRegistration) {
                    const workshopName = session.metadata?.workshopName ?? 'Workshop';
                    await mailTransport?.sendMail({
                        from: `${orderFromName} <${orderFromEmail}>`,
                        to: recipientEmail,
                        subject: `Registration confirmed: ${workshopName}`,
                        text: `You're registered!\n\n${workshopName}\n\nWe'll follow up with any additional details closer to the event. See you there!\n\n— CCAM`,
                    });
                } else {
                    await sendCartConfirmationEmail(
                        recipientEmail,
                        session.currency ?? 'usd',
                        session.amount_total ?? 0,
                        lineItems.map((line) => ({ name: line.name, quantity: line.quantity })),
                        shippingInfo
                    );
                }
            }

            await sendInternalCartOrderNotificationEmail({
                session,
                lineItems: lineItems.map((line) => ({
                    name: line.name,
                    quantity: line.quantity,
                })),
                shipping: shippingInfo,
            });

            await updatePaymentIntentMetadata(paymentIntentId, {
                cartProcessed: 'true',
            });

            break;
        }
        case 'payment_intent.succeeded': {
            const eventIntent = event.data.object as Stripe.PaymentIntent;
            const paymentIntent = await stripe.paymentIntents.retrieve(
                eventIntent.id,
                {
                    expand: ['latest_charge'],
                }
            );

            console.log('Payment succeeded:', {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                product: paymentIntent.metadata.productName,
                quantity: paymentIntent.metadata.quantity,
            });

            // Cart checkout sessions are handled by checkout.session.completed.
            if (!paymentIntent.metadata.productId) {
                break;
            }

            await decrementInventoryIfTracked(paymentIntent);
            await sendOrderConfirmationEmail(paymentIntent);
            await sendInternalSingleOrderNotificationEmail({ paymentIntent });
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            console.error('Payment failed:', paymentIntent.id);
            break;
        }
        default:
            // Unhandled event type — ignore
            break;
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    });
};
