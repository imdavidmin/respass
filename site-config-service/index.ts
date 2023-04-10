interface Env {
    RESPASS_KV: KVNamespace // Binding for the Issue Code KV namespace
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Request-Method': 'GET, OPTIONS'
}

export default {
    async fetch(req: Request, env: Env, context) {
        const url = new URL(req.url)
        const id = url.searchParams.get('prop')
        if (!id)
            return new Response(
                'Did not receive a "prop" search param.',
                { status: 400, headers: CORS_HEADERS }
            )
        const data = await env.RESPASS_KV.get(id.toUpperCase())
        if (data) {
            return new Response(
                data,
                {
                    headers: {
                        ...CORS_HEADERS,
                        'content-type': 'application/json'
                    }
                }
            )
        } else {
            return new Response(
                `No data for property "${id}"`,
                { status: 400, headers: CORS_HEADERS }
            )
        }
    }
}