import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { DatabaseService, JWTService, KVService } from '../common/api';
import { ErrorBoundary } from '../common/Components/ErrorBoundary';
import { NavMenu } from '../NavMenu';
import { FailureToast, ToastContext } from '../ToastWrapper';
import { LocalStorageKey } from '../types';
import { ReceiveInventory } from './ReceiveItems';
import { ResidentCollection } from './ItemCollection';
import { ResidentManagement } from './ResidentManagement/';


export type NavOption = { id: string, label: string, element: JSX.Element }
const DEFAULT_DATA_LOADING_STATUS = { resDir: false, siteConfig: false }
export const StaffAppContext = createContext(null as typeof DEFAULT_DATA_LOADING_STATUS)

const failToast = (e: Error, type: string) => FailureToast(
    <div className='grid gap-1'>
        Unable to fetch ${type} data.
        {e.name &&
            <span style={{ opacity: 0.8, fontSize: '0.8rem' }}>
                {`${e.name}: ${e.message}`}
            </span>
        }
    </div>
)

export function StaffApp() {
    const NAV_OPTIONS: Array<NavOption> = [
        { id: 'collect', label: 'Item Collection', element: <ResidentCollection /> },
        { id: 'receive', label: 'Receive Items', element: <ReceiveInventory /> },
        { id: 'issue', label: 'Resident Management', element: <ResidentManagement /> },
    ]
    const [activeTab, setActiveTab] = useState(0)
    const [dataFetch, setDataFetch] = useState({ ...DEFAULT_DATA_LOADING_STATUS })
    const addToast = useContext(ToastContext)

    useEffect(() => {
        DatabaseService.getAllResidents(localStorage.getItem(LocalStorageKey.JWT))
            .then(r => localStorage.setItem(LocalStorageKey.ResidentDirectory, JSON.stringify(r)))
            .catch((r: Error) => addToast(failToast(r, 'resident')))
            .finally(() => setDataFetch(dataFetch => { return { ...dataFetch, resDir: true } }))
        KVService.getSiteConfig()
            .then(config => localStorage.setItem(LocalStorageKey.SiteConfig, JSON.stringify(config)))
            .catch((r: Error) => addToast(failToast(r, 'site configuration')))
            .finally(() => setDataFetch(dataFetch => { return { ...dataFetch, siteConfig: true } }))
    }, [])

    return <StaffAppContext.Provider value={dataFetch}>
        <NavMenu options={NAV_OPTIONS}
            setter={id => setActiveTab(NAV_OPTIONS.findIndex(o => o.id == id))}
            active={activeTab}
        />
        <ErrorBoundary>
            {NAV_OPTIONS[activeTab].element}
        </ErrorBoundary>
    </StaffAppContext.Provider>
}