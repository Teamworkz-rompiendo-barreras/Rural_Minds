import React, { forwardRef } from 'react';

interface LocalSealProps {
    municipalityName: string;
    width?: number;
    height?: number;
    className?: string;
    id?: string;
}

const LocalSeal = forwardRef<SVGSVGElement, LocalSealProps>(({
    municipalityName,
    width = 300,
    height = 300,
    className = "",
    id = "local-seal-svg"
}, ref) => {
    // Neuro-friendly Blue P2: #374BA6 (base)
    // Matte/Soft Blue for Badge: #4C63B6 (slightly lighter/softer)
    // Sprout Green: #0F5C2E
    // Background: #F3F4F6 (N100/Off-white)

    // Dynamic text positioning based on length could be complex in SVG.
    // We'll use text-anchor middle.

    return (
        <svg
            ref={ref}
            id={id}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 400"
            width={width}
            height={height}
            className={`select-none ${className}`}
            role="img"
            aria-label={`Sello digital de Empresa Adherida a Rural Minds en el municipio de ${municipalityName}`}
        >
            <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
                </filter>
            </defs>

            {/* Background Circle */}
            <circle cx="200" cy="200" r="180" fill="#F9FAFB" stroke="#E5E7EB" strokeWidth="2" filter="url(#shadow)" />

            {/* Incomplete Ring - Symbolizing "Journey Started" */}
            {/* 300 degrees arc */}
            <path
                d="M 200, 40 A 160,160 0 1,1 110,366"
                fill="none"
                stroke="#374BA6"
                strokeWidth="12"
                strokeLinecap="round"
                opacity="0.9"
            />

            {/* Central Badge Content */}
            <g transform="translate(200, 180)">
                {/* Sprout Icon */}
                <path
                    d="M0,-50 C-20,-50 -40,-30 -40,0 C-40,40 0,60 0,80 C0,60 40,40 40,0 C40,-30 20,-50 0,-50 Z M-15,10 C-25,10 -30,0 -20,-20 M15,20 C25,20 30,5 20,-15"
                    fill="#0F5C2E"
                    opacity="0.9"
                />

                {/* Main Text */}
                <text
                    x="0"
                    y="110"
                    textAnchor="middle"
                    fontFamily="'Atkinson Hyperlegible', sans-serif"
                    fontSize="24"
                    fontWeight="bold"
                    fill="#374BA6"
                    letterSpacing="1"
                >
                    EMPRESA LOCAL
                </text>
            </g>

            {/* Bottom Curve Text for Municipality */}
            <path id="curve" d="M 60, 200 A 140,140 0 0,0 340,200" fill="none" />
            <text width="400">
                <textPath
                    href="#curve"
                    startOffset="50%"
                    textAnchor="middle"
                    fontFamily="'Atkinson Hyperlegible', sans-serif"
                    fontSize="26"
                    fontWeight="bold"
                    fill="#1F2937"
                >
                    {municipalityName.toUpperCase()}
                </textPath>
            </text>

            {/* Verification Metadata (Visible ID) */}
            <text
                x="200"
                y="360"
                textAnchor="middle"
                fontFamily="monospace"
                fontSize="10"
                fill="#9CA3AF"
            >
                VERIFIED • RURAL MINDS • {new Date().getFullYear()}
            </text>
        </svg>
    );
});

export default LocalSeal;
