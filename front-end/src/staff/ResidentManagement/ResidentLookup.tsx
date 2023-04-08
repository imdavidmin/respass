import React, { CSSProperties, useContext, useState } from 'react';
import { LocalStorageKey, ResidentDirectory } from '../../types';
import { BuildingAndUnitInput } from '../../common/Components/BuildingAndUnitInput';
import { ConfirmableButton } from '../../common/Components/ConfirmableButton';
import { DatabaseService } from '../../common/api';
import { ToastContext } from '../../ToastWrapper';
import { getResidentDirectory } from '../../common/util';

export function ResidentLookup() {
    const [lookupForm, setLookupForm] = useState([null, null]);
    const [lookupResult, setLookupResult] = useState<Array<[string, string]>>(null);
    const [disabledRows, setDisabledRows] = useState([])
    const addToast = useContext(ToastContext)

    const iconBtnStyle: CSSProperties = {
        background: '#eee',
        padding: '0.5rem'
    };

    function submitQuery() {
        const resDir: ResidentDirectory = JSON.parse(localStorage.getItem(LocalStorageKey.ResidentDirectory));
        const result = resDir?.[lookupForm[0]]?.[lookupForm[1]] ?? [];
        setLookupResult(result);
    }

    async function deleteResident(idToDelete: string) {
        setDisabledRows([...disabledRows, idToDelete])
        const isDeleted = await DatabaseService.deleteResident(idToDelete)
        if (isDeleted) {
            // Update both the displayed residents and the cached residents directory
            lookupResult.splice(lookupResult.findIndex(([name, id]) => id == idToDelete), 1)
            setLookupResult([...lookupResult])

            const resDir: ResidentDirectory = await getResidentDirectory()
            resDir[lookupForm[0]][lookupForm[1]] = lookupResult
            localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(resDir))

            addToast({
                message: 'Resident deleted.',
                title: '🗑️ Deleted'
            })
        } else {
            addToast({
                message: 'A problem occurred',
                title: '🤖 *blip boop*',
                barStyle: { background: '#df8000' }
            })
        }
    }

    if (lookupResult) {
        return lookupResult.length == 0
            ? <div>No results</div>
            : <div className='grid gap-1' style={{ gridTemplateColumns: '1fr repeat(2, max-content)', alignItems: 'center' }}>
                
                {lookupResult.map(([name, id], i) => <>
                    {name}
                    <button disabled={disabledRows.includes(id)} style={iconBtnStyle}>✏️</button>
                    <ConfirmableButton disabled={disabledRows.includes(id)} style={iconBtnStyle} onConfirm={() => deleteResident(id)}>🗑️</ConfirmableButton>
                </>)}
            </div>;
    } else {
        return <div className='grid gap-1'>
            <BuildingAndUnitInput form={lookupForm} setForm={setLookupForm} />
            <button onClick={submitQuery}>Search</button>
        </div>;
    }
}
