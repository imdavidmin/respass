import React, { CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { DatabaseService } from '../common/api';
import { getAuthInfo } from '../common/getAuthState';
import { QRReader } from '../common/qr';
import { qrChangeHandler } from '../common/qrChangeHandler';
import { AuthTokenPayload, QueryResult, LocalStorageKey, ItemRecord } from '../types';
import { getSiteConfig, ConfigKey } from '../common/util';
import { BuildingAndUnitInput } from '../common/Components/BuildingAndUnitInput';
import { FailureToast, ToastContext } from '../ToastWrapper';

export function ResidentCollection() {
    const [authenticatedResident, setAuthenticatedResident] = useState<AuthTokenPayload>(null);
    const [qrErrorMsg, setQrErrorMsg] = useState(null);
    const [confirmSkip, setConfirmSkip] = useState(false)
    const [authSkipped, setAuthSkipped] = useState(false)
    const [form, setForm] = useState([getSiteConfig(ConfigKey.AvailableBuildings)[0]?.value, null])
    const residentJWT = useRef(null)

    const codeHandler = (code: string) => {
        residentJWT.current = code
        qrChangeHandler(code, () => { }, setAuthenticatedResident, setQrErrorMsg);
    }
    const resetForm = () => {
        setAuthenticatedResident(null);
        setAuthSkipped(false);
        setConfirmSkip(false)
        setForm([getSiteConfig(ConfigKey.AvailableBuildings)[0].value, null])
        residentJWT.current = null
    }

    const queryByBuildingAndUnit = () => {
        setAuthenticatedResident({ ...getAuthInfo(), bld: form[0], unit: form[1] })
    }

    if (authenticatedResident?.name) {
        return <>
            {authSkipped
                ? <b className='padding-1'>⚠️ Checking out as {getAuthInfo().name}</b>
                : <AuthenticatedResidentBadge resident={authenticatedResident} />}
            <InventoryResults
                query={{ bld: authenticatedResident.bld, unit: authenticatedResident.unit }}
                residentJWT={residentJWT.current}
                resetForm={resetForm}
            />
        </>
    }

    if (authSkipped) {
        return <>
            <div className='grid gap-1 padding-1' style={{ gridTemplateColumns: 'max-content 1fr', alignItems: 'center' }}>
                <BuildingAndUnitInput form={form} setForm={setForm} />
            </div>
            <button disabled={form.some(field => field === null)} onClick={queryByBuildingAndUnit} style={{ margin: '1rem' }}>
                Show available items
            </button>
        </>
    } else {
        return <div className='grid gap-1'>
            <div className='centre-text' style={{ maxWidth: '400px' }}>
                {!confirmSkip
                    ? <>
                        <p>Please scan the resident's QR code</p>
                        <button onClick={() => setConfirmSkip(!confirmSkip)} style={{ width: 'max-content', margin: '0 auto 1rem' }}>Skip authentication</button>
                    </>
                    : <>
                        <p>
                            If you do not scan an identification QR code, the parcel will be marked as collected by
                            <b style={{ color: 'var(--theme-primary)' }}> {getAuthInfo().name}</b>, and you will assume responsibiliy.
                        </p>
                        <div className='flex-centre gap-1' style={{ margin: '1rem' }}>
                            <button onClick={() => setAuthSkipped(true)}>Confirm</button>
                            <button onClick={() => setConfirmSkip(!confirmSkip)} className='secondary'>Cancel</button>
                        </div>
                    </>}

            </div>
            <QRReader outputHandler={codeHandler} />
            <p className='centre-text'>{qrErrorMsg || ''}</p>
        </div>
    }
}

function AuthenticatedResidentBadge(props: { resident: AuthTokenPayload }) {
    return <div className='grid gap-1 rounded-1 padding-1' style={{ maxWidth: '400px', border: '1px solid #00000020' }}>
        <div className='flex-centre'>
            <img className='icon' src="./assets/icons/shield-check.svg" aria-hidden></img>
            <span style={{ marginLeft: '5px' }}>Verified as <b>{props.resident.name}</b></span>
        </div>
        <div className='grid' style={{ gridTemplateColumns: 'auto auto', gap: '0.5rem' }}>
            <span>Building</span>
            <b>{props.resident.bld}</b>
            <span>Unit</span>
            <b>{props.resident.unit}</b>
        </div>
    </div>
}

type InventoryResultsProps = {
    query: Partial<AuthTokenPayload>,
    residentJWT: string,
    resetForm: () => void
}
function InventoryResults(props: InventoryResultsProps) {
    const [queryResults, setQueryResults] = useState(null as QueryResult)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [statusMsg, setStatusMsg] = useState<string | JSX.Element>('⏳ Waiting for resident token')

    const addToast = useContext(ToastContext)
    const collected = useRef<Array<boolean>>([])

    const staffJWTToken = localStorage.getItem(LocalStorageKey.JWT)

    const isRetrievingMsg = <div className='flex-centre gap-1'>
        <div className='spinner' style={{ height: '1.5rem', width: '1.5rem' }}></div>
        Retrieving records
    </div>

    useEffect(() => {
        // Makes inventory query based on props passed to the backend
        if (!props.query) return
        setStatusMsg(isRetrievingMsg)

        DatabaseService.queryInventory(props.query, staffJWTToken)
            .then(r => {
                if (r.length == 0) {
                    setStatusMsg('🈳 No record of items belonging to this resident')
                } else {
                    setQueryResults(r)
                    setStatusMsg(<div className='flex-centre gap-1'>
                        Click on items collected by resident
                        <button onClick={() => setIsSubmitting(true)}>Done</button>
                    </div>)
                    collected.current = r.map(r => false)
                }
            }, rej => {
                setStatusMsg(<div style={{ textAlign: 'center' }}>
                    <p>😕 Something went wrong.</p>
                    <p style={{ opacity: 0.6, fontSize: '0.875rem' }}>{rej instanceof Error && `${rej.name}: ${rej.message}`}</p>
                </div>)
            })
    }, [])

    useEffect(() => {
        if (!isSubmitting) return

        const collectedIds = queryResults.reduce((acc, item, i) => {
            collected.current[i] && acc.push(item.id);
            return acc
        }, [])

        DatabaseService.submitInventoryCollection(collectedIds, props.residentJWT, staffJWTToken)
            .then(async result => {
                if (result.success) {
                    addToast({
                        title: '👍 Successed',
                        message: 'The packages are marked as collected.'
                    })
                    props.resetForm()
                } else {
                    addToast(FailureToast(`Something went wrong.\nStatus: ${result.res.status}\nMessage: ${await result.res.text()}`))
                }
            })
    }, [isSubmitting])

    const cardGridStyle: CSSProperties = {
        width: '100vw',
        boxSizing: 'border-box',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))'
    }

    return <>
        {statusMsg}
        <div className="grid gap-1 padding-1" style={cardGridStyle}>
            {queryResults?.map((r, i) =>
                <ItemCard key={i} item={r}
                    markCollection={(state) => collected.current[i] = state} />
            )}
        </div>
    </>
}

