# Store Documentation

This document covers all implemented store features and how to operate them:

- Adding and publishing products
- Required and optional Stripe metadata
- Cart and direct checkout flows
- Workshop registration flow
- Inventory handling and stock admin tools
- Confirmation emails and webhook behavior

## Architecture at a glance

Store data comes from two sources:

- Stripe is the source of truth for products, prices, payment, shipping rates, and inventory metadata.
- Astro content in src/content/store controls rich presentation details (images, tags, category, long-form copy, variants mapping, workshop linkage).

Main pages and APIs:

- src/pages/store/index.astro
- src/pages/store/[productId].astro
- src/pages/store/cart.astro
- src/pages/store/success.astro
- src/pages/register/[workshopId].astro
- src/pages/api/store/create-payment-intent.ts
- src/pages/api/store/create-checkout-session.ts
- src/pages/api/store/create-registration-session.ts
- src/pages/api/store/webhook.ts
- src/pages/api/store/admin/variant-stock.ts

## Environment variables

Required for store runtime:

- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

Required for shipping options in cart checkout (if using named rates in Stripe):

- STRIPE_RATE_PICKUP
- STRIPE_USPS_RATE_SHIPPING

Required for Stock Admin API/UI:

- STORE_ADMIN_TOKEN

Required for confirmation emails (optional but recommended):

- SMTP_HOST
- SMTP_PORT (defaults to 587)
- SMTP_USER
- SMTP_PASS
- SMTP_SECURE (true or false)
- ORDER_FROM_EMAIL (optional; defaults to store@ccam.world)
- ORDER_FROM_NAME (optional, defaults to CCAM Store)
- ORDER_NOTIFICATION_EMAIL (optional; single internal recipient)
- ORDER_NOTIFICATION_EMAILS (optional; comma-separated internal recipients)

## T-shirt shipping setup ($8)

If you already created an $8 shipping rate in Stripe, wire it into the app like this:

1. In Stripe Dashboard, copy the Shipping Rate ID for your $8 rate (starts with shr_).
2. Set STRIPE_USPS_RATE_SHIPPING to that Shipping Rate ID.
3. Set STRIPE_RATE_PICKUP to your pickup shipping rate ID (if you want pickup as an option).
4. For each shippable T-shirt product in Stripe, set product metadata fulfillment=ship.
5. Restart your app after env var changes.

Behavior notes:

- Cart checkout uses Stripe Checkout shipping options.
- When STRIPE_USPS_RATE_SHIPPING is configured, customers see that rate (for example $8) at checkout.
- If a product has fulfillment=ship_or_pickup and both rates are configured, customers can choose between shipping and pickup.
- If a product has fulfillment=pickup_only, shipping will not be offered for that item.

## How physical addresses are collected

Addresses are already collected in current implementation:

- Cart checkout (/store/cart):
  - Server sets shipping_address_collection with allowed countries US and CA.
  - Stripe Checkout collects shipping address during checkout.
- Buy Now modal (/store/[productId]):
  - Frontend mounts Stripe Address Element in shipping mode.
  - Customer enters shipping address directly in the modal.

Where to find the address after order:

- In Stripe Dashboard on the Checkout Session (cart flow), under Shipping details.
- In webhook handling, the app reads session.shipping_details.address for cart orders.

Important current limitation:

- Single-item Buy Now confirmation email currently does not include shipping address text.
- Cart confirmation email includes shipping method and address (unless pickup).

## Store feature inventory

### Customer-facing features

- Store grid with category + tag filtering
- Product detail pages with:
  - Hero image and gallery
  - Specs list
  - Embedded video
  - Rich MDX body content
  - Related products by shared tags
- Add to cart flow
- Cart checkout with Stripe Checkout Session
- Direct buy-now modal with Stripe Elements + PaymentIntent
- Out-of-stock and tracked inventory UI
- Size variant selection (variant-specific prices and stock)
- Success page that renders order summary

### Registration features

- Program pages can render inline registration CTA via RegistrationBlock
- Dedicated registration page at /register/[workshopId]
- Supports free and paid registration
- Remaining spots / fully booked state from inventory metadata
- Registration confirmation email via webhook

### Operator/admin features

- Variant stock admin UI at /store/admin/stock
- Variant stock admin API with bearer token auth
- CLI helper script: npm run stock:variants
- Registration export script: npm run registrations

## How to add a store item

### 1. Create product and price in Stripe

In Stripe Dashboard:

