import React, { useState } from 'react';

interface HeatmapData {
    id: string; // ISO Code e.g. ES-M
    name: string;
    value: number;
    activity: 'high' | 'medium' | 'low';
}

interface SpainHeatmapProps {
    data: HeatmapData[];
}

const SpainHeatmap: React.FC<SpainHeatmapProps> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

    const getColor = (id: string) => {
        const item = data.find(d => d.id === id);
        if (!item) return '#E5E7EB'; // Default gray
        if (item.activity === 'high') return '#0F5C2E'; // P1
        if (item.activity === 'medium') return '#374BA6'; // P2
        return '#9CA3AF'; // Low
    };

    const handleMouseEnter = (e: React.MouseEvent, id: string, name: string) => {
        const item = data.find(d => d.id === id);
        const value = item ? item.value : 0;
        setTooltip({
            x: e.clientX,
            y: e.clientY,
            text: `${name}: ${value} Actividad`
        });
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    return (
        <div className="relative w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
            {/* 
                Simplified SVG for Spain. 
                In a real production app, we would use a library like react-simple-maps or D3.
                For this prototype, we use a conceptual SVG representation with key regions (not accurate geography but functional for UI).
             */}
            <svg viewBox="0 0 800 600" className="w-full h-full">
                {/* Madrid */}
                <path
                    d="M380,280 L420,280 L420,320 L380,320 Z"
                    fill={getColor('ES-M')}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-all cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, 'ES-M', 'Madrid')}
                    onMouseLeave={handleMouseLeave}
                />

                {/* Castilla y Leon (Surrounding Madrid top/left) */}
                <path
                    d="M300,150 L450,150 L450,280 L300,280 Z"
                    fill={getColor('ES-CL')}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-all cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, 'ES-CL', 'Castilla y León')}
                    onMouseLeave={handleMouseLeave}
                />

                {/* Cataluña */}
                <path
                    d="M600,150 L750,180 L720,280 L580,250 Z"
                    fill={getColor('ES-B')}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-all cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, 'ES-B', 'Cataluña')}
                    onMouseLeave={handleMouseLeave}
                />

                {/* Andalucia */}
                <path
                    d="M250,450 L650,450 L620,550 L280,550 Z"
                    fill={getColor('ES-AN')}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-all cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, 'ES-AN', 'Andalucía')}
                    onMouseLeave={handleMouseLeave}
                />

                {/* Norte (Cantabria/Asturias) */}
                <path
                    d="M300,100 L500,100 L500,150 L300,150 Z"
                    fill={getColor('ES-CB')}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-all cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, 'ES-CB', 'Norte (Asturias/Cantabria)')}
                    onMouseLeave={handleMouseLeave}
                />

                {/* Extremadura */}
                <path
                    d="M250,280 L300,280 L300,450 L250,450 Z"
                    fill={getColor('ES-EX')}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:opacity-80 transition-all cursor-pointer"
                    onMouseEnter={(e) => handleMouseEnter(e, 'ES-EX', 'Extremadura')}
                    onMouseLeave={handleMouseLeave}
                />
            </svg>

            {/* Legend */}
            <div className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-lg shadow-sm text-xs border border-gray-200">
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-[#0F5C2E] rounded-full"></span> Alta Actividad</div>
                <div className="flex items-center gap-2 mb-1"><span className="w-3 h-3 bg-[#374BA6] rounded-full"></span> Actividad Media</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#9CA3AF] rounded-full"></span> Baja / Nula</div>
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div
                    className="fixed bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none z-50 whitespace-nowrap"
                    style={{ left: tooltip.x + 10, top: tooltip.y - 10 }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
};

export default SpainHeatmap;
