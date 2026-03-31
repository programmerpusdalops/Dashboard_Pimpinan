import React from 'react';

export default function BpbdLogo({ size = 24, className = '', style = {} }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={style}
        >
            {/* Lingkaran Biru Gelap (Khas BPBD/BNPB) */}
            <circle cx="50" cy="50" r="48" fill="#1e3a8a" />
            
            {/* Segitiga Oranye (Ketahanan/Penanggulangan) */}
            <path d="M50 18 L16 76 H84 Z" fill="#ea580c" />
            
            {/* Garis putih tipis (Styling opsional agar ikon lebih tegas) */}
            <path d="M50 26 L24 71 H76 Z" fill="#ffffff" />
            <path d="M50 32 L31 66 H69 Z" fill="#ea580c" />
        </svg>
    );
}
