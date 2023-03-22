import React, { useEffect, useState } from 'react';
import { QRReader } from './qr';
import { getParts, validateJWT } from './utils/jwt';
import { PUBLIC_KEY } from './index';

export function LoginQRScreen(props: { setAuthState: (code: number) => void; }) {
    const [scannedQR, setScannedQR] = useState(null);
    const [authStatus, setAuthStatus] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [authInfo, setAuthInfo] = useState({} as { name: string; });

    useEffect(() => {
        scannedQR && qrChangeHandler(scannedQR, setAuthStatus, setAuthInfo, setErrorMsg);
    }, [scannedQR]);

    useEffect(() => {
        const [jwt, info] = authStatus ? [scannedQR, JSON.stringify(authInfo)] : [null, null];

        localStorage.setItem('authJWT', jwt);
        localStorage.setItem('authInfo', info);
        props.setAuthState(getAuthState());
    }, [authInfo]);

    return <>
        <h1 style={{ margin: '0' }}>Hey there!</h1>
        <p>Please present your Respass QR code</p>
        <QRReader outputHandler={setScannedQR} successMsg={authStatus && `Hi, ${authInfo.name}`} />
        {errorMsg && <p className='errorMsg'>{errorMsg}</p>}
    </>;
}

async function qrChangeHandler(code: string, setAuthStatus: (b: boolean) => void, setAuthInfo: (data) => void, setErrorMsg: (s: string) => void) {
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

export function getAuthState() {
    const info = JSON.parse(localStorage.getItem('authInfo'))
    
    // Auth state codes are 0: unauthenticated, 1: resident, and 2: staff
    if (!info) return 0
    switch (info.role) {
        case 'res': return 1
        case 'staff': return 2
    }
}