import React from 'react';
import bpbdLogo from '../../assets/Logo/bpbd-sulteng-logo.PNG';

export default function BpbdLogo({ size = 24, className = '', style = {} }) {
    return (
        <img 
            src={bpbdLogo} 
            alt="BPBD Sulteng Logo" 
            width={size} 
            height={size} 
            className={className}
            style={{ objectFit: 'contain', ...style }} 
        />
    );
}
