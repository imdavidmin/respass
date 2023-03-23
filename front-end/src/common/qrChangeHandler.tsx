import { getParts, validateJWT } from '../utils/jwt';
import { PUBLIC_KEY } from '../index';

export async function qrChangeHandler(code: string, setAuthStatus: (b: boolean) => void, setAuthInfo: (data) => void, setErrorMsg: (s: string) => void) {
    // Parse the QR code as a JWT token
    // If the token's signature is verified, authentication is completed
    try {
        const isValidatedCode = await validateJWT(code, PUBLIC_KEY);
        if (isValidatedCode) {
            setAuthStatus(true);
            setAuthInfo(getParts(code).p);
            setErrorMsg(null);
        } else {
            throw { msg: 'Invalid code signature' };
        }
    } catch (e) {
        setErrorMsg(`There's a problem: ${e?.msg || e.name}`);
        setAuthStatus(false);
        setAuthInfo({});
    }
}
