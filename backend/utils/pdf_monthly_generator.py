
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from io import BytesIO
from datetime import datetime

# Brand Colors
COLOR_P1 = HexColor("#F2D680") # Yellow/Gold
COLOR_P2 = HexColor("#374BA6") # Blue
COLOR_TEXT = HexColor("#1A202C")

def create_pie_chart(data, labels):
    drawing = Drawing(400, 200)
    pc = Pie()
    pc.x = 150
    pc.y = 50
    pc.width = 120
    pc.height = 120
    pc.data = data
    pc.labels = labels
    pc.sideLabels = True
    pc.slices.strokeWidth = 0.5
    pc.slices[0].fillColor = COLOR_P2
    pc.slices[1].fillColor = COLOR_P1
    pc.slices[2].fillColor = colors.lightgrey
    
    drawing.add(pc)
    return drawing

def create_bar_chart(data, labels):
    drawing = Drawing(400, 200)
    bc = VerticalBarChart()
    bc.x = 50
    bc.y = 50
    bc.height = 125
    bc.width = 300
    bc.data = data
    bc.strokeColor = colors.black
    bc.valueAxis.valueMin = 0
    bc.categoryAxis.labels.boxAnchor = 'ne'
    bc.categoryAxis.labels.dx = 8
    bc.categoryAxis.labels.dy = -2
    bc.categoryAxis.categoryNames = labels
    bc.bars[0].fillColor = COLOR_P2
    drawing.add(bc)
    return drawing

def generate_monthly_report_pdf(municipality_name: str, data: dict):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)
    
    styles = getSampleStyleSheet()
    
    style_titular = ParagraphStyle(
        'Titular',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=26,
        textColor=COLOR_P2,
        spaceAfter=20
    )
    
    style_subtitle = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.gray,
        spaceAfter=30
    )
    
    style_section = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=COLOR_P2,
        spaceBefore=20,
        spaceAfter=15,
        borderPadding=5,
        borderWidth=0,
        leftIndent=0
    )
    
    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        textColor=COLOR_TEXT
    )
    
    style_kpi_val = ParagraphStyle('KPIVal', parent=style_body, fontSize=20, fontName='Helvetica-Bold', textColor=COLOR_P2)
    style_kpi_label = ParagraphStyle('KPILabel', parent=style_body, fontSize=9, textColor=colors.gray, textTransform='uppercase')

    story = []

    # --- Header ---
    story.append(Paragraph(f"Informe de Impacto: {municipality_name}", style_titular))
    story.append(Paragraph(f"Periodo: {data['month']} 2026 | Rural Minds x Teamworkz", style_subtitle))
    
    # --- Executive Summary ---
    story.append(Paragraph("1. El Resumen Ejecutivo", style_section))
    summary = f"\"Este mes, {data['total_interested']} profesionales han puesto sus ojos en nuestro municipio como su próximo hogar. Menos asfalto, más comunidad.\""
    story.append(Paragraph(summary, style_body))
    story.append(Spacer(1, 20))

    # --- Metrics Table ---
    story.append(Paragraph("2. Métricas de Atracción y Arraigo", style_section))
    
    kpi_data = [
        [Paragraph("Nuevos Residentes Potenciales", style_kpi_label), Paragraph("Talento Local Vinculado (KM 0)", style_kpi_label)],
        [Paragraph(f"{data['num_attraction']} 📈", style_kpi_val), Paragraph(f"{data['num_rooting']} 🆗", style_kpi_val)],
        [Paragraph("Consultas de Vivienda/Servicios", style_kpi_label), Paragraph("Matches Consolidados", style_kpi_label)],
        [Paragraph(f"{data['num_consults']} 🚀", style_kpi_val), Paragraph(f"{data['num_matches']} ✨", style_kpi_val)]
    ]
    
    t = Table(kpi_data, colWidths=[2.5*inch, 2.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor("#F9FAFB")),
        ('BOX', (0,0), (-1,-1), 1, colors.lightgrey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LEFTPADDING', (0,0), (-1,-1), 20),
        ('TOPPADDING', (0,0), (-1,-1), 15),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(t)
    story.append(Spacer(1, 30))

    # --- Origin Pie Chart ---
    story.append(Paragraph("3. Mapa de Origen: \"¿De dónde vienen?\"", style_section))
    origins = data['origins'] # {"Madrid": 40, "Barcelona": 20, "Otras": 30, "Intl": 10}
    chart = create_pie_chart(list(origins.values()), list(origins.keys()))
    story.append(chart)
    story.append(Spacer(1, 20))

    # --- Sensory Diagnosis ---
    story.append(Paragraph("4. Diagnóstico Sensorial del Municipio", style_section))
    sensory = data['sensory']
    story.append(Paragraph(f"• El <b>{sensory['silence']}%</b> busca entornos de baja estimulación sonora.", style_body))
    story.append(Paragraph(f"• El <b>{sensory['light']}%</b> prioriza espacios con luz natural regulable.", style_body))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<i>Sugerencia: {data['suggestion']}</i>", style_body))
    story.append(Spacer(1, 20))

    # --- Top Companies ---
    story.append(Paragraph("5. El Top de Empresas Dinamizadoras", style_section))
    for i, company in enumerate(data['top_companies'], 1):
        story.append(Paragraph(f"{i}. <b>{company['name']}</b>: {company['offers']} ofertas activas | {company['seal']}.", style_body))

    # --- Footer ---
    story.append(Spacer(1, 50))
    story.append(Paragraph("Rural Minds - Innovación con denominación de origen", style_body))
    story.append(Paragraph("Teamworkz. Todos los derechos reservados © 2026", style_body))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
