import { getKey } from "./crypto"
import { convertBase64ToBase64URL, b64ToArrayBuf } from "./encoding"

async function decodeJWT(s: string) {
    const decodedResult = getParts(s)
    if (!decodedResult.error) {
        return decodedResult
    }
}

export function getParts(jwt: string) {
    try {
        const [header, payload, signature] = jwt.split('.')
        const parseFromBase64URL = (str) => JSON.parse(atob(convertBase64ToBase64URL(str, true)))
        return {
            h: parseFromBase64URL(header),
            p: parseFromBase64URL(payload),
            s: signature
        }

    } catch (e) {
        console.error('Invalid JWT', e)
        return { error: 'Invalid JWT' }
    }
}


type KeyAlgInfo = {
    name: string,
    namedCurve: string,
    hash: string
}

export async function getSignedJWT(header, payload, privateKey: string, keyAlg?: KeyAlgInfo) {
    // Returns a signed JWT string using the provided private key
    // The key is assumed by default to be a ECDSA private key, using a P-256 curve, in PKCS8, PEM base-64 encoded format
    const alg = { name: "ECDSA", namedCurve: "P-256", hash: 'SHA-256', ...keyAlg }

    const strToBase64Url = (s) => convertBase64ToBase64URL(btoa(s));
    const signKey = await getKey("sign", privateKey, alg);

    const enc = new TextEncoder();
    const encodedString = strToBase64Url(JSON.stringify(header)) + "." + strToBase64Url(JSON.stringify(payload));
    const signatureAB = await crypto.subtle.sign(alg, signKey, enc.encode(encodedString));
    const signature = strToBase64Url(String.fromCharCode(...new Uint8Array(signatureAB)));

    return encodedString + "." + signature;
}

export async function validateJWT(jwt: string, publicKey: string, keyAlg?: KeyAlgInfo) {
    const alg = { name: "ECDSA", namedCurve: "P-256", hash: 'SHA-256', ...keyAlg }
    const key = await getKey('verify', publicKey, alg)
    const enc = new TextEncoder();
    const [header, payload, signature] = jwt.split('.')

    return await crypto.subtle.verify(alg, key, b64ToArrayBuf(convertBase64ToBase64URL(signature, true)), enc.encode(`${header}.${payload}`))
}
