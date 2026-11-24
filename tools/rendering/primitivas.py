#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""primitivas.py — o vocabulário visual, extraído das peças que já existem.

professor, 24/08: *"vale a pena vc realmente olhar os goldens prontos e tirar suas conclusões
de lá… afinal deve ter algum html que te ajuda a montar seus py."*

Ele estava certo, e a fonte é `_mural/pyramids-wall-integrated-v1/pyramids_wall_integrated_v2.html`.
Aquele arquivo não é documentação: é a peça, com todos os números. Cada primitive abaixo cita
a classe de onde veio.

## As cinco conclusões que eu tirei lendo a peça

**1. A unidade é o MILÍMETRO, não o pixel.** A folha é `@page 420mm 297mm`; borda é `.55mm`;
sombra é `1.3mm 1.3mm 0`; corpo de texto é `1.65mm`. Isso não é preciosismo — é o que faz a
mesma regra valer numa A3 e numa A4 sem recalcular nada, e é por isso que as peças de parede
têm peso de traço coerente entre si. Eu vinha escrevendo `3px`, que só quer dizer alguma
coisa na tela em que foi escrito.

**2. Sombra é sólida, deslocada e SEM desfoque** — `box-shadow: 1.5mm 1.5mm 0 var(--ink)`.
Em alguns objetos ela é da cor da tinta; em outros, translúcida (`rgba(23,47,67,.14)`); no
`route-badge` ela é DOURADA. A sombra é decisão de cor, não efeito.

**3. Quase todo objeto é levemente torto**, e os ângulos não se repetem: `-3°`, `2°`, `-1°`,
`1.2°`, `-.7°`, `4°`, `-5°`, `-8°`. Papel de aluno inclina mais; cartão de consulta inclina
pouco; o que carrega matemática precisa não inclina. É por isso que a parede parece montada
por uma pessoa e não gerada.

**4. O destaque é sublinhado grosso POR BAIXO da linha de base**, não fundo colorido:
`text-decoration-color: var(--gold); thickness: 1.2mm; underline-offset: -.7mm`. O amarelo
atravessa a letra como um marca-texto de verdade.

**5. Existem duas vozes de display, e elas fazem coisas diferentes.** Archivo Black nas peças
de parede integradas; Comic Neue Bold no golden das pirâmides. Não é contradição: uma é a voz
de sistema (rótulo, faixa, número), a outra é a voz de assunto (o título da peça). Onde as
duas aparecem juntas, Archivo é estrutura e Comic Neue é conteúdo.

## Como usar

    import primitivas as pr

    css = pr.css(unidade="mm")     # parede e handout
    css = pr.css(unidade="px", base=3.78)   # lâmina: 1mm ≈ 3.78px a 96dpi

    html = pr.papel_titulo("CILINDROS", rot=-2)

