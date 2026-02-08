import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';
import axios from '../config/api';

interface Organization {
    id: string;
    name: string;
    org_type?: string;
    municipality_id?: string;
    location_id?: string;
    sensory_commitment?: any;
    street_address?: string;
    postal_code?: string;
    location?: {
        municipality: string;
        province: string;
        autonomous_community?: string;
    };
    has_excellence_seal?: boolean;
}

interface User {
    id: string;
    email: string;
    role: string;
    full_name?: string;
    organization_id?: string;
    organization?: Organization;
    status?: string;
    talent_profile?: {
        residence_location_id?: string;
        is_willing_to_move?: boolean;
        target_locations?: string[];
        bio?: string;
        skills?: string[];
        residence_location?: {
            municipality: string;
            province: string;
            autonomous_community?: string;
        };
    };
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));

    useEffect(() => {
        // If token exists, set default header and fetch user
        if (token) {
            // Type assertion for custom property if needed, or just rely on interceptor
            // axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            sessionStorage.setItem('token', token);
            fetchUser();
        } else {
            // delete axios.defaults.headers.common['Authorization'];
            sessionStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            // API call to get current user details
            const response = await axios.get('/auth/me');
            setUser(response.data);
        } catch (error: any) {
            console.error('Failed to fetch user', error);
            // If 401 or 404, clear token to avoid zombie state
            if (error.response && (error.response.status === 401 || error.response.status === 404)) {
                logout();
            }
        }
    };

    const login = (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
