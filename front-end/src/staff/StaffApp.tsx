import React, { useEffect, useState } from 'react';
import { DatabaseService } from '../common/api';
import { NavMenu } from '../NavMenu';
import { LocalStorageKey } from '../types';
import { ReceiveInventory } from './ReceiveItems';
import { ResidentCollection } from './ResidentCollection';
import { TokenIssuance } from './TokenIssuance';

export type NavOption = { id: string, label: string, element: JSX.Element }

export function StaffApp() {
    const NAV_OPTIONS: Array<NavOption> = [
        { id: 'collect', label: 'Item Collection', element: <ResidentCollection /> },
        { id: 'receive', label: 'Receive Items', element: <ReceiveInventory /> },
        { id: 'issue', label: 'Issue Code', element: <TokenIssuance /> },
    ]
    const [activeTab, setActiveTab] = useState(0)
    const [currentUI, setCurrentUI] = useState(NAV_OPTIONS[activeTab].element)

    useEffect(() => {
        DatabaseService.getAllResidents(localStorage.getItem(LocalStorageKey.JWT))
            .then(r => localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(r)))
    }, [])

    return <>
        <NavMenu options={NAV_OPTIONS}
            setter={id => setActiveTab(NAV_OPTIONS.findIndex(o => o.id == id))}
            active={activeTab}
        />
        {NAV_OPTIONS[activeTab].element}
    </>;
}


