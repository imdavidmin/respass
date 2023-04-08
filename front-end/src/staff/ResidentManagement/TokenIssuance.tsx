import React, { useContext, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react';
import { AuthTokenPayload, ResidentDirectory } from '../../types';
import { getAuthInfo } from '../../common/getAuthState';
import { JWTService } from '../../common/api';
import { LocalStorageKey } from '../../types';
import { BuildingAndUnitInput } from '../../common/Components/BuildingAndUnitInput';
import { ToastContext } from '../../ToastWrapper';
import { SpinnerMessage } from '../../common/Components/SpinnerMessage';

export enum FieldLabel {
    Name = "Name",
    Building = "Building",
    Unit = "Unit",
    ResID = "Resident ID",
    IC = "Issue Code"
}
const DEFAULT_JWT_FORM: { [k in FieldLabel]: any } = {
    [FieldLabel.Name]: null,
    [FieldLabel.Building]: null,
    [FieldLabel.Unit]: null,
    [FieldLabel.ResID]: null,
    [FieldLabel.IC]: 1
}

const getResidentForm = (f: typeof DEFAULT_JWT_FORM) => {
    return {
        name: f[FieldLabel.Name],
        bld: f[FieldLabel.Building],
        unit: f[FieldLabel.Unit]
    }
}

const token = localStorage.getItem(LocalStorageKey.JWT)

export function TokenIssuance() {
    const resDir: ResidentDirectory = JSON.parse(localStorage.getItem(LocalStorageKey.ResidentDirectory))

    const [form, setForm] = useState(DEFAULT_JWT_FORM)
    const [residentNameOptions, setResidentNameOptions] = useState([])
    const [basicInfoCompleted, setBasicInfoCompleted] = useState(false)


    const updateForm = (formRow: { [k: string]: string | number }) => {
        setForm({ ...form, ...formRow })
    }

    // Check for form completeness to query name suggestions and enable buttons
    useEffect(() => {
        if (form.Building && form.Unit) {
            const nameOptions = resDir?.[form.Building]?.[form.Unit]?.map(([name, id]) => name) ?? []
            setResidentNameOptions(nameOptions)
            if (nameOptions.length > 0 && !form.Name) { setForm({ ...form, Name: nameOptions[0] }) }
        }

        !form.Name && form['Resident ID'] &&
            setForm({ ...form, "Resident ID": null })

        if (form.Name) {
            const matchedId = getResidentId()
            if (matchedId != form['Resident ID']) {
                setForm({ ...form, [FieldLabel.ResID]: matchedId })
            }
        }

        setBasicInfoCompleted([FieldLabel.Building, FieldLabel.Unit, FieldLabel.Name].every(k => form[k] != null))
    }, [form])

    function getResidentId() {
        try {
            const match = resDir?.[form.Building]?.[form.Unit]?.find(([name, id]) => name.toLowerCase() == form.Name.toLowerCase())
            return match[1]
        } catch (e) {
            console.error('Unexpected error looking up resident ID.')
            throw e
        }
    }

    const NAME_OPTIONS_ID = 'resident-name-options'

    return <div className='padding-1'>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'max-content 1fr', alignItems: 'center' }}>
            <BuildingAndUnitInput
                form={[form.Building, form.Unit]}
                setForm={(f) => setForm({ ...form, Name: null, Building: f[0], Unit: f[1] })}
            />
            <label>{FieldLabel.Name}</label>
            <select value={form.Name ?? ''}
                disabled={!form.Building || !form.Unit}
                onChange={e => updateForm({ [FieldLabel.Name]: e.target.value == '' ? null : e.target.value })} >
                {residentNameOptions.map((name, i) => <option value={name} key={i} >{name}</option>)}
            </select>

            <label>{FieldLabel.ResID}</label>
            <label style={{ padding: '0.5rem', opacity: form[FieldLabel.ResID] ? 1 : 0.8 }}>
                {form[FieldLabel.ResID] ?? 'N/A'}
            </label>


            <label>{FieldLabel.IC}</label>
            <input placeholder='Optional' type="number"></input>
        </div>


        <TokenIssuanceSubmission form={form} allowSubmit={basicInfoCompleted} />
    </div >
}

function TokenIssuanceSubmission(props: { form: typeof DEFAULT_JWT_FORM, allowSubmit: boolean }) {
    const [sendQREmail, setSendQREmail] = useState(true)
    const [tokenValue, setTokenValue] = useState(null)
    const [tokenInProgress, setTokenInProgress] = useState(false)

    const addToast = useContext(ToastContext)

    function toggleEmail() {
        setSendQREmail(!sendQREmail)
    }

    async function getJWTForResident() {
        setTokenInProgress(true)
        const staffInfo = getAuthInfo()
        const payload: AuthTokenPayload = {
            ...getResidentForm(props.form),
            sub: (props.form[FieldLabel.ResID] as number).toString(),
            ic: props.form[FieldLabel.IC] || 1,
            role: 'res',
            iss: `${staffInfo.name}-${staffInfo.ic}`,
        }

        setTokenValue(await JWTService.getJWT(payload, token, sendQREmail))
        addToast({ message: 'Code generated.', title: '👍' })
        setTokenInProgress(false)
    }

    return <div className='grid-centre gap-1 padding-1'>
        <div className='grid-centre'>
            <div className='flex-centre' style={{ margin: '5px' }}>
                <input type="checkbox" checked={sendQREmail} onChange={toggleEmail} />
                <label>Send the new token to resident's email</label>
            </div>
        </div>

        <button onClick={getJWTForResident}
            disabled={tokenInProgress || !props.allowSubmit}
            style={{ width: '100%' }}
        >
            {tokenInProgress ? <SpinnerMessage text='Generating' /> : 'Generate token'}
        </button>
        {tokenValue ? <QRCodeSVG value={tokenValue} /> : <div></div>}
    </div>
}

