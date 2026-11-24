"""List layout: original browser layout, local composition only."""
import os
import re
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(DIR, "..", ".."))
sys.path.insert(0, DIR)
from . import lista_fluxo as lfx

MARCA = "<!-- layout-navegador -->"
PAGINADOR = os.path.join(DIR, "paginador.js")

CSS_BASE = r"""
/* ---- baseline: vale SEM JavaScript ----------------------------------------
   Fluxo contínuo: o navegador pagina sozinho. É o que aparece se o paginador não
   rodar — correto, só não otimizado. */
@page listaFluxo { size: A4; margin: 14mm 14mm 16mm 14mm; }
html:not([data-paginado]) .fx-wrap { page: listaFluxo; }
html, body { margin: 0; padding: 0; }
.fx-topo { margin: 0 0 5mm; }
.fx-topo h1 { font-size: 15pt; margin: 0; color: var(--c-primary, #C0272D); }
.fx-topo .fx-sub { font-size: 9pt; color: #666; margin: 1mm 0 0; }
.fx-topo .fx-meta { font-size: 8.5pt; color: #444; margin: 2mm 0 0;
                    border-top: .8pt solid var(--c-primary, #C0272D); padding-top: 1.5mm; }
.fx-corpo { column-count: 2; column-gap: 7mm; }
.bex, .bex-extra { break-inside: avoid; page-break-inside: avoid; }

/* ---- depois que o paginador roda ------------------------------------------
   Ele remonta em .a4 (a mesma folha do handout_lib, com timbre) e o fluxo some.
   `data-paginado` no <html> é o interruptor: enquanto não existe, vale o baseline. */
/* A margem do baseline TEM que voltar a zero quando o paginador roda. As duas regras
   `@page` conviviam no mesmo arquivo (esta e a do handout_lib), e a última vence: a área
   imprimível encolhia 30mm de altura enquanto as folhas `.a4` continuavam com a altura
   cheia de A4. Resultado: cada folha transbordava alguns milímetros e o Chrome abria uma
   página a mais — a lista de Números Binomiais saía com 3 páginas onde o paginador tinha
   medido 2, e as duas últimas quase vazias. Levou uma sessão inteira para aparecer porque
   a tela mostrava certo; só o PDF mentia. */
@page { size: A4; margin: 0; }
html[data-paginado] .fx-corpo { column-count: 1; }
/* page-break-after: always é REDUNDANTE e por isso danoso aqui. Cada `.a4` tem
   exatamente 297mm de altura (com box-sizing:border-box), ou seja, enche a página
   sozinha — o Chrome já quebra ao terminar de encher, e a regra manda quebrar OUTRA
   vez. Resultado: uma página branca depois de cada folha, e o PDF sai com o DOBRO.
   Media na Y10 Polígonos: paginador dizia 3 páginas, o PDF trazia 6; em Números
   Binomiais, 2 contra 3 (a terceira era o resto empurrado pela branca).
   A altura sozinha pagina. `auto` desliga a segunda quebra sem soltar o resto. */
html[data-paginado] .a4 { page-break-after: auto; }
.pg-slim { font-size: 8pt; color: #666; border-bottom: .8pt solid var(--c-primary, #C0272D);
           padding-bottom: 1mm; margin-bottom: 4mm; }
.pg-cols td { padding: 0; }
.pg-cols td:first-child { padding-right: 3.5mm; }
.pg-cols td:last-child { padding-left: 3.5mm; }

@media screen {
  body { background: #eee; }
  .fx-wrap { background: #fff; max-width: 190mm; margin: 6mm auto; padding: 10mm 12mm; }
  html[data-paginado] .fx-wrap { background: none; padding: 0; max-width: none; }
}
"""


def montar(css, mathjax, meta, blocos, extra, paginador_rel):
    # `mathjax` vem como (script, delimitador): o motor E o modo. O modo mora num
    # atributo do `<html>`, e perdê-lo na paginação faz o motor carregar sem compor nada.
    mathjax, delim = mathjax if isinstance(mathjax, tuple) else (mathjax, "")
    attr_delim = ' data-math-delim="%s"' % delim if delim else ""
    corpo = "".join(blocos) + (extra or "")
    return f"""<!DOCTYPE html>
<html lang="pt-BR"{attr_delim}>
<head>
<meta charset="utf-8">
<title>{meta['titulo']}</title>
{mathjax}
<style>{css}{CSS_BASE}</style>
</head>
<body>
{MARCA}
<div class="fx-wrap">
  {lfx.bloco_topo(meta)}
  <div class="fx-corpo">{corpo}</div>
</div>
<script src="{paginador_rel}"></script>
</body>
</html>"""


