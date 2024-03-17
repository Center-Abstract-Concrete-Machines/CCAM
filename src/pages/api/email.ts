export const prerender = false;

import type { APIRoute } from 'astro';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { z } from 'astro/zod';

mailchimp.setConfig({
    apiKey: 'b9f0eace4daee6725d71dcca908617e2-us21',
    server: 'us21',
});
const listId = '35064a930b';

export const GET: APIRoute = async () => {
    return new Response('What are you doing here?');
};

export const POST: APIRoute = async ({ request }) => {
    const data = await request.formData();
    // Validation
    const nameHoneypot = data.get('name');
    if (nameHoneypot) return; // If bot inputted name in hidden input, do nothing

    const email = data.get('email');
    if (!z.string().email().safeParse(email).success) {
        return new Response(
            JSON.stringify({
                message: 'Please enter valid email.',
            }),
            { status: 400 }
        );
    }

    // Submit to mailchimp
    try {
        await mailchimp.lists.addListMember(listId, {
            email_address: email,
            status: 'subscribed',
        });
    } catch (e) {
        // Already subscribed
        if (e.response.body.title === 'Member Exists') {
            return new Response(
                JSON.stringify({
                    message: `${email} is already subscribed!`,
                })
            );
        }
        // Catchall general error
        console.error(e);
        return new Response(
            JSON.stringify({
                message: 'Error!',
            })
        );
    }

    // Success!
    return new Response(
        JSON.stringify({
            message: `${email} successfully subscribed!`,
        }),
        { status: 200 }
    );
};
