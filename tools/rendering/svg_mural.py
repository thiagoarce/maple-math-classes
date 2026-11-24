#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SVGs matemáticos que já nascem para a escala de um mural A3.

Não são ampliações dos helpers de handout. A geometria, o peso do traço e o corpo dos
rótulos são definidos para leitura em pé, e todo dado matemático é determinístico. Imagem
gerada pode dar contexto ao cartaz; medida, fórmula e relação geométrica ficam aqui.
"""
import math

PAPEL = "#FBFAF8"
TEXTO = "#1B1C1E"
AZUL = "#1D4999"
AZUL_CLARO = "#DDE7F6"
CIANO = "#13B6C6"
VERDE = "#15836D"
VERMELHO = "#B93A45"


def _pontos_poligono(cx, cy, raio, n, inicio_graus=-90):
    return " ".join(
        "%.1f,%.1f" % (
            cx + raio * math.cos(math.radians(inicio_graus + 360 * i / n)),
            cy + raio * math.sin(math.radians(inicio_graus + 360 * i / n)),
        )
        for i in range(n)
    )


def triade_poligonos_inscritos():
    """Triângulo, quadrado e hexágono realmente inscritos; o hexágono explicita R, a e ℓ."""
    grupos = []
    dados = [
        (160, 3, -90, "TRIÂNGULO", "120°"),
        (480, 4, -45, "QUADRADO", "90°"),
        (800, 6, 0, "HEXÁGONO", "60°"),
    ]
    for cx, n, inicio, nome, angulo in dados:
        grupos.append(
            '<circle cx="%d" cy="135" r="100" fill="none" stroke="#A9BAD7" '
            'stroke-width="4"/>'
            '<polygon points="%s" fill="#EAF0FA" fill-opacity=".72" '
            'stroke="%s" stroke-width="6" stroke-linejoin="round"/>'
            '<circle cx="%d" cy="135" r="5" fill="%s"/>'
            '<text x="%d" y="278" text-anchor="middle" font-size="26" '
            'font-weight="800" letter-spacing="2">%s</text>'
            '<text x="%d" y="307" text-anchor="middle" font-size="22" '
            'fill="#526276">ÂNGULO CENTRAL %s</text>'
            % (cx, _pontos_poligono(cx, 135, 100, n, inicio), AZUL, cx, AZUL,
               cx, nome, cx, angulo)
        )

    # No hexágono de topo plano: vértice superior direito (850,48.4), meio do lado
    # superior (800,48.4) e lado inferior de (750,221.6) a (850,221.6).
    grupos.append(
        '<line x1="800" y1="135" x2="850" y2="48.4" stroke="%s" stroke-width="5"/>'
        '<text x="842" y="104" font-size="30" font-style="italic" font-weight="800">R</text>'
        '<line x1="800" y1="135" x2="800" y2="48.4" stroke="%s" stroke-width="5" '
        'stroke-dasharray="10,8"/>'
        '<path d="M800 61 L813 61 L813 48.4" fill="none" stroke="%s" stroke-width="4"/>'
        '<text x="769" y="102" font-size="30" font-style="italic" font-weight="800">a</text>'
        '<line x1="750" y1="221.6" x2="850" y2="221.6" stroke="%s" stroke-width="8"/>'
        '<text x="800" y="216" text-anchor="middle" font-size="30" font-style="italic" '
        'font-weight="800">ℓ</text>'
        % (VERDE, VERDE, VERDE, CIANO)
    )
    return (
        '<svg width="100%%" viewBox="0 0 960 325" role="img" '
        'aria-label="Triângulo, quadrado e hexágono inscritos em circunferências">'
        '<rect width="960" height="325" fill="%s"/>%s</svg>'
        % (PAPEL, "".join(grupos))
    )


def diagonais_paralelepipedo():
    """Paralelepípedo em perspectiva com d na base e D no espaço, sem troca de letras."""
    return f"""
<svg width="100%" viewBox="0 0 900 420" role="img"
 aria-label="Diagonal d da base e diagonal D do espaço em um paralelepípedo">
  <rect width="900" height="420" fill="{PAPEL}"/>
  <polygon points="250,120 700,120 570,40 120,40" fill="{AZUL_CLARO}" opacity=".45"/>
  <polygon points="250,330 700,330 700,120 250,120" fill="#FFFFFF" opacity=".62"/>
  <polygon points="120,250 250,330 250,120 120,40" fill="#E7EEF8" opacity=".62"/>

  <g fill="none" stroke="{TEXTO}" stroke-width="5" stroke-linejoin="round">
    <path d="M250 330 H700 V120 H250 Z"/>
    <path d="M250 330 L120 250 V40 L250 120"/>
    <path d="M700 330 L570 250 V40 L700 120"/>
    <path d="M120 40 H570"/>
    <path d="M120 250 H570" stroke-dasharray="12,10"/>
    <path d="M570 250 V40" stroke-dasharray="12,10"/>
  </g>

  <line x1="120" y1="250" x2="700" y2="330" stroke="{VERDE}" stroke-width="10"
        stroke-linecap="round"/>
  <line x1="120" y1="40" x2="700" y2="330" stroke="{AZUL}" stroke-width="10"
        stroke-linecap="round"/>

  <g font-family="Arial, sans-serif" font-size="35" font-weight="800" fill="{TEXTO}">
    <text x="475" y="382" text-anchor="middle" font-style="italic">a</text>
    <text x="169" y="321" text-anchor="middle" font-style="italic">b</text>
    <text x="744" y="230" text-anchor="middle" font-style="italic">c</text>
    <text x="425" y="326" text-anchor="middle" fill="{VERDE}" font-style="italic">d</text>
    <text x="447" y="160" text-anchor="middle" fill="{AZUL}" font-style="italic">D</text>
  </g>
  <g display="none" font-family="Arial, sans-serif" font-size="21" font-weight="700" letter-spacing="2">
    <text x="425" y="355" text-anchor="middle" fill="{VERDE}">BASE</text>
    <text x="447" y="128" text-anchor="middle" fill="{AZUL}">ESPAÇO</text>
  </g>
