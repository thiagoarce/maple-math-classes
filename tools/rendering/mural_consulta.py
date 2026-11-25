#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""mural_consulta.py — a gramática do golden das pirâmides, em HTML.

## Por que existe

Ele, em 08/09/2026, escolheu o `pyramids-golden-sample-v1` como padrão das peças de
parede. O golden é escrito em TikZ, e as duas primeiras peças do 3º trimestre nasceram
assim — até o `checar_pilha_mural.py` lembrar que **a pilha do mural é HTML desde 25/08**,
e pelo motivo mais concreto possível: *"a dependência de LaTeX não é instalada por
ninguém — nem CI, nem script de preparo. Quando um container tem, tem por acaso."*

As duas coisas são compatíveis, porque o que ele aprovou foi a **língua visual**, não a
ferramenta. Este módulo é a língua:

- folha do tamanho final, em milímetro, uma página só;
- retícula de caderno ao fundo;
- chamada monumental em cartão inclinado com sombra sólida;
- a figura matemática como peça principal, em SVG;
- voz manuscrita (Comic Neue) só para anotação, nunca para conteúdo;
- matemática em Euler, pelo `ma_math.js` — offline, sem CDN;
- barra de armadilha, cartão de fórmula, e quase nenhum texto corrido.

## Como se escreve uma peça

Igual ao TikZ: **posição absoluta em milímetro**, porque peça de parede é composição, não
fluxo. O gerador de cada peça chama as primitivas abaixo e monta a folha; nada aqui decide
leiaute por conta própria.

    import mural_consulta as mc

    CORPO = (mc.chapeu("YEAR 10 · MAT 2 · TRIGONOMETRIA", tema="mat2")
             + mc.chamada("CICLO TRIGONOMÉTRICO", x=55, y=48, w=765, h=70, corpo=100)
             + mc.linha("SENO É O y · COSSENO É O x", x=62, y=144, corpo=42)
             + mc.figura(svg, x=55, y=170, w=390, h=380)
             + mc.cartao("O PONTO NO CICLO", "$P=(\\cos\\theta, \\sen\\theta)$",
                         x=490, y=185, w=375, h=145, tema="mat2"))
    HTML = mc.montar(META, CORPO, tema="mat2")

**O eixo Y aponta para BAIXO**, como em CSS e ao contrário do TikZ: `y=0` é o topo da
folha. É a única tradução que o porte exige, e explicitá-la aqui evita a peça sair
espelhada na vertical sem ninguém entender por quê.
"""
import os

from . import mural_lib as mu

AQUI = os.path.dirname(os.path.abspath(__file__))

# A paleta do golden, verificada contra `gerar.tex` do `pyramids-golden-sample-v1`.
PAPEL = "#FBFAF8"
TINTA = "#172734"
RETICULA = "#E7E1D6"
AMARELO = "#FFF1B9"
VERDE = "#2E7D52"
CORAL = "#E45F57"
AZUL = "#2D63B8"

# O acento da FRENTE identifica a disciplina; as cores acima continuam explicando função
# dentro do conteúdo. É a regra do `mapa_de_cabeca.md`, e é por isso que as duas famílias
# de cor convivem sem competir.
TEMAS = {"mat1": "#C0272D", "mat2": "#1D4999", "y9": "#2E7D32", "entrep": "#6B3FA0"}


def _fontes():
    """As três vozes do golden. Comic Neue é a mão humana — só anotação, nunca conteúdo."""
    return "".join([
        mu._font_face("MuralSans", "InstrumentSans-Regular.ttf", 400),
        mu._font_face("MuralSans", "InstrumentSans-Bold.ttf", 700),
        mu._font_face("MuralMono", "GeistMono-Regular.ttf", 400),
        mu._font_face("MuralMao", "ComicNeue-Bold.ttf", 700),
    ])


def _css(largura_mm, altura_mm, tema):
    acento = TEMAS[tema]
    return _fontes() + """
*{box-sizing:border-box;margin:0;padding:0}
@page{size:%(L)smm %(A)smm;margin:0}
html,body{width:%(L)smm;height:%(A)smm}
body{background:%(PAPEL)s;color:%(TINTA)s;font-family:'MuralSans',system-ui,sans-serif;
  -webkit-print-color-adjust:exact;print-color-adjust:exact}