O módulo devolve CSS e HTML; quem compõe é a peça. Primitive é vocabulário, não obrigação —
a regra do repositório é explícita: não empilhar `title paper` como dashboard, não circular
tudo, não transformar cada fórmula em cartão.
"""

import os
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)


# ============================================================
# CORES — as da peça, com uma divergência nomeada
# ============================================================
# Os valores vêm do `:root` de `pyramids_wall_integrated_v2.html`. A exceção é a tinta:
# a parede usa `#172f43` e ele escolheu `#12325F` para a lâmina em 24/08, olhando as duas
# lado a lado. As duas ficam, com o nome do lugar onde valem — unificar em silêncio seria
# eu decidindo design, e mexer no `#172f43` mudaria peças já impressas.
CORES = {
    "ground":     "#eeeae2",   # fundo atrás da peça
    "wall":       "#f8f5ed",   # campo da parede
    "ink_parede": "#172f43",
    "ink_tela":   "#12325F",
    "blue":       "#2d63b8",
    "blue_deep":  "#17457f",
    "blue_mid":   "#4f8dd4",
    "blue_pale":  "#e7f0fa",
    "gold":       "#f0b83a",
    "coral":      "#df6258",
    "green":      "#2f8f68",
    "grid":       "#dce6eb",
    "paper":      "#fff4bd",   # o amarelo do papel de título
    "plum":       "#76539f",
    "muted":      "#c9ced0",
}


# ============================================================
# GEOMETRIA — em milímetros, como na peça
# ============================================================
# Estes números não são propostas: são os que estão no arquivo. A coluna `origem` diz a
# classe exata, para qualquer um poder conferir.
GEOMETRIA_MM = {
    # traço                              origem
    "fio_reticula":        0.25,        # .wall::before
    "borda_no":            0.45,        # .map-node, .permanent-card
    "borda_cartao":        0.55,        # .consult-card, .word-wall
    "borda_papel_titulo":  0.70,        # .map-title
    "borda_painel":        0.65,        # .journey
    "borda_parede":        1.00,        # .wall
    "eixo":                1.20,        # .checklist-axis
    # raio
    "raio_no":             1.80,        # .map-node
    "raio_painel":         2.00,        # .journey, .status
    "raio_parede":         2.50,        # .wall
    "raio_mapa":           3.00,        # .mental-map
    "raio_pilula":         5.00,        # .zone-label, .route-badge
    # sombra sólida (dx = dy)
    "sombra_no":           0.80,        # .map-node, .permanent-card
    "sombra_cartao":       1.30,        # .consult-card
    "sombra_papel_titulo": 1.50,        # .map-title
    "sombra_painel":       1.60,        # .journey, .status
    "sombra_mapa":         2.40,        # .mental-map
    "sombra_parede":       3.00,        # .wall
    # marca-texto
    "marca_espessura":     1.20,        # .obj b
    "marca_deslocamento": -0.70,        # underline-offset
    # retícula
    "passo_reticula":      9.00,        # .wall::before
    "passo_reticula_mapa": 7.00,        # .mental-map::before
}

# Os ângulos que a peça realmente usa. Não é um intervalo contínuo: é um conjunto, e cada
# família tem o seu. Sorteio dentro do conjunto mantém a peça viva sem virar bagunça.
ROTACAO_DEG = {
    "papel_titulo": [-2.0],
    "cartao":       [-1.0, 1.2, -0.7],
    "papel_aluno":  [-3.0, 2.0, -1.0],
    "postit":       [4.0, -5.0],
    "cracha":       [-8.0, 2.0],
    "matematica":   [0.0],     # o que carrega notação precisa NÃO inclina
}

# Tipografia, em mm de corpo. Vem das mesmas classes.
#
# ATENÇÃO — ESTA ESCALA É DE UMA SUPERFÍCIE, NÃO DO SISTEMA.
#
# Todos estes valores foram extraídos de `pyramids-wall-integrated-v1`, que é **A3
# (420 × 297 mm)**. As paredes em LaTeX do repositório são **A1 (891 × 630 mm)** — 2,1×
# maiores. Usar os mesmos milímetros nas duas faz a tipografia aparecer pela metade em
# relação à superfície: medido em 24/08, ao montar o `_mural/mostruario-parede` primeiro em
# A1, onde o corpo de 1,65 mm virou fio de cabelo no raster.
#
# O `validated-decisions.md` do laboratório já fala em níveis por distância de leitura
# (A 3–5 m … T ~1 m). Esta tabela é UM desses níveis, e não diz qual. Enquanto não houver
# a tabela por nível, peça nova em A1 precisa recalibrar o corpo, e a de A3 pode usar isto
# direto.
TIPO_MM = {
    "titulo_peca":      8.40,   # .page-title, Archivo Black
    "titulo_papel":     7.20,   # .map-title
    "titulo_cartao":    2.70,   # .consult-card h3
    "faixa":            3.20,   # .page-subtitle
    "pilula":           2.55,   # .zone-label
    "pilula_pequena":   2.10,   # .permanent-title
    "no":               2.35,   # .map-node
    "corpo":            1.65,   # .consult-card p
    "microtexto":       1.15,   # .permanent-note
    "mao":              3.10,   # .map-kicker, Nothing You Could Do
    "mao_pequena":      1.80,   # .postit
}


def _u(valor, unidade, base):
    """mm da peça → a unidade da superfície. `base` é quantos px valem 1mm.

    `unidade="var"` existe para a LÂMINA PROJETADA. Ali a superfície não tem tamanho
    fixo: o mesmo deck abre no notebook, no projetor de 1920 e na TV da sala, e tem de
    ocupar a tela inteira em qualquer um. Emitir pixel congelaria a peça no tamanho em
    que ela foi escrita; emitir `vw` faria cada medida depender só da largura, e a lâmina
    estouraria em altura numa janela baixa.

    Então o milímetro vira uma variável CSS que a própria lâmina define uma vez
    (`--mm: min(0.3125vw, 0.55555vh)`, que é 320 mm de largura por 180 de altura), e todo
    o resto do vocabulário passa a ser `calc(N * var(--mm))`. É a mesma medida da parede e
    do papel, só que a régua encolhe junto com a janela — a proporção entre traço, corpo e
    respiro fica igual em qualquer tela, que é o ponto de medir em milímetro.
    """
    if unidade == "mm":
        return "%gmm" % valor
    if unidade == "var":
        return "calc(%g * var(--mm))" % valor
    return "%gpx" % round(valor * base, 2)


def css(unidade="mm", base=3.78, ink=None):
    """As classes do vocabulário. `ink` escolhe a tinta (parede ou tela).

    `unidade`: "mm" (parede, handout), "px" (lâmina de tamanho fixo, os goldens SL-*) ou
    "var" (deck projetado — ver `_u`).
    """
    g, t = GEOMETRIA_MM, TIPO_MM
    u = lambda v: _u(v, unidade, base)          # noqa: E731
    tinta = ink or (CORES["ink_parede"] if unidade == "mm" else CORES["ink_tela"])
    c = dict(CORES, ink=tinta)

    return f"""
