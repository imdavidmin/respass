import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { DatabaseService } from '../common/api';
import { QRReader } from '../common/qr';
import { qrChangeHandler } from '../common/qrChangeHandler';
import { AuthTokenPayload, QueryableKV, QueryResult, LocalStorageKey, ItemRecord } from '../types';

export function ResidentCollection() {
    const [authenticatedResident, setAuthenticatedResident] = useState({} as AuthTokenPayload);
    const [qrErrorMsg, setQrErrorMsg] = useState(null);
    const codeHandler = (code: string) => qrChangeHandler(code, () => { }, setAuthenticatedResident, setQrErrorMsg);

    return <>
        <h1>Item Collection</h1>
        {authenticatedResident.name
            ? <>
                <AuthenticatedResidentBadge resident={authenticatedResident} />
                <InventoryResults query={{ sub: [authenticatedResident.sub] }} />
            </>
            : <div className='grid gap-1'>
                Please scan the resident's code
                <QRReader outputHandler={codeHandler} />
                <p>{qrErrorMsg || ''}</p>
            </div>}
    </>;
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

type InventoryResultsProps = { query: QueryableKV }
function InventoryResults(props: InventoryResultsProps) {
    const [queryResults, setQueryResults] = useState(null as QueryResult)
    const [statusMsg, setStatusMsg] = useState<string | JSX.Element>('⏳ Waiting for resident token')
    const collected = useRef<Array<boolean>>([])

    const isRetrievingMsg = <div className='flex-centre gap-1'>
        <div className='spinner' style={{ height: '1.5rem', width: '1.5rem' }}></div>
        Retrieving records
    </div>

    useEffect(() => {
        // Makes inventory query based on props passed to the backend
        if (!props.query) return
        setStatusMsg(isRetrievingMsg)

        const staffJWTToken = localStorage.getItem(LocalStorageKey.JWT)
        DatabaseService.queryInventory(props.query, staffJWTToken)
            .then(r => {
                if (r.length == 0) {
                    setStatusMsg('🈳 No record of items belonging to this resident')
                } else {
                    setQueryResults(r)
                    setStatusMsg(<div className='flex-centre gap-1'>
                        Click on items collected by resident
                        <button>Done</button>
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

    return <div className='shadow-1 rounded-1 flex gap-1 padding-1 float-on-hover' onClick={toggleCheck} style={{ background: checked ? '#f8f8f8' : '#fff' }}>
        <span style={{ fontSize: '2rem' }}>{itemIcon}</span>
        <div className='grid'>
            <b>{props.item.lastAt}</b>
            <span>{props.item.note}</span>
        </div>
    </div>
}

function getIcon(type: string) {
    switch (type) {
        case 'parcel': return "📦";
        case 'key': return "🔑";
        default: return "💼"
    }
}