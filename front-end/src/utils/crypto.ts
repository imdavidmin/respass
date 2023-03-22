import { b64ToArrayBuf } from "./encoding";

function pemToArrayBuf(pem: string) {
    // Converts PEM base-64 encoded string to an ArrayBuffer
    const pemContent = pem
        .replaceAll("\n", "")
        .replace(/-----BEGIN [A-Z]+ KEY-----/, "")
        .replace(/-----END [A-Z]+ KEY-----/, "");

    return b64ToArrayBuf(pemContent);
}

export async function getKey(mode: 'sign' | 'verify', pkcs8: string, alg: Parameters<typeof crypto.subtle.importKey>[2]) {
    // Returns a crypto key from key stored in PKCS8 syntax, in PEM base-64 encoded format
    const format = mode == 'sign' ? 'pkcs8' : 'spki'
    return await crypto.subtle.importKey(format, pemToArrayBuf(pkcs8), alg, false, [mode]);
}