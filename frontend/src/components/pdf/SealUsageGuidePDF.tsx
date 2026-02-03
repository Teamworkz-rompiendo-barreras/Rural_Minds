import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Register fonts if needed, or use standard fonts. 
// Ideally we would register 'Atkinson Hyperlegible' but for PDF generation simplicity we might stick to Helvetica or register it via CDN if possible in react-pdf.
// For now, using Helvetica (Standard).

const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#F3F4F6', // N100 equivalent
        padding: 40,
        fontFamily: 'Helvetica'
    },
    header: {
        marginBottom: 30,
        borderBottomWidth: 2,
        borderBottomColor: '#374BA6', // P2
        paddingBottom: 10
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374BA6',
        marginBottom: 8
    },
    subtitle: {
        fontSize: 14,
        color: '#4B5563',
        fontStyle: 'italic'
    },
    section: {
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#0F5C2E' // P1 Sprout
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8
    },
    text: {
        fontSize: 11,
        color: '#374151',
        lineHeight: 1.5,
        marginBottom: 5
    },
    highlight: {
        fontWeight: 'bold',
        color: '#0F5C2E'
    },
    codeBlock: {
        backgroundColor: '#1F2937',
        color: '#E5E7EB',
        padding: 10,
        borderRadius: 4,
        fontFamily: 'Courier',
        fontSize: 10,
        marginTop: 10
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 10,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingTop: 10
    }
});

interface SealUsageGuidePDFProps {
    municipalityName: string;
}

const SealUsageGuidePDF: React.FC<SealUsageGuidePDFProps> = ({ municipalityName }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Tu Sello de Innovación Local</Text>
                <Text style={styles.subtitle}>
                    "Haz que tu compromiso se vea, haz que tu talento se sienta" en {municipalityName}.
                </Text>
            </View>

            {/* Intro */}
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.text}>
                    Este sello es tu credencial de impacto. Úsalo para diferenciarte y atraer a profesionales que buscan un entorno que les respete.
                    A continuación, te mostramos cómo aplicarlo correctamente.
                </Text>
            </View>

            {/* 1. Digital Window */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. En tu ventana digital (Web y App)</Text>
                <Text style={styles.text}>
                    <Text style={{ fontWeight: 'bold' }}>• Footer:</Text> Coloca el sello junto a tus certificaciones.
                </Text>
                <Text style={styles.text}>
                    <Text style={{ fontWeight: 'bold' }}>• Sobre Nosotros:</Text> Acompáñalo de la frase: "Somos parte de Rural Minds: apostamos por el talento local y la inclusión neurodiversa".
                </Text>
                <Text style={styles.text}>
                    <Text style={{ fontWeight: 'bold' }}>• Empleo:</Text> Obligatorio. Aumenta la confianza del candidato neurodivergente.
                </Text>
            </View>

            {/* 2. Communication */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. En tu comunicación diaria</Text>
                <Text style={styles.text}>
                    • Añade la versión pequeña a tu <Text style={styles.highlight}>Firma de Email</Text>.
                </Text>
                <Text style={styles.text}>
                    • Úsalo en el encabezado de tus <Text style={styles.highlight}>Boletines (Newsletters)</Text>.
                </Text>
            </View>

            {/* 3. Physical World */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. En el mundo físico</Text>
                <Text style={styles.text}>
                    • Imprime el PNG de alta resolución para la <Text style={styles.highlight}>entrada de tu oficina</Text>.
                </Text>
                <Text style={styles.text}>
                    • Inclúyelo en carteles de búsqueda de personal.
                </Text>
            </View>

            {/* Accessibility Rule */}
            <View style={{ ...styles.section, borderLeftColor: '#F59E0B' }}>
                <Text style={styles.sectionTitle}>⚠️ Regla de Oro de Accesibilidad</Text>
                <Text style={styles.text}>
                    Siempre que uses el sello en digital, añade este Texto Alternativo (Alt-Text):
                </Text>
                <View style={styles.codeBlock}>
                    <Text>alt="Sello de Empresa Local Adherida a Rural Minds en {municipalityName}"</Text>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>Rural Minds - Guía de Uso Oficial | {new Date().getFullYear()}</Text>
                <Text>Ayuntamiento de {municipalityName}</Text>
            </View>
        </Page>
    </Document>
);

export default SealUsageGuidePDF;