</svg>"""


def _secao(cx, y, deslocamento=0, destaque=False):
    """Paralelogramo horizontal de área fixa; deslocamento inclina sem deformar."""
    cor = CIANO if destaque else AZUL
    opacidade = ".30" if destaque else ".10"
    return (
        '<polygon points="%d,%d %d,%d %d,%d %d,%d" fill="%s" fill-opacity="%s" '
        'stroke="%s" stroke-width="%s"/>'
        % (cx - 95 + deslocamento, y, cx + 55 + deslocamento, y,
           cx + 95 + deslocamento, y + 34, cx - 55 + deslocamento, y + 34,
           cor, opacidade, cor, "6" if destaque else "4")
    )


def cavalieri_prismas():
    """Dois prismas de mesma altura e seções correspondentes congruentes."""
    secoes = []
    for y in (90, 180, 270, 340):
        secoes.append(_secao(250, y, 0, y == 180))
        # A inclinação desloca cada seção, mas não muda sua forma nem área.
        desloc = round((340 - y) * 0.28)
        secoes.append(_secao(680, y, desloc, y == 180))
    return f"""
<svg width="100%" viewBox="0 0 960 410" role="img"
 aria-label="Prisma reto e prisma oblíquo com mesma altura e seções de mesma área">
  <rect width="960" height="410" fill="{PAPEL}"/>
  <g>{''.join(secoes)}</g>
  <g fill="none" stroke="{TEXTO}" stroke-width="5" stroke-linejoin="round">
    <path d="M155 340 L305 340 L345 374 L195 374 Z"/>
    <path d="M155 90 L305 90 L345 124 L195 124 Z"/>
    <path d="M155 340 V90 M305 340 V90 M345 374 V124 M195 374 V124"/>
    <path d="M585 340 L735 340 L775 374 L625 374 Z"/>
    <path d="M655 90 L805 90 L845 124 L695 124 Z"/>
    <path d="M585 340 L655 90 M735 340 L805 90 M775 374 L845 124 M625 374 L695 124"/>
  </g>
  <g stroke="{VERDE}" stroke-width="5" fill="none">
    <path d="M105 90 V340 M93 90 H117 M93 340 H117"/>
    <path d="M535 90 V340 M523 90 H547 M523 340 H547"/>
  </g>
  <g font-family="Arial, sans-serif" fill="{TEXTO}">
    <text x="73" y="225" font-size="34" font-weight="800" font-style="italic">h</text>
    <text x="503" y="225" font-size="34" font-weight="800" font-style="italic">h</text>
    <text x="250" y="222" text-anchor="middle" font-size="36" font-weight="900"
          fill="{CIANO}">A</text>
    <text x="734" y="222" text-anchor="middle" font-size="36" font-weight="900"
          fill="{CIANO}">A</text>
    <text x="250" y="405" text-anchor="middle" font-size="25" font-weight="800"
          letter-spacing="3">RETO</text>
    <text x="710" y="405" text-anchor="middle" font-size="25" font-weight="800"
          letter-spacing="3">OBLÍQUO</text>
  </g>
</svg>"""


def mapa_distributiva():
    """Mapa de distribuição de 2x sobre 3x − 4; produtos e expoentes ficam explícitos."""
    return f"""
<svg width="100%" viewBox="0 0 900 280" role="img"
 aria-label="Dois x distribuído para três x e menos quatro">
  <rect width="900" height="280" fill="{PAPEL}"/>
  <defs>
    <marker id="seta" markerWidth="12" markerHeight="12" refX="9" refY="4"
            orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L10,4 L0,8 Z" fill="{AZUL}"/>
    </marker>
  </defs>
  <rect x="35" y="86" width="150" height="108" rx="28" fill="{AZUL}" />
  <text x="110" y="153" text-anchor="middle" font-family="Arial, sans-serif"
        font-size="48" font-weight="900" fill="white" paint-order="normal">2x</text>

  <g fill="{AZUL_CLARO}" stroke="{AZUL}" stroke-width="5">
    <rect x="335" y="28" width="170" height="82" rx="18"/>
    <rect x="335" y="170" width="170" height="82" rx="18"/>
  </g>
  <g fill="#EAF6F2" stroke="{VERDE}" stroke-width="5">
    <rect x="675" y="28" width="190" height="82" rx="18"/>
    <rect x="675" y="170" width="190" height="82" rx="18"/>
  </g>

  <g fill="none" stroke="{AZUL}" stroke-width="7" marker-end="url(#seta)">
    <path d="M185 115 C245 86 270 70 325 70"/>
    <path d="M185 165 C245 194 270 210 325 210"/>
  </g>
  <g fill="none" stroke="{VERDE}" stroke-width="7" marker-end="url(#seta)">
    <path d="M505 69 H663"/>
    <path d="M505 211 H663"/>
  </g>

  <g font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="{TEXTO}">
    <text x="420" y="83" text-anchor="middle">3x</text>
    <text x="420" y="225" text-anchor="middle">−4</text>
    <text x="770" y="83" text-anchor="middle">6x²</text>
    <text x="770" y="225" text-anchor="middle">−8x</text>
  </g>
  <g font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="{AZUL}">
    <text x="585" y="58" text-anchor="middle">×</text>
    <text x="585" y="200" text-anchor="middle">×</text>
  </g>
</svg>"""
