import React, { useState, useEffect, useRef } from 'react';
import axios from '../config/api';

interface Location {
    id: string;
    label: string;
    municipality: string;
    province: string;
}

interface LocationSelectorProps {
    value?: string;
    onChange: (locationId: string, municipalityName?: string) => void;
    label?: string;
    placeholder?: string;
    error?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
    onChange,
    label = "Ubicación",
    placeholder = "Buscar municipio...",
    error
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Debounce timer
    const timeoutRef = useRef<any>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Initial fetch if value exists (to show label instead of ID)
    // For now, we skip this optimization or assume the parent passes the label if needed,
    // but typically we need an endpoint to get One location by ID.
    // Let's implement basic search first. 

    useEffect(() => {
        // Handle clicks outside to close
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = (text: string) => {
        setQuery(text);
        setIsOpen(true);

        if (text.length < 2) {
            setResults([]);
            return;
        }

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        setLoading(true);
        timeoutRef.current = setTimeout(async () => {
            try {
                const res = await axios.get(`/locations/search?q=${encodeURIComponent(text)}`);
                setResults(res.data);
            } catch (err) {
                console.error("Location search error", err);
            } finally {
                setLoading(false);
            }
        }, 500); // 500ms debounce
    };

    const handleSelect = (loc: Location) => {
        setQuery(loc.label);
        onChange(loc.id, loc.municipality);
        setIsOpen(false);
    };

    return (
        <div className="w-full relative" ref={wrapperRef}>
            {label && <label className="block text-sm font-bold text-n900 mb-1">{label}</label>}
            <div className="relative">
                <input
                    type="text"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-p2 outline-none transition-all ${error ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsOpen(true)}
                />

                {loading && (
                    <div className="absolute right-3 top-3">
                        <div className="w-5 h-5 border-2 border-p2 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

            {isOpen && results.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl rounded-lg mt-1 max-h-60 overflow-y-auto">
                    {results.map((loc) => (
                        <li
                            key={loc.id}
                            onClick={() => handleSelect(loc)}
                            className="p-3 hover:bg-gray-50 cursor-pointer text-n900 text-sm border-b border-gray-100 last:border-0"
                        >
                            <span className="font-bold">{loc.municipality}</span>
                            <span className="text-gray-500 ml-2 text-xs">({loc.province})</span>
                        </li>
                    ))}
                </ul>
            )}

            {isOpen && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute z-50 w-full bg-white border border-gray-100 shadow-xl rounded-lg mt-1 p-3 text-center text-gray-500 text-sm">
                    No se encontraron resultados
                </div>
            )}
        </div>
    );
};

export default LocationSelector;
