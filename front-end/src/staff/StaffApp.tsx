import React, { useState } from 'react';
import { getAuthInfo, getAuthState } from '../common/getAuthState';
import { LocalStorageKey } from '../enums';
import { ResidentCollection } from './ResidentCollection';

export function StaffApp() {
    const NAV_OPTIONS = [
        { id: 'collect', label: 'Item Collection', element: <ResidentCollection /> }]
    const DEFAULT_SCREEN_ID = 'collect'

    const [currentUI, setCurrentUI] = useState(NAV_OPTIONS.find(e => e.id == DEFAULT_SCREEN_ID).element)
    return <>
        <div>
            Logged in as {getAuthInfo().name}
        </div>
        <NavMenu options={NAV_OPTIONS} />
        {currentUI}
    </>;
}

function NavMenu(props) {
    return <></>
}

