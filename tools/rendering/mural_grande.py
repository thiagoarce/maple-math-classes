#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mural_grande.py — um mural em UMA arte, num PDF do tamanho da parede.

## Por que existe

Dele, em 17/08/2026: *"a escola permite imprimir murais completos de 2x2, 3x3, 2x1 (A3) e
até 4x4… ou seja, dá para ter uma arte com o mural completo de uma unidade já no começo,
em vez de um monte de folha e arquivos diferentes."*

O `mural_lib` resolve a folha: um conceito por A3 ou A4, feito para a parede finita e para
trocar quando o tópico fecha. Isso continua valendo — e é o formato certo para o que gira
durante a unidade. O que faltava era o outro objeto: **a unidade inteira numa peça só**,
grande, que sobe no primeiro dia e fica. Em A4 solto o aluno vê cinco folhas; em 3×3 ele
vê a unidade.

## Como funciona

A arte é **uma página só**, do tamanho final do mural, desenhada como cartaz e não como
folha ampliada: corpo, hierarquia e espaçamento calculados para leitura a dois metros. O
Chrome imprime essa página em PDF no tamanho real, e **é esse PDF que se entrega**.

Houve uma versão que recortava o PDF em peças A4 aqui dentro. Ela saiu por instrução dele
em 17/08: *"você não precisa cortar o arquivo. A própria secretaria faz esse trabalho. Você
me entrega o PDF grande."* Recortar aqui era resolver um problema que não era nosso — e
ainda impunha uma escala fixa a quem tem plotter.

## Tamanho

**Livre.** Dele, em 17/08: *"você não precisa se prender a A4. Qualquer formato grande que
seja melhor serve. Pode ser até quadrado. Sempre dá pra usar tesoura pra juntar as
partes."* Então o tamanho sai do conteúdo, não da folha: escolhe-se a proporção que faz os
blocos caberem sem sobra e sem aperto, e pronto.

Referência de escala, não regra:

| Tamanho | Serve para |
|---|---|
| 420 × 297 mm | um conceito, uma figura |
| ~600 × 800 mm | consulta densa, lida de perto |
| ~700 × 1000 mm | painel de unidade, lido do fundo da sala |
| ~840 × 1190 mm | parede de corredor |

O gerador imprime o tamanho em mm no fim — é isso que vai no pedido à gráfica. A
equivalência em A4 sai junto, com `≈` quando não é exata, para ninguém mandar cortar em
nove folhas achando que fecha na régua.

## Simplicidade

Dele, no mesmo dia: *"toma cuidado para não ficar um monte de coisa entulhada.
Simplicidade ajuda."* Cartaz não é handout: o que ele carrega é o que se consulta de longe
e em três segundos. Na dúvida entre mais um bloco e mais ar, é mais ar — o bloco a mais
tem casa na folha do aluno, o ar não tem casa nenhuma.
"""
import os

from . import mural_lib as mu
from . import topdf

MM = 2.8346456693  # 1 mm em pontos PDF


REF = (630 * 891) ** 0.5   # o primeiro cartaz, 3×3 A4 — a régua de todos os outros


def _css(largura_mm, altura_mm, cor, tinta, acento, escala=1.0):
    """A tipografia ESCALA com o cartaz, e isso não é refinamento: é o que faz o mesmo
    gerador servir formatos diferentes.

    A primeira versão fixava os corpos em mm calibrados para 630×891, e o mesmo arquivo em
    A2 saía com o título ocupando um terço da folha. A segunda escalou pela LARGURA, e aí
    um cartaz em paisagem (1000×700) ganhava corpo de 20 mm: largura sozinha mente quando
    a proporção muda. Agora a régua é a **média geométrica** dos dois lados, que é o que
    responde por "quanta superfície esta peça tem".

    `escala` é o ajuste fino por peça: um mapa radial quer corpo menor que um painel de
    unidade, porque tem seis caixas competindo pelo mesmo espaço.
    """
    e = ((largura_mm * altura_mm) ** 0.5 / REF) * escala
    def mm(valor):
        return round(valor * e, 2)
    return mu._fontes_css() + r"""
*{box-sizing:border-box;margin:0;padding:0}
@page{size:%(L)dmm %(A)dmm;margin:0}
html,body{width:%(L)dmm;height:%(A)dmm}
body{font-family:'MuralSans',system-ui,sans-serif;color:#16181d;background:#FBFAF8;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.cartaz{width:%(L)dmm;height:%(A)dmm;display:grid;
  grid-template-rows:auto auto auto minmax(0,1fr) auto;padding:0 0 14mm}

