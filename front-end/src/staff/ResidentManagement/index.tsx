import React, { CSSProperties, useState } from 'react'
import { CreateResident } from './CreateResident'
import { TokenIssuance } from './TokenIssuance'
import { ResidentLookup } from './ResidentLookup'
import { RevokeToken } from './RevokeToken'

export function ResidentManagement() {
    const [screen, setScreen] = useState(0)

    const backButtonStyle: CSSProperties = {
        background: '#eee',
        color: '#666',
        padding: '0.5rem'
    }
    const menuStyle: CSSProperties = {
        gridTemplateColumns: 'max-content 1fr',
        gap: '2rem 1.5rem',
        alignItems: 'start'
    }

    const labels = {
        1: 'Token Issuance',
        2: 'Revoke Token',
        3: 'Resident Lookup',
        4: 'Create New Resident'
    }

    function getScreen() {
        switch (screen) {
            case 0:
                return <div className='grid gap-1 padding-1' style={menuStyle}>
                    <h2 style={{ margin: 0 }}>Access</h2>
                    <div className='grid gap-1'>
                        <button onClick={() => setScreen(1)}>Issue ID Token</button>
                        <button onClick={() => setScreen(2)}>Revoke ID Token</button>
                    </div>
                    <h2 style={{ margin: 0 }}>Records</h2>
                    <div className='grid gap-1'>
                        <button onClick={() => setScreen(3)}>Lookup Resident</button>
                        <button onClick={() => setScreen(4)}>Create New Resident</button>
                    </div>
                </div>
            case 1:
                return <TokenIssuance />
            case 2:
                return <RevokeToken />
            case 3:
                return <ResidentLookup />
            case 4:
                return <CreateResident />
        }
    }
    return <>
        {screen != 0 &&
            <div className='flex-centre gap-1 padding-1'>
                <button style={backButtonStyle} onClick={() => setScreen(0)}>
                    ⬅️ Back
                </button>
                <div className='centre-text' style={{ flexGrow: 1, fontSize: '1.25rem' }}>{labels[screen]}</div>
            </div>
        }
        {getScreen()}
    </>
}