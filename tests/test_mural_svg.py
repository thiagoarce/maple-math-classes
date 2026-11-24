from xml.etree import ElementTree as ET
from math import hypot
from tools.rendering import svg_mural as m
for fn in (m.triade_poligonos_inscritos,m.diagonais_paralelepipedo,m.cavalieri_prismas,m.mapa_distributiva):
    root=ET.fromstring(fn())
    assert root.tag=="svg" and root.get("viewBox") and root.get("aria-label")
    assert not any(e.tag in ("script","image","foreignObject") for e in root.iter())
root=ET.fromstring(m.triade_poligonos_inscritos())
for polygon,cx,n in zip(root.findall("polygon"),(160,480,800),(3,4,6)):
    pts=[tuple(map(float,p.split(","))) for p in polygon.get("points").split()]
    assert len(pts)==n and all(abs(hypot(x-cx,y-135)-100)<0.1 for x,y in pts)
print("PASS: four mural SVGs and polygon geometry")
