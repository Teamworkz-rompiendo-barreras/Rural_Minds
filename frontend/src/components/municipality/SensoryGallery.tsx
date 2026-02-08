
import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, Stack } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';

interface SensoryGalleryProps {
    images: string[];
}

const SensoryGallery: React.FC<SensoryGalleryProps> = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide]);

    if (!images || images.length === 0) return null;

    return (
        <Box sx={{ width: '100%', position: 'relative' }}>
            <Box sx={{
                height: 400,
                borderRadius: 4,
                overflow: 'hidden',
                position: 'relative',
                bgcolor: '#000'
            }}>
                <img
                    src={images[currentIndex]}
                    alt={`Imagen ${currentIndex + 1} del municipio`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                <IconButton
                    onClick={prevSlide}
                    sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' } }}
                >
                    <ArrowBackIos sx={{ ml: 1 }} />
                </IconButton>

                <IconButton
                    onClick={nextSlide}
                    sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(255,255,255,0.3)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.5)' } }}
                >
                    <ArrowForwardIos />
                </IconButton>
            </Box>

            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                {images.map((_, i) => (
                    <Box
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        sx={{
                            width: 10, height: 10, borderRadius: '50%',
                            bgcolor: i === currentIndex ? '#0F5C2E' : '#CBD5E1',
                            cursor: 'pointer'
                        }}
                    />
                ))}
            </Stack>
        </Box>
    );
};

export default SensoryGallery;
