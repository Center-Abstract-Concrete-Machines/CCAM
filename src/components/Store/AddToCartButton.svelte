<script lang="ts">
    interface ProductCartItem {
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

    interface SizeOption {
        size: string;
        label: string;
        priceId: string;
        unitAmount: number;
        inventoryCount: number | null;
    }

    interface CartEntry extends ProductCartItem {
        quantity: number;
    }

    interface Props {
        product: ProductCartItem;
        sizeOptions?: SizeOption[];
    }

    let { product, sizeOptions = [] }: Props = $props();
    let added = $state(false);
    let selectedSize = $state('');

    const CART_KEY = 'ccam_store_cart_v1';

    const selectedSizeOption = $derived(
        sizeOptions.find((option) => option.size === selectedSize) ??
            sizeOptions[0] ??
            null
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

    const activeProduct = $derived(
        selectedSizeOption
            ? {
                ...product,
                priceId: selectedSizeOption.priceId,
                unitAmount: selectedSizeOption.unitAmount,
                inventoryCount: selectedSizeOption.inventoryCount,
                variantSize: selectedSizeOption.size,
                variantLabel: selectedSizeOption.label,
                name: `${product.name} (${selectedSizeOption.label})`,
            }
            : product
    );

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

    function writeCart(cart: CartEntry[]) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent('ccam-cart-updated'));
    }

    function addToCart() {
        const cart = readCart();
        const existing = cart.find(
            (entry) =>
                entry.priceId === activeProduct.priceId &&
                entry.variantSize === activeProduct.variantSize
        );

        if (existing) {
            const maxQty =
                typeof activeProduct.inventoryCount === 'number'
                    ? Math.max(0, activeProduct.inventoryCount)
                    : 999;
            if (existing.quantity < maxQty) {
                existing.quantity += 1;
            }
        } else {
            cart.push({ ...activeProduct, quantity: 1 });
        }

        writeCart(cart);
        added = true;
        setTimeout(() => {
            added = false;
        }, 1000);
    }

    const isOutOfStock = $derived(
        typeof activeProduct.inventoryCount === 'number' &&
            activeProduct.inventoryCount <= 0
    );
</script>

{#if sizeOptions.length > 0}
    <label class="font-mono text-xs text-textColor/60 uppercase tracking-wider" for="add-cart-size">
        Size
    </label>
    <select
        id="add-cart-size"
        class="border border-dashed border-borderColor/50 bg-backgroundColor text-textColor p-2 text-sm"
        bind:value={selectedSize}
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

<button class="button" onclick={addToCart} disabled={isOutOfStock}>
    {isOutOfStock ? 'Out of Stock' : added ? 'Added' : 'Add to Cart'}
</button>

<style>
    select {
        color-scheme: light dark;
    }

    select option {
        background: var(--backgroundColor);
        color: var(--textColor);
    }
</style>
