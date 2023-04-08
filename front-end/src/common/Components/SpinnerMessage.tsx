import React, { CSSProperties } from 'react';

export function SpinnerMessage(props: { text: string; size?: string; style?: CSSProperties; }) {
    const size = props.size || '1.25rem';
    return <div className='flex-centre gap-1' style={props.style}>
        <div className='spinner' style={{ height: size, width: size }}></div>
        {props.text}
    </div>;
}
