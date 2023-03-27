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

type InventoryReceiptFormRow = [string, string, string, string, string]
type InventoryReceiptForm = Array<InventoryReceiptFormRow>
type TableColumn = { label: string, type?: string, options?: Array<{ label?: string, value: string }> }

export function ReceiveInventory() {
    const columns: Array<TableColumn> = [
        { label: 'Type', type: 'select', options: OBJECT_TYPES },
        { label: 'Building', type: 'select', options: BUILDINGS },
        { label: 'Unit', type: 'text' },
        { label: 'Recipient', type: 'list' },
        { label: 'Location', type: 'select', options: INVENTORY_LOCATIONS },
        { label: 'Note', type: 'text' },
        { label: '' },
    ]
    const [form, setForm] = useState<InventoryReceiptForm>([])
    const [formUpdate, setFormUpdate] = useState(null)
    const [isFormComplete, setIsFormComplete] = useState(false)
    const [datalistOptions, setDatalistOptions] = useState<Array<Array<string>>>([[]])
    const [residents, setResidents] = useState({})
    const [entryRows, setEntryRows] = useState<Array<Array<JSX.Element>>>([])

    useEffect(() => {
        addRow();
        retrieveAllResidents(setResidents)
    }, [])

    useEffect(() => {
        if (!formUpdate) return

        const newForm = [...form]
        newForm[formUpdate[0]][formUpdate[1]] = formUpdate[2]
        setForm(newForm)
    }, [formUpdate])

    useEffect(() => {
        setIsFormComplete(form.every(row => row.slice(0, row.length - 1).every(v => v != null)))

        // If building and unit is filled for a row, update suggested names
        const updatedListOptions = []
        form.forEach(data => {
            const [bld, unit] = [data[1], data[2]]
            updatedListOptions.push(bld && unit
                ? residents[bld][unit]
                : [])
        })
        setDatalistOptions(updatedListOptions)
    }, [form])


    function addRow() {
        const i = entryRows.length
        processAddRow(i, columns,
            (r) => setForm([...form, r]),
            (u) => setEntryRows([...entryRows, u]),
            (e, col) => setFormUpdate([i, col, e.target.value == '' ? null : e.target.value])
        )
    }
    function submitForm() {
        submitEntries(form, reset)
    }
    function reset() {

    }

    return <>
        <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(2, max-content) 70px repeat(2, max-content) 150px min-content', margin: '2rem 0' }}>
            {columns.map(o => <b>{o.label}</b>)}
            {entryRows.map((r, i) => {
                return <>
                    {r}
                    <datalist id={`ri-form-row${i}-names`}>
                        {datalistOptions[i] && datalistOptions[i].map(o => <option value={o} />)}
                    </datalist>
                </>
            })}
        </div>
        <div className="flex-centre gap-1">
            <button onClick={addRow}>Add another entry</button>
            <button onClick={submitForm} disabled={!isFormComplete}>Submit</button>
        </div>
    </>
}

async function submitEntries(form: InventoryReceiptForm, onComplete: (e?) => void) {

}

async function retrieveAllResidents(setResidents: (data) => void) {
    setResidents({ C: { 606: ['David Min', 'Stefan Bratanov'] } })
}

function processAddRow(i: number, columns: Array<TableColumn>,
    addFormDataRow: (r: InventoryReceiptFormRow) => void,
    addUIRow: (u: Array<JSX.Element>) => void,
    formUpdateHandler: (e, col: number) => void) {

    const getDropdown = (column, handler) => {
        const dropdownOptions = column.options.map((v, i) =>
            <option value={v.value} key={i} >{v.label}</option>
        )
        return <select onChange={handler}>{dropdownOptions}</select>
    }

    const listId = `ri-form-row${i}-names`
    addUIRow([
        getDropdown(columns[0], (e) => formUpdateHandler(e, 0)),
        getDropdown(columns[1], (e) => formUpdateHandler(e, 1)),
        <input type='text' onChange={e => formUpdateHandler(e, 2)}></input>,
        <input type='text' onChange={e => formUpdateHandler(e, 3)} list={listId}></input>,
        getDropdown(columns[4], (e) => formUpdateHandler(e, 4)),
        <input type='text' onChange={e => formUpdateHandler(e, 5)}></input>,
        <button style={{ background: 'none', padding: '5px' }}>❌</button>
    ])
    addFormDataRow([OBJECT_TYPES[0].value, BUILDINGS[0].value, null, null, null])
}