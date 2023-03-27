import React, { CSSProperties, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react';
import { AuthTokenPayload } from '../types';
import { getAuthInfo } from '../common/getAuthState';
import { DatabaseService, JWTService } from '../common/api';
import { LocalStorageKey } from '../types';

enum FieldLabel {
    Name = "Name",
    Building = "Building",
    Unit = "Unit",
    ResID = "Resident ID",
    IC = "Issue Code"
}
const DEFAULT_FORM: { [k in FieldLabel]: any } = {
    [FieldLabel.Name]: null,
    [FieldLabel.Building]: null,
    [FieldLabel.Unit]: null,
    [FieldLabel.ResID]: null,
    [FieldLabel.IC]: 1
}

const getResidentForm = (f: typeof DEFAULT_FORM) => {
    return {
        name: f[FieldLabel.Name],
        bld: f[FieldLabel.Building],
        unit: f[FieldLabel.Unit]
    }
}

export function TokenIssuance() {
    const token = localStorage.getItem(LocalStorageKey.JWT)
    const [form, setForm] = useState(DEFAULT_FORM)
    const [residentLocked, setResidentLocked] = useState(false)
    const [queryErrorMsg, setQueryErrorMsg] = useState(null)
    const [residentQueryInProgress, setResidentQueryInProgress] = useState(null)
    const [tokenInProgress, setTokenInProgress] = useState(false)
    const [idBtnsDisabled, setIdBtnsDisabled] = useState(false)
    const [tokenValue, setTokenValue] = useState(null)
    const [sendQREmail, setSendQREmail] = useState(true)
    const [emailValid, setEmailValid] = useState(false)

    const systemFields: Array<FieldLabel> = [FieldLabel.ResID, FieldLabel.IC]

    const updateForm = (fields: { [k: string]: string | number }) => {
        setForm({ ...form, ...fields })
    }

    useEffect(() => {
        const resDataFilled = Object.entries(form)
            .filter(([k, v]: [FieldLabel, any]) => !systemFields.includes(k))
            .every(([k, v]) => v != null)

        setIdBtnsDisabled(!resDataFilled)
        resDataFilled && setQueryErrorMsg(null)
    }, [form])

    async function searchForResident() {
        setQueryErrorMsg(null)
        setResidentQueryInProgress('Searching')
        const result = await DatabaseService.querySingleIdentity(getResidentForm(form), token)
        if (result.index.length == 1) {
            // Updates previously filled in fields as well to match case in db entry
            const fields = [
                ['name', FieldLabel.Name],
                ['bld', FieldLabel.Building],
                ['unit', FieldLabel.Unit],
                ['id', FieldLabel.ResID]
            ]
            const data = {}
            for (let i = 0; i < fields.length; i++) {
                const j = result.columns.indexOf(fields[i][0])
                data[fields[j][1]] = result.data[0][i]
            }
            updateForm(data)
            setResidentLocked(true)
        } else if (result.index.length == 0) {
            setQueryErrorMsg('No such resident found.')
        }
        setResidentQueryInProgress(null)
    }

    async function createNewResident() {
        setQueryErrorMsg(null)
        setResidentQueryInProgress('Requesting')
        const result = await DatabaseService.addResident(getResidentForm(form), token)
        updateForm({ [FieldLabel.ResID]: result })
    }

    async function getJWTForResident() {
        setTokenInProgress(true)
        const staffInfo = getAuthInfo()
        const payload: AuthTokenPayload = {
            ...getResidentForm(form),
            sub: (form[FieldLabel.ResID] as number).toString(),
            ic: form[FieldLabel.IC] || 1,
            role: 'res',
            iss: `${staffInfo.name}-${staffInfo.ic}`,
        }

        setTokenValue(await JWTService.getJWT(payload, token))
        setTokenInProgress(false)
    }

    function toggleEmail() {
        setSendQREmail(!sendQREmail)
    }

    return <div className='padding-1'>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'max-content 1fr', alignItems: 'center' }}>
            {Object.keys(form).map((label: FieldLabel) => !systemFields.includes(label) &&
                <React.Fragment key={label}>
                    <label>{label}</label>
                    <input autoComplete='off'
                        disabled={residentLocked}
                        value={form[label] || ''}
                        onChange={e => updateForm({ [label]: e.target.value == '' ? null : e.target.value })} />
                </React.Fragment>)}
            <label>{FieldLabel.ResID}</label>
            <div className='grid' style={{ gap: '5px' }}>
                <input hidden={!residentLocked} disabled type="number" value={form[FieldLabel.ResID] || ''}></input>
                {queryErrorMsg || ''}
                {!residentLocked
                    ? residentQueryInProgress
                        ? <SpinnerMessage text={residentQueryInProgress} style={{ width: '100%' }} />
                        : <div className='flex' style={{ gap: '3px' }}>
                            <button disabled={idBtnsDisabled} onClick={searchForResident}>Search</button>
                            <button disabled={idBtnsDisabled} onClick={createNewResident}>Create New</button>
                        </div>
                    : <></>
                }
            </div>
            {residentLocked && <>
                <label>{FieldLabel.IC}</label>
                <input placeholder='Optional' type="number"></input>
            </>}
        </div>

        {residentLocked && <div className='grid-centre gap-1 padding-1'>
            <div className='grid-centre'>
                <div className='flex-centre' style={{ margin: '5px' }}>
                    <input type="checkbox" checked={sendQREmail} onChange={toggleEmail} />
                    <label>Send the new token to resident's email</label>
                </div>
                <input type="email"
                    hidden={!sendQREmail}
                    placeholder='email@web.com'
                    onChange={e => setEmailValid((e.target as HTMLInputElement).validity.valid)}
                    style={{ width: 'calc(100% - 1rem)' }}
                />
            </div>

            <button onClick={getJWTForResident}
                disabled={tokenInProgress || (sendQREmail && !emailValid)}
                style={{ width: '100%' }}
            >
                {tokenInProgress ? <SpinnerMessage text='Generating' /> : 'Generate token'}
            </button>
            {tokenValue ? <QRCodeSVG value={tokenValue} /> : <div></div>}
        </div>}
    </div>
}

function SpinnerMessage(props: { text: string, size?: string, style?: CSSProperties }) {
    const size = props.size || '1.25rem'
    return <div className='flex-centre gap-1' style={props.style}>
        <div className='spinner' style={{ height: size, width: size }}></div>
        {props.text}
    </div>
}