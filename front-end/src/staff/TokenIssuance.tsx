import React, { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react';
import { AuthTokenPayload } from '../types';
import { getAuthInfo } from '../common/getAuthState';
import { getSignedJWT } from '../utils/jwt';

const DEFAULT_FORM = {
    "Resident ID": null,
    "Name": null,
    "Building": null,
    "Unit": null,
    "Issue Code": 1
}

export function TokenIssuance(prop) {
    const [form, setForm] = useState(DEFAULT_FORM)
    const [tokenValue, setTokenValue] = useState(null)
    const [privatePEM, setPrivatePEM] = useState<string>()

    const optionalFields = ['Issue #']
    const updateForm = (k, v) => {
        setForm({ ...form, [k]: v })
    }
    const formIsFilled = () => Object.entries(form)
        .filter(([k, v]) => !optionalFields.includes(k))
        .every(([k, v]) => v != null)

    useEffect(() => {
        if (!(privatePEM && formIsFilled())) return

        getJWTForResident(form, privatePEM)
            .then(jwt => setTokenValue(jwt))
    }, [form])

    return <div className="grid gap-1" style={{ gridTemplateColumns: 'max-content 1fr' }}>
        {Object.keys(form).map(label => <React.Fragment key={label}>
            <label>{label}</label>
            <input type={label == 'Issue #' ? 'number' : 'text'}
                onChange={e => updateForm(label, e.target.value)} />
        </React.Fragment>)}
        <div>
            <button>Register new resident</button>
        </div>
        {tokenValue ? <QRCodeSVG value={tokenValue} /> : <div></div>}
    </div>

}

async function getJWTForResident(form: typeof DEFAULT_FORM, pem: string) {
    const staffInfo = getAuthInfo()
    const payload: AuthTokenPayload = {
        sub: form['Resident #'],
        bld: form.Building,
        unit: form.Unit,
        name: form.Name,
        role: 'res',
        ic: form['Issue #'],
        iss: `${staffInfo.name}-${staffInfo.ic}`
    }
    const HEADER = {
        "alg": "ES256",
        "typ": "JWT"
    }
    return await getSignedJWT(HEADER, payload, pem)
}