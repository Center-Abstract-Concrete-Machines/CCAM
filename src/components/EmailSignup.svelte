<script lang="ts">
    const endpoint = '/api/email';
    let form: HTMLFormElement;
    let disabled = false;
    let showMessage = false;
    let responseMessage: string;

    async function submit(e) {
        disabled = true;
        e.preventDefault();
        const formData = new FormData(e.target);
        const nameHoneypot = formData.get('name');
        if (nameHoneypot) return; // If bot inputted name in hidden input, do nothing

        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (data.message) {
            responseMessage = data.message;
            showMessage = true;
        }

        if (data.status === 'success') {
            form.current.reset();
        }

        disabled = false;
    }
</script>

<form action={endpoint} method="POST" on:submit={submit} bind:this={form}>
    <div class="flex flex-wrap gap-4 justify-center">
        <input
            type="email"
            name="email"
            class="border border-dashed border-borderColor/30 bg-backgroundColor px-4 py-2 min-w-0 max-w-full grow"
            placeholder="Email"
            autoComplete="email"
            required
        />
        <input type="text" name="name" class="hidden" />
        <button type="submit" class="button" {disabled}> Submit </button>
    </div>
    <div class="flex items-center justify-center pt-2">
        {#if showMessage && responseMessage}
            <span class="text-sm text-textColor/80 text-balance">
                {responseMessage}
            </span>
        {/if}
    </div>
</form>
