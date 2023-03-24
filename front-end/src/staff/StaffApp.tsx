import React, { CSSProperties, useEffect, useState } from 'react';
import { getAuthInfo } from '../common/getAuthState';
import { ResidentCollection } from './ResidentCollection';
import { TokenIssuance } from './TokenIssuance';

type NavOption = { id: string, label: string, element: JSX.Element }

export function StaffApp() {
    const NAV_OPTIONS: Array<NavOption> = [
        { id: 'collect', label: 'Item Collection', element: <ResidentCollection /> },
        { id: 'issue', label: 'Issue Code', element: <TokenIssuance/> }
    ]
    const [activeTab, setActiveTab] = useState(0)
    const [currentUI, setCurrentUI] = useState(NAV_OPTIONS[activeTab].element)

    return <>

        <NavMenu options={NAV_OPTIONS}
            setter={id => setActiveTab(NAV_OPTIONS.findIndex(o => o.id == id))}
            active={activeTab}
        />
        {NAV_OPTIONS[activeTab].element}
    </>;
}

function NavMenu(props: { options: Array<NavOption>, active: number, setter: (id: string) => void }) {
    const shadow: CSSProperties = {
        boxShadow: '0 3px 3px #00000020'
    }
    return <div className='padding-1 flex-centre fill-vp-width' style={shadow}>
        <nav className='flex-centre gap-1' style={{ flexGrow: 1 }}>
            {props.options.map((o, i) =>
                <a key={o.id} onClick={() => props.setter(o.id)} className={props.active == i ? 'active' : null}>
                    {o.label}
                </a>)}
        </nav>
        <div>
            Logged in as {getAuthInfo().name}
        </div>
    </div >
}