.folha{position:relative;width:%(L)smm;height:%(A)smm;overflow:hidden;
  background-image:linear-gradient(%(RET)s 1px,transparent 1px),
                   linear-gradient(90deg,%(RET)s 1px,transparent 1px);
  background-size:14mm 14mm}
.p{position:absolute}
.chapeu{font-weight:700;color:%(ACE)s;letter-spacing:.06em}
/* Chamada: cartão inclinado com sombra SÓLIDA deslocada — não é sombra de profundidade,
   é uma segunda forma. Por isso `box-shadow` sem desfoque. */
.chamada{background:%(AMA)s;border:2.3mm solid %(TINTA)s;border-radius:8mm;
  box-shadow:8mm 8mm 0 0 %(TINTA)s;display:flex;align-items:center;justify-content:center;
  font-weight:700;line-height:1;text-align:center}
.cartao{background:%(PAPEL)s;border:2.3mm solid %(TINTA)s;border-radius:9mm;padding:6mm 8mm;
  display:flex;flex-direction:column}
.cartao>.rot{font-weight:700;color:%(VER)s;letter-spacing:.04em}
.cartao>.miolo{flex:1;display:flex;align-items:center;justify-content:center;
  flex-direction:column;gap:4mm}
.barra{background:%(COR)s;color:%(PAPEL)s;border-radius:6mm;padding:5mm 6mm;
  display:flex;align-items:center;gap:8mm}
.barra .cap{font-weight:700;line-height:1.15;letter-spacing:.03em}
.mao{font-family:'MuralMao',cursive;font-weight:700;line-height:1.15}
.caps{font-weight:700;letter-spacing:.02em;line-height:1.15}
.fig{display:flex;align-items:center;justify-content:center}
.fig svg{width:100%%;height:100%%;display:block}
mjx-container{color:inherit}
/* O MathJax injeta um MathML assistivo para leitor de tela. Numa folha que vai para a
   parede ele não serve a ninguém — e, pior, entra na conta de `scrollWidth` e fazia o
   portão de transbordo acusar 150 mm de estouro que não existem no papel. */
