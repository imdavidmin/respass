import React, { useContext, useEffect, useState } from "react";
import { DatabaseService } from "../common/api";
import { SpinnerMessage } from "../common/Components/SpinnerMessage";
import { ConfigKey, getSiteConfig } from "../common/util";
import { ToastContext } from "../ToastWrapper";
import { LocalStorageKey } from "../types";
import { StaffAppContext } from "./StaffApp";

const INVENTORY_LOCATIONS_DATALIST_ID = `ri-form-inventory-locations`
type InventoryReceiptFormRow = [string, string, string, string, string, string]
export type InventoryReceiptForm = Array<InventoryReceiptFormRow>
type TableColumn = { label: string, type?: string, options?: Array<{ label?: string, value: string }> }

export function ReceiveInventory() {
    const EMPTY_ROW: InventoryReceiptFormRow = [
        getSiteConfig(ConfigKey.InventoryObjectTypes)?.[0]?.value,
        getSiteConfig(ConfigKey.AvailableBuildings)?.[0]?.value,
        null, null, null, null
    ]

    const [form, setForm] = useState<InventoryReceiptForm>([EMPTY_ROW])
    const [removeRow, setRemoveRow] = useState(null)
    const [isFormComplete, setIsFormComplete] = useState(false)
    const [residents, setResidents] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const dataFetchStatus = useContext(StaffAppContext)
    const addToast = useContext(ToastContext)

    if (!dataFetchStatus.siteConfig) {
        return <SpinnerMessage text="Loading site configuration..." />
    }

    useEffect(() => {
        dataFetchStatus?.resDir &&
            setResidents(JSON.parse(localStorage.getItem(LocalStorageKey.ResidentDirectory)))
    }, [dataFetchStatus])

    useEffect(() => {
        // Last column is "notes", which is optional
        setIsFormComplete(form.every(row => row.slice(0, row.length - 1).every(v => v != null)))
    }, [form])

    const formUpdateHandler = (row, data) => {
        form[row] = data
        setForm([...form])
    }

    useEffect(() => {
        if (removeRow === null) return

        form.splice(removeRow, 1)
        setForm([...form])

        setRemoveRow(null)
    }, [removeRow])

    async function submitForm() {
        if (form.length == 0) return
        setIsSubmitting(true)
        const result = await DatabaseService.addInventory(form, localStorage.getItem(LocalStorageKey.JWT))

        if (result.success) {
            setForm([EMPTY_ROW])
            addToast({ title: '👍 Submitted', message: 'The items are recorded successfully.' })
        } else {
            addToast({
                title: '🚨 Submission failed',
                message: <div className="grid gap-1">
                    The items have not been recorded, try again, or contact support noting the message below.
                    <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>
                        {`Status: ${result.res.status}\nMessage: ${await result.res.text()}`}
                    </span>
                </div>,
                barStyle: { background: '#df8000' }
            })
        }
        setIsSubmitting(false)
    }

    const formGridStyle = {
        gridTemplateColumns: 'repeat(2, max-content) 70px max-content 100px 150px min-content',
        margin: '2rem 0'
    }

    const columns: Array<TableColumn> = [
        { label: 'Type', options: getSiteConfig(ConfigKey.InventoryObjectTypes) },
        { label: 'Building', options: getSiteConfig(ConfigKey.AvailableBuildings) },
        { label: 'Unit' },
        { label: 'Recipient' },
        { label: 'Location', options: getSiteConfig(ConfigKey.InventoryLocations) },
        { label: 'Note' },
        { label: '' },
    ]

    return <>
        {!dataFetchStatus.resDir &&
            <div className="flex-centre gap-1">
                <div className="spinner" ></div>
                Still loading resident data...
            </div>
        }
        <div className="grid gap-1" style={formGridStyle}>
            {columns.map((o, i) => <b key={i}>{o.label}</b>)}
            {form.map((r, i) => <FormRow key={i}
                columns={columns}
                row={i}
                data={r}
                residents={residents}
                updateHandler={(data) => formUpdateHandler(i, data)}
                removeTrigger={() => setRemoveRow(i)}
            />)}
            <datalist id={INVENTORY_LOCATIONS_DATALIST_ID}>
                {getSiteConfig(ConfigKey.InventoryLocations)?.map((l, i) => <option key={i} value={l.value}></option>)}
            </datalist>
        </div>
        {form.length >= 10 &&
            'We recommend submitting for every 10 entries to avoid accidental data loss'
        }
        <div className="flex-centre gap-1" style={{ pointerEvents: isSubmitting ? 'none' : null }}>
            <button onClick={() => setForm([...form, EMPTY_ROW])}>Add another entry</button>
            <button onClick={submitForm} disabled={!isFormComplete || isSubmitting}>
                {isSubmitting
                    ? <SpinnerMessage text="Submitting" />
                    : 'Submit'}
            </button>
        </div>
    </>
}

function FormRow(props: { columns: Array<TableColumn>, row: number, data: Array<any>, residents: {}, updateHandler: (data) => void, removeTrigger: () => void }) {
    function formUpdateHandler(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, col: number) {
        props.data[col] = e.target.value == '' ? null : e.target.value
        props.updateHandler([...props.data])
    }

    const getValue = (col: number) => props.data[col] || ''

    // If building and unit is filled for a row, update suggested names
    const [bld, unit] = [props.data[1], props.data[2]]
    const datalistOptions: Array<Array<string>> = bld && unit
        ? props.residents?.[bld]?.[unit]?.map(([name, id]) => name) ?? []
        : []

    const resNamesDatalistId = `ri-form-row${props.row}-names`

    const mapDropdownOptions = (v, i) => <option value={v.value} key={i} >{v.label || v.value}</option>
    return <React.Fragment key={props.row}>
        <select value={getValue(0)} onChange={(e) => formUpdateHandler(e, 0)}>
            {props.columns[0].options.map(mapDropdownOptions)}
        </select>
        <select value={getValue(1)} onChange={(e) => formUpdateHandler(e, 1)}>
            {props.columns[1].options.map(mapDropdownOptions)}
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
            {datalistOptions.map(o => <option value={o} />)}
        </datalist>
    </React.Fragment>
}