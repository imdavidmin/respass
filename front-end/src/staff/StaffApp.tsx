import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DatabaseService } from '../common/api';
import { NavMenu } from '../NavMenu';
import { FailureToast, ToastContext } from '../ToastWrapper';
import { LocalStorageKey } from '../types';
import { ReceiveInventory } from './ReceiveItems';
import { ResidentCollection } from './ResidentCollection';
import { ResidentManagement } from './ResidentManagement/';

export type NavOption = { id: string, label: string, element: JSX.Element }
export const StaffAppContext = createContext(null)

export function StaffApp() {
    const NAV_OPTIONS: Array<NavOption> = [
        { id: 'collect', label: 'Item Collection', element: <ResidentCollection /> },
        { id: 'receive', label: 'Receive Items', element: <ReceiveInventory /> },
        { id: 'issue', label: 'Resident Management', element: <ResidentManagement /> },
    ]
    const [activeTab, setActiveTab] = useState(0)
    const [dataFetch, setDataFetch] = useState({ resDir: false })
    const addToast = useContext(ToastContext)

    useEffect(() => {
        DatabaseService.getAllResidents(localStorage.getItem(LocalStorageKey.JWT))
            .then(r => localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(r)))
            .catch((r: Error) => addToast(
                FailureToast(<div className='grid gap-1'>
                    Unable to fetch resident data.
                    {r.name &&
                        <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>
                            {`${r.name}: ${r.message}`}
                        </span>
                    }
                </div>)))
            .finally(() => setDataFetch({ resDir: true }))
    }, [])

    return <StaffAppContext.Provider value={dataFetch}>
        <NavMenu options={NAV_OPTIONS}
            setter={id => setActiveTab(NAV_OPTIONS.findIndex(o => o.id == id))}
            active={activeTab}
        />
        {NAV_OPTIONS[activeTab].element}
    </StaffAppContext.Provider>

}