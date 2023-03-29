import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DatabaseService } from '../common/api';
import { NavMenu } from '../NavMenu';
import { ToastContext } from '../ToastWrapper';
import { LocalStorageKey } from '../types';
import { ReceiveInventory } from './ReceiveItems';
import { ResidentCollection } from './ResidentCollection';
import { TokenIssuance } from './TokenIssuance';

export type NavOption = { id: string, label: string, element: JSX.Element }
export const StaffAppContext = createContext(null)

export function StaffApp() {
    const NAV_OPTIONS: Array<NavOption> = [
        { id: 'collect', label: 'Item Collection', element: <ResidentCollection /> },
        { id: 'receive', label: 'Receive Items', element: <ReceiveInventory /> },
        { id: 'issue', label: 'Issue Code', element: <TokenIssuance /> },
    ]
    const [activeTab, setActiveTab] = useState(0)
    const isFirstLoad = useRef(true)
    const [dataFetchStatus, setDataFetchStatus] = useState({ resDir: false })
    const addToast = useContext(ToastContext)


    useEffect(() => {
        DatabaseService.getAllResidents(localStorage.getItem(LocalStorageKey.JWT))
            .then(r => localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(r)))
            .catch((r: Error) => addToast({
                title: `🤖 *blip boop*`,
                message: <div className='grid gap-1'>
                    Unable to fetch resident data.
                    {r.name &&
                        <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>
                            {`${r.name}: ${r.message}`}
                        </span>
                    }
                </div>,
                barStyle: { background: '#df8000' }
            }))
            .finally(() => setDataFetchStatus({ resDir: true }))
    }, [])

    return <StaffAppContext.Provider value={dataFetchStatus}>
        <NavMenu options={NAV_OPTIONS}
            setter={id => setActiveTab(NAV_OPTIONS.findIndex(o => o.id == id))}
            active={activeTab}
        />
        {NAV_OPTIONS[activeTab].element}
    </StaffAppContext.Provider>

}