import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// This function sends a notification using Expo's Push API
// It expects a JSON body with { "to": "token", "title": "title", "body": "body", "data": {} }

Deno.serve(async (req: Request) => {
    try {
        const { to, title, body, data } = await req.json();

        if (!to) {
            return new Response(JSON.stringify({ error: 'Recipient token required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to,
                title,
                body,
                data,
            }),
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
