import React from 'react';
import { Box, Stepper, Step, StepLabel, Typography, StepConnector, stepConnectorClasses, styled } from '@mui/material';
import {
    Send, FactCheck, Chat,
    Construction, HomeWork
} from '@mui/icons-material';

const ColorlibConnector = styled(StepConnector)(() => ({
    [`&.${stepConnectorClasses.alternativeLabel}`]: {
        top: 22,
    },
    [`&.${stepConnectorClasses.active}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: 'linear-gradient( 95deg, #0F5C2E 0%, #38A169 50%, #BEE3F8 100%)',
        },
    },
    [`&.${stepConnectorClasses.completed}`]: {
        [`& .${stepConnectorClasses.line}`]: {
            backgroundImage: 'linear-gradient( 95deg, #0F5C2E 0%, #38A169 100%)',
        },
    },
    [`& .${stepConnectorClasses.line}`]: {
        height: 3,
        border: 0,
        backgroundColor: '#E2E8F0',
        borderRadius: 1,
    },
}));

const ColorlibStepIconRoot = styled(Box)<{
    active?: boolean;
    completed?: boolean;
}>(({ active, completed }) => ({
    backgroundColor: '#E2E8F0',
    zIndex: 1,
    color: '#718096',
    width: 44,
    height: 44,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(active && {
        backgroundImage: 'linear-gradient( 136deg, #0F5C2E 0%, #38A169 100%)',
        color: 'white',
        boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
    }),
    ...(completed && {
        backgroundImage: 'linear-gradient( 136deg, #0F5C2E 0%, #38A169 100%)',
        color: 'white',
    }),
}));

function ColorlibStepIcon(props: any) {
    const { active, completed, className, icon } = props;
    const icons: { [index: string]: React.ReactElement } = {
        1: <Send fontSize="small" />,
        2: <FactCheck fontSize="small" />,
        3: <Chat fontSize="small" />,
        4: <Construction fontSize="small" />,
        5: <HomeWork fontSize="small" />,
    };
    return (
        <ColorlibStepIconRoot active={active} completed={completed} className={className}>
            {icons[String(icon)]}
        </ColorlibStepIconRoot>
    );
}

interface ProcessTimelineProps {
    status: string;
}

const mapStatusToStep = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return 0;
        case 'accepted': return 1;
        case 'conversación municipal': return 2;
        case 'entrevista técnica pendiente': return 2;
        case 'adecuación sensorial en proceso': return 3;
        case 'hired': return 4;
        case 'mudanza': return 4;
        default: return 0;
    }
};

const steps = [
    'Enviada',
    'En Revisión',
    'Conversación',
    'Ajustes',
    '¡Firma!'
];

const ProcessTimeline: React.FC<ProcessTimelineProps> = ({ status }) => {
    const activeStep = mapStatusToStep(status);

    return (
        <Box sx={{ width: '100%', py: 2 }}>
            <Stepper
                alternativeLabel
                activeStep={activeStep}
                connector={<ColorlibConnector />}
            >
                {steps.map((label, index) => (
                    <Step key={label}>
                        <StepLabel
                            StepIconComponent={ColorlibStepIcon}
                        >
                            <Typography
                                variant="caption"
                                fontWeight={activeStep === index ? "bold" : "medium"}
                                sx={{ color: activeStep === index ? '#0F5C2E' : '#A0AEC0' }}
                            >
                                {label}
                            </Typography>
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>
        </Box>
    );
};

export default ProcessTimeline;
