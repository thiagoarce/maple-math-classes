#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Tokens de identidade visual para papel e projeção; valores compartilhados."""

import base64
import os

DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(DIR, "fontes")


# ============================================================
# FRENTES — a cor que diz de onde a peça é
# ============================================================
# Fonte: `handout_lib.THEMES` + `mural_lib.CORES` + `slides_y9_lib.TEMAS`, que já
# coincidiam nas cores fortes. A regra pedagógica está em
# `_mural/validated-decisions.md` (22/08): a cor da frente IDENTIFICA onde a peça mora;
# a cor de conteúdo EXPLICA o que acontece dentro dela. Dourado é destaque transversal,
# nunca identificador de frente.
FRENTES = {
    "mat1":   {"forte": "#C0272D", "tinta_papel": "#FDF3F3", "tinta_parede": "#FBEDED",
               "acento_papel": "#F5A800", "acento_parede": "#F5A800"},
    "mat2":   {"forte": "#1D4999", "tinta_papel": "#EEF2F9", "tinta_parede": "#EAF0FA",
               "acento_papel": "#F5A800", "acento_parede": "#00A3B8"},
    "y9":     {"forte": "#2E7D32", "tinta_papel": "#EDF6EE", "tinta_parede": "#EDF6EE",
               "acento_papel": "#F5A800", "acento_parede": "#F5A800"},
    "entrep": {"forte": "#6B3FA0", "tinta_papel": "#F2ECF9", "tinta_parede": "#F2ECF9",
               "acento_papel": "#F5A800", "acento_parede": "#F5A800"},
    "neutro": {"forte": "#16181d", "tinta_papel": "#F2F2F3", "tinta_parede": "#F2F2F3",
               "acento_papel": "#F5A800", "acento_parede": "#F5A800"},
}


# ============================================================
# PALETA FUNCIONAL — a cor que diz o que está acontecendo
# ============================================================
# Fonte: tokens do `handout_lib`, onde cada cor já carrega um papel pedagógico fixo.
PALETA = {
    "ouro":   "#F5A800",   # diagnóstica, macete, destaque transversal
    "verde":  "#2E7D32",   # exemplo resolvido, Questão do Dia
    "roxo":   "#6B3FA0",   # exercício, autoavaliação
    "vermelho": "#C0272D",
    "azul":   "#1D4999",
    "ouro_tinta":  "#FFF8E6",
    "verde_tinta": "#F2F8F2",
    "roxo_tinta":  "#F7F3FB",
    "roxo_borda":  "#cbb8e0",
}


# ============================================================
# NEUTROS
# ============================================================
NEUTROS = {
    # A tinta do papel É a tinta da parede, desde 25/08. Era `#1a1a1a` — um cinza quase
    # preto que ninguém decidiu, herdado do CSS de 2026 — enquanto o mural e a lâmina já
    # escreviam em `#172f43`. Duas tintas é o começo de dois dialetos, e a folha impressa
    # ao lado do mural mostrava a diferença. O valor é o mesmo de
    # `primitivas.CORES["ink_parede"]`, e `checar_identidade.py` reprova se os dois
    # divergirem.
    "tinta":   "#172f43",   # texto principal — a mesma da parede
    "meta":    "#333",      # linha de metadados
    "surdo":   "#555",      # subtítulo, legenda
    "borda":   "#bbb",
    "mesa":    "#888",      # fundo de tela atrás da folha (some na impressão)
    "papel":   "#FBFAF8",   # papel do mural e da lâmina: o halo é do fundo, não branco
    # Os três abaixo entram com a pele do handout (HO-01, aprovada em 25/08). Já existiam
    # em `primitivas.CORES` para as peças de parede; passam a ser catalogados aqui porque
    # agora o papel também os usa, e o que duas superfícies compartilham mora na
    # identidade.
    "papel_titulo": "#fff4bd",   # o campo amarelo atrás do título
    "azul_pale":    "#e7f0fa",   # fundo de caixa de fórmula
    "azul_medio":   "#4f8dd4",   # contorno do numeral vazado
}


