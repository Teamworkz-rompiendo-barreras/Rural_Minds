
import React from 'react';
import {
    Box, Typography, Paper, Slider, ToggleButtonGroup, ToggleButton,
    FormControlLabel, Checkbox, Stack, Tooltip, IconButton
} from '@mui/material';
import {
    InfoOutlined, Wifi, LocalHospital, Terrain, Waves, Park, HomeWork
} from '@mui/icons-material';

interface WellnessFiltersProps {
    filters: any;
    onFilterChange: (newFilters: any) => void;
}

const WellnessFilters: React.FC<WellnessFiltersProps> = ({ filters, onFilterChange }) => {

    const handleChange = (field: string, value: any) => {
        onFilterChange({ ...filters, [field]: value });
    };

    return (
        <Paper sx={{
            p: 4,
            borderRadius: 4,
            boxShadow: 'none',
            border: '1px solid #E2E8F0',
            bgcolor: '#F8FAFC'
        }}>
            <Stack spacing={4}>
                {/* 1. Stimulus Level */}
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#475569', display: 'flex', alignItems: 'center', gap: 1 }}>
                        Nivel de Estímulo <Tooltip title="Bajo: Pueblos muy tranquilos. Alto: Municipios con más actividad social."><InfoOutlined sx={{ fontSize: 16 }} /></Tooltip>
                    </Typography>
                    <ToggleButtonGroup
                        value={filters.stimulus_level}
                        exclusive
                        onChange={(_, val) => val && handleChange('stimulus_level', val)}
                        fullWidth
                        size="small"
                        sx={{
                            '& .MuiToggleButton-root': {
                                borderRadius: 2,
                                border: '1px solid #CBD5E1',
                                '&.Mui-selected': {
                                    bgcolor: '#0F5C2E',
                                    color: 'white',
                                    '&:hover': { bgcolor: '#083D1F' }
                                }
                            }
                        }}
                    >
                        <ToggleButton value="low">Bajo</ToggleButton>
                        <ToggleButton value="medium">Medio</ToggleButton>
                        <ToggleButton value="high">Alto</ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* 2. Environment Type */}
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#475569' }}>
                        Tipo de Entorno
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {[
                            { id: 'montaña', label: 'Montaña', icon: <Terrain /> },
                            { id: 'costa', label: 'Costa', icon: <Waves /> },
                            { id: 'valle', label: 'Valle', icon: <Park /> },
                            { id: 'interior', label: 'Interior', icon: <HomeWork /> }
                        ].map((env) => (
                            <Box
                                key={env.id}
                                onClick={() => handleChange('environment_type', filters.environment_type === env.id ? null : env.id)}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 3,
                                    border: '1px solid',
                                    borderColor: filters.environment_type === env.id ? '#0F5C2E' : '#E2E8F0',
                                    bgcolor: filters.environment_type === env.id ? '#F0FFF4' : 'white',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    flex: 1,
                                    minWidth: 80,
                                    transition: 'all 0.2s',
                                    '&:hover': { borderColor: '#0F5C2E' }
                                }}
                            >
                                <IconButton size="small" sx={{ color: filters.environment_type === env.id ? '#0F5C2E' : '#94A3B8' }}>
                                    {env.icon}
                                </IconButton>
                                <Typography variant="caption" display="block" fontWeight="bold" color={filters.environment_type === env.id ? '#0F5C2E' : '#64748B'}>
                                    {env.label}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* 3. Essential Services & Connectivity */}
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#475569' }}>
                        Infraestructura de Paz
                    </Typography>
                    <Stack spacing={1}>
                        <FormControlLabel
                            control={<Checkbox checked={filters.min_connectivity} onChange={(e) => handleChange('min_connectivity', e.target.checked)} sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#0F5C2E' } }} />}
                            label={<Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Fibra Óptica &gt; 600Mb <Wifi sx={{ fontSize: 16, color: '#3182CE' }} /></Typography>}
                        />
                        <FormControlLabel
                            control={<Checkbox checked={filters.has_services} onChange={(e) => handleChange('has_services', e.target.checked)} sx={{ color: '#94A3B8', '&.Mui-checked': { color: '#0F5C2E' } }} />}
                            label={<Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Servicios a &lt; 15 min <LocalHospital sx={{ fontSize: 16, color: '#E53E3E' }} /></Typography>}
                        />
                    </Stack>
                </Box>

                {/* 4. Affinity Slider */}
                <Box>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 4, color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                        Afinidad Sensorial Mínima
                        <span style={{ color: '#0F5C2E' }}>{filters.min_match_score}%</span>
                    </Typography>
                    <Slider
                        value={filters.min_match_score}
                        onChange={(_, val) => handleChange('min_match_score', val)}
                        valueLabelDisplay="auto"
                        sx={{
                            color: '#0F5C2E',
                            '& .MuiSlider-thumb': {
                                width: 20,
                                height: 20,
                                border: '4px solid white',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }
                        }}
                    />
                </Box>
            </Stack>
        </Paper>
    );
};

export default WellnessFilters;