mjx-assistive-mml{display:none!important}
mjx-container[display]{margin:0!important}
""" % {"L": largura_mm, "A": altura_mm, "PAPEL": PAPEL, "TINTA": TINTA, "RET": RETICULA,
       "AMA": AMARELO, "VER": VERDE, "COR": CORAL, "ACE": acento}


def _pos(x, y, w=None, h=None, extra=""):
    css = "left:%smm;top:%smm;" % (x, y)
    if w is not None:
        css += "width:%smm;" % w
    if h is not None:
        css += "height:%smm;" % h
    return css + extra


def chapeu(texto, x=42, y=24, corpo=12, tema="mat1", direita=None):
    out = ('<div class="p chapeu" style="%sfont-size:%smm">%s</div>'
           % (_pos(x, y), corpo, texto))
    if direita:
        out += ('<div class="p caps" style="%sfont-size:%smm;text-align:right">%s</div>'
                % (_pos(None if False else 0, y, None, None,
                        "right:42mm;left:auto;"), corpo * 0.65, direita))
    return out


def chamada(texto, x, y, w, h, corpo, rot=-2.1):
    return ('<div class="p chamada" style="%stransform:rotate(%sdeg);font-size:%smm">%s</div>'
            % (_pos(x, y, w, h), rot, corpo, texto))


def linha(texto, x, y, corpo, cor=None, classe="caps", w=None, centro=False):
    cor_css = ("color:%s;" % cor) if cor else ""
    centro_css = "text-align:center;" if centro else ""
    return ('<div class="p %s" style="%s%s%sfont-size:%smm">%s</div>'
            % (classe, _pos(x, y, w), cor_css, centro_css, corpo, texto))


def mao(texto, x, y, corpo, cor=TINTA, w=None, centro=False):
    """Anotação em voz manuscrita. Nunca carrega conteúdo — só interpreta o que está ao lado."""
    extra = "text-align:center;" if centro else ""
    return ('<div class="p mao" style="%s%scolor:%s;font-size:%smm">%s</div>'
            % (_pos(x, y, w), extra, cor, corpo, texto))


def figura(svg, x, y, w, h):
    return '<div class="p fig" style="%s">%s</div>' % (_pos(x, y, w, h), svg)


def cartao(rotulo, miolo, x, y, w, h, tema="mat1", corpo=26, rot=1.2, rotulo_corpo=9):
    """Cartão de fórmula: sombra sólida na cor da FRENTE, miolo centrado."""
    return ('<div class="p cartao" style="%stransform:rotate(%sdeg);'
            'box-shadow:9mm 9mm 0 0 %s">'
            '<div class="rot" style="font-size:%smm">%s</div>'
            '<div class="miolo" style="font-size:%smm">%s</div></div>'
            % (_pos(x, y, w, h), rot, TEMAS[tema], rotulo_corpo, rotulo, corpo, miolo))


def lista(pares, corpo=None):
    """Rótulo à direita, conteúdo à esquerda, colunas alinhadas.

    Centralizar cada linha isoladamente deixa a lista ragged — o olho não encontra a
    coluna e a caixa parece mal ocupada. Aqui o rótulo alinha à direita e o conteúdo à
    esquerda, então as fórmulas nascem todas do mesmo eixo vertical.
    """
    linhas = "".join(
        '<div style="text-align:right;opacity:.72">%s</div><div style="text-align:left">%s</div>'
        % (rot, val) for rot, val in pares)
    tam = ("font-size:%smm;" % corpo) if corpo else ""
    return ('<div style="display:inline-grid;grid-template-columns:auto auto;'
            'gap:.45em 1.1em;align-items:center;%s">%s</div>' % (tam, linhas))


def moldura(miolo, x, y, w, h, cor=VERDE, fundo="#E8F3ED", corpo=14, rot=0):
    """Caixa com filete, sem sombra. Para o que ACOMPANHA um bloco em vez de competir.

    O `cartao()` tem sombra sólida na cor da frente, e sombra é peso: a caixa das
    condições de existência ganhava a mesma presença do cartão de fórmula e brigava com
    ele. Aqui o filete basta.
    """
    # O miolo vai dentro de um <div> próprio: num container flex cada trecho de texto vira
    # ITEM, e aí o `<br>` entre eles não quebra nada — as três formas da reta saíam lado a
    # lado, embaralhadas. Só se vê no raster.
    return ('<div class="p" style="%stransform:rotate(%sdeg);background:%s;'
            'border:1.6mm solid %s;border-radius:5mm;display:flex;align-items:center;'
            'justify-content:center;padding:4mm 6mm;font-size:%smm">'
            '<div style="width:100%%;text-align:center;line-height:1.5">%s</div></div>'
            % (_pos(x, y, w, h), rot, fundo, cor, corpo, miolo))


def barra(matematica, linhas, x, y, w, h, corpo=15, caps=9, rot=1.2):
    """A armadilha. Vermelha, matemática à esquerda, a regra em caixa alta à direita."""
    caps_html = "".join('<div>%s</div>' % l for l in linhas)
    return ('<div class="p barra" style="%stransform:rotate(%sdeg)">'
            '<div style="font-size:%smm;white-space:nowrap">%s</div>'
            '<div class="cap" style="font-size:%smm">%s</div></div>'
            % (_pos(x, y, w, h), rot, corpo, matematica, caps, caps_html))


# ---------------------------------------------------------------------------
# Gramática CONSULTATION (`_mural/consultation-golden-sample/README.md`)
#
# Peça de consulta próxima: o aluno vai até a parede porque TRAVOU e precisa decidir como
# proceder. É outra função da do GS-01 — lá é *"preciso lembrar esta relação"*, aqui é
# *"o que eu faço agora?"* —, e por isso é outra arquitetura: `pergunta → condição →
# saída → exemplo`.
#
# O golden avisa que o título não pode virar herói que rouba espaço do conteúdo, e que a
# peça aceita mais densidade — desde que a leitura de perto continue clara.
# ---------------------------------------------------------------------------

def trilha(pergunta, ramos, x, y, w, h, tema="mat1", corpo=11, pergunta_corpo=13,
           deitada=False):
    """Uma decisão: a pergunta no alto, e os caminhos embaixo.

    Cada ramo é `(condição, saída, exemplo, cor)`. A COR é o caminho — o golden autoriza
    cores internas para codificar saídas —, e o exemplo é compacto por regra: *"exemplos
    devem ser compactos e suficientes para reconhecer o padrão, não mini-aulas"*.
    """
    linhas = []
    for cond, saida, exemplo, cor in ramos:
        linhas.append(
            '<div style="display:grid;grid-template-columns:auto 1fr;gap:0 3mm;'
            'border-left:2.2mm solid %s;padding:1.6mm 0 1.6mm 4mm">'
            '<div style="grid-column:1/-1;font-weight:700;font-size:.92em;color:%s;'
            'letter-spacing:.03em">%s</div>'
            '<div style="grid-column:1/-1">%s</div>'
            '%s</div>'
            % (cor, cor, cond, saida,
               ('<div style="grid-column:1/-1;font-size:.8em;background:#f1f2f4;'
                'border-radius:.28em;padding:.16em .5em;justify-self:start;'
                'margin-top:.3em">%s</div>' % exemplo) if exemplo else ""))
    # `deitada`: a pergunta fica à esquerda e os caminhos correm em colunas. Serve quando
    # a decisão é uma comparação de três saídas curtas — em pé ela desperdiçaria uma
    # coluna inteira da folha para três linhas.
    if deitada:
        return ('<div class="p" style="%sbackground:%s;border:1.6mm solid %s;'
                'border-radius:6mm;padding:5mm 6mm;display:grid;'
                'grid-template-columns:auto repeat(%d,1fr);gap:0 6mm;align-items:center;'
                'font-size:%smm">'
                '<div style="font-weight:700;font-size:%smm;color:%s;line-height:1.15;'
                'padding-right:2mm">%s</div>%s</div>'
                % (_pos(x, y, w, h), PAPEL, TEMAS[tema], len(ramos), corpo,
                   pergunta_corpo, TINTA, pergunta, "".join(linhas)))
    return ('<div class="p" style="%sbackground:%s;border:1.6mm solid %s;'
            'border-radius:6mm;padding:5mm 6mm;display:flex;flex-direction:column;'
            'gap:2.4mm;font-size:%smm">'
            '<div style="font-weight:700;font-size:%smm;color:%s;line-height:1.15">%s</div>'
            '%s</div>'
            % (_pos(x, y, w, h), PAPEL, TEMAS[tema], corpo, pergunta_corpo, TINTA,
               pergunta, "".join(linhas)))


def montar(titulo, corpo, largura_mm=891, altura_mm=630, tema="mat1", *, math_src):
    """A folha inteira. `data-math-delim` liga o modo delimitador do `ma_math.js`."""
    if not isinstance(math_src, str) or not __import__("re").fullmatch(r"(?:\.\./)*[A-Za-z0-9_/-]*ma_math\.js", math_src):
        raise ValueError("Expected explicit relative ma_math.js path")
    rel = math_src
    return ("""<!doctype html>
