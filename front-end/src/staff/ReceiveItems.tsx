import React, { useEffect, useRef, useState } from "react";

const OBJECT_TYPES = [{ label: '📦', value: 'parcel' }, { label: '🔑', value: 'key' }]
const BUILDINGS = [
    { label: 'Banbury Point', value: 'C' },
    { label: 'Chorley Court', value: 'E' },
    { label: 'Lamington Heights', value: 'D' },
    { label: '14 Rifle Street', value: 'F' },
    { label: 'Madeira Street', value: 'S' }
]
const INVENTORY_LOCATIONS = [{ value: 'Shelf A' }, { value: 'Shelf B' }]


const INVENTORY_LOCATIONS_DATALIST_ID = `ri-form-inventory-locations`
type InventoryReceiptFormRow = [string, string, string, string, string, string]
type InventoryReceiptForm = Array<InventoryReceiptFormRow>
type TableColumn = { label: string, type?: string, options?: Array<{ label?: string, value: string }> }

const columns: Array<TableColumn> = [
    { label: 'Type', type: 'select', options: OBJECT_TYPES },
    { label: 'Building', type: 'select', options: BUILDINGS },
    { label: 'Unit', type: 'text' },
    { label: 'Recipient', type: 'list' },
    { label: 'Location', type: 'select', options: INVENTORY_LOCATIONS },
    { label: 'Note', type: 'text' },
    { label: '' },
]

export function ReceiveInventory() {
    const [form, setForm] = useState<InventoryReceiptForm>([])
    const [formUI, setFormUI] = useState<Array<Array<JSX.Element>>>([])
    const [removeRow, setRemoveRow] = useState(null)
    const [isFormComplete, setIsFormComplete] = useState(false)
    const [residents, setResidents] = useState({})

    useEffect(() => {
        addRow();
        retrieveAllResidents(setResidents)
    }, [])

    useEffect(() => {
        // Last column is notes, which is optional
        setIsFormComplete(form.every(row => row.slice(0, row.length - 1).every(v => v != null)))
    }, [form])

    const formUpdateHandler = (row, data) => {
        form[row] = data
        setForm([...form])
    }

    function addRow() {
        setForm([...form, [OBJECT_TYPES[0].value, BUILDINGS[0].value, null, null, null, null]])
    }

    useEffect(() => {
        if (removeRow === null) return

        form.splice(removeRow, 1)
        formUI.splice(removeRow, 1)
        setForm([...form])
        setFormUI([...formUI])

        setRemoveRow(null)
    }, [removeRow])

    function submitForm() {
        submitEntries(form, () => { })
    }

    const formGridStyle = {
        gridTemplateColumns: 'repeat(2, max-content) 70px max-content 100px 150px min-content',
        margin: '2rem 0'
    }

    return <>
        <div className="grid gap-1" style={formGridStyle}>
            {columns.map(o => <b>{o.label}</b>)}
            {form.map((r, i) => <FormRow key={i}
                row={i}
                data={r}
                residents={residents}
                updateHandler={(data) => formUpdateHandler(i, data)}
                removeTrigger={() => setRemoveRow(i)}
            />)}
            <datalist id={INVENTORY_LOCATIONS_DATALIST_ID}>
                {INVENTORY_LOCATIONS.map(l => <option value={l.value}></option>)}
            </datalist>
        </div>
        {form.length >= 10 &&
            'We recommend submitting for every 10 entries to avoid accidental data loss'
        }
        <div className="flex-centre gap-1">
            <button onClick={addRow}>Add another entry</button>
            <button onClick={submitForm} disabled={!isFormComplete}>Submit</button>
        </div>
    </>
}

function FormRow(props: { row: number, data: Array<any>, residents: {}, updateHandler: (data) => void, removeTrigger: () => void }) {
    function formUpdateHandler(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, col: number) {
        props.data[col] = e.target.value == '' ? null : e.target.value
        props.updateHandler([...props.data])
    }

    const getValue = (col: number) => props.data[col] || ''

    // If building and unit is filled for a row, update suggested names
    const [bld, unit] = [props.data[1], props.data[2]]
    const datalistOptions: Array<Array<string>> = bld && unit
        ? props.residents[bld][unit]
        : []

    const resNamesDatalistId = `ri-form-row${props.row}-names`

    const mapDropdownOptions = (v, i) => <option value={v.value} key={i} >{v.label || v.value}</option>
    return <>
        <select value={getValue(0)} onChange={(e) => formUpdateHandler(e, 0)}>
            {columns[0].options.map(mapDropdownOptions)}
        </select>
        <select value={getValue(1)} onChange={(e) => formUpdateHandler(e, 0)}>
            {columns[1].options.map(mapDropdownOptions)}
        </select>
        <input value={getValue(2)} type='text' onChange={e => formUpdateHandler(e, 2)}></input>
        <input value={getValue(3)} type='text' onChange={e => formUpdateHandler(e, 3)} list={resNamesDatalistId}></input>
        <input value={getValue(4)} type='text' onChange={e => formUpdateHandler(e, 4)} list={INVENTORY_LOCATIONS_DATALIST_ID}></input>
        <input value={getValue(5)} type='text' onChange={e => formUpdateHandler(e, 5)}></input>
        {props.row == 0
            ? <div></div>
            : <button aria-label="Remove row"
                style={{ background: 'none', padding: '5px' }}
                onClick={props.removeTrigger}>
                ❌
            </button>
        }
        <datalist id={resNamesDatalistId}>
            {datalistOptions?.map(o => <option value={o} />)}
        </datalist>
    </>
}

async function submitEntries(form: InventoryReceiptForm, onComplete: (e?) => void) {

}

async function retrieveAllResidents(setResidents: (data) => void) {
    setResidents({ C: { 606: ['David Min', 'Stefan Bratanov'] } })
}