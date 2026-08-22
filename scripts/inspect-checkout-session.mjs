import Stripe from 'stripe';
import { loadScriptEnv } from './_env.mjs';

const [sessionId] = process.argv.slice(2);
if (!sessionId) {
    console.error('Usage: node scripts/inspect-checkout-session.mjs <session_id>');
    process.exit(1);
}

const env = loadScriptEnv();

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['shipping_cost.shipping_rate', 'line_items.data.price.product'],
});

console.log('session_id:', session.id);
console.log('mode:', session.mode);
console.log('payment_status:', session.payment_status);
console.log('currency:', session.currency);

const configuredShippingOptions = (session.shipping_options ?? []).map((opt) =>
    typeof opt.shipping_rate === 'string'
        ? opt.shipping_rate
        : opt.shipping_rate?.id ?? null
);
console.log('configured_shipping_rate_ids:', configuredShippingOptions);

const shippingRate = session.shipping_cost?.shipping_rate;
if (shippingRate && typeof shippingRate !== 'string') {
    console.log('selected_shipping_rate_id:', shippingRate.id);
    console.log('selected_shipping_display_name:', shippingRate.display_name);
    console.log('selected_shipping_amount:', shippingRate.fixed_amount?.amount ?? null);
} else {
    console.log('selected_shipping_rate_id:', null);
}

const lineItems = session.line_items?.data ?? [];
for (const item of lineItems) {
    const product = item.price?.product;
    const productName =
        product && typeof product !== 'string' ? product.name : item.description ?? 'Item';
    console.log('line_item:', productName, 'x', item.quantity ?? 1);
}

if (session.shipping_details?.address) {
    const a = session.shipping_details.address;
    const formatted = [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
        .filter(Boolean)
        .join(', ');
    console.log('shipping_address:', formatted);
} else {
    console.log('shipping_address:', null);
}
