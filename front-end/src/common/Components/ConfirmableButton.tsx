import React, { ButtonHTMLAttributes, CSSProperties, useRef, useState } from 'react';

export function ConfirmableButton(props: { onConfirm: () => void } & ButtonHTMLAttributes<HTMLButtonElement>) {
    const [confirming, setConfirming] = useState(false);
    const timer = useRef(null);
    const handleClick = () => {
        if (confirming) {
            props.onConfirm();
            timer.current && clearTimeout(timer.current);
        } else {
            timer.current = setTimeout(() => setConfirming(false), 3000);
        }
        setConfirming(!confirming);
    };
    const bannerStyle: CSSProperties = {
        background: '#666',
        outline: '1px solid #ccc',
        borderRadius: '1rem',
        padding: '0.5rem',
        position: 'absolute',
        top: '-2.5rem',
        left: '-0.5rem'
    };
    const confirmBanner = <div style={bannerStyle}>Confirm?</div>;

    const btnProps = {...props}
    delete btnProps['onConfirm']

    return <button {...btnProps} onClick={handleClick} style={{ ...props.style, position: 'relative' }}>
        {confirming && confirmBanner}
        {props.children}
    </button>;
}
