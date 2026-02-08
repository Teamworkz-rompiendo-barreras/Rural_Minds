from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from io import BytesIO
from datetime import datetime

# Brand Colors
COLOR_P1 = HexColor("#F2D680") # Gold/Yellow
COLOR_P2 = HexColor("#374BA6") # Blue Primary
COLOR_BG = HexColor("#FFFFFF")
COLOR_TEXT = HexColor("#1A202C") # Dark Gray for text (Atkinson readable)

def generate_impact_report_pdf(org_name: str, metrics: dict):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    # Costum Styles simulating Futura/Atkinson
    style_title = ParagraphStyle(
        'TwzTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=COLOR_P1,
        spaceAfter=30,
        alignment=1 # Center
    )
    
    style_header = ParagraphStyle(
        'TwzHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=18,
        textColor=COLOR_P2,
        spaceBefore=20,
        spaceAfter=10
    )
    
    style_body = ParagraphStyle(
        'TwzBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=18, # 1.5 spacing
        textColor=COLOR_TEXT
    )
    
    style_metric_label = ParagraphStyle('MetricLabel', parent=style_body, fontSize=10, textColor=colors.gray)
    style_metric_value = ParagraphStyle('MetricValue', parent=style_title, fontSize=20, textColor=COLOR_P2, alignment=0)

    elements = []

    # --- Cover Page ---
    # In a real scenario we would draw a full page rectangle, but with SimpleDocTemplate we simulate with content
    # For MVP, we use a simple header structure
    
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("REPORTE DE IMPACTO SOCIAL", style_title))
    elements.append(Paragraph(f"Preparado para: {org_name}", style_body))
    elements.append(Paragraph(f"Fecha: {datetime.now().strftime('%Y-%m-%d')}", style_body))
    elements.append(Spacer(1, 3*inch))
    elements.append(Paragraph("Generado por Antigravity / Teamworkz", style_body))
    elements.append(PageBreak())

    # --- Executive Summary ---
    elements.append(Paragraph("1. Resumen Ejecutivo", style_header))
    summary_text = f"""
    En el último trimestre, {org_name} ha demostrado un compromiso medible con la inclusión. 
    A través de la implementación de ajustes razonables y la adopción de prácticas neuroinclusivas, 
    la organización ha comenzado a convertir la diversidad cognitiva en una ventaja competitiva tangible.
    """
    elements.append(Paragraph(summary_text, style_body))
    elements.append(Spacer(1, 0.5*inch))

    # --- Metrics Block ---
    elements.append(Paragraph("2. Métricas de Impacto", style_header))
    
    # Create a table for metrics
    data = [
        [Paragraph(f"Score Inclusión: {metrics.get('inclusion_score', '--')}", style_metric_value),
         Paragraph(f"Bienestar Promedio: {metrics.get('wellbeing_level', '--')}/10", style_metric_value)],
        [Paragraph("Social Score basado en activación y adecuación.", style_metric_label),
         Paragraph("Basado en el feedback directo de los colaboradores.", style_metric_label)],
        
        [Paragraph(f"ROI Estimado: {metrics.get('roi_estimated', '--')}", style_metric_value),
         Paragraph(f"Retención: {metrics.get('retention_rate', '--')}", style_metric_value)],
        [Paragraph("Ahorro anual proyectado por reducción de rotación.", style_metric_label),
         Paragraph("Tasa de retención de talento neurodivergente.", style_metric_label)]
    ]
    
    t = Table(data, colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*inch))

    # --- Adjustments Detail ---
    elements.append(Paragraph("3. Detalle de Ajustes Implementados", style_header))
    if metrics.get('activation_metrics'):
        act = metrics['activation_metrics']
        elements.append(Paragraph(f"• Setup de Marca: {'Completado' if act.get('brand_setup') else 'Pendiente'}", style_body))
        elements.append(Paragraph(f"• Adopción Perfil Sensorial: {act.get('sensory_adoption')}%", style_body))
        elements.append(Paragraph(f"• Salud Accesibilidad: {act.get('accessibility_health')}/100", style_body))
        elements.append(Paragraph(f"• Micro-learning consumido: {act.get('learning_usage')} unidades", style_body))
    else:
        elements.append(Paragraph("No hay datos de detalles disponibles.", style_body))

    elements.append(Spacer(1, 0.5*inch))
    
    # --- Closing ---
    elements.append(Paragraph("4. Próximos Pasos", style_header))
    elements.append(Paragraph("Para maximizar estos resultados, recomendamos agendar una sesión de revisión con nuestros expertos.", style_body))
    
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("Agenda 30 minutos aquí: https://cal.com/teamworkz/review", style_body))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_impact_report_txt(org_name: str, metrics: dict):
    # Accessible Plain Text Version
    act = metrics.get('activation_metrics', {})
    content = f"""
REPORTE DE IMPACTO SOCIAL (Versión Texto Plano)
Preparado para: {org_name}
Fecha: {datetime.now().strftime('%Y-%m-%d')}
Generado por: Teamworkz

1. RESUMEN EJECUTIVO
En el último trimestre, {org_name} ha demostrado un compromiso medible con la inclusión.

2. MÉTRICAS DE IMPACTO
- Score Inclusión: {metrics.get('inclusion_score', '--')}
- Bienestar Promedio: {metrics.get('wellbeing_level', '--')}/10
- ROI Estimado: {metrics.get('roi_estimated', '--')}
- Tasa de Retención: {metrics.get('retention_rate', '--')}

3. DETALLE DE AJUSTES
- Setup de Marca: {'Completado' if act.get('brand_setup') else 'Pendiente'}
- Adopción Perfil Sensorial: {act.get('sensory_adoption', 0)}%
- Salud Accesibilidad: {act.get('accessibility_health', 0)}/100
- Micro-learning: {act.get('learning_usage', 0)} unidades

4. PRÓXIMOS PASOS
Recomendamos agendar revisión: https://cal.com/teamworkz/review

fin del reporte.
    """
    return content
