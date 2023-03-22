export const b64ToArrayBuf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer
export function convertBase64ToBase64URL(s, reverse?: boolean) {
    if (reverse) {
        return s.replaceAll("-", "+").replaceAll("_", "/")
    } else {
        return s.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
    }
}