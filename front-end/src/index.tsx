import React, { createContext, useState } from 'react'
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './common/Components/ErrorBoundary';
import { getAuthState } from './common/getAuthState';
import { LoginQRScreen } from './LoginQRScreen';
import { ResidentApp } from './resident/ResidentApp';
import { StaffApp } from './staff/StaffApp';
import { ToastWrapper } from './ToastWrapper';

export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEt98y6jlP8awFC3/D3CwrCub4x9oY
6oyDYLhkpTmVyGyESS/f0DBhBQhj1BzIw5JIPsJ0qJv61pTibCL1O/oCMw==
-----END PUBLIC KEY-----`

export const AuthContext = createContext<() => void>(null)

function App() {
    const [authState, setAuthState] = useState(getAuthState())
    const delayedSetAuthState = (code: number) => setTimeout(() => setAuthState(code), 1000)

    function getUI() {
        // Auth state codes are 0: unauthenticated, 1: resident, and 2: staff
        switch (authState) {
            case 0: return <LoginQRScreen setAuthState={delayedSetAuthState} />
            case 1: return <ResidentApp />
            case 2: return <StaffApp />
        }
    }

    function logout() {
        localStorage.clear()
        setAuthState(0)
    }

    return (
        <AuthContext.Provider value={logout}>
            <ToastWrapper className='grid-centre gap-1 fill-vp-width' style={{ padding: "0 2rem" }}>
                <ErrorBoundary>
                    {getUI()}
                </ErrorBoundary>
            </ToastWrapper>
        </AuthContext.Provider>
    )
}


const root = createRoot(document.querySelector('#root'))
root.render(<React.StrictMode><App /></React.StrictMode>)