# ============================================================
# SOMBRA — o relevo sólido, que é sempre a tinta com alfa
# ============================================================
# A identidade tem um relevo só: deslocamento sólido, sem desfoque, na cor da tinta. Ele
# aparece no papel de título, na pílula de seção, no cartão e na lacuna, e a diferença
# entre eles é de OPACIDADE, não de cor.
#
# Estava escrito à mão cinco vezes como `rgba(23,47,67,.13)` dentro do `handout_lib`. É a
# tinta pela quarta vez, numa forma que o portão de identidade nem enxergava — ele lê
# hexadecimal, e `rgb()` passava batido. Consolidado em 25/08, junto com o portão que
# agora lê as duas notações.
ALFA_SOMBRA = {
    "titulo": 1.0,     # o papel de título tem sombra CHEIA: é o objeto mais forte da folha
    "secao":  0.18,
    "cartao": 0.13,
    "lacuna": 0.12,
}


def rgba(cor_hex, alfa):
    """`#172f43` + 0.13 → `rgba(23,47,67,.13)`. Alfa 1 devolve o próprio hexadecimal."""
    if alfa >= 1:
        return cor_hex
    h = cor_hex.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return "rgba(%d,%d,%d,%s)" % (r, g, b, ("%.2f" % alfa).lstrip("0").rstrip("0"))


# ============================================================
# PAPEL — escala e espaçamento da folha A4
# ============================================================
# Referência histórica omitida.
# altura útil da folha depende disto e a zona segura do timbrado é de 30mm.
ESCALA_PAPEL = {
    "fm": "11pt", "titulo": "15pt", "secao": "10pt", "corpo": "9.5pt",
    "meta": "8.5pt", "pgnum": "8pt", "tag": "7.5pt", "legenda": "7pt",
}

ESPACO_PAPEL = {"1": "1mm", "1-5": "1.5mm", "2": "2mm", "3": "3mm", "4": "4mm"}

# A entrelinha do corpo, DECLARADA — e isto foi aprendido trocando a face em 23/08.
#
# Até então o handout não declarava `line-height` nenhum: usava o `normal` do navegador,
# que é calculado a partir das métricas internas da fonte. Trocar Inter por Instrument
# Sans levou a caixa de linha de 14px para 15px, 7% a mais, e duas páginas de uma aula
# cheia passaram a transbordar — sem que uma linha de conteúdo tivesse mudado.
#
# Referência histórica omitida.
# independente da face: trocar de tipografia deixa de mexer no ritmo da página.
ENTRELINHA_PAPEL = "1.1"

# A arte do timbrado sobe 30mm do pé. Mesma medida que o `paginador_handout.js` chama de
# respiro e que o `verificar_aula.py` confere no PDF impresso.
ZONA_SEGURA_MM = 30


# ============================================================
# LÂMINA — medida nos goldens, 24/08
# ============================================================
# Ficou vazio de propósito enquanto os goldens não fechavam: preencher antes seria eu
# escolhendo uma média entre o `clamp()` do `slides_y9_lib.py` e o conjunto do
# `slides_lib.py`, que é exatamente o que este arquivo existe para impedir.
#
# Agora os valores vêm MEDIDOS das oito famílias congeladas por ele em 24/08
# (SL-01, 02, 03, 04, 05b, 05c, 05d, 06, 07, 08), não propostos.
#
# A superfície vem antes da escala, porque a escala só significa alguma coisa em cima dela:
# a lâmina é uma superfície FÍSICA, extraída do mural de pirâmides (`@page 420mm 297mm`,
# contorno `.55mm`, sombra `1.3mm`). Projetada, 320 × 180 mm a 5 px/mm dão os 1600 × 900 px
# — e o milímetro continua sendo a unidade em que se pensa, o pixel só o resultado.
LAMINA_MM = (320, 180)
LAMINA_PX_POR_MM = 5.0

