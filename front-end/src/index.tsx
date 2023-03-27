import React, { CSSProperties, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client';
import { getAuthState } from './common/getAuthState';
import { LoginQRScreen } from './LoginQRScreen';
import { ResidentApp } from './resident/ResidentApp';
import { StaffApp } from './staff/StaffApp';

export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEt98y6jlP8awFC3/D3CwrCub4x9oY
6oyDYLhkpTmVyGyESS/f0DBhBQhj1BzIw5JIPsJ0qJv61pTibCL1O/oCMw==
-----END PUBLIC KEY-----`

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

    return (
        <ToastListener className='grid-centre gap-1 fill-vp-width' style={{ padding: "0 2rem" }}>
            {getUI()}
        </ToastListener>
    )
}
function ToastListener(props) {
    const [toasts, setToasts] = useState([{ msg: 'test', title: 'Test' }])
    const toastWrapperStyle: CSSProperties = {
        position: 'absolute',
        bottom: '1rem',
        right: '1rem',
    }
    return <div {...props}>
        {props.children}
        <div className='grid' style={toastWrapperStyle}>
            {toasts.map(t => <ToastCard message={t.msg} title={t.title} />)}
        </div>
    </div>
}
function ToastCard(props: { message: JSX.Element | string, title?: string, style?: CSSProperties, barStyle?: CSSProperties }) {
    const padding = '0.5rem'
    const barStyle: CSSProperties = {
        background: 'var(--theme-primary)',
        padding: padding,
        color: 'var(--theme-primary-text)',
        ...props.barStyle
    }
    const toastStyle: CSSProperties = {
        background: '#ffffffaa',
        backdropFilter: 'blur(10px)',
        borderRadius: '5px',
        minWidth: '200px',
        overflow: 'hidden',
        position: 'relative'
    }
    const btnSize = '1.25rem'

    const closeBtnStyle: CSSProperties = {
        color: 'red',
        background: '#fff',
        borderRadius: '100%',
        height: btnSize,
        width: btnSize,
        border: 0,
        position: 'absolute',
        top: padding,
        right: padding,
        fontSize: '1.5rem',
        cursor: 'pointer'
    }
    return <div className='grid' style={{ ...toastStyle, ...props.style }}>
        <button className='special flex-centre' style={closeBtnStyle}>×</button>
        {props.title && <div style={barStyle}>{props.title}</div>}
        <span style={{ margin: `1rem ${padding}` }}>
            {props.message}
        </span>
    </div>
}

const root = createRoot(document.querySelector('#root'))
root.render(<App />)
