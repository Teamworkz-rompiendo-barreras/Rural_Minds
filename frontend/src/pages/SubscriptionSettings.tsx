import React, { useState, useEffect } from 'react';
import axios from '../config/api';
import { useAuth } from '../context/AuthContext';

const SubscriptionSettings: React.FC = () => {
    const { token } = useAuth();
    const [currentPlan, setCurrentPlan] = useState('starter');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (token) fetchDetails();
    }, [token]);

    const fetchDetails = async () => {
        try {
            const res = await axios.get('/org/settings');
            if (res.data && res.data.subscription_plan) {
                setCurrentPlan(res.data.subscription_plan);
            }
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handlePlanChange = async (plan: string) => {
        if (confirm(`¿Estás seguro de cambiar al plan ${plan}?`)) {
            setUpdating(true);
            try {
                await axios.patch('/org/settings', {
                    subscription_plan: plan
                });
                setCurrentPlan(plan);
                alert(`Cambiado exitosamente al plan ${plan}.`);
            } catch (err) {
                alert('Fallo al actualizar el plan');
            }
            setUpdating(false);
        }
    };

    const plans = [
        {
            id: 'starter',
            name: 'Starter',
            price: '0€/mes',
            features: ['5 Vacantes/mes', 'Búsqueda Básica', 'Soporte Estándar'],
            color: 'bg-green-100 border-green-300'
        },
        {
            id: 'growth',
            name: 'Growth',
            price: '299€/mes',
            features: ['Vacantes Ilimitadas', 'Matching IA Avanzado', 'Soporte Prioritario', 'Acceso a Soluciones'],
            color: 'bg-blue-100 border-blue-300'
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'A medida',
            features: ['Gerente de Éxito Dedicado', 'Integración SSO', 'Reportes Personalizados', 'Multi-tenant'],
            color: 'bg-purple-100 border-purple-300'
        }
    ];

    if (loading) return <div className="p-8">Cargando suscripción...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-primary">Gestión de Suscripción</h1>
                    <p className="text-gray-600">Gestiona tu facturación y capacidades del plan.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow border">
                    Plan Actual: <span className="font-bold text-primary uppercase">{currentPlan}</span>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`rounded-xl p-6 border-2 transition-all relative ${currentPlan === plan.id ? 'border-primary ring-4 ring-primary ring-opacity-20 shadow-xl scale-105 bg-white' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                    >
                        {currentPlan === plan.id && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                                Plan Activo
                            </div>
                        )}
                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                        <div className="text-3xl font-bold text-gray-800 mb-6">{plan.price}</div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                    <span className="text-green-500">✓</span> {feat}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handlePlanChange(plan.id)}
                            disabled={updating || currentPlan === plan.id}
                            className={`w-full py-3 rounded-lg font-bold transition-all ${currentPlan === plan.id
                                ? 'bg-gray-100 text-gray-400 cursor-default'
                                : 'bg-primary text-white hover:bg-opacity-90'
                                }`}
                        >
                            {currentPlan === plan.id ? 'Plan Actual' : updating ? 'Actualizando...' : `Cambiar a ${plan.name}`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SubscriptionSettings;
