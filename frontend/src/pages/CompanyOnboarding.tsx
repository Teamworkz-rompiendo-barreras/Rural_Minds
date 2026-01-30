import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CompanyOnboarding: React.FC = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        size: '',
        logo_url: '',
        primary_color: '#0F5C2E'
    });

    useEffect(() => {
        if (token) fetchDetails();
    }, [token]);

    const fetchDetails = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/org/settings');
            if (res.data) {
                setFormData({
                    name: res.data.name || '',
                    industry: res.data.industry || '',
                    size: res.data.size || '',
                    logo_url: res.data.branding_logo_url || '',
                    primary_color: res.data.primary_color_override || '#0F5C2E'
                });
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
            // If 404/Fail, maybe they are super new or something unique.
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Map form data to API schema
            const payload = {
                name: formData.name,
                industry: formData.industry,
                size: formData.size,
                branding_logo_url: formData.logo_url,
                primary_color_override: formData.primary_color
            };
            await axios.patch('http://127.0.0.1:8000/org/settings', payload);
            // Redirect to dashboard or show success
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to save", err);
            alert("Failed to save details");
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading company details...</div>;

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
            <h1 className="text-3xl font-heading font-bold text-primary mb-2">Company Profile</h1>
            <p className="text-gray-600 mb-8">Set up your organization's identity for the RuralMinds platform.</p>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Industry</label>
                        <input
                            type="text"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            placeholder="e.g. Technology, Agriculture"
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Company Size</label>
                    <select
                        name="size"
                        value={formData.size}
                        onChange={handleChange}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="">Select Size</option>
                        <option value="1-10">1-10 Employees</option>
                        <option value="11-50">11-50 Employees</option>
                        <option value="51-200">51-200 Employees</option>
                        <option value="200+">200+ Employees</option>
                    </select>
                </div>

                {/* Branding */}
                <div className="border-t border-gray-200 pt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Branding</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Logo URL</label>
                            <input
                                type="url"
                                name="logo_url"
                                value={formData.logo_url}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Brand Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    name="primary_color"
                                    value={formData.primary_color}
                                    onChange={handleChange}
                                    className="h-12 w-24 p-1 rounded cursor-pointer border"
                                />
                                <span className="uppercase font-mono text-gray-500">{formData.primary_color}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save & Continue'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CompanyOnboarding;
