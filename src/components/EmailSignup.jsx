import { useRef, useState } from 'preact/hooks';

export default function EmailSignup() {
    const [responseMessage, setResponseMessage] = useState('');
    const [disabled, setDisabled] = useState(false);
    const [showMessage, setShowMessage] = useState(false);
    const form = useRef(null);

    async function submit(e) {
        setDisabled(true);
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await fetch(
            'https://parkerdavis-saveFormData.web.val.run',
            {
                method: 'POST',
                body: formData,
            }
        );
        const data = await response.json();

        if (data.message) {
            setResponseMessage(data.message);
            setShowMessage(true);
        }

        if (data.status === 'success') {
            form.current.reset();
            // setTimeout(() => {
            //     setShowMessage(false);
            // }, 3000);
        }

        setDisabled(false);
    }

    return (
        <form onSubmit={submit} ref={form}>
            <div class="flex flex-wrap gap-4 justify-center">
                <input
                    type="email"
                    name="email"
                    className="border border-dashed border-borderColor bg-backgroundColor px-4 py-2 min-w-0 max-w-full grow"
                    placeholder="Email"
                    required
                />
                <input type="text" name="trap" className="hidden" />
                <button type="submit" className="button" disabled={disabled}>
                    Submit
                </button>
            </div>
            <div className="flex items-center justify-center pt-2 ">
                {showMessage && responseMessage && (
                    <span class="text-sm text-textColor/80">
                        {responseMessage}
                    </span>
                )}
            </div>
        </form>
    );
}
