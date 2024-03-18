import { useRef, useState } from 'preact/hooks';

// const endpoint = 'https://parkerdavis-subscribeForm.web.val.run';
const endpoint = '/api/email';

export default function EmailSignup() {
    const [responseMessage, setResponseMessage] = useState('');
    const [disabled, setDisabled] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const form = useRef(null);

    async function submit(e) {
        setDisabled(true);
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
            setResponseMessage(data.message);
            setShowMessage(true);
        }

        if (data.status === 'success') {
            form.current.reset();
        }

        setDisabled(false);
    }

    return (
        <form action={endpoint} method="POST" onSubmit={submit} ref={form}>
            <div class="flex flex-wrap gap-4 justify-center">
                <input
                    type="email"
                    name="email"
                    className="border border-dashed border-borderColor/30 bg-backgroundColor px-4 py-2 min-w-0 max-w-full grow"
                    placeholder="Email"
                    autoComplete="email"
                    required
                />
                <input type="text" name="name" className="hidden" />
                <button type="submit" className="button" disabled={disabled}>
                    Submit
                </button>
            </div>
            <div className="flex items-center justify-center pt-2 ">
                {showMessage && responseMessage && (
                    <span class="text-sm text-textColor/80 text-balance">
                        {responseMessage}
                    </span>
                )}
            </div>
        </form>
    );
}
