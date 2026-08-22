<script lang="ts">
    import { onMount } from 'svelte';

    interface ProductOption {
        id: string;
        title: string;
        stripeProductId: string;
    }

    interface VariantRow {
        priceId: string;
        size: string;
        sizeLabel: string;
        unitAmount: number;
        currency: string;
        inventoryCount: number | null;
        inventoryLevel: 'price' | 'product';
        draftInventoryCount: number;
    }

    interface Props {
        products: ProductOption[];
    }

    let { products }: Props = $props();

    let token = $state('');
    let selectedContentId = $state('');
    let loading = $state(false);
    let saving = $state(false);
    let errorMessage = $state('');
    let successMessage = $state('');
    let productName = $state('');
    let stripeProductId = $state('');
    let rows = $state<VariantRow[]>([]);

    const hasToken = $derived(token.trim().length > 0);
    const hasSelection = $derived(selectedContentId.trim().length > 0);

    const changedRows = $derived(
        rows.filter((row) => row.draftInventoryCount !== (row.inventoryCount ?? 0))
    );

    const selectedProduct = $derived(
        products.find((product) => product.id === selectedContentId) ?? null
    );

    function formatCurrency(amount: number, currency: string) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount / 100);
    }

    function normalizeCount(value: string) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 0) return 0;
        return parsed;
    }

    async function loadStock() {
        if (!hasToken || !hasSelection) {
            errorMessage = 'Enter admin token and choose a product.';
            return;
        }

        loading = true;
        errorMessage = '';
        successMessage = '';

        try {
            const query = new URLSearchParams({ contentId: selectedContentId });
            const res = await fetch(`/api/store/admin/variant-stock?${query.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token.trim()}`,
                },
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error ?? 'Unable to load variant stock.');
            }

            productName = data.productName;
            stripeProductId = data.stripeProductId;
            rows = (data.variants ?? []).map((variant: any) => ({
                priceId: variant.priceId,
                size: variant.size ?? '',
                sizeLabel: variant.sizeLabel ?? variant.size ?? '',
                unitAmount: variant.unitAmount,
                currency: variant.currency,
                inventoryCount: variant.inventoryCount,
                inventoryLevel: variant.inventoryLevel,
                draftInventoryCount: variant.inventoryCount ?? 0,
            }));

            if (rows.length === 0) {
                successMessage = 'No active one-time prices found for this product.';
            }
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Unable to load stock.';
            rows = [];
        } finally {
            loading = false;
        }
    }

    async function saveChanges() {
        if (!hasToken) {
            errorMessage = 'Enter admin token.';
            return;
        }

        if (changedRows.length === 0) {
            successMessage = 'No changes to save.';
            return;
        }

        saving = true;
        errorMessage = '';
        successMessage = '';

        try {
            const res = await fetch('/api/store/admin/variant-stock', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token.trim()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    updates: changedRows.map((row) => ({
                        priceId: row.priceId,
                        inventoryCount: row.draftInventoryCount,
                    })),
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? 'Failed to save variant stock updates.');
            }

            const updated = new Map(
                (data.updated ?? []).map((item: any) => [
                    item.priceId,
                    item.newInventoryCount,
                ])
            );

            rows = rows.map((row) => {
                const nextCount = updated.get(row.priceId);
                if (typeof nextCount !== 'number') return row;
                return {
                    ...row,
                    inventoryCount: nextCount,
                    draftInventoryCount: nextCount,
                };
            });

            successMessage = `Saved ${data.updated?.length ?? changedRows.length} stock update(s).`;
        } catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Failed to save stock updates.';
        } finally {
            saving = false;
        }
    }

    onMount(() => {
        const savedToken = window.sessionStorage.getItem('ccam_store_admin_token');
        if (savedToken) {
            token = savedToken;
        }
    });

    $effect(() => {
        if (token.trim()) {
            window.sessionStorage.setItem('ccam_store_admin_token', token.trim());
        } else {
            window.sessionStorage.removeItem('ccam_store_admin_token');
        }
    });

    $effect(() => {
        if (!selectedContentId && products.length > 0) {
            selectedContentId = products[0].id;
        }
    });
</script>

