<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { loadStripe } from '@stripe/stripe-js';
    import type {
        Stripe,
        StripeElements,
        StripeAddressElement,
        StripePaymentElement,
    } from '@stripe/stripe-js';

    interface Props {
        priceId: string;
        productName: string;
        unitAmount: number;   // in cents
        currency: string;
        publishableKey: string;
        returnUrl: string;
        inventoryCount?: number | null;
        sizeOptions?: Array<{
            size: string;
            label: string;
            priceId: string;
            unitAmount: number;
            inventoryCount: number | null;
        }>;
    }

    let {
        priceId,
        productName,
        unitAmount,
        currency,
        publishableKey,
        returnUrl,
        inventoryCount = null,
        sizeOptions = [],
    }: Props = $props();

    let quantity = $state(1);
    let step = $state<'idle' | 'loading' | 'form' | 'submitting' | 'error'>('idle');
    let errorMessage = $state('');
    let stripe = $state<Stripe | null>(null);
    let elements = $state<StripeElements | null>(null);
    let addressElement = $state<StripeAddressElement | null>(null);
    let paymentElement = $state<StripePaymentElement | null>(null);
    let dialog: HTMLDialogElement;
    let selectedSize = $state('');

    const selectedSizeOption = $derived(
        sizeOptions.find((option) => option.size === selectedSize) ??
            sizeOptions[0] ??
            null
    );

    const hasSizeOptions = $derived(sizeOptions.length > 0);
    const activePriceId = $derived(selectedSizeOption?.priceId ?? priceId);
    const activeUnitAmount = $derived(selectedSizeOption?.unitAmount ?? unitAmount);
    const activeInventoryCount = $derived(
        selectedSizeOption?.inventoryCount ?? inventoryCount
    );

    const formatter = $derived(
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        })
    );

    const total = $derived(formatter.format((activeUnitAmount * quantity) / 100));
    const hasTrackedInventory = $derived(typeof activeInventoryCount === 'number');
    const isOutOfStock = $derived(
        typeof activeInventoryCount === 'number' && activeInventoryCount <= 0
    );
    const maxQuantity = $derived(
        typeof activeInventoryCount === 'number'
            ? Math.max(1, Math.min(10, activeInventoryCount))
            : 10
    );

    $effect(() => {
        if (sizeOptions.length === 0) {
            selectedSize = '';
            return;
        }

        const stillExists = sizeOptions.some((option) => option.size === selectedSize);
        if (!stillExists) {
            selectedSize = sizeOptions[0].size;
        }
    });

    $effect(() => {
        if (quantity > maxQuantity) {
            quantity = maxQuantity;
        }
    });

    async function openCheckout() {
        if (isOutOfStock) {
            return;
        }

        dialog.showModal();
        step = 'loading';
        errorMessage = '';

        try {
            if (!stripe) {
                stripe = await loadStripe(publishableKey);
            }

            const res = await fetch('/api/store/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    priceId: activePriceId,
                    quantity,
                    variantSize: selectedSizeOption?.size,
                    variantLabel: selectedSizeOption?.label,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error ?? 'Failed to initialize checkout');
            }

            const { clientSecret } = await res.json();

            addressElement?.unmount();
            paymentElement?.unmount();

            elements = stripe!.elements({
                clientSecret,
                appearance: {
                    theme: 'flat',
                    variables: {
                        colorBackground: 'hsl(43deg 100% 97%)',
                        colorText: 'hsl(0deg 0% 7%)',
                        colorDanger: '#ff7a1a',
                        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                        borderRadius: '0px',
                        spacingUnit: '4px',
                    },
                },
            });

            addressElement = elements.create('address', { mode: 'shipping' });
            paymentElement = elements.create('payment');

            // Render form containers before Stripe mounts into them
            await tick();

            addressElement.mount('#stripe-address');
            paymentElement.mount('#stripe-payment');

            step = 'form';
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            step = 'error';
        }
    }

    async function submitPayment(e: SubmitEvent) {
        e.preventDefault();
        if (!stripe || !elements) return;
        step = 'submitting';
        errorMessage = '';

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl },
        });

        if (error) {
            errorMessage = error.message ?? 'Payment failed';
            step = 'form';
        }
        // On success, Stripe redirects — no further handling needed here
    }

    function close() {
        addressElement?.unmount();
        paymentElement?.unmount();
        addressElement = null;
        paymentElement = null;
        dialog.close();
        step = 'idle';
        elements = null;
    }

    onMount(() => {
        dialog.addEventListener('click', (e) => {
            const rect = dialog.getBoundingClientRect();
            if (
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom
            ) {
                close();
            }
        });
    });
</script>

