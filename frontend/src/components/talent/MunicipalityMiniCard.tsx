import React from 'react';
import { Card, CardContent, CardMedia, Typography, Chip, Stack, IconButton } from '@mui/material';
import { Favorite, LocationOn, Wifi, Thermostat } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface MunicipalityMiniCardProps {
    municipality: {
        id: string;
        municipality: string;
        province: string;
        gallery_urls?: string[];
        internet_speed?: string;
        average_climate?: string;
    };
    onRemove?: (id: string) => void;
}

const MunicipalityMiniCard: React.FC<MunicipalityMiniCardProps> = ({ municipality, onRemove }) => {
    const navigate = useNavigate();
    const poster = municipality.gallery_urls?.[0] || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=400';

    return (
        <Card
            sx={{
                borderRadius: 4,
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-5px)' },
                cursor: 'pointer',
                position: 'relative'
            }}
            onClick={() => navigate(`/municipality/${municipality.id}`)}
        >
            <CardMedia
                component="img"
                height="140"
                image={poster}
                alt={municipality.municipality}
            />
            <IconButton
                size="small"
                onClick={(e) => { e.stopPropagation(); onRemove?.(municipality.id); }}
                sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'white' } }}
            >
                <Favorite sx={{ color: '#E53E3E', fontSize: 18 }} />
            </IconButton>
            <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>{municipality.municipality}</Typography>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'text.secondary', mb: 1 }}>
                    <LocationOn sx={{ fontSize: 14 }} />
                    <Typography variant="caption">{municipality.province}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                    {municipality.internet_speed && (
                        <Chip icon={<Wifi sx={{ fontSize: 12 }} />} label={municipality.internet_speed} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    )}
                    {municipality.average_climate && (
                        <Chip icon={<Thermostat sx={{ fontSize: 12 }} />} label={municipality.average_climate} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default MunicipalityMiniCard;
