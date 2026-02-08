
import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack, Skeleton } from '@mui/material';
import {
    WbSunny, WaterDrop, Air
} from '@mui/icons-material';

interface WeatherWidgetProps {
    municipality: string;
    lat?: number;
    lon?: number;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ municipality, lat, lon }) => {
    const [loading, setLoading] = useState(true);
    const [weather, setWeather] = useState<any>(null);

    useEffect(() => {
        // In a real app, you would use lat/lon with OpenWeather API
        // For this implementation, we simulate a realistic response to show the UI
        const mockFetch = () => {
            setTimeout(() => {
                setWeather({
                    temp: 18,
                    condition: 'Soleado',
                    humidity: 45,
                    wind: 12,
                    icon: <WbSunny sx={{ color: '#F6AD55', fontSize: 40 }} />
                });
                setLoading(false);
            }, 1000);
        };

        mockFetch();
    }, [lat, lon]);

    if (loading) return <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 4 }} />;

    return (
        <Box sx={{
            p: 3,
            borderRadius: 4,
            bgcolor: 'white',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <Stack direction="row" spacing={3} alignItems="center">
                {weather.icon}
                <Box>
                    <Typography variant="h4" fontWeight="bold" color="#2D3748">
                        {weather.temp}°C
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {weather.condition} en {municipality}
                    </Typography>
                </Box>
            </Stack>

            <Stack direction="row" spacing={4}>
                <Stack alignItems="center">
                    <WaterDrop sx={{ color: '#3182CE', fontSize: 18, mb: 0.5 }} />
                    <Typography variant="caption" fontWeight="bold">{weather.humidity}%</Typography>
                    <Typography variant="caption" color="text.disabled">Humedad</Typography>
                </Stack>
                <Stack alignItems="center">
                    <Air sx={{ color: '#4A5568', fontSize: 18, mb: 0.5 }} />
                    <Typography variant="caption" fontWeight="bold">{weather.wind} km/h</Typography>
                    <Typography variant="caption" color="text.disabled">Viento</Typography>
                </Stack>
            </Stack>
        </Box>
    );
};

export default WeatherWidget;
