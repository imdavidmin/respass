import React, { CSSProperties, useState } from 'react';
import { SpinnerMessage } from '../../common/Components/SpinnerMessage';
import { BuildingAndUnitInput } from '../../common/Components/BuildingAndUnitInput';
import { DEFAULT_FORM } from './CreateResident';

type ResidentInformationFormProps = {
    form: ReturnType<typeof useState<typeof DEFAULT_FORM>>,
    submitting: boolean,
    onSubmit: (f: ResidentData) => void,
    submitText: string,
    submittingText: string
}
export function ResidentInformationForm(props: ResidentInformationFormProps) {
    const [form, setForm] = props.form;
    const complete = form.slice(0, 3).every(v => v != null);
    const [isComplete, setIsComplete] = useState(complete);

    if (complete != isComplete)
        setIsComplete(!isComplete);

    // Validate form completeness
    const updateForm = (e, i) => {
        form[i] = e.target.value == '' ? null : e.target.value;
        setForm([...form]);
    };

    const formGridStyle: CSSProperties = Object.assign(
        { gridTemplateColumns: 'max-content 1fr', alignItems: 'center' },
        props.submitting ? { opacity: 0.8, pointerEvents: 'none' as const } : {}
    );
    const buttonStyle: CSSProperties = Object.assign(
        { gridColumn: '1 / 3', marginTop: '1rem' },
        props.submitting ? { background: '#ddd', color: '#333' } : {}
    );

    return <div className='grid gap-1' style={formGridStyle}>
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
            onClick={() => props.onSubmit(getKVFromForm(form))}>
            {props.submitting ? <SpinnerMessage text={props.submittingText} /> : props.submitText}
        </button>
    </div>;
}

export type ResidentData = ReturnType<typeof getKVFromForm>;
function getKVFromForm(f: typeof DEFAULT_FORM) {
    return {
        bld: f[0],
        unit: f[1],
        name: f[2],
        email: f[3],
        phone: f[4]
    };
}
