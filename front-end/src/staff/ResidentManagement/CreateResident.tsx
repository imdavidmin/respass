import React, { CSSProperties, useContext, useEffect, useState } from 'react';
import { LocalStorageKey, ResidentDirectory } from '../../types';
import { DatabaseService } from '../../common/api';
import { SpinnerMessage } from '../../common/Components/SpinnerMessage';
import { BuildingAndUnitInput } from '../../common/Components/BuildingAndUnitInput';
import { ToastContext } from '../../ToastWrapper';
import { getResidentDirectory } from '../../common/util';

const DEFAULT_FORM = [null, null, null, null, null]

export function CreateResident() {
    const [form, setForm] = useState([...DEFAULT_FORM]);
    const [isComplete, setIsComplete] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const addToast = useContext(ToastContext)

    const updateForm = (e, i) => {
        form[i] = e.target.value == '' ? null : e.target.value;
        setForm([...form]);
    };

    const formGridStyle: CSSProperties = Object.assign(
        { gridTemplateColumns: 'max-content 1fr', alignItems: 'center' },
        submitting ? { opacity: 0.8, pointerEvents: 'none' as const } : {}
    );
    const buttonStyle: CSSProperties = Object.assign(
        { gridColumn: '1 / 3', marginTop: '1rem' },
        submitting ? { background: '#ddd', color: '#333' } : {}
    );

    // Submission of query to add new resident
    useEffect(() => {
        if (!submitting) return;

        DatabaseService.addResident(getKVFromForm(form), localStorage.getItem(LocalStorageKey.JWT))
            .then(id => {
                if (!id) throw id
                updateCachedResidentDirectory(getKVFromForm(form), id.toString())
                setForm([...DEFAULT_FORM])

                addToast({
                    title: '👍 Success',
                    message: `Resident added with ID ${id}.`
                })
            })
            .catch(e =>
                addToast({
                    message: 'Failed to add resident.',
                    title: '🤖 *blip boop*',
                    barStyle: { background: '#df8000' }
                }))
            .finally(() => setSubmitting(false));
    }, [submitting]);

    // Validate form completeness
    useEffect(() => {
        setIsComplete(form.slice(0, 3).every(v => v != null));
    }, [form]);

    function getKVFromForm(f: typeof form) {
        return {
            bld: f[0],
            unit: f[1],
            name: f[2],
            email: f[3],
            phone: f[4]
        };
    }
    async function updateCachedResidentDirectory(data: ReturnType<typeof getKVFromForm>, id: string) {
        const resDir: ResidentDirectory = await getResidentDirectory()
        resDir[data.bld] ??={}
        resDir[data.bld][data.unit]??=[]
        resDir[data.bld][data.unit].push([data.name, id])
        localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(resDir))
    }

    return <>
        <div className='grid gap-1' style={formGridStyle}>
            <BuildingAndUnitInput
                form={form.slice(0, 2)}
                setForm={(f) => setForm([...f, ...form.slice(2)])} />
            <label>Name</label>
            <input type='text' required value={form[2] || ''} onChange={(e) => updateForm(e, 2)}></input>
            <label>Email</label>
            <input type="email"
                placeholder='Optional'
                value={form[3] || ''}
                onChange={(e) => updateForm(e, 3)} />
            <label>Phone</label>
            <input type='tel'
                placeholder='Optional'
                value={form[4] || ''}
                onChange={(e) => updateForm(e, 4)} />
            <button style={buttonStyle}
                disabled={!isComplete}
                onClick={() => setSubmitting(true)}>
                {submitting ? <SpinnerMessage text='Creating' /> : 'Create Resident'}
            </button>
        </div>
    </>;
}

