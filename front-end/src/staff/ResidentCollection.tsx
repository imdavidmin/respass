import React, { useEffect, useState } from 'react';
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
            ? <div className='grid gap-1'>
                <div className='flex-centre'>
                    <img className='icon' src="./assets/icons/shield-check.svg" aria-hidden></img>
                    <span style={{ marginLeft: '5px' }}>Verified as <b>{authenticatedResident.name}</b></span>
                </div>
                <div className='grid gap-1' style={{ gridTemplateColumns: 'auto auto' }}>
                    <span>Building</span>
                    <span>{authenticatedResident.bld}</span>
                    <span>Unit</span>
                    <span>{authenticatedResident.unit}</span>
                </div>
                <InventoryResults query={{ sub: [authenticatedResident.sub] }} />
            </div>
            : <div className='grid gap-1'>
                Please scan the resident's code
                <QRReader outputHandler={codeHandler} />
                <p>{qrErrorMsg || ''}</p>
            </div>}
    </>;
}

type InventoryResultsProps = { query: QueryableKV }
function InventoryResults(props: InventoryResultsProps) {
    const [queryResults, setQueryResults] = useState(null as QueryResult)

    useEffect(() => {
        if (!props.query) return
        const staffJWTToken = localStorage.getItem(LocalStorageKey.JWT)
        DatabaseService.query(props.query, staffJWTToken).then(r =>
            setQueryResults(r)
        )
    }, [])

    return <div className='shadow-1 rounded-1'>
        {!props.query
            ? <p>⏳ Waiting for resident token</p>
            : !queryResults ? <p>🔍 Retrieving records</p> : <></>}
        {queryResults && queryResults.filter(r => r.type == 'parcel')
            .map((r, i) => <ParcelCard key={i} item={r} />)
        }
    </div>;
}

function ParcelCard(props: { item: ItemRecord }) {
    return <div>
        <span>{props.item.lastAt}</span>
        <span>{props.item.notes}</span>
    </div>
}