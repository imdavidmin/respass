declare global {
    IC_KV: KV // Binding for the Issue Code KV namespace
}

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': "*",
    'Access-Control-Allow-Headers': 'authorization,content-type',
    'Access-Control-Request-Method': 'GET, OPTIONS'
}

export default {
    async fetch(req: Request, env, context) {
        const url = new URL(req.url)
        const id = url.searchParams.get('rid')
        const ic = url.searchParams.get('ic')

        // Checks the given Issue Code against latest valid code stored in KV
        // If no code is stored in the KV, then all issue codes are valid for the given resident ID
        const validIC = env.IC_KV.get(id)
        if (validIC === null || ic == validIC) {
            return new Response('', { headers: CORS_HEADERS })
        } else {
            return new Response(`Last valid: ${validIC}; Supplied: ${ic}`, { status: 401, headers: CORS_HEADERS })
        }
    }
}