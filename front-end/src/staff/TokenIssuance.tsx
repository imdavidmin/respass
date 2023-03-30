import React, { CSSProperties, useContext, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react';
import { AuthTokenPayload, ResidentDirectory } from '../types';
import { getAuthInfo } from '../common/getAuthState';
import { DatabaseService, JWTService } from '../common/api';
import { LocalStorageKey } from '../types';
import { BuildingAndUnitInput } from '../common/Components/BuildingAndUnitInput';
import { ToastContext } from '../ToastWrapper';

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
    // TODO - Add data check for resident directory
    const resDir: ResidentDirectory = JSON.parse(localStorage.getItem(LocalStorageKey.ResidentDirectory))

    const [form, setForm] = useState(DEFAULT_JWT_FORM)
    const [residentNameOptions, setResidentNameOptions] = useState([])
    const [hasMatch, setHasMatch] = useState(null)
    const [queryErrorMsg, setQueryErrorMsg] = useState(null)
    const [residentQueryInProgress, setResidentQueryInProgress] = useState(null)
    const [basicInfoCompleted, setBasicInfoCompleted] = useState(false)

    const addToast = useContext(ToastContext)
    const updateForm = (formRow: { [k: string]: string | number }) => {
        setForm({ ...form, ...formRow })
    }

    // Check for form completeness to query name suggestions and enable buttons
    useEffect(() => {
        if (form.Building && form.Unit) {
            setResidentNameOptions(resDir?.[form.Building]?.[form.Unit]?.map(([name, id]) => name) ?? [])
        }
        const requiredFields = [FieldLabel.Building, FieldLabel.Unit, FieldLabel.Name]
        const completed = requiredFields.every(k => form[k] != null)

        setBasicInfoCompleted(completed)
        completed && setQueryErrorMsg(null)
    }, [form])

    useEffect(() => {
        if (hasMatch === false) {
            addToast({
                message: <>
                    The name "{form[FieldLabel.Name]}" is not a registered resident's
                    name for {form[FieldLabel.Building]} unit {form[FieldLabel.Unit]}.
                </>
            })
            setHasMatch(null)
        }
    }, [hasMatch])

    function checkForResidentMatch() {
        const match = resDir?.[form.Building]?.[form.Unit]?.find(([name, id]) => name.toLowerCase() == form.Name.toLowerCase())
        if (!match) {
            setHasMatch(false)
            return
        } else {
            setForm({
                ...form,
                [FieldLabel.Name]: match[0],
                [FieldLabel.ResID]: match[1]
            })
        }
    }

    async function createNewResident() {
        setQueryErrorMsg(null)
        setResidentQueryInProgress('Requesting')
        const result = await DatabaseService.addResident(getResidentForm(form), token)
        updateForm({ [FieldLabel.ResID]: result })
        setResidentQueryInProgress(null)
    }

    const NAME_OPTIONS_ID = 'resident-name-options'

    return <div className='padding-1'>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'max-content 1fr', alignItems: 'center' }}>
            <BuildingAndUnitInput
                form={[form.Building, form.Unit]}
                setForm={(f) => setForm({ ...form, Building: f[0], Unit: f[1] })}
                locked={form[FieldLabel.ResID] != null}
            />
            <label>{FieldLabel.Name}</label>
            <input
                value={form.Name ?? ''}
                type="text"
                disabled={form[FieldLabel.ResID] != null}
                list={NAME_OPTIONS_ID}
                onChange={e => updateForm({ [FieldLabel.Name]: e.target.value == '' ? null : e.target.value })} />
            <datalist id={NAME_OPTIONS_ID}>
                {residentNameOptions.map(name => <option value={name} />)}
            </datalist>

            <label>{FieldLabel.ResID}</label>
            <div className='grid' style={{ gap: '5px' }}>
                {queryErrorMsg || ''}
                {residentQueryInProgress
                    ? <SpinnerMessage text={residentQueryInProgress} />
                    : form[FieldLabel.ResID]
                        ? <input disabled type="number" value={form[FieldLabel.ResID]}></input>
                        : <div className='flex' style={{ gap: '3px' }}>
                            <button disabled={!basicInfoCompleted} onClick={checkForResidentMatch}>Search</button>
                            <button disabled={!basicInfoCompleted} onClick={createNewResident}>Create New</button>
                        </div>
                }
            </div>
            {form[FieldLabel.ResID] != null && <>
                <label>{FieldLabel.IC}</label>
                <input placeholder='Optional' type="number"></input>
            </>}
        </div>

        {form[FieldLabel.ResID] != null &&
            <TokenIssuanceSubmission form={form} />}
    </div>
}

function TokenIssuanceSubmission(props: { form: typeof DEFAULT_JWT_FORM }) {
    const [sendQREmail, setSendQREmail] = useState(true)
    const [tokenValue, setTokenValue] = useState(null)
    const [tokenInProgress, setTokenInProgress] = useState(false)
    const [emailValid, setEmailValid] = useState(false)

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

        setTokenValue(await JWTService.getJWT(payload, token))
        setTokenInProgress(false)
    }

    return <div className='grid-centre gap-1 padding-1'>
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
    </div>
}

function SpinnerMessage(props: { text: string, size?: string, style?: CSSProperties }) {
    const size = props.size || '1.25rem'
    return <div className='flex-centre gap-1' style={props.style}>
        <div className='spinner' style={{ height: size, width: size }}></div>
        {props.text}
    </div>
}