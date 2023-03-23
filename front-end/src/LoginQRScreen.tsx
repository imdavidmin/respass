import React, { useEffect, useState } from 'react';
import { getAuthState } from './common/getAuthState';
import { QRReader } from './common/qr';
import { qrChangeHandler } from './common/qrChangeHandler';

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