.faixa{background:%(COR)s;color:#FBFAF8;padding:%(P22)smm %(P20)smm %(P16)smm;position:relative}
.faixa .chapeu{font-family:'MuralMono',monospace;font-size:%(F13)smm;letter-spacing:.3em;
  text-transform:uppercase;opacity:.85}
.faixa h1{font-family:'MuralDisplay',sans-serif;font-size:%(F64)smm;line-height:.86;
  letter-spacing:-.01em;margin-top:6mm}
.faixa .turma{font-family:'MuralMono',monospace;font-size:%(F9)smm;letter-spacing:.22em;
  text-transform:uppercase;opacity:.8;margin-top:8mm}
.faixa:after{content:"";position:absolute;left:20mm;right:20mm;bottom:0;height:2.4mm;
  background:%(ACE)s}

/* Linha do tempo: a unidade tem começo e fim, e é a leitura da esquerda para a direita
   que faz o aluno saber onde está hoje. */
.tempo{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6mm;
  padding:14mm 20mm 10mm}
.parada{border-top:2mm solid %(COR)s;padding-top:6mm}
.parada .quando{font-family:'MuralMono',monospace;font-size:%(F85)smm;letter-spacing:.14em;
  color:%(COR)s;font-weight:700}
.parada .oque{font-size:%(F11)smm;line-height:1.18;margin-top:4mm}
.parada.prova{border-top-color:%(ACE)s}
.parada.prova .quando{color:#B26A00}

.miolo{display:grid;grid-template-columns:1.35fr 1fr;gap:12mm;padding:6mm 20mm 0;min-height:0}
/* Uma coluna só: quando o cartaz tem poucos blocos, dividir em duas deixa metade da
   faixa vazia e a outra apertada. Cartaz simples ocupa a largura toda. */
.miolo.solo{grid-template-columns:1fr}
.bloco{background:%(TIN)s;border-left:3mm solid %(COR)s;padding:12mm 12mm 12mm 14mm}
.bloco h2{font-family:'MuralMono',monospace;font-size:%(F85)smm;letter-spacing:.2em;
  text-transform:uppercase;color:%(COR)s;margin-bottom:8mm}
.bloco li,.bloco p{font-size:%(F125)smm;line-height:1.3;list-style:none;margin-bottom:7mm}
.bloco li:last-child,.bloco p:last-child{margin-bottom:0}
.bloco li b,.bloco p b{color:%(COR)s}
.coluna{display:grid;gap:12mm;align-content:start}

/* As três coisas — o instrumento que as aulas repetem todo dia. */
.tres{counter-reset:t}
.tres li{position:relative;padding-left:22mm;counter-increment:t}
.tres li:before{content:counter(t);position:absolute;left:0;top:-3mm;
  font-family:'MuralDisplay',sans-serif;font-size:%(F22)smm;line-height:1;color:%(COR)s;opacity:.5}

/* Palavras em CARTÃO, não em chip de texto: dele, em 17/08, "pode colocar (…) palavras de
   uso em cards". Cartão tem fundo próprio e sombra curta, então ele se destaca do bloco
   atrás e o aluno lê a palavra sem ler a caixa. */
.vocab{display:flex;flex-wrap:wrap;gap:5mm}
.vocab span{background:#fff;border:.8mm solid %(COR)s;border-radius:4mm;
  padding:5mm 8mm;font-size:%(F11)smm;font-weight:700;color:%(COR)s;
  box-shadow:0 1.6mm 0 0 rgba(0,0,0,.07)}

/* Faixa baixa: o terço de baixo do cartaz. Sem ela, um 3×3 imprime três A4 em branco —
   e cartaz com um terço vazio parece inacabado na parede, não arejado. É onde entram a
   FIGURA (que é o que um cartaz deve ter e uma folha de exercício não tem espaço para
   ter) e a área que a turma preenche durante a unidade. */
.baixo{display:grid;grid-template-columns:1.1fr 1fr;gap:12mm;padding:12mm 20mm 6mm;align-items:stretch}
/* Sem a área de co-construção (é o caso do mural de CONSULTA), a figura toma a largura
   inteira e as peças dela vão lado a lado — senão sobra meia faixa vazia embaixo, que é
   o mesmo defeito do terço vazio, só que menor. */
.baixo.solo{grid-template-columns:1fr;align-items:start}
/* `align-items:start` no modo solo: sem a área de co-construção do lado, a caixa da figura
   esticava até o rodapé e as retas numéricas — que são largas e baixas — ficavam boiando
   no meio de um retângulo vazio. Melhor a caixa ter a altura do desenho e o espaço que
   sobra virar ar. */
.baixo.solo .figura .par{grid-auto-flow:column;grid-auto-columns:1fr}
/* `margin:auto` em vez de `justify-items:center`: com o item centrado pelo grid ele
   passa a ser dimensionado pelo CONTEÚDO, e um SVG com width:100%% colapsa para a
   largura intrínseca — o desenho do Sarrus saía do tamanho de um selo. */
.baixo.solo .figura svg{display:block;margin:0 auto;max-width:92%%;max-height:%(FIGS)smm}
.figura{background:#fff;border:1.2mm solid #d8d5cf;padding:10mm;display:grid;
  grid-template-rows:auto minmax(0,1fr)}
.figura h2{font-family:'MuralMono',monospace;font-size:%(F85)smm;letter-spacing:.2em;
  text-transform:uppercase;color:%(COR)s;margin-bottom:8mm}
.figura .par{display:grid;gap:8mm;align-content:center}
.figura svg{width:100%%;height:auto;max-height:%(FIGH)smm}
.figura .leg{font-size:%(F105)smm;line-height:1.22;margin-top:2mm;text-align:center}
.figura .leg b{color:%(COR)s}
.juntos{background:#fff;border:1.2mm dashed %(COR)s;padding:10mm;display:grid;
  grid-template-rows:auto minmax(0,1fr)}
.juntos h2{font-family:'MuralMono',monospace;font-size:%(F85)smm;letter-spacing:.2em;
  text-transform:uppercase;color:%(COR)s;margin-bottom:6mm}
/* Pauta desenhada linha a linha, não com `repeating-linear-gradient`: o gradiente pintou
   duas linhas e ignorou o resto quando a caixa cresceu, e o defeito só apareceu no PDF
   rasterizado. Doze divs com borda são previsíveis em qualquer altura. */
.juntos .pauta{display:flex;flex-direction:column;justify-content:space-between}
.juntos .pauta i{display:block;border-bottom:.7mm solid #cfcabf}


/* Tira de identificação: a alternativa à faixa monumental. No mapa radial o título já
   está no CENTRO — repetir no topo seria dizer duas vezes e roubar a área que faz o
   formato ser diferente. Aqui em cima fica só o registro: turma, unidade e validade. */
.tira{display:flex;justify-content:space-between;align-items:baseline;gap:2vw;
  padding:%(P16)smm %(P20)smm %(NG)smm;font-family:'MuralMono',monospace;
  font-size:%(F9)smm;letter-spacing:.24em;text-transform:uppercase;color:%(COR)s;
  border-bottom:.8mm solid %(COR)s;margin:0 %(P20)smm}

/* Marcos da espinha: a data em mono, o assunto em corpo de conversa. O marco de HOJE
   ganha o acento — é a única coisa no cartaz que muda de semana para semana, e é a
   primeira que o aluno procura. */
.mapa .marco{position:absolute}
.mapa .marco .quando{font-family:'MuralMono',monospace;font-size:%(F85)smm;
  letter-spacing:.14em;color:%(COR)s;font-weight:700}
.mapa .marco .oque{font-size:%(F105)smm;line-height:1.2;margin-top:%(NG)smm}
.mapa .marco.agora .quando{color:#B26A00}
.mapa .marco.agora .oque{font-weight:700}

/* ------------------------------------------------------------- mapa radial ---- */
/* O mapa é posicionado em mm ABSOLUTOS do cartaz: as caixas e os fios usam as
   mesmas coordenadas, e a tira de topo e o rodapé ficam por cima, nas faixas que
   o `topo_mm` já reservou. */
.cartaz.livre{position:relative;display:block}
.cartaz.livre .tira{position:absolute;top:0;left:0;right:0;z-index:2}
.cartaz.livre .rodape{position:absolute;bottom:%(NG)smm;left:0;right:0;z-index:2}
.mapa{position:absolute;inset:0;width:100%%}
.mapa .fios{position:absolute;inset:0;width:100%%;height:100%%}
.mapa .no,.mapa .centro{position:absolute;box-sizing:border-box}
.mapa .no{background:%(TIN)s;padding:%(NP)smm;border-top:1.6mm solid %(COR)s}
.mapa .no.fazer{background:#fff;border-top-color:#16181d;
  box-shadow:inset 0 0 0 .5mm #e2ded7}
.mapa .no.cuidado{background:#fff;border-top-color:#B26A00;
  box-shadow:inset 0 0 0 .5mm #f0e2c8}
.mapa .no h3{font-family:'MuralMono',monospace;font-size:%(F85)smm;letter-spacing:.18em;
  text-transform:uppercase;margin-bottom:%(NG)smm}
.mapa .no .txt{font-size:%(F11)smm;line-height:1.28}
.mapa .no .txt p{margin-bottom:%(NG)smm}
.mapa .no .txt p:last-child{margin-bottom:0}
.mapa .no .txt b{color:%(COR)s}
.mapa .no.cuidado .txt b{color:#B26A00}
.mapa .centro{background:%(COR)s;color:#FBFAF8;display:grid;align-content:center;
  padding:%(NP)smm;text-align:center}
.mapa .centro .chapeu{font-family:'MuralMono',monospace;font-size:%(F9)smm;
  letter-spacing:.26em;text-transform:uppercase;opacity:.85}
.mapa .centro h2{font-family:'MuralDisplay',sans-serif;font-size:%(F30)smm;line-height:.9;
  margin:%(NG)smm 0}
.mapa .centro .sub{font-size:%(F105)smm;line-height:1.2;opacity:.9}
.rodape{display:flex;justify-content:space-between;align-items:baseline;
  padding:12mm 20mm 0;font-family:'MuralMono',monospace;font-size:%(F75)smm;
  letter-spacing:.18em;text-transform:uppercase;color:#8a8d92;
  border-top:.6mm solid #d8d5cf;margin:12mm 20mm 0}
""" % dict(L=largura_mm, A=altura_mm, COR=cor, TIN=tinta, ACE=acento,
           P22=mm(22), P20=mm(20), P16=mm(16), F13=mm(13), F64=mm(64),
           F9=mm(9), F85=mm(8.5), F11=mm(11), F125=mm(12.5), F22=mm(22),
           F105=mm(10.5), F75=mm(7.5), FIGH=mm(78), FIGS=mm(96),
           F30=mm(30), NP=mm(9), NG=mm(4))


def reta_numerica(cor, ponto, aberto, direita, rotulo):
    """Uma reta numérica de parede: ponto aberto ou fechado, e o lado que vale.

    Existe aqui e não no `mural_lib` porque é figura de CARTAZ — traço grosso, raio
    grande, legível a dois metros. A mesma figura em A4 sairia com traço de cabelo.
    """
    x = 30 + (ponto + 3) * 90
    seta = ('<path d="M %d 60 L 560 60" stroke="%s" stroke-width="9" fill="none"/>'
            '<path d="M 560 60 l -26 -14 l 0 28 z" fill="%s"/>' % (x, cor, cor)) if direita \
        else ('<path d="M %d 60 L 40 60" stroke="%s" stroke-width="9" fill="none"/>'
              '<path d="M 40 60 l 26 -14 l 0 28 z" fill="%s"/>' % (x, cor, cor))
    ticks = "".join(
        '<line x1="%d" y1="52" x2="%d" y2="68" stroke="#9aa0a8" stroke-width="4"/>'
        '<text x="%d" y="92" text-anchor="middle" font-size="22" fill="#6d7075">%d</text>'
        % (30 + (n + 3) * 90, 30 + (n + 3) * 90, 30 + (n + 3) * 90, n)
        for n in range(-3, 4))
    bolinha = ('<circle cx="%d" cy="60" r="16" fill="#fff" stroke="%s" stroke-width="9"/>'
               % (x, cor)) if aberto else \
              ('<circle cx="%d" cy="60" r="16" fill="%s"/>' % (x, cor))
    return ('<div><svg viewBox="0 0 600 110" role="img" aria-label="%s">'
            '<line x1="20" y1="60" x2="580" y2="60" stroke="#c9c6c0" stroke-width="4"/>'
            '%s%s%s</svg><div class="leg">%s</div></div>'
            % (rotulo, ticks, seta, bolinha, rotulo))


def matriz(linhas, cor="#16181d", setas=None, coluna_destaque=None,
           destaque="#B26A00", largura=None):
    """Uma matriz entre colchetes, em SVG, no tamanho de parede.

    O `handout_lib.matriz` desenha a matriz da FOLHA: `inline-table`, colchete de 2px,
    corpo de 10pt e cores vindas das variáveis CSS do handout. Nada disso sobrevive num
    cartaz — 2px a dois metros é um fio, e as variáveis não existem aqui.

    Esta desenha a matriz do CARTAZ: colchete grosso com serifa, célula grande, e dois
    recursos que só fazem sentido na parede:

    - `setas=[(i0,j0,i1,j1,cor), …]` — as diagonais do determinante 2×2, que é o que
      transforma "ad − bc" de fórmula decorada em caminho que se vê;
    - `coluna_destaque` — a coluna trocada em Cramer, em dourado. É o erro nº 1 daquela
      aula: trocar a linha em vez da coluna.

    Dele, em 17/08, olhando o mural de matrizes: *"era legal umas matrizes mais."*
    Cartaz de álgebra sem álgebra desenhada é lista de regras — e lista de regras o aluno
    já tem na folha.
    """
    m, n = len(linhas), len(linhas[0])
    cw, ch = 78.0, 62.0
    pad = 26.0
    largura_vb = n * cw + 2 * pad
    altura_vb = m * ch + 28
    def centro(i, j):
        return (pad + (j + 0.5) * cw, 14 + (i + 0.5) * ch)

    partes = []
    if coluna_destaque is not None:
        x = pad + coluna_destaque * cw
        partes.append('<rect x="%.1f" y="8" width="%.1f" height="%.1f" rx="8" '
                      'fill="%s" opacity=".16"/>' % (x, cw, altura_vb - 16, destaque))
    # colchetes: haste + serifa em cima e embaixo
    for x, s in ((pad - 12, 1), (largura_vb - pad + 12, -1)):
        partes.append('<path d="M %.1f 10 L %.1f 10 L %.1f %.1f L %.1f %.1f" '
                      'stroke="%s" stroke-width="7" fill="none" stroke-linecap="square"/>'
                      % (x + s * 16, x, x, altura_vb - 10, x + s * 16, altura_vb - 10, cor))
    for i, linha in enumerate(linhas):
        for j, valor in enumerate(linha):
            cx, cy = centro(i, j)
            partes.append('<text x="%.1f" y="%.1f" text-anchor="middle" '
                          'dominant-baseline="central" font-size="40" font-weight="700" '
                          'fill="%s">%s</text>' % (cx, cy, cor, valor))
    for (i0, j0, i1, j1, cs) in (setas or []):
        x0, y0 = centro(i0, j0)
        x1, y1 = centro(i1, j1)
        # encurta a seta para não encostar no algarismo
        dx, dy = x1 - x0, y1 - y0
        norma = (dx * dx + dy * dy) ** .5 or 1
        k = 12 / norma   # encurta só o suficiente para não encostar no algarismo
        partes.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" '
                      'stroke-width="6" marker-end="url(#p%s)"/>'
                      % (x0 + dx * k, y0 + dy * k, x1 - dx * k, y1 - dy * k, cs,
                         cs.lstrip("#")))
    marcadores = "".join(
        '<marker id="p%s" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" '
        'markerHeight="5" orient="auto-start-reverse">'
        '<path d="M 0 0 L 10 5 L 0 10 z" fill="%s"/></marker>'
        % (cs.lstrip("#"), cs) for (_a, _b, _c, _d, cs) in (setas or []))
    estilo = ' style="max-width:%s"' % largura if largura else ""
    return ('<svg viewBox="0 0 %.0f %.0f"%s><defs>%s</defs>%s</svg>'
            % (largura_vb, altura_vb, estilo, marcadores, "".join(partes)))



# ---------------------------------------------------------------- mapa radial ----
# A estrutura vem do "Revisaí" do Poliedro, que ele apontou como referência em 17/08: um
# centro e ramos que mostram COMO AS PARTES SE LIGAM — que é justamente o que a grade de
# blocos não diz. A execução, não: o Revisaí usa papel quadriculado impresso, setas
# curvas e uma cor nova por assunto, e as três coisas contrariam o `filosofia_visual.md`
# ("a retícula jamais impressa, sempre sentida"; "a única curva permitida é a que pertence
# a um símbolo"; "cada nova cor é uma renúncia à autoridade da anterior").
#
# Então: estrutura emprestada, gramática nossa. Conectores ORTOGONAIS, como um andaime —
# e a cor sai da paleta fechada que já existe, mudando de PAPEL e não de matiz:
#
#   dominante  → o que é (definição, o objeto)
#   tinta      → o que se faz (procedimento)
#   acento     → o que trai (a armadilha, o erro típico)
#
# É a mesma paleta dos outros murais. O que muda é que aqui ela carrega SIGNIFICADO, e o
# aluno aprende o código em dez segundos.
PAPEIS = ("objeto", "fazer", "cuidado")


def mapa(centro, ramos, largura_mm, altura_mm, tema="y9", topo_mm=0):
    """Um mapa radial: centro ancorado, ramos em duas colunas, conectores ortogonais.

    `centro`: (chapeu, titulo, subtitulo)
    `ramos`:  [(papel, titulo, html[, peso])] — a ordem preenche a coluna esquerda e
    depois a direita, de cima para baixo. O `peso` (padrão 1) distribui a altura: uma
    caixa com matriz desenhada precisa de mais do que uma com três linhas de texto, e sem
    isso metade dos ramos fica com um vão embaixo enquanto a outra metade aperta.

    Tudo é posicionado em MILÍMETROS, e o desenho dos conectores usa as mesmas
    coordenadas das caixas: é o que garante que a linha encosta na caixa em qualquer
    tamanho de cartaz, sem uma segunda fonte de verdade para a mesma posição.
    """
    cor, tinta, acento = mu.CORES.get(tema, mu.CORES["neutro"])
    tom = {"objeto": cor, "fazer": "#16181d", "cuidado": "#B26A00"}

    margem = round(largura_mm * 0.035)
    util_l = largura_mm - 2 * margem
    topo = topo_mm + margem
    util_a = altura_mm - topo - margem

    lado_l = round(util_l * 0.295)          # largura de cada coluna de ramos
    centro_l = round(util_l * 0.30)
    centro_a = round(util_a * 0.24)
    x_esq, x_dir = margem, largura_mm - margem - lado_l
    x_cen = round((largura_mm - centro_l) / 2)
    y_cen = round(topo + (util_a - centro_a) / 2)

    metade = (len(ramos) + 1) // 2
    colunas = [ramos[:metade], ramos[metade:]]

    caixas, linhas = [], []
    for lado, grupo in enumerate(colunas):
        if not grupo:
            continue
        x = x_esq if lado == 0 else x_dir
        # altura de cada ramo: divide a área útil, com um respiro entre eles
        respiro = round(util_a * 0.045)
        pesos = [(r[3] if len(r) > 3 else 1.0) for r in grupo]
        livre = util_a - respiro * (len(grupo) - 1)
        alturas = [livre * w / sum(pesos) for w in pesos]
        y = topo
        for i, r in enumerate(grupo):
            papel, titulo, html = r[0], r[1], r[2]
            alt = round(alturas[i])
            caixas.append(
                '<div class="no %s" style="left:%dmm;top:%dmm;width:%dmm;height:%dmm">'
                '<h3 style="color:%s">%s</h3><div class="txt">%s</div></div>'
                % (papel, x, round(y), lado_l, alt, tom.get(papel, cor), titulo, html))
            # conector ortogonal: sai do centro, vai até o meio do vão, sobe/desce, entra
            ym = y + alt / 2.0
            y += alt + respiro
            if lado == 0:
                x0, x1 = x_cen, x + lado_l
                xm = (x0 + x1) / 2.0
            else:
                x0, x1 = x_cen + centro_l, x
                xm = (x0 + x1) / 2.0
            y0 = y_cen + centro_a / 2.0
            linhas.append(
                '<path d="M %.1f %.1f H %.1f V %.1f H %.1f" stroke="%s" stroke-width="1.1" '
                'fill="none" stroke-linejoin="miter"/>'
                '<circle cx="%.1f" cy="%.1f" r="1.9" fill="%s"/>'
                % (x0, y0, xm, ym, x1, tom.get(papel, cor), x1, ym,
                   tom.get(papel, cor)))

    chapeu, titulo, sub = centro
    return (
        '<div class="mapa">'
        '<svg class="fios" viewBox="0 0 %d %d" preserveAspectRatio="none">%s</svg>'
        '<div class="centro" style="left:%dmm;top:%dmm;width:%dmm;height:%dmm">'
        '<div class="chapeu">%s</div><h2>%s</h2><div class="sub">%s</div></div>'
        '%s</div>'
        % (largura_mm, altura_mm, "".join(linhas),
           x_cen, y_cen, centro_l, centro_a, chapeu, titulo, sub, "".join(caixas)))




def espinha(marcos, blocos, largura_mm, altura_mm, tema="y9", topo_mm=0, agora=None):
    """Linha do tempo VERTICAL à esquerda, conteúdo pendurado à direita.

    A terceira estrutura da família, e ela existe pelo mesmo motivo das outras duas: dele,
    em 17/08, *"os murais tão todos iguais"*. Painel de unidade e mapa radial respondem a
    perguntas diferentes; este responde à do painel — *onde estamos e o que vem* — com um
    esqueleto que não é a grade de blocos.

    A leitura passa a ser de cima para baixo, como o calendário realmente anda, e o marco
    de HOJE fica marcado no fio. `agora` é o índice do marco atual.

    `marcos`: [(quando, o quê)] · `blocos`: [(papel, titulo, html[, peso])]
    """
    cor, tinta, acento = mu.CORES.get(tema, mu.CORES["neutro"])
    tom = {"objeto": cor, "fazer": "#16181d", "cuidado": "#B26A00"}

    margem = round(largura_mm * 0.035)
    topo = topo_mm + margem
    util_a = altura_mm - topo - margem
    fio_x = margem + round(largura_mm * 0.055)
    col_esq_l = round(largura_mm * 0.26)
    x_dir = margem + col_esq_l + round(largura_mm * 0.045)
    larg_dir = largura_mm - margem - x_dir

    passo = util_a / max(1, len(marcos))
    partes, svg = [], ['<line x1="%d" y1="%.1f" x2="%d" y2="%.1f" stroke="%s" '
                       'stroke-width="1.2" opacity=".45"/>'
                       % (fio_x, topo, fio_x, topo + util_a, cor)]
    for i, (quando, oque) in enumerate(marcos):
        y = topo + i * passo + passo * 0.28
        destaque = (agora is not None and i == agora)
        svg.append('<circle cx="%d" cy="%.1f" r="%.1f" fill="%s"/>'
                   % (fio_x, y, 3.4 if destaque else 2.0,
                      acento if destaque else cor))
        partes.append(
            '<div class="marco%s" style="left:%dmm;top:%.1fmm;width:%dmm">'
            '<div class="quando">%s</div><div class="oque">%s</div></div>'
            % (" agora" if destaque else "", fio_x + 7, y - 7,
               col_esq_l - 10, quando, oque))

    respiro = round(util_a * 0.035)
    pesos = [(b[3] if len(b) > 3 else 1.0) for b in blocos]
    livre = util_a - respiro * (len(blocos) - 1)
    y = topo
    for i, b in enumerate(blocos):
        alt = livre * pesos[i] / sum(pesos)
        partes.append(
            '<div class="no %s" style="left:%dmm;top:%.0fmm;width:%dmm;height:%.0fmm">'
            '<h3 style="color:%s">%s</h3><div class="txt">%s</div></div>'
            % (b[0], x_dir, y, larg_dir, alt, tom.get(b[0], cor), b[1], b[2]))
        y += alt + respiro

    return ('<div class="mapa"><svg class="fios" viewBox="0 0 %d %d" '
            'preserveAspectRatio="none">%s</svg>%s</div>'
            % (largura_mm, altura_mm, "".join(svg), "".join(partes)))


def cartaz_livre(meta, corpo, largura_mm=700, altura_mm=830, tema="y9", rodape="",
                 escala=1.0):
    """Cartaz sem a faixa monumental: uma tira de identificação, o corpo, o rodapé.

    Existe porque a faixa de topo é o que faz todos os murais parecerem o mesmo mural —
    dele, em 17/08: *"meu negócio é que os murais tão todos iguais"*. A faixa continua
    certa quando o título PRECISA ser lido do fundo da sala (o painel de unidade). Num
    mapa radial, o título está no centro, e repeti-lo no topo é dizer duas vezes.
    """
    cor, tinta, acento = mu.CORES.get(tema, mu.CORES["neutro"])
    corpo_html = (
        '<div class="cartaz livre">'
        '<div class="tira"><span>%s</span><span>%s</span></div>'
        '%s'
        '<div class="rodape"><span>%s</span><span>%s</span></div>'
        '</div>'
        % (meta.get("turma", ""), meta.get("chapeu", ""), corpo,
           meta.get("unidade", ""), rodape))
    return ('<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
            '<title>%s</title>\n<style>%s\n.cartaz.livre{grid-template-rows:auto '
            'minmax(0,1fr) auto}</style>\n</head>\n<body>\n%s\n</body>\n</html>'
            % (meta.get("titulo", "Mural"),
               _css(largura_mm, altura_mm, cor, tinta, acento, escala), corpo_html))


def cartaz(meta, tempo, blocos_esquerda, blocos_direita, vocab=(), figura=None,
           juntos=None, largura_mm=630, altura_mm=891, tema="y9", rodape=""):
    """A arte inteira, numa página só.

    `tempo`: [(quando, o quê, é_prova)] — a linha do tempo da unidade.
    `blocos_*`: [(título, [itens], classe)] — `classe` pode ser "tres" para a numeração
    grande, ou "" para lista simples.
    """
    cor, tinta, acento = mu.CORES.get(tema, mu.CORES["neutro"])

    paradas = "".join(
        '<div class="parada%s"><div class="quando">%s</div>'
        '<div class="oque">%s</div></div>'
        % (" prova" if prova else "", quando, oque)
        for quando, oque, prova in tempo)

    def coluna(blocos):
        return "".join(
            '<div class="bloco"><h2>%s</h2><ul class="%s">%s</ul></div>'
            % (titulo, classe, "".join("<li>%s</li>" % i for i in itens))
            for titulo, itens, classe in blocos)

    voc = ('<div class="bloco"><h2>Words of the unit</h2><div class="vocab">%s</div></div>'
           % "".join("<span>%s</span>" % v for v in vocab)) if vocab else ""

    baixo = ""
    if figura or juntos:
        baixo = ('<div class="baixo%s">%s%s</div>'
                 % ("" if (figura and juntos) else " solo",
                    ('<div class="figura"><h2>%s</h2><div class="par">%s</div></div>'
                     % (figura[0], "".join(figura[1]))) if figura else "",
                    ('<div class="juntos"><h2>%s</h2><div class="pauta">%s</div></div>'
                     % (juntos, "<i></i>"*10)) if juntos else ""))

    solo = " solo" if not (blocos_esquerda and blocos_direita) else ""
    corpo = (
        '<div class="cartaz">'
        '<div class="faixa"><div class="chapeu">%s</div><h1>%s</h1>'
        '<div class="turma">%s</div></div>'
        '<div class="tempo">%s</div>'
        '<div class="miolo%s"><div class="coluna">%s</div>'
        '<div class="coluna">%s%s</div></div>'
        '%s'
        '<div class="rodape"><span>%s</span><span>%s</span></div>'
        '</div>'
        % (meta.get("chapeu", ""), meta.get("titulo", ""), meta.get("turma", ""),
           paradas, solo, coluna(blocos_esquerda), coluna(blocos_direita), voc, baixo,
           meta.get("unidade", ""), rodape or "sobe no primeiro dia da unidade"))

    return ('<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<title>%s</title>\n<style>%s</style>\n</head>\n<body>\n%s\n</body>\n</html>'
            % (meta.get("titulo", "Mural"),
               _css(largura_mm, altura_mm, cor, tinta, acento), corpo))


def conferir(caminho_html):
    """O conteúdo cabe na página? Mede no Chrome e devolve o transbordo em mm.

    Existe porque o mesmo defeito aconteceu duas vezes em 17/08: um cartaz com um terço
    vazio e outro cortado por baixo — os dois passaram pelo gerador sem uma reclamação,
    porque `overflow` esconde na tela e o PDF simplesmente corta. Cartaz que corta perde o
    último bloco, que é onde está o conteúdo mais novo.

    Transbordo positivo = cortou.
    """
    import json
    import re as _re
    import subprocess
    chrome = topdf.chrome_bin()
    if not chrome:
        return "não encontrei o Chrome (topdf.chrome_bin() não resolveu nenhum caminho)"
    # Medir SÓ DEPOIS de as fontes carregarem: elas vão embutidas em base64 e a métrica
    # delas é diferente da fallback do sistema. Medindo antes, o texto quebra em mais
    # linhas do que quebrará na impressão e o portão reprova cartaz que está certo — foi o
    # que aconteceu na primeira versão.
    script = ("document.fonts.ready.then(function(){"
              "var c=document.querySelector('.cartaz');"
              "document.title = JSON.stringify({h:c.scrollHeight, v:c.clientHeight});});")
    # `file://` exige caminho ABSOLUTO. Chamado com caminho relativo — de um script de
    # lote, de um teste — o Chrome não carregava nada, o título voltava intacto e a
    # medição virava "não deu para medir". Enquanto essa frase dizia "sem Chrome",
    # ninguém tinha como perceber; foi o primeiro defeito que a mensagem honesta achou.
    marcado = caminho_html + ".medir.html"
    with open(caminho_html, encoding="utf-8") as f:
        doc = f.read()
    with open(marcado, "w", encoding="utf-8") as f:
        f.write(doc.replace("</body>", "<script>%s</script></body>" % script))
    try:
        proc = subprocess.run(
            [chrome, "--headless", "--disable-gpu",
             "--virtual-time-budget=6000", "--dump-dom", "file://" + os.path.abspath(marcado)],
            capture_output=True, timeout=120)
        saida = proc.stdout.decode("utf-8", "replace")
    finally:
        os.remove(marcado)
    m = _re.search(r"<title>(.*?)</title>", saida, _re.S)
    if not m:
        return ("o Chrome rodou e não devolveu a medição (saída %d)" % proc.returncode)
    try:
        d = json.loads(m.group(1).replace("&quot;", '"'))
    except ValueError:
        return "a medição do transbordo voltou ilegível"
    return round((d["h"] - d["v"]) / (96 / 25.4), 1)   # px CSS -> mm


def conferir_caixas(caminho_html):
    """Cada caixa cabe no que ela mesma reservou? Devolve [(titulo, transbordo_mm), ...].

    Existe porque `conferir()` mede a FOLHA inteira, e a folha pode sobrar enquanto uma
    caixa individual vaza: foi o que aconteceu em 08/09 no mapa do ciclo, em que o SVG
    passava da borda da caixa (o rótulo de 270° e a linha de fecho saíam para fora) e o
    portão passou verde, porque a soma continuava cabendo. Transbordo de caixa não corta o
    PDF, faz coisa pior — encavala em cima da caixa vizinha e o aluno lê texto por cima de
    desenho.

    Mede as duas direções: altura (texto a mais) e largura (figura larga demais).
    Transbordo positivo = vazou.
    """
    import json
    import re as _re
    import subprocess
    chrome = topdf.chrome_bin()
    if not chrome:
        return "não encontrei o Chrome (topdf.chrome_bin() não resolveu nenhum caminho)"
    script = ("document.fonts.ready.then(function(){"
              "var r=[];"
              "document.querySelectorAll('.centro,.no').forEach(function(n){"
              "var t=n.querySelector('h2,h3');"
              "r.push([t?t.textContent.trim():'(sem titulo)',"
              "n.scrollHeight-n.clientHeight, n.scrollWidth-n.clientWidth]);});"
              "document.title = JSON.stringify(r);});")
    marcado = caminho_html + ".caixas.html"
    with open(caminho_html, encoding="utf-8") as f:
        doc = f.read()
    with open(marcado, "w", encoding="utf-8") as f:
        f.write(doc.replace("</body>", "<script>%s</script></body>" % script))
    try:
        proc = subprocess.run(
            [chrome, "--headless", "--disable-gpu",
             "--virtual-time-budget=6000", "--dump-dom", "file://" + os.path.abspath(marcado)],
            capture_output=True, timeout=120)
        saida = proc.stdout.decode("utf-8", "replace")
    finally:
        os.remove(marcado)
    m = _re.search(r"<title>(.*?)</title>", saida, _re.S)
    if not m:
        return "o Chrome rodou e não devolveu a medição das caixas (saída %d)" % proc.returncode
    bruto = m.group(1).replace("&quot;", '"').replace("&amp;", "&")
    bruto = bruto.replace("&lt;", "<").replace("&gt;", ">")
    try:
        linhas = json.loads(bruto)
    except ValueError:
        return "a medição das caixas voltou ilegível"
    mm = 96 / 25.4
    return [(nome, round(max(dh, dw) / mm, 1)) for nome, dh, dw in linhas]


def grade_de(largura_mm, altura_mm):
    """Quantas A4 a arte equivale, e se a equivalência é EXATA.

    O tamanho não precisa mais ser múltiplo de A4 — dele, em 17/08: *"você não precisa se
    prender a A4. Qualquer formato grande que seja melhor serve. Pode ser até quadrado.
    Sempre dá pra usar tesoura pra juntar as partes."* Então a grade virou referência
    aproximada, e dizer "3×3" para 700×950 seria mentir por 11%: o `≈` é o que impede
    alguém de mandar imprimir em nove A4 achando que vai fechar na régua.
    """
    def tentar(cw, ch):
        c, l = largura_mm / cw, altura_mm / ch
        if abs(c - round(c)) < 0.02 and abs(l - round(l)) < 0.02:
            return round(c), round(l)
        return None

    # Duas passadas: A4 em pé e A4 DEITADA. Sem a segunda, 891 × 630 — que é exatamente
    # 3 × 3 folhas deitadas — era reportado como "≈ 4×2 A4", e a mensagem do gerador
    # passava a mentir justo no número que vai para o pedido da gráfica.
    exato = tentar(210, 297) or tentar(297, 210)
    if exato:
        return "%d×%d A4" % exato
    return "≈ %d×%d A4" % (round(largura_mm / 210.0), round(altura_mm / 297.0))


def build(html, out_dir, nome, largura_mm=630, altura_mm=891):
    os.makedirs(out_dir, exist_ok=True)
    caminho = os.path.join(out_dir, nome + ".html")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK ->", caminho)
    if os.environ.get("SEM_PDF") == "1":
        return caminho  # synthetic specimen: browser gate prints later
    transbordo = conferir(caminho)
    if isinstance(transbordo, str) or transbordo is None:
        print("   ATENÇÃO — o transbordo NÃO foi medido: %s"
              % (transbordo if isinstance(transbordo, str) else "motivo desconhecido"))
        raise RuntimeError("Mural não medido; impressão bloqueada")
    if transbordo is None:
        pass
    elif transbordo > 1:
        raise SystemExit("ERRO: o cartaz transborda %.1f mm — o PDF vai CORTAR o último "
                         "bloco. Enxugue o conteúdo ou aumente a folha." % transbordo)
    else:
        print("   cabe na folha (sobra %.1f mm)" % abs(transbordo))
    caixas = conferir_caixas(caminho)
    if isinstance(caixas, str):
        raise RuntimeError("Caixas não medidas; impressão bloqueada: "+caixas)
    if caixas is None:
        pass
    else:
        vazando = [(n, t) for n, t in caixas if t > 1]
        if vazando:
            raise SystemExit(
                "ERRO: %d caixa(s) vazam o próprio quadro — encavalam a vizinha:\n%s"
                % (len(vazando),
                   "\n".join("   · %s: %.1f mm para fora" % (n, t) for n, t in vazando)))
        print("   %d caixas medidas, nenhuma vaza" % len(caixas))
    pdf = topdf.gerar(caminho)
    if not pdf:
        print("   ATENÇÃO — não saiu PDF, só o HTML (o navegador não gerou).")
        return caminho
    print("   PDF -> %s  ·  %d × %d mm  ·  %s"
          % (os.path.basename(pdf), largura_mm, altura_mm,
             grade_de(largura_mm, altura_mm)))
    return caminho