1. Create a Product.
2. Create at least one active one-time Price for the product.
3. Add product images/description in Stripe if you want a fallback display when content metadata is absent.

Important:

- Subscription or recurring prices are not used by this store implementation.
- Inactive products/prices are automatically excluded.

### 2. Add content entry in src/content/store

Create a folder for the product and add an index.mdx file.

Use the template at:

- src/content/store/_template.mdx

Minimum content frontmatter:

```mdx
---
stripeProductId: prod_XXXXXXXXXXXXXXXX
---
```

Typical full frontmatter:

```mdx
---
title: Product title override (optional)
stripeProductId: prod_XXXXXXXXXXXXXXXX
excerpt: Store card summary
category: apparel
tags:
  - example-tag
heroImage: ./hero.jpg
heroImageAlt: Hero image alt text
galleryImages:
  - image: ./gallery-1.jpg
    alt: Detail image
sizeVariants:
  - size: s
    label: S
    stripePriceId: price_XXXXXXXXXXXX
  - size: m
    label: M
    stripePriceId: price_YYYYYYYYYYYY
specs:
  - label: Material
    value: 100% cotton
videoEmbedUrl: https://www.youtube.com/embed/VIDEO_ID
---
```

Notes:

- stripeProductId must be a Stripe Product ID and is required.
- sizeVariants are optional but required for per-size inventory and per-size pricing.
- Category must be one of: synth, printed-matter, apparel, accessory, other.

### 3. Confirm visibility rules

A product appears in the main store grid when:

- Stripe product is active
- Product has an active default one-time price with unit_amount
- Product is not flagged as registration (see metadata below)
- Content entry is not marked workshopRegistration: true

### 4. Test locally

- Open /store and verify card content and filtering.
- Open /store/[your-content-id] and test Add to Cart and Buy Now.
- Complete a test-mode checkout in Stripe.

## Stripe metadata reference

This section describes metadata read by the app from Stripe Dashboard objects.

### Product metadata keys

- inventory_count
  - Non-negative integer as string
  - Used as product-level stock fallback for display and validation
- fulfillment
  - Values used in app logic: ship, pickup_only, ship_or_pickup
  - Determines shipping/pickup options in cart checkout sessions
- registration
  - Set to true to identify a Stripe product as registration-only
  - Excluded from main /store grid
- contentId
  - Optional but recommended for registration products
  - Used for registration cancel URL routing in create-registration-session
- size
  - Optional fallback when variant size is not provided elsewhere

### Price metadata keys

- inventory_count
  - Non-negative integer as string
  - Overrides product-level inventory_count for this specific price/variant
- size
  - Variant size code fallback
- size_label
  - Human-readable variant label fallback

### Metadata written by server logic

The app writes internal metadata in payment and checkout flows. You generally do not set these manually.

PaymentIntent metadata (single-item modal flow):

- priceId
- productId
- productName
- quantity
- inventoryTracked
- inventoryLevel
- inventoryAdjusted
- confirmationEmailSent
- variantSize
- variantLabel

Checkout Session metadata (registration flow):

- isRegistration: true
- workshopName

Line item product_data metadata (cart checkout flow):

- sourcePriceId
- sourceProductId
- variantSize
- variantLabel
- inventoryLevel

## Registration setup and workflow

There are two ways to connect a program to registration:

1. Program frontmatter direct link with stripeRegistrationId
2. Store content mapping with workshopRegistration: true + programId

Relevant schema fields:

- Programs collection: stripeRegistrationId
- Store collection: workshopRegistration, programId, stripeProductId

### Recommended setup for a registration product

1. Create Stripe Product + default one-time Price.
2. Set product metadata.registration to true.
3. Set product metadata.contentId to your registration route slug (recommended).
4. Optionally set product or price metadata.inventory_count to track capacity.
5. Add store content entry using template:

```mdx
---
stripeProductId: prod_XXXXXXXXXXXX
workshopRegistration: true
programId: your-program-slug
---
```

Template file:

- src/content/store/templates/workshop-registration.mdx

### Registration UX flow

```mermaid
flowchart TD
  A[Program page with RegistrationBlock] --> B[POST /api/store/create-registration-session]
  B --> C[Stripe Checkout Session URL]
  C --> D[User completes checkout in Stripe]
  D --> E[Webhook checkout.session.completed]
  E --> F[Decrement inventory]
  E --> G[Send registration confirmation email]
  D --> H[/store/success?session_id=...]
```

