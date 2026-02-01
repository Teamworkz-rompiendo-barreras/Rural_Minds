import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
    highContrast: boolean;
    toggleHighContrast: () => void;
    fontSize: number;
    increaseFontSize: () => void;
    decreaseFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [highContrast, setHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState(16);

    const toggleHighContrast = () => {
        setHighContrast(prev => !prev);
    };

    const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
    const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

    useEffect(() => {
        // Apply global classes or styles based on highContrast
        if (highContrast) {
            document.body.classList.add('high-contrast');
            document.body.style.backgroundColor = '#000000';
            document.body.style.color = '#FFFFFF';
        } else {
            document.body.classList.remove('high-contrast');
            document.body.style.backgroundColor = '';
            document.body.style.color = '';
        }
    }, [highContrast]);

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}px`;
    }, [fontSize]);

    return (
        <ThemeContext.Provider value={{ highContrast, toggleHighContrast, fontSize, increaseFontSize, decreaseFontSize }}>
            {children}
        </ThemeContext.Provider>
    );
};