:root{{
  --ink:{c['ink']};--ground:{c['ground']};--wall:{c['wall']};--blue:{c['blue']};
  --blue-deep:{c['blue_deep']};--blue-mid:{c['blue_mid']};--blue-pale:{c['blue_pale']};
  --gold:{c['gold']};--coral:{c['coral']};--green:{c['green']};--grid:{c['grid']};
  --paper:{c['paper']};--plum:{c['plum']};--muted:{c['muted']};
}}

/* PAPEL DE TÍTULO — `.map-title`. Campo amarelo, contorno grosso, sombra SÓLIDA da cor da
   tinta, e o título dentro. É a entrada editorial da peça, e só existe uma por peça. */
.pr-papel{{display:inline-block;padding:{u(2.5)} {u(7)} {u(2)};background:var(--paper);
  border:{u(g['borda_papel_titulo'])} solid var(--ink);
  box-shadow:{u(g['sombra_papel_titulo'])} {u(g['sombra_papel_titulo'])} 0 var(--ink);
  font:900 {u(t['titulo_papel'])}/.9 'PrDisplay',Impact,sans-serif;text-transform:uppercase}}

/* PÍLULA — `.zone-label`, `.word-title`, `.permanent-title`. Identifica o bloco; cor cheia,
   texto claro, caixa-alta. Nunca é decoração: se não nomeia nada, não entra. */
.pr-pilula{{display:inline-block;padding:{u(2)} {u(4)};border-radius:{u(g['raio_pilula'])};
  background:var(--green);color:#fff;letter-spacing:{u(.35)};text-transform:uppercase;
  font:700 {u(t['pilula'])}/1 'PrSans',Arial,sans-serif}}
.pr-pilula.azul{{background:var(--blue-deep)}}
.pr-pilula.coral{{background:var(--coral)}}
.pr-pilula.ameixa{{background:var(--plum)}}
.pr-pilula.tinta{{background:var(--ink)}}

/* CARTÃO — `.consult-card`. Objeto branco com contorno e sombra translúcida. O cabeçalho
   colorido é parte do cartão, não uma faixa solta. */
.pr-cartao{{position:relative;background:#fff;border:{u(g['borda_cartao'])} solid var(--ink);
  box-shadow:{u(g['sombra_cartao'])} {u(g['sombra_cartao'])} 0 rgba(23,47,67,.14);overflow:hidden}}
.pr-cartao > h3{{margin:0;padding:{u(2.7)} {u(2)} {u(1.5)};background:var(--blue-deep);color:#fff;
  text-align:center;text-transform:uppercase;
  font:900 {u(t['titulo_cartao'])}/.95 'PrDisplay',Impact,sans-serif}}
.pr-cartao > p{{margin:{u(1.8)} {u(2)} 0;font:700 {u(t['corpo'])}/1.15 'PrSans',Arial,sans-serif}}

/* NÓ — `.map-node`. A unidade mínima de conteúdo do mapa: caixa branca pequena, borda fina,
   sombra curta. Existe para ser ligada por conector, não para viver sozinha. */
.pr-no{{display:inline-block;padding:{u(1.5)} {u(2.4)} {u(1.3)};background:#fff;
  border:{u(g['borda_no'])} solid var(--ink);border-radius:{u(g['raio_no'])};
  box-shadow:{u(g['sombra_no'])} {u(g['sombra_no'])} 0 rgba(23,47,67,.13);
  text-transform:uppercase;font:700 {u(t['no'])}/1 'PrSans',Arial,sans-serif}}