Key behavior:

- Free registrations are supported (payment method collection is set to if_required).
- If inventory_count is set and 0, registration is shown as Fully Booked.
- Cancel returns to /register/[contentId or productId].

## Checkout workflows

### A) Direct Buy Now (product page modal)

1. User opens modal.
2. Frontend calls POST /api/store/create-payment-intent with priceId, quantity, and optional variant values.
3. Server validates price/product/inventory and creates PaymentIntent.
4. Stripe Elements confirms payment and redirects to /store/success.
5. Webhook payment_intent.succeeded decrements inventory (if tracked) and sends confirmation email.

### B) Cart checkout

1. Cart is stored in localStorage key ccam_store_cart_v1.
2. Cart page calls POST /api/store/create-checkout-session with line items.
3. Server re-validates each price/product/inventory and creates Checkout Session.
4. Success redirects to /store/success?session_id=...
5. Webhook checkout.session.completed decrements inventory per line item and sends confirmation email.

## How you are notified of new orders

You currently have three notification channels:

1. Stripe Dashboard notifications
- Stripe records every payment and checkout session.
- You can enable Stripe email notifications in Dashboard settings.

2. Your app webhook endpoint
- Endpoint: /api/store/webhook
- Handles checkout.session.completed and payment_intent.succeeded.
- Decrements inventory and triggers confirmation email sending logic.

3. SMTP emails from the app
- Customer confirmation emails are sent when SMTP is configured.
- For cart orders, email includes line items and shipping details.
- For registration orders, email includes registration confirmation.
- Internal new-order alert emails are sent to ORDER_NOTIFICATION_EMAILS (or ORDER_NOTIFICATION_EMAIL).
- If no internal recipient env var is set, internal alerts default to ORDER_FROM_EMAIL.

Internal alert contents include:

- customer email
- items and quantities
- shipping method and shipping address (for shipping orders)
- Stripe session/payment intent IDs

## Inventory behavior

Inventory is metadata-driven and validated server-side before payment/session creation.

Priority order:

1. Price metadata.inventory_count (variant-level)
2. Product metadata.inventory_count (fallback)

Decrement timing:

- Single-item modal flow: webhook payment_intent.succeeded
- Cart flow and registration flow: webhook checkout.session.completed

Safety/idempotency:

- payment_intent metadata flags prevent duplicate decrement in single-item flow
- cartProcessed metadata flag prevents duplicate cart processing

## Stock admin operations

### Browser UI

Page:

- /store/admin/stock

Behavior:

- Loads variants from contentId or stripeProductId.
- Allows editing inventory_count on Stripe Prices.
- Requires Authorization bearer token matching STORE_ADMIN_TOKEN.

### API

Endpoint:

- GET /api/store/admin/variant-stock?contentId=...
- GET /api/store/admin/variant-stock?stripeProductId=prod_...
- POST /api/store/admin/variant-stock

POST body:

```json
{
  "updates": [
    { "priceId": "price_123", "inventoryCount": 10 }
  ]
}
```

### CLI script

Use npm script:

- npm run stock:variants -- list --content-id your-content-id
- npm run stock:variants -- set --price-id price_123 --count 8
- npm run stock:variants -- bulk --file ./updates.json

Source:

- scripts/admin-variant-stock.mjs

## Files to reference when updating behavior

- Content schema: src/content.config.ts
- Store index filtering/mapping: src/pages/store/index.astro
- Product detail + variants: src/pages/store/[productId].astro
- Cart page product sync: src/pages/store/cart.astro
- Success page rendering: src/pages/store/success.astro
- Registration page: src/pages/register/[workshopId].astro
- Registration CTA component: src/components/Store/RegistrationBlock.astro
- PaymentIntent API: src/pages/api/store/create-payment-intent.ts
- Cart Checkout Session API: src/pages/api/store/create-checkout-session.ts
- Registration Session API: src/pages/api/store/create-registration-session.ts
- Webhook inventory + email logic: src/pages/api/store/webhook.ts
- Variant stock admin API: src/pages/api/store/admin/variant-stock.ts

## Known gotchas

- workshopRegistration products are intentionally hidden from /store.
- registration=true Stripe products are also hidden from /store.
- inventory_count must parse to a non-negative integer string.
- Registration and cart flows decrement on checkout.session.completed; direct modal flow decrements on payment_intent.succeeded.
- If SMTP settings are missing, checkout still works but confirmation emails are skipped.
