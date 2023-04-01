import React, { CSSProperties, useContext, useState } from 'react';
import { AuthContext } from '.';
import { getAuthInfo } from './common/getAuthState';
import { NavOption } from './staff/StaffApp';

export function NavMenu(props: { options: Array<NavOption>; active: number; setter: (id: string) => void; }) {
    const [isLogoutHover, setIsLogoutHover] = useState(false)
    const logout = useContext(AuthContext)
    const shadow: CSSProperties = {
        boxShadow: '0 3px 3px #00000020'
    };
    return <div className='padding-1 flex-centre fill-vp-width' style={shadow}>
        <nav className='flex-centre gap-1' style={{ flexGrow: 1 }}>
            {props.options.map((o, i) =>
                <a key={o.id}
                    className={props.active == i ? 'active' : null}
                    onClick={() => props.setter(o.id)} >
                    {o.label}
                </a>)}
        </nav>
        <button className='special login-status'
            onMouseEnter={() => setIsLogoutHover(true)}
            onMouseLeave={() => setIsLogoutHover(false)}
            onClick={logout}
        >
            {isLogoutHover ? 'Logout' : <>👤 {getAuthInfo().name}</>}
        </button>
    </div>;
}
