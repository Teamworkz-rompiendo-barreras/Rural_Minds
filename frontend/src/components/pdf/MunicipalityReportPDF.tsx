import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register fonts if needed, or use defaults
// For now, using standard Serif/Sans

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 2,
        borderBottomColor: '#0F5C2E',
        paddingBottom: 20,
        marginBottom: 30,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    logo: {
        width: 80,
        height: 40,
        objectFit: 'contain',
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F5C2E',
        textAlign: 'right',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 10,
        textTransform: 'uppercase',
        borderBottom: 1,
        borderBottomColor: '#eeeeee',
        paddingBottom: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 15,
        marginBottom: 20,
    },
    kpiCard: {
        width: '30%',
        padding: 15,
        backgroundColor: '#f9fafb',
        borderRadius: 8,
        border: 1,
        borderColor: '#e5e7eb',
    },
    kpiValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F5C2E',
        marginBottom: 5,
    },
    kpiLabel: {
        fontSize: 8,
        color: '#6b7280',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    prideSection: {
        backgroundColor: '#0F5C2E',
        padding: 20,
        borderRadius: 12,
        color: 'white',
        marginBottom: 30,
    },
    prideTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    prideGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    prideItem: {
        width: '30%',
    },
    prideValue: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    prideLabel: {
        fontSize: 7,
        opacity: 0.8,
        textTransform: 'uppercase',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#9ca3af',
        borderTop: 1,
        borderTopColor: '#eeeeee',
        paddingTop: 10,
    }
});

interface ReportProps {
    municipalityName: string;
    municipalityLogo?: string;
    stats: {
        insertionRate: number;
        companiesValidated: number;
        activeProjects: number;
        localCandidates: number;
        fixedPopulation: number;
        newResidents: number;
        jobsGeneratedQuarter: number;
        impactScore: number;
    };
    month: string;
}

const MunicipalityReportPDF: React.FC<ReportProps> = ({ municipalityName, municipalityLogo, stats, month }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.logoContainer}>
                    {/* RuralMinds Logo (Placeholder or absolute URL needed for production) */}
                    <Text style={{ color: '#0F5C2E', fontWeight: 'bold', fontSize: 16 }}>Rural Minds</Text>
                    <Text style={{ color: '#9ca3af', fontSize: 16 }}>|</Text>
                    {municipalityLogo ? (
                        <Image src={municipalityLogo} style={styles.logo} />
                    ) : (
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{municipalityName}</Text>
                    )}
                </View>
                <View>
                    <Text style={styles.reportTitle}>Reporte de Impacto Social</Text>
                    <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>{month}</Text>
                </View>
            </View>

            {/* Pride Section */}
            <View style={styles.prideSection}>
                <Text style={styles.prideTitle}>Resumen de Resultados Directos (Orgullo Municipal)</Text>
                <View style={styles.prideGrid}>
                    <View style={styles.prideItem}>
                        <Text style={styles.prideValue}>{stats.fixedPopulation}</Text>
                        <Text style={styles.prideLabel}>Población Fijada</Text>
                    </View>
                    <View style={styles.prideItem}>
                        <Text style={styles.prideValue}>{stats.newResidents}</Text>
                        <Text style={styles.prideLabel}>Nuevos Vecinos</Text>
                    </View>
                    <View style={styles.prideItem}>
                        <Text style={styles.prideValue}>{stats.jobsGeneratedQuarter}</Text>
                        <Text style={styles.prideLabel}>Empleos (Trimestre)</Text>
                    </View>
                </View>
            </View>

            {/* General Stats */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Indicadores de Ecosistema</Text>
                <View style={styles.grid}>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.companiesValidated}</Text>
                        <Text style={styles.kpiLabel}>Empresas Validadas</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.activeProjects}</Text>
                        <Text style={styles.kpiLabel}>Proyectos Activos</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.localCandidates}</Text>
                        <Text style={styles.kpiLabel}>Pool de Talento</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.insertionRate}%</Text>
                        <Text style={styles.kpiLabel}>Tasa de Inserción</Text>
                    </View>
                    <View style={styles.kpiCard}>
                        <Text style={styles.kpiValue}>{stats.impactScore}/100</Text>
                        <Text style={styles.kpiLabel}>Impact Score</Text>
                    </View>
                </View>
            </View>

            {/* Descriptive Note */}
            <View style={styles.section}>
                <Text style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.5 }}>
                    Este reporte certifica los resultados de colaboración entre el Ayuntamiento de {municipalityName} y la plataforma Rural Minds.
                    Las métricas reflejadas son el resultado del compromiso municipal por la atracción de talento, la validación de empresas con propósito
                    y la fijación de población en el territorio rural.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text>Documento generado oficialmente por Rural Minds para {municipalityName}</Text>
                <Text>© {new Date().getFullYear()} Rural Minds - Inteligencia Territorial</Text>
            </View>
        </Page>
    </Document>
);

export default MunicipalityReportPDF;
