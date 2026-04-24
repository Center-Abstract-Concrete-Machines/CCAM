<script lang="ts">
    interface ProductRecord {
        productId: string;
        priceId: string;
        name: string;
        image: string;
        unitAmount: number;
        currency: string;
        inventoryCount: number | null;
        variantSize?: string;
        variantLabel?: string;
    }

    interface CartEntry extends ProductRecord {
        quantity: number;
    }

    interface Props {
        products: ProductRecord[];
    }

    let { products }: Props = $props();

    const CART_KEY = 'ccam_store_cart_v1';
    let cart = $state<CartEntry[]>([]);
    let submitting = $state(false);
    let errorMessage = $state('');

    function readCart(): CartEntry[] {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function writeCart(next: CartEntry[]) {
        cart = next;
        localStorage.setItem(CART_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('ccam-cart-updated'));
    }

    function syncCartFromStorage() {
        const productMap = new Map(products.map((p) => [p.priceId, p]));

        // Always trust server-side product data for price/currency/inventory
        const normalized = readCart()
            .map((entry) => {
                const product = productMap.get(entry.priceId);
                if (!product) return null;

                const maxQty =
                    typeof product.inventoryCount === 'number'
                        ? Math.max(0, Math.min(10, product.inventoryCount))
                        : 10;

                const quantity = Math.max(1, Math.min(entry.quantity ?? 1, maxQty));
                if (maxQty === 0) return null;

                return {
                    ...product,
                    quantity,
                };
            })
            .filter(Boolean) as CartEntry[];

        writeCart(normalized);
    }

    function increment(priceId: string) {
        const next = cart.map((entry) => {
            if (entry.priceId !== priceId) return entry;

            const maxQty =
                typeof entry.inventoryCount === 'number'
                    ? Math.max(0, Math.min(10, entry.inventoryCount))
                    : 10;

            return {
                ...entry,
                quantity: Math.min(maxQty, entry.quantity + 1),
            };
        });
        writeCart(next);
    }

    function decrement(priceId: string) {
        const next = cart
            .map((entry) => {
                if (entry.priceId !== priceId) return entry;
                return {
                    ...entry,
                    quantity: entry.quantity - 1,
                };
            })
            .filter((entry) => entry.quantity > 0);
        writeCart(next);
    }

    async function checkout() {
        if (cart.length === 0) {
            return;
        }

        submitting = true;
        errorMessage = '';

        try {
            const res = await fetch('/api/store/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cart.map((entry) => ({
                        priceId: entry.priceId,
                        quantity: entry.quantity,
                        variantSize: entry.variantSize,
                        variantLabel: entry.variantLabel,
                    })),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? 'Unable to start checkout');
            }

            if (!data.url) {
                throw new Error('Checkout URL missing from server response');
            }

            window.location.assign(data.url);
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Checkout failed';
            submitting = false;
        }
    }

    const subtotal = $derived(
        cart.reduce((sum, entry) => sum + entry.unitAmount * entry.quantity, 0)
    );

    const currency = $derived(cart[0]?.currency ?? 'usd');

    function formatCents(amount: number) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    }

    $effect(() => {
        syncCartFromStorage();

        const onStorage = () => syncCartFromStorage();
        const onCartUpdated = () => syncCartFromStorage();

        window.addEventListener('storage', onStorage);
        window.addEventListener('ccam-cart-updated', onCartUpdated);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('ccam-cart-updated', onCartUpdated);
        };
    });
</script>

{#if cart.length === 0}
    <div class="border border-dashed border-borderColor/30 p-8 text-center">
        <p class="font-mono text-textColor/60 mb-4">Your cart is empty.</p>
        <a href="/store" class="button">Browse Store</a>
    </div>
{:else}
    <div class="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <ul class="border border-dashed border-borderColor/30 divide-y divide-dashed divide-borderColor/30">
            {#each cart as entry}
                <li class="p-4 sm:p-5 flex gap-4 items-start">
                    <div class="w-20 h-20 border border-dashed border-borderColor/30 overflow-hidden bg-borderColor/10 shrink-0">
                        {#if entry.image}
                            <img src={entry.image} alt={entry.name} class="w-full h-full object-cover" loading="lazy" />
                        {/if}
                    </div>

                    <div class="grow space-y-2">
                        <div>
                            <h2 class="font-sans text-xl">{entry.name}</h2>
                            {#if entry.variantLabel}
                                <p class="font-mono text-xs text-textColor/60 uppercase tracking-wider">
                                    Size: {entry.variantLabel}
                                </p>
                            {/if}
                            <p class="font-mono text-sm text-textColor/60">{formatCents(entry.unitAmount)}</p>
                        </div>

                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                class="border border-dashed border-borderColor/50 w-8 h-8"
                                onclick={() => decrement(entry.priceId)}
                                disabled={submitting}
                                aria-label={`Decrease ${entry.name} quantity`}
                            >−</button>
                            <span class="font-mono w-6 text-center">{entry.quantity}</span>
                            <button
                                type="button"
                                class="border border-dashed border-borderColor/50 w-8 h-8"
                                onclick={() => increment(entry.priceId)}
                                disabled={
                                    submitting ||
                                    (typeof entry.inventoryCount === 'number' &&
                                        entry.quantity >= entry.inventoryCount)
                                }
                                aria-label={`Increase ${entry.name} quantity`}
                            >+</button>
                            <span class="font-mono text-sm text-textColor/60 ml-auto">
                                {formatCents(entry.quantity * entry.unitAmount)}
                            </span>
                        </div>
                    </div>
                </li>
            {/each}
        </ul>

        <aside class="border border-dashed border-borderColor/30 p-5 h-fit sticky top-4">
            <h2 class="font-sans text-2xl mb-4">Order</h2>
            <div class="flex justify-between font-mono text-sm mb-2">
                <span class="text-textColor/60">Subtotal</span>
                <span>{formatCents(subtotal)}</span>
            </div>
            <p class="font-mono text-xs text-textColor/50 mb-5">
                Shipping and taxes are calculated at Stripe checkout.
            </p>

            {#if errorMessage}
                <p class="font-mono text-xs text-Orange mb-3">{errorMessage}</p>
            {/if}

            <button
                class="button w-full"
                onclick={checkout}
                disabled={submitting}
            >
                {submitting ? 'Redirecting…' : 'Checkout'}
            </button>
        </aside>
    </div>
{/if}
