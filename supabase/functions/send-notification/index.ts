import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { to, title, body, data, sound, badge } = await req.json();

        if (!to || typeof to !== 'string') {
            return new Response(JSON.stringify({ error: 'A valid "to" (Expo push token) is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!body || typeof body !== 'string') {
            return new Response(JSON.stringify({ error: 'A "body" string is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const payload: Record<string, unknown> = {
            to,
            title: title ?? 'GKP Radio',
            body,
            sound: sound ?? 'default',
        };

        if (data && typeof data === 'object') {
            payload.data = data;
        }

        if (typeof badge === 'number') {
            payload.badge = badge;
        }

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
