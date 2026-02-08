import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

interface ExcellenceSealBadgeProps {
    size?: number;
    showText?: boolean;
}

const ExcellenceSealBadge: React.FC<ExcellenceSealBadgeProps> = ({ size = 40, showText = false }) => {
    return (
        <Tooltip title="Empresa de Excelencia: Entorno Real Validado">
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                <Box
                    sx={{
                        width: size,
                        height: size,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #F2D680 0%, #D4AF37 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(212, 175, 55, 0.3)',
                        border: '2px solid #FFF',
                        cursor: 'help'
                    }}
                >
                    <span style={{ fontSize: size * 0.6 }}>🏅</span>
                </Box>
                {showText && (
                    <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 1 }}>
                        Sello de Excelencia
                    </Typography>
                )}
            </Box>
        </Tooltip>
    );
};

export default ExcellenceSealBadge;