function ItemCard(props: { item: ItemRecord, markCollection: (boolean) => void }) {
    const [checked, setChecked] = useState(false)
    const toggleCheck = () => { setChecked(!checked); props.markCollection(!checked) }
    const itemIcon = getIcon(props.item.type)

    const defaultStyle: CSSProperties = { background: '#fff', overflow: 'hidden' }
    const checkedStyle: CSSProperties = { background: '#f8f8f8', outline: '2px solid var(--theme-primary)' }

    const nameTagStyle: CSSProperties = {
        background: checked ? '#ddd' : '#ffda29',
        color: checked ? '#333' : '#000',
        fontWeight: 'bold',
        padding: '0.5rem',
        textTransform: 'uppercase'
    }

    return <div
        className='shadow-1 rounded-1 float-on-hover flex-dir-col'
        onClick={toggleCheck}
        style={checked ? checkedStyle : defaultStyle}>
        <div className='flex gap-1 padding-1'>
            <span style={{ fontSize: '2rem' }}>{itemIcon}</span>
            <div className='grid'>
                <b>{props.item.lastAt}</b>
                <span>{props.item.note}</span>
            </div>
        </div>
        <div className='centre-text' style={nameTagStyle}>{props.item.owner}</div>
    </div>
}

function getIcon(type: string) {
    switch (type) {
        case 'parcel': return "📦";
        case 'key': return "🔑";
        default: return "💼"
    }
}