# Os degraus ESTÁVEIS: repetidos, com o mesmo valor, em todas as famílias. Em mm.
ESCALA_LAMINA = {
    "meta": 2.8,        # etiqueta do cabeçalho, mono, caixa alta
    "rotulo": 2.9,      # pílula e crachá
    "corpo_p": 3.8,     # apoio, legenda de cartão
    "corpo": 4.8,       # texto de leitura da lâmina
    "corpo_g": 5.4,     # apoio que precisa ser lido de longe (SL-03, SL-06, SL-12)
    "subhead": 6.4,     # enunciado, critério, pergunta operacional
    "math": 8.8,        # matemática de linha
    "math_hero": 15.2,  # matemática que É a lâmina

    # Dois papéis que não são "título maior", e por isso são degrau e não faixa. Vieram das
    # famílias de 24/08 e cada um tem uma razão de leitura própria:
    "dado_tabela": 11.0,  # número dentro de coluna — o olho compara a FORMA da coluna
    "cronometro": 30.0,   # o tempo, lido do fundo da sala NO MEIO da atividade, de relance
}

# O TOPO da escala não é um degrau, é uma faixa — e isto é achado, não preferência.
#
# Título e hero variam de família para família (SL-04 usa 10,4; SL-01 e SL-02, 11,2; SL-07,
# 12,4; a fórmula hero da SL-05c chega a 24), e a variação tem causa: numa lâmina projetada
# o título disputa a tela com o objeto matemático. Onde o objeto é o herói (abertura), o
# título recua; onde a instrução é tudo o que existe (SL-07), ele avança.
#
# Registrar como faixa é a leitura honesta do que foi congelado. Fixar um número só faria
# uma das oito peças aprovadas passar a estar fora da própria tabela.
FAIXA_TITULO_LAMINA = (10.4, 12.4)
FAIXA_HERO_LAMINA = (11.4, 24.0)

# ACHADO de 24/08, ao congelar as seis famílias novas, e registrado porque contradiz o que
# eu tinha escrito acima.
#
# Escrevi que sete degraus eram estáveis "em todas as famílias" e depois produzi seis
# famílias que usaram, à mão, 5,4 · 6,6 · 7,0 · 7,6 · 11,0 · 30,0. Nenhum portão reclamou,
# porque essas peças escrevem o número direto no CSS em vez de pedir a `TIPO`.
#
# Duas coisas diferentes estavam misturadas nesses seis números:
#
# 1. **papéis novos**, que subiram para a tabela acima — o número de tabela e o tempo do
#    cronômetro. O tempo em 30 mm está muito além da faixa de hero (11,4–24), e está certo:
#    ele não é um título grande, é um mostrador consultado de relance do fundo da sala no
#    meio de uma atividade. Alargar a faixa de hero para caber 30 misturaria os dois papéis;
# 2. **deriva**, que é o resto — 6,6 onde havia 6,4; 7,0 onde havia 6,4; 7,6 avulso. São
#    diferenças invisíveis a três metros que existem só porque eu digitei um número em vez
#    de consultar a tabela.
#
# A faixa entre `corpo` e `math_hero` é, na prática, LIVRE: cada família compõe ali. Isso é
# a leitura honesta do que foi congelado, e não uma permissão que eu esteja concedendo — mas
# significa que a tabela acima descreve os extremos e os papéis nomeados, não a escala
# Referência histórica omitida.
FAIXA_LIVRE_LAMINA = (4.8, 15.2)

# A mão humana também é faixa, e por um motivo diferente: a anotação acompanha o tamanho do
# que ela comenta (4,6 na pista da SL-04; 5,6 na abertura; 7,0 no gancho da SL-08).
FAIXA_ANOTACAO_LAMINA = (4.6, 7.0)


# ============================================================
# TIPOGRAFIA
# ============================================================
# Referência histórica omitida.
# papel e na tela"*. Ela já era a voz dos slides do Y9 e do mural; o handout pedia `'Inter'`
# sem vendorizar, então a folha saía com a fonte que a máquina tivesse na hora de imprimir.
#
# As outras faces têm papel declarado em `mural_lib._fontes_css()` e continuam valendo:
# Big Shoulders para título monumental, Geist Mono para índice e marca de registro,
# Nothing You Could Do como a única mão humana do sistema.
FACES = {
    "texto":    [("InstrumentSans-Regular.ttf", 400), ("InstrumentSans-Bold.ttf", 700)],
    "display":  [("BigShoulders-Bold.ttf", 700)],
    "mono":     [("GeistMono-Regular.ttf", 400)],
    "mao":      [("NothingYouCouldDo-Regular.ttf", 400)],
}

