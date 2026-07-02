<script lang="ts">
    import AddToCartButton from './AddToCartButton.svelte';
    import CheckoutModal from './CheckoutModal.svelte';

    type StoreProduct = {
        id: string;
        name: string;
        description: string;
        cardImage: string;
        detailHref: string;
        priceId: string;
        unitAmount: number;
        currency: string;
        inventoryCount: number | null;
        category?: string;
        tags?: string[];
    };

    let {
        products,
        publishableKey,
        returnUrl,
    }: {
        products: StoreProduct[];
        publishableKey: string;
        returnUrl: string;
    } = $props();

    const CATEGORY_LABELS: Record<string, string> = {
        synth: 'Synths',
        'printed-matter': 'Printed Matter',
        apparel: 'Apparel',
        accessory: 'Accessories',
        other: 'Other',
    };

    const categories = $derived([
        'all',
        ...new Set(
            products
                .map((p) => p.category)
                .filter((c): c is string => Boolean(c))
        ),
    ]);

    const allTags = $derived(
        [...new Set(products.flatMap((p) => p.tags ?? []))].sort()
    );

    let activeCategory = $state('all');
    let selectedTags = $state<string[]>([]);

    function toggleTag(tag: string) {
        if (selectedTags.includes(tag)) {
            selectedTags = selectedTags.filter((t) => t !== tag);
        } else {
            selectedTags = [...selectedTags, tag];
        }
    }

    function setCategory(cat: string) {
        activeCategory = cat;
    }

    const filteredProducts = $derived(
        products.filter((p) => {
            const matchesCategory =
                activeCategory === 'all' || p.category === activeCategory;
            const matchesTags =
                selectedTags.length === 0 ||
                (p.tags ?? []).some((t) => selectedTags.includes(t));
            return matchesCategory && matchesTags;
        })
    );

    function formatCurrency(amount: number, currency: string) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    }

    function formatCategory(cat: string) {
        return cat === 'all' ? 'All' : (CATEGORY_LABELS[cat] ?? cat);
    }
</script>

<!-- Category nav -->
{#if categories.length > 1}
    <nav
        class="px-4 py-4 flex flex-wrap gap-2 border-b border-dashed border-borderColor/30"
    >
        {#each categories as cat}
            <button
                onclick={() => setCategory(cat)}
                class="font-mono text-xs uppercase tracking-wider px-3 py-1 border border-dashed transition-colors {activeCategory ===
                cat
                    ? 'border-textColor bg-textColor text-backgroundColor'
                    : 'border-borderColor/50 text-textColor/60 hover:border-textColor hover:text-textColor'}"
            >
                {formatCategory(cat)}
            </button>
        {/each}
    </nav>
{/if}

<!-- Tag filter -->
{#if allTags.length > 0}
    <div
        class="px-4 py-3 flex flex-wrap gap-2 items-center border-b border-dashed border-borderColor/30"
    >
        <span
            class="font-mono text-xs text-textColor/40 uppercase tracking-wider mr-1"
        >
            Filter:
        </span>
        {#each allTags as tag}
            <button
                onclick={() => toggleTag(tag)}
                class="font-mono text-xs px-2 py-0.5 border border-dashed transition-colors {selectedTags.includes(
                    tag
                )
                    ? 'border-textColor bg-textColor text-backgroundColor'
                    : 'border-borderColor/40 text-textColor/50 hover:border-textColor/70 hover:text-textColor/80'}"
            >
                #{tag}
            </button>
        {/each}
        {#if selectedTags.length > 0}
            <button
                onclick={() => (selectedTags = [])}
                class="font-mono text-xs text-textColor/40 underline hover:text-textColor/70 ml-1"
            >
                clear
            </button>
        {/if}
    </div>
{/if}

<!-- Product grid -->
{#if filteredProducts.length === 0}
    <section class="px-4 py-16 flex items-center justify-center min-h-64">
        <p class="font-mono text-lg text-textColor/50">
            No products match the current filter.
        </p>
    </section>
{:else}
    <section>
        <ul
            class="grid gap-px border-dashed border-borderColor/30 sm:grid-cols-2 lg:grid-cols-3 card-grid triple"
        >
            {#each filteredProducts as product}
                <li
                    class="flex flex-col border-dashed border-borderColor/30 p-6 gap-4"
                >
                    {#if product.cardImage}
                        <a
                            href={product.detailHref}
                            class="aspect-square overflow-hidden bg-borderColor/10 block"
                        >
                            <img
                                src={product.cardImage}
                                alt={product.name}
                                class="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </a>
                    {/if}
                    <div class="flex flex-col gap-2 grow">
                        <h2 class="font-sans text-xl font-medium">
                            <a href={product.detailHref}>{product.name}</a>
                        </h2>
                        {#if product.description}
                            <p class="font-mono text-sm text-textColor/70 grow">
                                {product.description}
                            </p>
                        {/if}
                        <p class="font-mono text-lg">
                            {formatCurrency(
                                product.unitAmount,
                                product.currency
                            )}
                        </p>
                        {#if typeof product.inventoryCount === 'number'}
                            <p class="font-mono text-xs text-textColor/60">
                                {product.inventoryCount > 0
                                    ? `${product.inventoryCount} in stock`
                                    : 'Out of stock'}
                            </p>
                        {/if}
                        {#if product.tags && product.tags.length > 0}
                            <ul class="flex flex-wrap gap-1 mt-1">
                                {#each product.tags as tag}
                                    <li>
                                        <button
                                            onclick={() => toggleTag(tag)}
                                            class="font-mono text-xs text-textColor/40 hover:text-textColor/70 transition-colors"
                                        >
                                            #{tag}
                                        </button>
                                    </li>
                                {/each}
                            </ul>
                        {/if}
                    </div>
                    <div class="flex gap-2 flex-wrap flex-row">
                        <a href={product.detailHref} class="block">
                            <button class="button w-full">
                                View Details
                            </button>
                        </a>
                        <AddToCartButton
                            product={{
                                productId: product.id,
                                priceId: product.priceId,
                                name: product.name,
                                image: product.cardImage,
                                unitAmount: product.unitAmount,
                                currency: product.currency,
                                inventoryCount: product.inventoryCount,
                            }}
                        />
                        <CheckoutModal
                            priceId={product.priceId}
                            productName={product.name}
                            unitAmount={product.unitAmount}
                            currency={product.currency}
                            {publishableKey}
                            {returnUrl}
                            inventoryCount={product.inventoryCount}
                        />
                    </div>
                </li>
            {/each}
        </ul>
    </section>
{/if}
