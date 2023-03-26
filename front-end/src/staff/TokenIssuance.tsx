import React, { useEffect, useState } from 'react'
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

export function TokenIssuance(prop) {
    const token = localStorage.getItem(LocalStorageKey.JWT)
    const [form, setForm] = useState(DEFAULT_FORM)
    const [residentLocked, setResidentLocked] = useState(false)
    const [queryErrorMsg, setQueryErrorMsg] = useState(null)
    const [residentQueryInProgress, setResidentQueryInProgress] = useState(null)
    const [idBtnsDisabled, setIdBtnsDisabled] = useState(false)
    const [tokenValue, setTokenValue] = useState(null)

    const systemFields: Array<FieldLabel> = [FieldLabel.ResID, FieldLabel.IC]
    const optionalFields: Array<FieldLabel> = [FieldLabel.IC]
    const updateForm = (k, v) => {
        setForm({ ...form, [k]: v })
    }

    useEffect(() => {
        const resDataFilled = Object.entries(form)
            .filter(([k, v]: [FieldLabel, any]) => !systemFields.includes(k))
            .every(([k, v]) => v != null)

        setIdBtnsDisabled(!resDataFilled)

    }, [form])

    const getResidentForm = (f: typeof form) => {
        return {
            name: f[FieldLabel.Name],
            bld: f[FieldLabel.Building],
            unit: f[FieldLabel.Unit]
        }
    }

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
            for (let i = 0; i < fields.length; i++) {
                const j = result.columns.indexOf(fields[i][0])
                updateForm(fields[j][1], result.data[0][i])
            }
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
        updateForm([FieldLabel.ResID], result)
    }

    async function getJWTForResident() {
        const staffInfo = getAuthInfo()
        const payload: AuthTokenPayload = {
            ...getResidentForm(form),
            sub: (form[FieldLabel.ResID] as number).toString(),
            ic: form[FieldLabel.IC] || 1,
            role: 'res',
            iss: `${staffInfo.name}-${staffInfo.ic}`,
        }

        setTokenValue(await JWTService.getJWT(payload, token))
    }

    function toggleEmail() {

    }

    return <>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'max-content 1fr' }}>
            {Object.keys(form).map((label: FieldLabel) => !systemFields.includes(label) &&
                <React.Fragment key={label}>
                    <label>{label}</label>
                    <input autoComplete='off'
                        disabled={residentLocked}
                        value={form[label] || ''}
                        onChange={e => updateForm(label, e.target.value == '' ? null : e.target.value)} />
                </React.Fragment>)}
            <label>{FieldLabel.ResID}</label>
            <div className='grid' style={{ gap: '5px' }}>
                <input disabled type="number" value={form[FieldLabel.ResID] || ''}></input>
                {queryErrorMsg || ''}
                <div className='flex' style={{ gap: '3px' }}>
                    {residentQueryInProgress
                        ? <div className='flex-centre gap-1' style={{ width: '100%' }}>
                            <div className='spinner' style={{ height: '1rem', width: '1rem' }}></div>
                            {residentQueryInProgress}
                        </div>
                        : <>
                            <button disabled={idBtnsDisabled} onClick={searchForResident}>Search</button>
                            <button disabled={idBtnsDisabled} onClick={createNewResident}>Create New</button>
                        </>
                    }
                </div>
            </div>

            <label>{FieldLabel.IC}</label>
            <input placeholder='Optional' type="number"></input>

        </div>
        <div className='grid-centre'>
            <div className='flex-centre' style={{ margin: '5px' }}>
                <input type="checkbox" checked onChange={toggleEmail} />
                <label>Send the new token to resident's email</label>
            </div>
            <input type="email" placeholder='email@web.com' style={{ width: 'calc(100% - 2rem)' }}></input>
        </div>

        <button onClick={getJWTForResident}>Generate token</button>
        {tokenValue ? <QRCodeSVG value={tokenValue} /> : <div></div>}
    </>
}