# A matemática não está aqui: ela é composta pelo MathJax, não escolhida por CSS. A regra
# fechada é `MathJax compõe; Euler fala; Fira Bold enfatiza` — ver `ma_math.js` e
# `fontes/FONTES_MATEMATICAS.md`. Ênfase matemática é `\boldsymbol{}`, nunca `font-weight`.


def fonte_embutida(nome, arquivo, peso):
    """Um `@font-face` com o TTF/WOFF2 embutido em base64.

    Embutido, e não referenciado: o deck abre por `file://` no computador dele e a folha
    é rasterizada por Chrome headless. Arquivo externo falha nos dois, em silêncio, e o
    defeito só aparece impresso.

    Veio de `mural_lib._font_face()` e `slides_y9_lib._fonte()`, que eram a mesma função
    escrita duas vezes.
    """
    caminho = os.path.join(FONT_DIR, arquivo)
    if not os.path.isfile(caminho):
        return ""
    with open(caminho, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    fmt = "woff2" if arquivo.endswith(".woff2") else "truetype"
    return ("@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
            "src:url(data:font/%s;base64,%s) format('%s');}\n"
            % (nome, peso, fmt, b64, fmt))


def faces_css(mapa):
    """CSS das faces pedidas. `mapa` é {papel: nome-na-superfície}.

        faces_css({"texto": "SlideSans", "mono": "SlideMono"})
    """
    fora = []
    for papel, nome in mapa.items():
        for arquivo, peso in FACES[papel]:
            fora.append(fonte_embutida(nome, arquivo, peso))
    return "".join(fora)


def variaveis_css(frente="neutro", superficie="papel"):
    """Bloco `:root{--…}` para embutir INLINE na peça.

    Inline porque o deck aberto por `file://` não busca folha de estilo externa — a mesma
    razão do pdf.js e do MathJax vendorizados.
    """
    f = FRENTES[frente]
    lado = "papel" if superficie == "papel" else "parede"
    linhas = [
        "--c-forte:%s" % f["forte"],
        "--c-tinta-frente:%s" % f["tinta_%s" % lado],
        "--c-acento:%s" % f["acento_%s" % lado],
    ]
    linhas += ["--c-%s:%s" % (k.replace("_", "-"), v) for k, v in PALETA.items()]
    linhas += ["--c-%s:%s" % (k, v) for k, v in NEUTROS.items()]
    if superficie == "papel":
        linhas += ["--fs-%s:%s" % (k, v) for k, v in ESCALA_PAPEL.items()]
        linhas += ["--sp-%s:%s" % (k, v) for k, v in ESPACO_PAPEL.items()]
    return ":root{%s}" % ";".join(linhas)


def impressao_digital():
    """O que muda o resultado impresso, resumido para o portão comparar.

    Mesma ideia de `handout_lib.versao_da_biblioteca()`: responder "esta peça foi gerada
    com a identidade de hoje?" sem rodar o gerador.
    """
    import hashlib
    corpo = repr([FRENTES, PALETA, NEUTROS, ESCALA_PAPEL, ESPACO_PAPEL, FACES,
                  ZONA_SEGURA_MM, ENTRELINHA_PAPEL])
    return hashlib.sha256(corpo.encode("utf-8")).hexdigest()[:12]


__all__ = ["FRENTES", "PALETA", "NEUTROS", "ESCALA_PAPEL", "ESPACO_PAPEL", "ENTRELINHA_PAPEL",
           "ESCALA_LAMINA", "LAMINA_MM", "LAMINA_PX_POR_MM", "FAIXA_TITULO_LAMINA",
           "FAIXA_HERO_LAMINA", "FAIXA_ANOTACAO_LAMINA", "FAIXA_LIVRE_LAMINA",
           "FACES", "ZONA_SEGURA_MM", "fonte_embutida", "faces_css",
           "variaveis_css", "impressao_digital"]
