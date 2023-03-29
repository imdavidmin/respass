import React, { ComponentProps, createContext, CSSProperties, HTMLAttributes, useState } from 'react';

export const ToastContext = createContext((t: ToastCardProps) => { })

type ToastInfo = Omit<ToastCardProps, 'dismissTrigger'>

export function ToastWrapper(props: HTMLAttributes<HTMLDivElement> & { offset?: string, children?: JSX.Element | JSX.Element[] }) {
    const [toasts, setToasts] = useState<Array<ToastInfo>>([]);
    const containerOffset = props.offset ?? '1rem'

    const addToast = (toast: ToastInfo) => { setToasts([...toasts, toast]); };
    const dismissToast = (i) => { toasts.splice(i, 1); setToasts([...toasts]); };

    const toastWrapperStyle: CSSProperties = {
        position: 'absolute',
        bottom: containerOffset,
        right: containerOffset,
    };

    return <ToastContext.Provider value={addToast}>
        <div {...props}>
            {props.children}
            <div className='grid' style={toastWrapperStyle}>
                {toasts.map((t, i) => <ToastCard
                    dismissTrigger={() => dismissToast(i)}
                    message={t.message}
                    title={t.title}
                    style={t.style}
                    barStyle={t.barStyle}
                />)}
            </div>
        </div>
    </ToastContext.Provider>;
}

type ToastCardProps = {
    message: JSX.Element | string;
    dismissTrigger: () => void;
    title?: string;
    style?: CSSProperties;
    barStyle?: CSSProperties;
};

function ToastCard(props: ToastCardProps) {
    const padding = '0.5rem';
    const barStyle: CSSProperties = {
        background: 'var(--theme-primary)',
        padding: padding,
        color: 'var(--theme-primary-text)',
        ...props.barStyle
    };
    const toastStyle: CSSProperties = {
        background: '#ffffffaa',
        backdropFilter: 'blur(10px)',
        borderRadius: '5px',
        minWidth: '200px',
        overflow: 'hidden',
        position: 'relative'
    };
    const btnSize = '1.25rem';

    const closeBtnStyle: CSSProperties = {
        color: 'red',
        background: '#fff',
        borderRadius: '100%',
        height: btnSize,
        width: btnSize,
        border: 0,
        position: 'absolute',
        top: padding,
        right: padding,
        fontSize: '1.5rem',
        cursor: 'pointer'
    };
    return <div className='grid' style={{ ...toastStyle, ...props.style }}>
        <button className='special flex-centre' style={closeBtnStyle} onClick={props.dismissTrigger}>×</button>
        {props.title && <div style={barStyle}>
            {props.title}
        </div>}
        <span style={{ margin: `1rem ${padding}` }}>
            {props.message}
        </span>
    </div>;
}