<button class="button" onclick={openCheckout} disabled={isOutOfStock}>
    {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
</button>

<dialog bind:this={dialog} class="checkout-dialog">
    <div class="checkout-container bg-backgroundColor text-textColor font-mono p-6 max-w-lg w-full relative">

        <!-- Header -->
        <div class="flex items-start justify-between mb-6 border-b border-dashed border-borderColor/30 pb-4">
            <div>
                <h2 class="font-sans text-2xl font-medium">{productName}</h2>
                <p class="text-textColor/50 text-sm mt-1">Checkout</p>
            </div>
            <button onclick={close} aria-label="Close" class="text-textColor/50 hover:text-textColor transition-colors mt-1">
                <svg viewBox="0 0 24 24" class="h-4 w-4" stroke="currentColor" stroke-width="2px" stroke-linecap="butt">
                    <line x1="2" y1="2" x2="22" y2="22" /><line x1="22" y1="2" x2="2" y2="22" />
                </svg>
            </button>
        </div>

        {#if step === 'error'}
            <p class="text-Orange text-sm py-8 text-center">{errorMessage}</p>
        {:else}
            <form onsubmit={submitPayment}>
                {#if step === 'loading'}
                    <p class="text-textColor/50 text-sm mb-5">Loading checkout…</p>
                {/if}

                <!-- Quantity -->
                <div class="mb-5">
                    {#if hasSizeOptions}
                        <label class="block text-sm mb-2 text-textColor/70 uppercase tracking-wider" for="size-select">Size</label>
                        <select
                            id="size-select"
                            class="w-full border border-dashed border-borderColor/50 bg-backgroundColor text-textColor p-2 text-sm mb-4"
                            bind:value={selectedSize}
                            disabled={step === 'loading' || step === 'submitting'}
                        >
                            {#each sizeOptions as option}
                                <option value={option.size}>
                                    {option.label}
                                    {typeof option.inventoryCount === 'number'
                                        ? option.inventoryCount > 0
                                            ? ` (${option.inventoryCount} in stock)`
                                            : ' (Out of stock)'
                                        : ''}
                                </option>
                            {/each}
                        </select>
                    {/if}

                    <p class="block text-sm mb-2 text-textColor/70 uppercase tracking-wider">Quantity</p>
                    <div class="flex items-center gap-3">
                        <button
                            type="button"
                            class="border border-dashed border-borderColor/50 w-8 h-8 flex items-center justify-center hover:bg-backgroundHover hover:text-backgroundColor transition-colors"
                            onclick={() => { if (quantity > 1) quantity--; }}
                            disabled={step === 'loading' || step === 'submitting'}
                        >−</button>
                        <span class="w-6 text-center">{quantity}</span>
                        <button
                            type="button"
                            class="border border-dashed border-borderColor/50 w-8 h-8 flex items-center justify-center hover:bg-backgroundHover hover:text-backgroundColor transition-colors"
                            onclick={() => {
                                if (quantity < maxQuantity) quantity++;
                            }}
                            disabled={
                                step === 'loading' ||
                                step === 'submitting' ||
                                quantity >= maxQuantity
                            }
                        >+</button>
                        <span class="ml-auto text-sm text-textColor/60">{total}</span>
                    </div>
                    {#if hasTrackedInventory}
                        <p class="mt-2 text-xs text-textColor/60">
                            {activeInventoryCount} in stock
                        </p>
                    {/if}
                </div>

                <!-- Stripe Address Element -->
                <div class="mb-5">
                    <p class="block text-sm mb-2 text-textColor/70 uppercase tracking-wider">Shipping Address</p>
                    <div id="stripe-address"></div>
                </div>

                <!-- Stripe Payment Element -->
                <div class="mb-6">
                    <p class="block text-sm mb-2 text-textColor/70 uppercase tracking-wider">Payment</p>
                    <div id="stripe-payment"></div>
                </div>

                {#if errorMessage}
                    <p class="text-Orange text-sm mb-4">{errorMessage}</p>
                {/if}

                <button
                    type="submit"
                    class="button w-full"
                    disabled={step === 'submitting' || step === 'loading'}
                >
                    {step === 'submitting' ? 'Processing…' : `Pay ${total}`}
                </button>
            </form>
        {/if}
    </div>
</dialog>

<style>
    .checkout-dialog {
        margin: auto;
        border: none;
        padding: 0;
        max-width: 100%;
        animation: fade-in 200ms;
    }

    .checkout-dialog::backdrop {
        background: hsl(0 0% 0% / 0.8);
        backdrop-filter: blur(4px);
    }

    @keyframes fade-in {
        from { opacity: 0; transform: translateY(40px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    /* Stripe Element containers need a min height while mounting */
    #stripe-address,
    #stripe-payment {
        min-height: 40px;
    }

    #size-select {
        color-scheme: light dark;
    }

    #size-select option {
        background: var(--backgroundColor);
        color: var(--textColor);
    }
</style>
