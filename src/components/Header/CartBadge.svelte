<script lang="ts">
    const CART_KEY = 'ccam_store_cart_v1';

    type CartEntry = {
        quantity?: number;
    };

    let count = $state(0);

    function computeCount() {
        const raw = localStorage.getItem(CART_KEY);
        if (!raw) {
            count = 0;
            return;
        }

        try {
            const parsed = JSON.parse(raw) as CartEntry[];
            if (!Array.isArray(parsed)) {
                count = 0;
                return;
            }

            count = parsed.reduce((sum, entry) => {
                const qty = Number(entry?.quantity ?? 0);
                return sum + (Number.isFinite(qty) ? Math.max(0, qty) : 0);
            }, 0);
        } catch {
            count = 0;
        }
    }

    $effect(() => {
        computeCount();

        const onStorage = () => computeCount();
        const onCartUpdated = () => computeCount();

        window.addEventListener('storage', onStorage);
        window.addEventListener('ccam-cart-updated', onCartUpdated);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('ccam-cart-updated', onCartUpdated);
        };
    });
</script>

{#if count > 0}
    <span class="cart-badge" aria-label={`${count} items in cart`}>
        {count}
    </span>
{/if}

<style>
    .cart-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 1.25rem;
        height: 1.25rem;
        padding: 0 0.3rem;
        border: 1px dashed hsl(var(--borders));
        border-radius: 999px;
        font-size: 0.65rem;
        line-height: 1;
        font-family: var(--font-mono);
    }
</style>