<section class="px-4 py-8 border-b border-dashed border-borderColor/30">
    <h1 class="font-sans text-4xl sm:text-6xl mb-3">Store Stock Admin</h1>
    <p class="font-mono text-sm text-textColor/60 max-w-2xl">
        Update size-level inventory counts for Stripe prices without touching code.
    </p>
</section>

<section class="px-4 py-6 border-b border-dashed border-borderColor/30 grid gap-4 lg:grid-cols-[1.2fr_1fr_auto] items-end">
    <label class="font-mono text-xs text-textColor/60 uppercase tracking-wider block">
        Admin Token
        <input
            type="password"
            class="mt-2 w-full border border-dashed border-borderColor/50 bg-backgroundColor text-textColor p-2 text-sm"
            bind:value={token}
            placeholder="STORE_ADMIN_TOKEN"
        />
    </label>

    <label class="font-mono text-xs text-textColor/60 uppercase tracking-wider block">
        Product
        <select
            class="mt-2 w-full border border-dashed border-borderColor/50 bg-backgroundColor text-textColor p-2 text-sm"
            bind:value={selectedContentId}
        >
            {#each products as product}
                <option value={product.id}>{product.title}</option>
            {/each}
        </select>
    </label>

    <button class="button h-fit" onclick={loadStock} disabled={loading || !hasToken || !hasSelection}>
        {loading ? 'Loading…' : 'Load Stock'}
    </button>
</section>

{#if errorMessage}
    <section class="px-4 py-4">
        <p class="font-mono text-sm text-Orange">{errorMessage}</p>
    </section>
{/if}

{#if successMessage}
    <section class="px-4 py-4">
        <p class="font-mono text-sm text-textColor/70">{successMessage}</p>
    </section>
{/if}

{#if rows.length > 0}
    <section class="px-4 py-6">
        <div class="border border-dashed border-borderColor/30 p-4 mb-4">
            <p class="font-mono text-xs text-textColor/60 uppercase tracking-wider">Product</p>
            <p class="font-sans text-xl mt-1">{productName}</p>
            <p class="font-mono text-xs text-textColor/60 mt-1">{stripeProductId}</p>
            {#if selectedProduct}
                <p class="font-mono text-xs text-textColor/50 mt-1">Content ID: {selectedProduct.id}</p>
            {/if}
        </div>

        <div class="overflow-x-auto border border-dashed border-borderColor/30">
            <table class="w-full min-w-[780px]">
                <thead class="border-b border-dashed border-borderColor/30">
                    <tr class="font-mono text-xs uppercase tracking-wider text-textColor/60">
                        <th class="text-left p-3">Size</th>
                        <th class="text-left p-3">Price</th>
                        <th class="text-left p-3">Price ID</th>
                        <th class="text-left p-3">Current</th>
                        <th class="text-left p-3">New Count</th>
                        <th class="text-left p-3">Source</th>
                    </tr>
                </thead>
                <tbody>
                    {#each rows as row, idx}
                        <tr class="border-b border-dashed border-borderColor/20 font-mono text-sm">
                            <td class="p-3">{row.sizeLabel || row.size || 'Variant'}</td>
                            <td class="p-3">{formatCurrency(row.unitAmount, row.currency)}</td>
                            <td class="p-3 text-xs text-textColor/60 break-all">{row.priceId}</td>
                            <td class="p-3">{row.inventoryCount ?? 'Not Set'}</td>
                            <td class="p-3">
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class="w-28 border border-dashed border-borderColor/50 bg-backgroundColor text-textColor p-1.5"
                                    value={row.draftInventoryCount}
                                    oninput={(event) => {
                                        const value = normalizeCount((event.currentTarget as HTMLInputElement).value);
                                        rows[idx].draftInventoryCount = value;
                                        rows = rows;
                                    }}
                                />
                            </td>
                            <td class="p-3 text-xs text-textColor/60 uppercase">{row.inventoryLevel}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex items-center gap-3 flex-wrap">
            <button class="button" onclick={saveChanges} disabled={saving || changedRows.length === 0}>
                {saving ? 'Saving…' : `Save ${changedRows.length} Change(s)`}
            </button>
            <button class="button" onclick={loadStock} disabled={loading || saving}>
                Refresh
            </button>
        </div>
    </section>
{/if}

<style>
    select,
    input {
        color-scheme: light dark;
    }

    select option {
        background: var(--backgroundColor);
        color: var(--textColor);
    }
</style>
