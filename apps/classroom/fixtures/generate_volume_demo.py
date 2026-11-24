from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

out = Path(__file__).with_name("volume-demo.pdf")
c = canvas.Canvas(str(out), pagesize=A4, invariant=1)
for heading, lines in [
    ("Area e volume - investigacao", [
        "Uma caixa retangular tem base de 4 dm por 3 dm e altura de 8 dm.",
        "1. Calcule a area da base.",
        "2. Calcule o volume. Explique a unidade.",
    ]),
    ("Area e volume - transferencia", [
        "3. Dobre a area da base e reduza a altura pela metade.",
        "O que acontece com o volume? Justifique.",
        "4. Proponha outras dimensoes com o mesmo volume.",
    ]),
]:
    c.setFont("Helvetica-Bold", 19)
    c.drawString(48, 785, heading)
    c.setFont("Helvetica", 12)
    for i, line in enumerate(lines):
        c.drawString(48, 746 - i * 30, line)
    for y in range(610, 140, -42):
        c.setStrokeColorRGB(.75, .78, .84)
        c.line(48, y, 547, y)
    c.showPage()
c.save()
print(out)
