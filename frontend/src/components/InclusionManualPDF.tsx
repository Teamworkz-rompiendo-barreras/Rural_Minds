
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts
Font.register({
    family: 'Atkinson Hyperlegible',
    fonts: [
        { src: 'https://fonts.gstatic.com/s/atkinsonhyperlegible/v2/9o8jL7kFpC5q3m6p2E3r6q4o8.ttf', fontWeight: 400 }, // Regular
        { src: 'https://fonts.gstatic.com/s/atkinsonhyperlegible/v2/9o8iL7kFpC5q3m6p2E3r6q4o8.ttf', fontWeight: 700 }  // Bold
    ]
});

Font.register({
    family: 'Jost', // Using Jost as free alternative to Futura
    fonts: [
        { src: 'https://fonts.gstatic.com/s/jost/v14/92zPt88fL6v8jD3t.ttf', fontWeight: 700 } // Bold
    ]
});

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Atkinson Hyperlegible',
        backgroundColor: '#FFFFFF'
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 2,
        borderBottomColor: '#374BA6', // P2
        paddingBottom: 12
    },
    title: {
        fontSize: 24,
        fontFamily: 'Jost',
        fontWeight: 'bold',
        color: '#374BA6', // P2
        marginBottom: 6
    },
    subtitle: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 20
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: 'Jost',
        fontWeight: 'bold',
        color: '#374BA6', // P2
        marginBottom: 8,
        backgroundColor: '#F3F4F6', // N100
        padding: 6,
        borderRadius: 4
    },
    text: {
        fontSize: 12,
        color: '#0D1321', // N900
        lineHeight: 1.5,
        marginBottom: 8,
        textAlign: 'justify'
    },
    list: {
        marginLeft: 12,
        marginTop: 4
    },
    listItem: {
        fontSize: 12,
        color: '#0D1321', // N900
        marginBottom: 6,
        lineHeight: 1.5
    },
    bold: {
        fontWeight: 700,
        fontFamily: 'Atkinson Hyperlegible'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 10,
        color: '#999999',
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
        paddingTop: 10
    }
});

interface InclusionManualPDFProps {
    municipalityName?: string;
}

const InclusionManualPDF: React.FC<InclusionManualPDFProps> = ({ municipalityName }) => (
    <Document title="Manual de Inclusión Rural Minds" author="Rural Minds" language="es">
        <Page size="A4" style={styles.page}>

            {/* Header / Portada Simplificada */}
            <View style={styles.header}>
                <Text style={styles.title}>Manual de Inclusión: Comunicación Efectiva</Text>
                <Text style={styles.subtitle}>Innovación con Denominación de Origen | Teamworkz Certified</Text>
            </View>

            {/* Sección 1: Introducción */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. La Neurodiversidad en el Entorno Rural</Text>
                <Text style={styles.text}>
                    El talento local es el motor de la innovación. Rural Minds conecta habilidades únicas con oportunidades reales, rompiendo barreras geográficas y cognitivas mediante tecnología adaptativa. Entender la neurodiversidad no es solo inclusión, es una ventaja competitiva para tu empresa.
                </Text>
            </View>

            {/* Sección 2: Protocolo de Mensajería */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. Protocolo de Mensajería: Reglas de Oro</Text>
                <Text style={styles.text}>
                    Antes de escribir, <Text style={styles.bold}>consulta siempre el Perfil Sensorial</Text> del candidato.
                </Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}>• <Text style={styles.bold}>Claridad ante todo:</Text> Evita el sarcasmo, las metáforas complejas o las frases hechas. Sé directo y utiliza listas numeradas para las tareas.</Text>
                    <Text style={styles.listItem}>• <Text style={styles.bold}>Respeto a los Tiempos:</Text> No esperes respuesta inmediata. La comunicación asíncrona reduce la ansiedad y mejora la calidad del trabajo.</Text>
                    <Text style={styles.listItem}>• <Text style={styles.bold}>Preparación de Entrevistas:</Text> Envía las preguntas o los puntos a tratar con 24 horas de antelación. La anticipación es clave para reducir la incertidumbre.</Text>
                </View>
            </View>

            {/* Sección 3: Diccionario de Ajustes */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. Diccionario de Ajustes Rápidos</Text>
                <View style={styles.list}>
                    <Text style={styles.listItem}><Text style={styles.bold}>Hipersensibilidad Lumínica:</Text> Evita fondos blancos puros (usa #F0F4EF) y permite el uso de gafas de sol o pantallas tenues.</Text>
                    <Text style={styles.listItem}><Text style={styles.bold}>Comunicación Asíncrona:</Text> El talento responde mejor por escrito y con tiempo para procesar, en lugar de llamadas "sorpresa".</Text>
                    <Text style={styles.listItem}><Text style={styles.bold}>Carga Cognitiva:</Text> Divide las tareas grandes en pasos pequeños y secuenciales. Una cosa a la vez.</Text>
                </View>
            </View>

            {/* Sección 4: Casos de Éxito */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>4. Casos de Éxito</Text>
                <Text style={styles.text}>
                    Empresas rurales que implementaron estos protocolos reportaron un aumento del 40% en retención de talento y una mejora significativa en la innovación interna.
                </Text>
            </View>

            {/* Sección 5: Impacto Local */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>5. Impacto Social en {municipalityName || "Tu Municipio"}</Text>
                <Text style={styles.text}>
                    Al adoptar este manual, contribuyes directamente a la estrategia "Talento KM 0" de {municipalityName || "este territorio"}, fomentando el arraigo y reduciendo la brecha digital.
                </Text>
            </View>

            {/* Footer */}
            <Text style={styles.footer}>
                Rural Minds 2026 - Documento oficial para el ecosistema inclusivo.
            </Text>
        </Page>
    </Document>
);

export default InclusionManualPDF;
