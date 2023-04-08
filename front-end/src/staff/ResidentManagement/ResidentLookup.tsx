import React, { createContext, CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { LocalStorageKey, ResidentDirectory } from '../../types';
import { BuildingAndUnitInput } from '../../common/Components/BuildingAndUnitInput';
import { ConfirmableButton } from '../../common/Components/ConfirmableButton';
import { DatabaseService } from '../../common/api';
import { FailureToast, ToastContext } from '../../ToastWrapper';
import { getResidentDirectory } from '../../common/util';
import { ResidentInformationForm } from './ResidentInformationForm';
import { SpinnerMessage } from '../../common/Components/SpinnerMessage';
import { updateCachedResidentDirectory } from './CreateResident';

const ResidentLookupContext = createContext((b: boolean) => { })

export function ResidentLookup() {
    const [lookupForm, setLookupForm] = useState([null, null]);
    const [lookupResult, setLookupResult] = useState<Array<[string, string]>>(null);
    const [disabledRows, setDisabledRows] = useState([])
    const [editRows, setEditRows] = useState([])

    const [refreshTrigger, setRefreshTrigger] = useState(false)

    useEffect(() => {
        if (refreshTrigger) {
            submitQuery()
            setRefreshTrigger(false)
        }
    }, [refreshTrigger])

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
        const isDeleted = await DatabaseService.deleteResident(idToDelete, localStorage.getItem(LocalStorageKey.JWT))
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
            addToast(FailureToast('A problem occurred'))
        }
    }

    function toggleEdit(id) {
        const i = editRows.indexOf(id)
        if (i == -1) {
            setEditRows([...editRows, id])
        } else {
            editRows.splice(i, 1)
            setEditRows([...editRows])
        }
    }
    function removeIdFromEditRows(id) {
        editRows.splice(editRows.indexOf(id, 1));
        setEditRows([...editRows])
    }

    if (lookupResult) {
        return lookupResult.length == 0
            ? <div>No results</div>
            : <ResidentLookupContext.Provider value={setRefreshTrigger}>
                <div className='grid gap-1' style={{ gridTemplateColumns: '1fr repeat(2, max-content)', alignItems: 'center' }}>
                    {lookupResult.map(([name, id], i) => <>
                        <span key={`name-${i}`}>{name}</span>
                        <button key={`edit-${i}`} style={iconBtnStyle}
                            disabled={disabledRows.includes(id)}
                            onClick={() => toggleEdit(id)}>
                            {editRows.includes(id) ? '✅' : '✏️'}
                        </button>
                        <ConfirmableButton key={`del-${i}`}
                            disabled={disabledRows.includes(id)}
                            style={iconBtnStyle}
                            onConfirm={() => deleteResident(id)}>
                            🗑️
                        </ConfirmableButton>
                        {editRows.includes(id) &&
                            <EditContactForm key={`form-${id}`}
                                name={name} id={id} bld={lookupForm[0]} unit={lookupForm[1]}
                                onClose={() => removeIdFromEditRows(id)} />
                        }
                    </>)
                    }
                </div>
            </ResidentLookupContext.Provider>;
    } else {
        return <div className='grid gap-1'>
            <BuildingAndUnitInput form={lookupForm} setForm={setLookupForm} />
            <button onClick={submitQuery}>Search</button>
        </div>;
    }
}

function EditContactForm(props: { name: string, id: string, bld: string, unit: string, onClose: () => void }) {
    const form = useState([props.bld, props.unit, props.name, null, null])
    const [contactInfo, setContactInfo] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const dataToSubmit = useRef(null)

    const addToast = useContext(ToastContext)
    const refreshTrigger = useContext(ResidentLookupContext)

    useEffect(() => {
        if (!contactInfo) {
            DatabaseService.getResidentContact(props.id, localStorage.getItem(LocalStorageKey.JWT))
                .then(r => {
                    if (!r) {
                        setContactInfo({})
                    } else {
                        form[0][3] = r.email
                        form[0][4] = r.phone
                        form[1]([...form[0]])
                        setContactInfo(r)
                    }
                })
        }
    }, [contactInfo])

    useEffect(() => {
        if (!dataToSubmit.current) return
        const cachedFormData = dataToSubmit.current
        DatabaseService.updateResident(dataToSubmit.current, props.id, localStorage.getItem(LocalStorageKey.JWT))
            .then(async (succeded) => {
                if (succeded) {
                    await updateCachedResidentDirectory(cachedFormData, props.id)
                    refreshTrigger(true)
                    addToast({ message: 'Information updated.', title: '👍' })
                    props.onClose()
                } else {
                    addToast(FailureToast('Something went wrong.'))
                }
                setIsSubmitting(false)
            })
        dataToSubmit.current = null
    }, [isSubmitting])

    return <div className='padding-1 shadow-1 rounded-1' style={{ gridColumn: '1 / 4' }}>
        {contactInfo
            ? <ResidentInformationForm
                form={form}
                submitting={isSubmitting}
                onSubmit={(f) => { dataToSubmit.current = f; setIsSubmitting(true); }}
                submitText='Update Resident'
                submittingText='Updating'
            />
            : <SpinnerMessage text='Getting data' />}
        <button className='secondary' onClick={props.onClose} style={{ marginTop: '0.5rem', width: '100%' }}>Cancel</button>
    </div>
}