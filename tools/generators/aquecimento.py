#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Aquecimento paramétrico: seis questões de pré-requisitos por tópico.

Gabaritos calculados pelo gerador e semente determinística por slug.
Tópicos sem template retornam None.
"""
import random
import re

# Um item é (pergunta_html, resposta_texto). A resposta vai só para o gabarito.


def _potencias(rnd):
    """Pré-requisito de equações/inequações exponenciais e de logaritmos."""
    b1, e1 = rnd.choice([(2, 5), (2, 6), (3, 4), (5, 3), (10, 4)])
    b2 = rnd.choice([2, 3, 5])
    p, q = rnd.choice([(2, 4), (3, 5), (4, 3), (5, 2)])
    b3, e3 = rnd.choice([(2, 3), (5, 2), (3, 3), (10, 3)])
    b4, e4 = rnd.choice([(3, 3), (2, 5), (5, 3), (7, 2)])
    b5, e5 = rnd.choice([(2, 6), (3, 4), (5, 4), (2, 8)])
    b6, e6 = rnd.choice([(2, 6), (3, 5), (10, 3), (5, 3)])
    return [
        (rf"${b1}^{{{e1}}} = $", f"{b1 ** e1}"),
        (rf"${b2}^{{{p}}} \cdot {b2}^{{{q}}} = {b2}^{{\square}}$", f"{p + q}"),
        (rf"${b3}^{{-{e3}}} = $", rf"1/{b3 ** e3}"),
        (rf"${b4 ** e4} = {b4}^{{\square}}$", f"{e4}"),
        (rf"$\dfrac{{{b5}^{{{e5}}}}}{{{b5}^{{{e5 - 2}}}}} = {b5}^{{\square}}$", "2"),
        (rf"${b6}^{{x}} = {b6 ** e6} \Rightarrow x = $", f"{e6}"),
    ]


def _logaritmos(rnd):
    """Pré-requisito de equações/inequações logarítmicas: a definição, na mão."""
    itens = _potencias(rnd)[:3]
    b1, e1 = rnd.choice([(2, 5), (3, 4), (5, 3), (10, 4)])
    b2, e2 = rnd.choice([(2, 3), (3, 3), (5, 2)])
    b3 = rnd.choice([2, 3, 5, 10])
    itens += [
        (rf"$\log_{{{b1}}} {b1 ** e1} = $", f"{e1}"),
        (rf"$\log_{{{b2}}} x = {e2} \Rightarrow x = $", f"{b2 ** e2}"),
        (rf"$\log_{{{b3}}} 1 = $", "0"),
    ]
    return itens


def _plana_pitagoras(rnd):
    """Pré-requisito de geometria espacial (prisma, pirâmide, cilindro, cone, esfera):
    o aluno precisa da área da base e do Pitágoras antes de qualquer volume."""
    a, b = rnd.choice([(6, 4), (8, 5), (7, 3), (9, 4)])
    bt, ht = rnd.choice([(10, 6), (8, 5), (12, 7), (6, 9)])
    c1, c2, hip = rnd.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13), (9, 12, 15)])
    lado = rnd.choice([4, 5, 6, 7])
    r = rnd.choice([3, 4, 5, 6])
    aresta = rnd.choice([2, 3, 4, 5])
    return [
        (f"&Aacute;rea do ret&acirc;ngulo {a}&nbsp;cm &times; {b}&nbsp;cm:", f"{a * b} cm²"),
        (f"&Aacute;rea do tri&acirc;ngulo de base {bt}&nbsp;cm e altura {ht}&nbsp;cm:",
         f"{bt * ht / 2:g} cm²"),
        (f"Hipotenusa do tri&acirc;ngulo ret&acirc;ngulo de catetos {c1} e {c2}:", f"{hip}"),
        (f"&Aacute;rea do quadrado de lado {lado}&nbsp;cm:", f"{lado ** 2} cm²"),
        (f"&Aacute;rea do c&iacute;rculo de raio {r}&nbsp;cm (em fun&ccedil;&atilde;o de &pi;):",
         f"{r ** 2}π cm²"),
        (f"Volume do cubo de aresta {aresta}&nbsp;cm:", f"{aresta ** 3} cm³"),
    ]


def _quadratica(rnd):
    """Pré-requisito de função quadrática / equação do 2º grau."""
    r1, r2 = rnd.choice([(2, 3), (1, 4), (-2, 5), (-1, 6), (3, 5)])
    b, c = -(r1 + r2), r1 * r2                    # x² + bx + c com raízes r1, r2
    a2, b2, c2 = rnd.choice([(1, -5, 6), (1, 2, -8), (2, -7, 3), (1, -6, 9)])
    delta = b2 * b2 - 4 * a2 * c2
    k = rnd.choice([2, 3, 4, 5])
    x0 = rnd.choice([2, 3, -2, -3])
    m, n = rnd.choice([(2, 5), (3, 4), (5, 2), (4, 7)])
    sinal = "+" if b >= 0 else "-"
    coef_a = "" if a2 == 1 else str(a2)      # "1x²" não se escreve
    return [
        (rf"$f(x) = x^2 - {k}x + 1$, ent&atilde;o $f({x0}) = $", f"{x0 * x0 - k * x0 + 1}"),
        (rf"$\Delta$ de ${coef_a}x^2 {'+' if b2 >= 0 else '-'} {abs(b2)}x "
         rf"{'+' if c2 >= 0 else '-'} {abs(c2)} = 0$:", f"{delta}"),
        (rf"$(x + {m})^2 = x^2 + \square x + {m * m}$", f"{2 * m}"),
        (rf"Ra&iacute;zes de $x^2 {sinal} {abs(b)}x "
         rf"{'+' if c >= 0 else '-'} {abs(c)} = 0$:", f"{r1} e {r2}"),
        (rf"${n}x - {m} = 0 \Rightarrow x = $", f"{m}/{n}"),
        (rf"$x^2 = {k * k} \Rightarrow x = $", f"±{k}"),
    ]


def _linear(rnd):
    """Pré-requisito de inequações do 1º grau: resolver a equação e lidar com o sinal."""
    a, b, c = rnd.choice([(3, 5, 20), (4, 7, 31), (5, 2, 27), (2, 9, 23)])
    k = rnd.choice([2, 3, 4, 5])
    m = rnd.choice([6, 8, 10, 12])
    p, q = rnd.choice([(3, 12), (5, 20), (4, 24), (7, 21)])
    x0 = rnd.choice([2, 3, 4])
    return [
        (rf"${a}x + {b} = {c} \Rightarrow x = $", f"{(c - b) / a:g}"),
        (rf"$-{k}x > {k * m} \Rightarrow x \;\square\; -{m}$",
         "&lt; (multiplicar por negativo inverte)"),
        (rf"$\dfrac{{x}}{{{p}}} = {q // p} \Rightarrow x = $", f"{q}"),
        (rf"$f(x) = {a}x - {b}$, ent&atilde;o $f({x0}) = $", f"{a * x0 - b}"),
        (rf"Zero de $y = {k}x - {k * x0}$:", f"{x0}"),
        (rf"${m} - x < 0 \Rightarrow x \;\square\; {m}$", "&gt;"),
    ]


# Um tópico só entra aqui quando eu sei dizer QUAL é o pré-requisito dele. A chave é
# casada por substring contra o slug do fascículo; o que não casar fica sem aquecimento.
TEMPLATES = [
    (r"logaritm", _logaritmos),
    (r"exponencia", _potencias),
    (r"prisma|piramide|pir&acirc;mide|cilindro|cone|esfera|poliedro|"
     r"geometria-espacial|solidos|s&oacute;lidos", _plana_pitagoras),
    (r"funcao-quadratica|equacao-2-grau|equacao-do-2-grau|parabola", _quadratica),
    (r"inequacoes$|inequacoes-", _linear),
    (r"funcao-afim|introducao-as-funcoes", _linear),
]


def para_slug(slug, seed=None):
    """Devolve [(pergunta_html, resposta)] para o fascículo, ou None se não houver
    template para o tópico (caso em que a lista simplesmente não leva aquecimento)."""
    for padrao, fn in TEMPLATES:
        if re.search(padrao, slug, re.I):
            return fn(random.Random(seed if seed is not None else slug))
    return None


def html(itens, minutos=5):
    """Caixa de aquecimento: itens curtos em duas colunas, letra por item.

    Tema dourado, que no padrão é a cor da diagnóstica/macete — o aquecimento é
    exatamente isso, uma diagnóstica de pré-requisito no começo da lista.
    """
    letras = "abcdefghij"
    cels = []
    for i, (pergunta, _) in enumerate(itens):
        cels.append(
            f'<td width="50%" style="padding:0 2mm .8mm 0; vertical-align:top">'
            f'<span style="color:#8a6100">{letras[i]})</span> {pergunta} '
            f'<span style="color:#bbb">_____</span></td>')
    linhas = []
    for i in range(0, len(cels), 2):
        fatia = cels[i:i + 2]
        if len(fatia) == 1:
            fatia.append('<td width="50%"></td>')
        linhas.append("<tr>" + "".join(fatia) + "</tr>")
    return (
        '<div class="bex bex-aquecimento">'
        '<span class="tag">Aquecimento &middot; %d min</span>'
        '<p style="margin:0 0 1mm; font-size:8.5pt; color:#555">De cabe&ccedil;a ou com '
        'conta curta ao lado. S&atilde;o pr&eacute;-requisitos &mdash; se algum travar, '
        '&eacute; a&iacute; que voc&ecirc; come&ccedil;a a estudar.</p>'
        '<table class="lay"><tbody>%s</tbody></table>'
        '</div>') % (minutos, "".join(linhas))


def linhas_gabarito(itens):
    letras = "abcdefghij"
    return [f"- **{letras[i]})** {resp}" for i, (_, resp) in enumerate(itens)]


if __name__ == "__main__":
    import sys
    for slug in (sys.argv[1:] or ["equacoes-e-inequacoes-exponenciais",
                                  "prismas", "funcao-quadratica-parabolas"]):
        itens = para_slug(slug)
        print("\n=== %s ===" % slug)
        if not itens:
            print("  (sem template — lista sai sem aquecimento)")
            continue
        for i, (p, r) in enumerate(itens):
            print("  %s) %-58s -> %s" % ("abcdef"[i], p, r))
