import React, { useEffect } from 'react';
import { FieldLabel } from '../../staff/ResidentManagement/TokenIssuance';
import { getSiteConfig, ConfigKey } from '../util';

export function BuildingAndUnitInput(props: { form: Array<string>; setForm: (f: Array<string>) => void; locked?: boolean }) {
    const buildingData = getSiteConfig(ConfigKey.AvailableBuildings);
    const updateForm = (row, e) => {
        props.form[row] = e.target.value == '' ? null : e.target.value;
        props.setForm([...props.form]);
    };

    // If form has no selected buildings, set default building as selected
    useEffect(() => {
        !props.form[0] &&
            props.setForm([buildingData?.[0]?.value, props.form[1]]);
    }, [])

    return <>
        <label>{FieldLabel.Building}</label>
        <select disabled={props.locked} value={props.form[0] ?? ''} onChange={(e) => updateForm(0, e)}>
            {buildingData?.map((b, i) =>
                <option value={b.value} key={i}>{b.label ?? b.value}</option>
            )}
        </select>
        <label>{FieldLabel.Unit}</label>
        <input disabled={props.locked} type='text' value={props.form[1] ?? ''} onChange={(e) => updateForm(1, e)}></input>
    </>;
}
