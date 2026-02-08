
import React from 'react';
import {
    Card, CardContent, Typography, Box, Chip, Stack, Button
} from '@mui/material';
import {
    LocationOn, Wifi, Speed, Favorite, FavoriteBorder,
    Park, Waves, Terrain, HomeWork
} from '@mui/icons-material';

interface OpportunityCardProps {
    challenge: any;
    onApply: (id: string) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ challenge, onApply }) => {
    const [isFavorite, setIsFavorite] = React.useState(false);

    // Environment icon logic
    const getEnvIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'montaña': return <Terrain sx={{ color: '#4A5568' }} />;
            case 'costa': return <Waves sx={{ color: '#3182CE' }} />;
            case 'valle': return <Park sx={{ color: '#38A169' }} />;
            default: return <HomeWork sx={{ color: '#718096' }} />;
        }
    };

    return (
        <Card sx={{
            borderRadius: 4,
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            border: 'none',
            overflow: 'hidden',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.08)'
            }
        }}>
            {/* Header Image placeholder */}
            <Box sx={{
                height: 180,
                bgcolor: '#EDF2F7',
                position: 'relative',
                backgroundImage: `url(${challenge.tenant?.branding_logo_url || 'https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=800'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
                <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: 'white',
                    borderRadius: '50%',
                    p: 0.5,
                    cursor: 'pointer'
                }} onClick={() => setIsFavorite(!isFavorite)}>
                    {isFavorite ? <Favorite color="error" /> : <FavoriteBorder color="action" />}
                </Box>

                {challenge.match_score && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: -20,
                        left: 24,
                        bgcolor: '#0F5C2E',
                        color: 'white',
                        px: 2,
                        py: 0.5,
                        borderRadius: 2,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}>
                        {challenge.match_score}% Match Sensorial
                    </Box>
                )}
            </Box>

            <CardContent sx={{ pt: 4, px: 3 }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#2D3748', lineHeight: 1.2 }}>
                            {challenge.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                {challenge.tenant?.name}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">•</Typography>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <LocationOn sx={{ fontSize: 14, color: '#A0AEC0' }} />
                                <Typography variant="caption" color="primary" fontWeight="bold">
                                    {challenge.distance_label || "Ubicación ideal"}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: 40
                    }}>
                        {challenge.description || "Oportunidad perfecta para desarrollar tu talento en un entorno de paz y bienestar."}
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        <Chip
                            icon={getEnvIcon(challenge.environment_type || 'interior')}
                            label={challenge.environment_type || 'Interior'}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 1.5, px: 0.5 }}
                        />
                        {challenge.has_fiber_600 && (
                            <Chip
                                icon={<Wifi sx={{ fontSize: 16 }} />}
                                label="Fibra 600"
                                size="small"
                                sx={{ borderRadius: 1.5, bgcolor: '#EBF8FF', color: '#2B6CB0', border: 'none' }}
                            />
                        )}
                        <Chip
                            label={`Estímulo ${challenge.stimulus_level || 'Bajo'}`}
                            size="small"
                            sx={{ borderRadius: 1.5, bgcolor: '#F0FFF4', color: '#2F855A', border: 'none' }}
                        />
                    </Stack>

                    <Box sx={{ pt: 1 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => onApply(challenge.id)}
                            sx={{
                                bgcolor: '#0F5C2E',
                                py: 1.2,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                '&:hover': { bgcolor: '#083D1F' }
                            }}
                        >
                            Ver Detalles
                        </Button>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default OpportunityCard;