<html lang="pt-BR" data-math-delim="$"><head><meta charset="utf-8">
<title>%s</title>
<script defer src="%s"></script>
<style>%s</style></head>
<body><div class="folha">%s</div></body></html>"""
            % (titulo, rel, _css(largura_mm, altura_mm, tema), corpo))


def conferir(caminho_html):
    """Algum bloco passa da borda da folha?

    Devolve `[(o que é, quanto vazou em mm)]` quando conseguiu medir, e uma STRING com o
    motivo quando não conseguiu. A distinção não é preciosismo: até 09/09 os três jeitos
    de não medir — Chrome ausente, Chrome que não devolveu resposta, resposta ilegível —
    devolviam todos `None`, e o `build` imprimia "sem Chrome" nos três. A frase mentia
    duas vezes em três, e mandava procurar o defeito no lugar errado. Aconteceu de
    verdade: nesta mesma sessão o portão disse "sem Chrome" e, segundos depois, o MESMO
    binário gerou o PDF.

    Uma medição que não aconteceu é o começo do falso-verde de 24/08. Ela pode não
    reprovar a geração — há máquina sem navegador —, mas tem de dizer alto que a folha
    saiu SEM CONFERIR, e dizer por quê.

    O `mural_grande.conferir` procura `.cartaz` e `.no`, que esta gramática não tem — ele
    rodava e media ZERO elemento, devolvendo verde sem ter olhado nada. É o mesmo
    falso-verde do portão de impressão de 24/08, e por isso esta gramática ganha o portão
    dela em vez de emprestar o do vizinho.

    Aqui não existe transbordo "para baixo" como num cartaz de fluxo: tudo é posicionado
    em milímetro, então o defeito possível é um bloco cair fora da folha ou um texto
    estourar a caixa que lhe foi dada. Mede-se os dois.
    """
    import json
    import re as _re
    import subprocess
    from . import topdf
    chrome = topdf.chrome_bin()
    if not chrome:
        return "não encontrei o Chrome (topdf.chrome_bin() não resolveu nenhum caminho)"
    script = ("""
      function pronto(){
        var f = document.querySelector('.folha');
        var lim = f.getBoundingClientRect();
        var fora = [];
        document.querySelectorAll('.p').forEach(function(n){
          var r = n.getBoundingClientRect();
          var d = Math.max(lim.left - r.left, r.right - lim.right,
                           lim.top - r.top, r.bottom - lim.bottom);
          var texto = (n.textContent || '').replace(/\\s+/g,' ').trim().slice(0, 40);
          if (d > 1) fora.push([texto || n.className, d]);
          if (n.scrollHeight - n.clientHeight > 2 || n.scrollWidth - n.clientWidth > 2) {
            fora.push([(texto || n.className) + ' (estoura a própria caixa)',
                       Math.max(n.scrollHeight - n.clientHeight,
                                n.scrollWidth - n.clientWidth)]);
          }
        });
        document.title = JSON.stringify(fora);
      }
      /* Espera a matemática ANTES de medir. O `ma_math.js` entra com `defer`, então
         `window.MAMath` ainda não existe quando este script roda: perguntar por ele aqui
         devolvia "não tem matemática", media o `$...$` cru e acusava 150 mm de estouro
         que sumiam depois de o SVG entrar. O sinal certo é o atributo/evento. */
      function matematicaPronta(){
        if (document.documentElement.getAttribute('data-math-ready')) return Promise.resolve();
        return new Promise(function(r){
          document.addEventListener('ma:math-ready', r, {once:true});
          setTimeout(r, 15000);
        });
      }
      document.fonts.ready.then(matematicaPronta).then(pronto, pronto);
    """)
    marcado = caminho_html + ".medir.html"
    with open(caminho_html, encoding="utf-8") as f:
        doc = f.read()
    with open(marcado, "w", encoding="utf-8") as f:
        f.write(doc.replace("</body>", "<script>%s</script></body>" % script))
    try:
        proc = subprocess.run(
            [chrome, "--headless", "--disable-gpu",
             "--virtual-time-budget=20000", "--dump-dom", "file://" + os.path.abspath(marcado)],
            capture_output=True, timeout=180)
        saida = proc.stdout.decode("utf-8", "replace")
    finally:
        os.remove(marcado)
    m = _re.search(r"<title>(.*?)</title>", saida, _re.S)
    if not m:
        # O código de saída separa "o navegador morreu" de "a página não respondeu". Um
        # Chromium pela metade sai 139 (SIGSEGV) até em `--version`; foi o que travou o
        # QA dos slides do Y9 em 08/09, e a mensagem de lá também não dizia qual era.
        erro = proc.stderr.decode("utf-8", "replace").strip().splitlines()
        return ("o Chrome rodou e não devolveu a medição (saída %d)%s"
                % (proc.returncode,
                   "; última linha do erro: " + erro[-1][:160] if erro else ""))
    bruto = (m.group(1).replace("&quot;", '"').replace("&amp;", "&")
             .replace("&lt;", "<").replace("&gt;", ">"))
    try:
        linhas = json.loads(bruto)
    except ValueError:
        return "a medição voltou ilegível: %s" % bruto[:160]
    mm = 96 / 25.4
    return [(nome, round(d / mm, 1)) for nome, d in linhas]


def build(html, out_dir, nome="mural_consulta", largura_mm=891, altura_mm=630):
    """Escreve, mede caixa a caixa e gera o PDF."""
    from . import topdf
    os.makedirs(out_dir, exist_ok=True)
    caminho = os.path.join(out_dir, nome + ".html")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK ->", caminho)
    if os.environ.get("SEM_PDF") == "1":
        return caminho  # synthetic specimen: browser gate prints later
    fora = conferir(caminho)
    if isinstance(fora, str):
        print("   ATENÇÃO — a folha NÃO foi medida: %s" % fora)
        raise RuntimeError("Mural não medido; impressão bloqueada")
    elif fora:
        raise SystemExit("ERRO: %d bloco(s) fora da folha ou estourando a caixa:\n%s"
                         % (len(fora), "\n".join("   · %s: %.1f mm" % (n, d)
                                                  for n, d in fora)))
    else:
        print("   tudo dentro da folha")
    pdf = topdf.gerar(caminho)
    if not pdf:
        print("   (sem Chrome: só o HTML)")
        return caminho
    print("   PDF -> %s  ·  %d × %d mm" % (os.path.basename(pdf), largura_mm, altura_mm))
    return caminho
