export const fetchJsonPost = (url: string | URL, payload, bearerToken?: string) => {
    const headers = {
        'Content-Type': 'application/json',
    }
    if (bearerToken) { headers['Authorization'] = `Bearer ${bearerToken}` }

    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    })
}

export function isOkayJSON(r: Response) { return r.ok && r.headers.get('content-type')?.includes('application/json') }