/* RETÍCULA — `.wall::before`. Sentida, nunca esqueleto: fio de {g['fio_reticula']}mm a
   {g['passo_reticula']}mm, com metade da opacidade. */
.pr-reticula{{position:absolute;inset:0;pointer-events:none;opacity:.5;
  background-image:linear-gradient(var(--grid) {u(g['fio_reticula'])},transparent {u(g['fio_reticula'])}),
                   linear-gradient(90deg,var(--grid) {u(g['fio_reticula'])},transparent {u(g['fio_reticula'])});
  background-size:{u(g['passo_reticula'])} {u(g['passo_reticula'])}}}

/* MARCA-TEXTO — `.obj b`. Sublinhado grosso DEBAIXO da linha de base, atravessando a letra.
   Não é fundo colorido: o amarelo passa por dentro do texto. */
.pr-marca{{text-decoration:underline;text-decoration-color:var(--gold);
  text-decoration-thickness:{u(g['marca_espessura'])};
  text-underline-offset:{u(g['marca_deslocamento'])};
  /* Sem isto o marca-texto praticamente SOME: o padrão do navegador é
     `text-decoration-skip-ink:auto`, que interrompe a linha em volta de cada letra — e
     como esta linha passa por DENTRO da palavra, o navegador apaga quase tudo. Medido:
     a cor e a espessura estavam corretas no `getComputedStyle` e mesmo assim não havia
     amarelo no raster. */
  text-decoration-skip-ink:none}}

/* ANOTAÇÃO — `.map-kicker`, `.map-note`. A mão humana: coral, levemente torta, curta. */
.pr-mao{{color:var(--coral);font:400 {u(t['mao'])}/1 'PrMao',cursive}}

/* NUMERAL VAZADO — `.obj-num`. Número grande em contorno, para ordenar sem pesar. */
.pr-numeral{{color:transparent;-webkit-text-stroke:{u(.35)} var(--blue-mid);
  font:900 {u(6.3)}/.9 'PrDisplay',Impact,sans-serif}}

/* CRACHÁ DE ROTA — `.route-badge`. Papel amarelo com sombra DOURADA e rotação forte.
   Nomeia um movimento entre partes da peça (ENTENDER, PRATICAR). */
.pr-cracha{{display:inline-block;padding:{u(1.7)} {u(3)};background:var(--paper);
  border:{u(g['borda_cartao'])} solid var(--ink);border-radius:{u(g['raio_pilula'])};
  box-shadow:{u(1)} {u(1)} 0 var(--gold);color:var(--blue-deep);text-transform:uppercase;
  font:900 {u(2.35)}/1 'PrDisplay',Impact,sans-serif}}

/* POST-IT — `.postit`. Onde a turma escreve. Amarelo, torto, sombra curta, letra à mão. */
.pr-postit{{display:inline-block;width:{u(12)};height:{u(10)};padding:{u(2)} {u(1)};
  background:var(--paper);box-shadow:{u(.7)} {u(.7)} 0 rgba(23,47,67,.12);text-align:center;
  font:400 {u(t['mao_pequena'])}/1 'PrMao',cursive}}
"""


def papel_titulo(texto, rot=None):
    r = ROTACAO_DEG["papel_titulo"][0] if rot is None else rot
    return f'<div class="pr-papel" style="transform:rotate({r}deg)">{texto}</div>'


def pilula(texto, cor="verde"):
    classe = {"verde": "", "azul": " azul", "coral": " coral",
              "ameixa": " ameixa", "tinta": " tinta"}[cor]
    return f'<span class="pr-pilula{classe}">{texto}</span>'


def no(texto):
    return f'<span class="pr-no">{texto}</span>'


def cracha(texto, rot=-8):
    return f'<span class="pr-cracha" style="transform:rotate({rot}deg)">{texto}</span>'


def postit(texto, rot=4):
    return f'<span class="pr-postit" style="transform:rotate({rot}deg)">{texto}</span>'


def anotacao(texto, rot=2):
    return f'<span class="pr-mao" style="display:inline-block;transform:rotate({rot}deg)">{texto}</span>'


__all__ = ["CORES", "GEOMETRIA_MM", "ROTACAO_DEG", "TIPO_MM", "css",
           "papel_titulo", "pilula", "no", "cracha", "postit", "anotacao"]
