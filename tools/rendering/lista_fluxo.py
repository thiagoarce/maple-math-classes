"""Original list extraction and heading, without legacy batch CLI."""
import re
def _bloco_fechado(html, ini):
    """Devolve o fim do <div> que abre em `ini`, contando aninhamento."""
    prof, i = 0, ini
    while i < len(html):
        if html.startswith("<div", i):
            prof += 1
        elif html.startswith("</div>", i):
            prof -= 1
            if prof == 0:
                return i + len("</div>")
        i += 1
    return len(html)


def extrair(html):
    """(css, mathjax, meta, blocos_questao, bloco_extra) de uma lista já gerada.

    `mathjax` carrega o `<script>` E o atributo de modo. O `ma_math.js` só varre o
    documento por `$…$` quando o `<html>` traz `data-math-delim`; sem ele o motor carrega,
    não acha nó nenhum marcado e a folha paginada fica com o TeX cru na tela.
    """
    css = re.search(r"<style>(.*?)</style>", html, re.S)
    css = css.group(1) if css else ""
    # `ma_math` entrou na lista em 23/08 e este filtro não o conhecia: a tag é
    # `<script src=".../ma_math.js">`, que não contém "MathJax" nem "tex-svg". Resultado:
    # a versão PAGINADA da folha saía SEM motor matemático, e as alternativas apareciam
    # como `$P =\begin{bmatrix}…` cru para quem abrisse o HTML.
    #
    # Isso escapava por um acidente: o PDF que ia para a gráfica era rasterizado ANTES da
    # paginação, de um arquivo que ainda tinha o motor. Duas medidas certas sobre dois
    # arquivos diferentes — o mesmo padrão do `.espaco` dos passaportes.
    #
    # O `[:4000]` também sai: com a fonte embutida em base64 o `<head>` passa de 4000
    # caracteres muito antes de chegar ao script, e o recorte é uma armadilha à espera.
    mathjax = "".join(p for p in re.findall(r"<script.*?</script>", html, re.S)
                      if "MathJax" in p or "tex-svg" in p or "ma_math" in p)
    m_delim = re.search(r'<html[^>]*\sdata-math-delim="([^"]*)"', html)
    delim = m_delim.group(1) if m_delim else ""
    blocos, extra = [], ""
    for m in re.finditer(r'<div class="bex[^"]*"', html):
        trecho = html[m.start():_bloco_fechado(html, m.start())]
        if "bex-extra" in trecho[:60]:
            # pode haver MAIS DE UMA caixa coringa (estudo extra + padrão do ENEM).
            # Atribuir em vez de acumular fazia a última engolir a anterior, e a caixa
            # do ENEM sumia sem erro nenhum.
            extra += trecho
        else:
            blocos.append(trecho)
    titulo = re.search(r"<title>(.*?)</title>", html, re.S)
    meta = {"titulo": titulo.group(1).strip() if titulo else "Lista de Exerc&iacute;cios"}
    m = re.search(r'<div class="hd-meta">(.*?)</div>', html, re.S)
    meta["linha"] = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", m.group(1))).strip() if m else ""
    sub = re.search(r'<[ph][^>]*class="hd-sub"[^>]*>(.*?)</[ph][^>]*>', html, re.S)
    meta["sub"] = sub.group(1).strip() if sub else ""
    return css, (mathjax, delim), meta, blocos, extra



def bloco_topo(meta):
    """Título + subtítulo + linha de meta. Fica ACIMA do multicolunas, então come altura
    das duas colunas da página 1 — por isso precisa ser medido, não estimado."""
    return ('<div class="fx-topo"><h1>%s</h1><p class="fx-sub">%s</p>'
            '<p class="fx-meta">%s</p></div>'
            % (meta["titulo"], meta["sub"], meta["linha"]))



