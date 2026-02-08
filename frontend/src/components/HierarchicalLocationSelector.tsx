import React, { useState, useEffect } from 'react';
import axios from '../config/api';

interface SimpleLocation {
    id: string;
    municipality: string;
    province: string;
    autonomous_community: string;
}

interface HierarchicalLocationSelectorProps {
    value?: string;
    onChange: (locationId: string, municipalityName?: string) => void;
    label?: string;
}

const HierarchicalLocationSelector: React.FC<HierarchicalLocationSelectorProps> = ({
    onChange,
    label = "Ubicación"
}) => {
    const [regions, setRegions] = useState<string[]>([]);
    const [provinces, setProvinces] = useState<string[]>([]);
    const [municipalities, setMunicipalities] = useState<SimpleLocation[]>([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedMuni, setSelectedMuni] = useState('');

    const [loading, setLoading] = useState(false);
    const [muniSearch, setMuniSearch] = useState('');

    // Fetch regions on mount
    useEffect(() => {
        const fetchRegions = async () => {
            try {
                const res = await axios.get('/locations/regions');
                setRegions(res.data);
            } catch (err) {
                console.error("Error fetching regions", err);
            }
        };
        fetchRegions();
    }, []);

    // Fetch provinces when region changes
    useEffect(() => {
        if (selectedRegion) {
            const fetchProvinces = async () => {
                try {
                    const res = await axios.get(`/locations/provinces?region=${encodeURIComponent(selectedRegion)}`);
                    setProvinces(res.data);
                    setSelectedProvince('');
                    setMunicipalities([]);
                    setSelectedMuni('');
                } catch (err) {
                    console.error("Error fetching provinces", err);
                }
            };
            fetchProvinces();
        } else {
            setProvinces([]);
        }
    }, [selectedRegion]);

    // Fetch municipalities when province changes or search changes
    useEffect(() => {
        if (selectedRegion && selectedProvince) {
            const fetchMunicipalities = async () => {
                setLoading(true);
                try {
                    const url = `/locations/municipalities?region=${encodeURIComponent(selectedRegion)}&province=${encodeURIComponent(selectedProvince)}${muniSearch ? `&q=${encodeURIComponent(muniSearch)}` : ''}`;
                    const res = await axios.get(url);
                    setMunicipalities(res.data);
                } catch (err) {
                    console.error("Error fetching municipalities", err);
                } finally {
                    setLoading(false);
                }
            };

            const timer = setTimeout(fetchMunicipalities, muniSearch ? 300 : 0);
            return () => clearTimeout(timer);
        }
    }, [selectedRegion, selectedProvince, muniSearch]);

    const handleMuniSelect = (muni: SimpleLocation) => {
        setSelectedMuni(muni.id);
        setMuniSearch(muni.municipality);
        onChange(muni.id, muni.municipality);
    };

    return (
        <div className="space-y-4">
            {label && <label className="block text-sm font-bold text-n900 mb-1">{label}</label>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Region Selection */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">1. Comunidad Autónoma</label>
                    <select
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-p2 outline-none appearance-none bg-white cursor-pointer"
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* Province Selection */}
                <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">2. Provincia</label>
                    <select
                        className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-p2 outline-none appearance-none bg-white cursor-pointer ${!selectedRegion ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!selectedRegion}
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                    >
                        <option value="">Seleccionar...</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            {/* Municipality Autocomplete */}
            <div className="relative">
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">3. Municipio / Pueblo</label>
                <input
                    type="text"
                    placeholder={selectedProvince ? "Escribe para buscar..." : "Selecciona provincia primero"}
                    disabled={!selectedProvince}
                    className={`w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl focus:border-p2 focus:border-solid outline-none transition-all ${!selectedProvince ? 'bg-gray-50 opacity-50' : 'bg-white'}`}
                    value={muniSearch}
                    onChange={(e) => {
                        setMuniSearch(e.target.value);
                        setSelectedMuni('');
                    }}
                />

                {loading && (
                    <div className="absolute right-4 bottom-4">
                        <div className="w-5 h-5 border-2 border-p2 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {selectedProvince && muniSearch.length > 0 && !selectedMuni && municipalities.length > 0 && (
                    <ul className="absolute z-50 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl mt-2 max-h-48 overflow-y-auto cursor-crosshair">
                        {municipalities.map(m => (
                            <li
                                key={m.id}
                                onClick={() => handleMuniSelect(m)}
                                className="p-4 hover:bg-p2/5 hover:text-p2 font-bold text-sm transition-colors border-b border-gray-50 last:border-0"
                            >
                                {m.municipality}
                            </li>
                        ))}
                    </ul>
                )}

                {selectedProvince && muniSearch.length > 2 && municipalities.length === 0 && !loading && (
                    <div className="absolute z-50 w-full bg-white border border-gray-100 shadow-2xl rounded-2xl mt-2 p-4 text-center text-gray-400 italic text-sm">
                        No encontrado. Prueba otra escritura.
                    </div>
                )}
            </div>

            {/* Privacy Note */}
            <p className="text-[10px] text-gray-400 italic leading-snug">
                🔒 Tu ubicación exacta solo se compartirá con la empresa tras un match mutuo. El sistema la usa ahora para priorizar ofertas locales.
            </p>
        </div>
    );
};

export default HierarchicalLocationSelector;
