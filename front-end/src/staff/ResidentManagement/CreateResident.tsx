import React, { useContext, useEffect, useState } from 'react';
import { LocalStorageKey, ResidentDirectory } from '../../types';
import { DatabaseService } from '../../common/api';
import { FailureToast, ToastContext } from '../../ToastWrapper';
import { ConfigKey, getResidentDirectory, getSiteConfig } from '../../common/util';
import { ResidentData, ResidentInformationForm } from './ResidentInformationForm';

export const DEFAULT_FORM = [getSiteConfig(ConfigKey.AvailableBuildings)[0].value, null, null, null, null]

export function CreateResident() {
    const formState = useState([...DEFAULT_FORM])
    const [submitting, setSubmitting] = useState(false);
    const addToast = useContext(ToastContext)

    function submit(form: ResidentData) {
        setSubmitting(true)
        DatabaseService.addResident(form, localStorage.getItem(LocalStorageKey.JWT))
            .then(id => {
                if (!id) throw id
                updateCachedResidentDirectory(form, id.toString())
                formState[1]([...DEFAULT_FORM])

                addToast({
                    title: '👍 Success',
                    message: `Resident added with ID ${id}.`
                })
            })
            .catch(e =>
                addToast(FailureToast('Failed to add resident.'))
            )
            .finally(() => setSubmitting(false));
    }

    return <ResidentInformationForm
        form={formState}
        submitting={submitting}
        onSubmit={submit}
        submitText='Create Resident'
        submittingText='Creating' />
}

export async function updateCachedResidentDirectory(data: ResidentData, id: string) {
    const resDir: ResidentDirectory = await getResidentDirectory()
    resDir[data.bld] ??= {}
    resDir[data.bld][data.unit] ??= []
    const match = resDir[data.bld][data.unit].find(([n, i]) => i.toString() == id)
    if (!match) {
        resDir[data.bld][data.unit].push([data.name, id])
    } else {
        match[0] = data.name
    }

    localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(resDir))
}