#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Biblioteca de handouts: composição, blocos de conteúdo, paginação e validação."""

import base64
import hashlib
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if __package__:
    from . import identidade as idt
else:
    import identidade as idt  # noqa: E402

# A arte do timbrado (faixa laranja/vermelha + folha de bordo) sobe 30mm do pé.
# Mesma medida que o `paginador_handout.js` chama de respiro e que o
# `verificar_aula.py` usa para conferir o PDF impresso.
SAFE_BOTTOM_MM = 30

# ============================================================
# GERAÇÃO DA FOLHA
# ============================================================
# A impressão digital (`versao_da_biblioteca`) responde "esta folha saiu da biblioteca de
# hoje?". É uma pergunta boa, mas a resposta sozinha não diz o que fazer — e em 23/08 isso
# estourou: a identidade visual mudou (face editorial, entrelinha declarada, motor
# matemático), a digital mudou junto, e 118 aulas FUTURAS viraram reprovação de uma vez.
# Ele tinha acabado de decidir o contrário: *"só aula nova e as que eu mexer"*.
#
# Então existem duas perguntas diferentes, e agora elas têm respostas separadas:
#
#   GERAÇÃO muda  → a folha velha está ERRADA. Foi o caso de 12/08, quando o pé do `.a4`
#                   passou de 22 para 30mm: quem imprimisse a folha antiga teria a arte do
#                   timbrado atravessando caixa de resolução. Isso reprova.
#   digital muda  → a folha velha está VELHA, e continua correta: outra face, outra voz
#                   matemática. Isso avisa, e some quando a aula for regerada.
#
# Subir este número é dizer "o que está impresso não serve mais". Não subir por mudança de
# língua é o que mantém o portão legível.
GERACAO = 1

# ============================================================
# TEMAS
# ============================================================
# As cores saíram daqui e foram para `identidade.py` em 23/08. Elas eram as MESMAS de
# `mural_lib.CORES` e de `slides_y9_lib.TEMAS`, escritas três vezes — e três cópias da
# mesma decisão divergem na primeira mudança. Aqui fica só o recorte que o papel usa.
THEMES = {
    nome: {"primary": f["forte"], "tint": f["tinta_papel"]}
    for nome, f in idt.FRENTES.items() if nome in ("mat1", "mat2")
}

# ============================================================
# TIMBRADO
# ============================================================

def versao_da_biblioteca():
    """Impressão digital das partes da biblioteca que SAEM no handout.

    Serve para responder "esta folha foi gerada com a biblioteca de hoje?" sem rodar o
    gerador. Existe porque em 12/08 mudei o pé do `.a4` de 22 para 30mm e tive que
    regerar 116 aulas na mão: nada avisaria se eu tivesse esquecido metade, e com dois
    modelos commitando ao mesmo tempo esquecer é o caso normal, não a exceção.

    Entra só o que muda o resultado impresso — CSS, temas, MathJax e a zona segura.
    Docstring, comentário e função nova não contam, senão o portão acusaria a cada
    edição de texto e viraria ruído.

    NÃO cobre as listas: elas carregam uma cópia própria do CSS, feita quando foram
    montadas, e não passam por `build()`.
    """
    material = "\x00".join([CSS, MATHJAX, repr(sorted(THEMES.items())),
                             str(SAFE_BOTTOM_MM), idt.impressao_digital()])
    return hashlib.sha1(material.encode("utf-8")).hexdigest()[:12]



# ============================================================
# TOKENS DA FOLHA — os nomes daqui, os valores da identidade
# ============================================================
def _tokens_css(theme_key):
    """O bloco `:root` do handout, montado a partir de `identidade.py`.

    Os NOMES continuam os desta biblioteca (`--c-primary`, `--c-gold`, `--fs-body`…):
    são usados em centenas de linhas de CSS aqui dentro e em geradores de aula, e
    renomeá-los seria uma migração de risco sem ganho nenhum. O que mudou é de onde vem
    o VALOR — antes escrito aqui, agora decidido num lugar só.
    """
    f = idt.FRENTES[theme_key]
    pares = [
        ("--c-primary", f["forte"]),
        ("--c-primary-tint", f["tinta_papel"]),
        ("--c-red", idt.PALETA["vermelho"]),
        ("--c-gold", idt.PALETA["ouro"]),
        ("--c-green", idt.PALETA["verde"]),
        ("--c-purple", idt.PALETA["roxo"]),
        ("--c-blue", idt.PALETA["azul"]),
        ("--c-ink", idt.NEUTROS["tinta"]),
        # A pele (HO-01) precisa destes três; são os mesmos da parede.
        ("--c-paper", idt.NEUTROS["papel_titulo"]),
        ("--c-blue-pale", idt.NEUTROS["azul_pale"]),
        ("--c-blue-mid", idt.NEUTROS["azul_medio"]),
        ("--c-muted", idt.NEUTROS["surdo"]),
        ("--c-meta", idt.NEUTROS["meta"]),
        ("--c-border", idt.NEUTROS["borda"]),
        ("--c-canvas", idt.NEUTROS["mesa"]),
        ("--c-gold-tint", idt.PALETA["ouro_tinta"]),
        ("--c-green-tint", idt.PALETA["verde_tinta"]),
        ("--c-purple-tint", idt.PALETA["roxo_tinta"]),
        ("--c-purple-border", idt.PALETA["roxo_borda"]),
    ]
    # Os nomes da escala são traduzidos de propósito: a identidade fala português, o CSS
    # desta biblioteca fala inglês desde 2026 e é citado por 116 geradores de aula. A
    # tradução mora aqui, num lugar; renomear lá fora seria migração de risco sem ganho.
    #
    # Escrever `"--fs-" + chave` foi o meu erro de 23/08: saiu `--fs-corpo`, o CSS
    # continuou pedindo `var(--fs-body)`, e como CSS não reclama de variável inexistente
    # a folha inteira caiu para o 16px padrão do navegador. Duas páginas transbordaram e
    # eu quase atribuí isso à troca de fonte.
    FS = {"fm": "fm", "titulo": "title", "secao": "section", "corpo": "body",
          "meta": "meta", "pgnum": "pgnum", "tag": "tag", "legenda": "caption"}
    # O relevo da identidade: uma cor só (a tinta), quatro opacidades.
    pares += [("--sombra-" + k, idt.rgba(idt.NEUTROS["tinta"], a))
              for k, a in idt.ALFA_SOMBRA.items()]
    pares += [("--fs-" + FS[k], v) for k, v in idt.ESCALA_PAPEL.items()]
    pares += [("--sp-" + k, v) for k, v in idt.ESPACO_PAPEL.items()]
    pares.append(("--lh-body", idt.ENTRELINHA_PAPEL))
    return ":root {\n" + "".join("  %s: %s;\n" % par for par in pares) + "}"


# A face editorial vai EMBUTIDA, e isso conserta um defeito silencioso: até 23/08 o CSS
# do handout começava com `@import url('https://fonts.googleapis.com/…Inter…')`. Quem
# Referência histórica omitida.
# folha na fonte que a máquina tivesse, com outra métrica e outras quebras de linha, sem
# aviso nenhum. É a mesma razão do pdf.js e do MathJax vendorizados.
def _faces_css():
    return idt.faces_css({"texto": "MBSans"})

def find_letterhead(start_dir):
    """Sobe diretórios a partir de start_dir até achar assets/papel_timbrado.png."""
    d = start_dir
    for _ in range(6):
        for meio in (("assets",), ("materials", "assets")):
            # `materials/assets` também: o acervo de Empreendedorismo vive fora de
            # `materials/`, e subindo de lá só se encontra a raiz do repo — onde o
            # timbrado está em `materials/assets`, não em `assets`. Sem isto, um
            # handout de Entrep não gera de dentro da própria pasta.
            candidate = os.path.join(d, *meio, "papel_timbrado.png")
            if os.path.isfile(candidate):
                return candidate
        d = os.path.dirname(d)
    raise FileNotFoundError(
        "papel_timbrado.png não encontrado subindo a partir de " + start_dir)


def load_bg(letterhead_path):
    with open(letterhead_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    ext = "jpeg" if letterhead_path.lower().endswith((".jpg", ".jpeg")) else "png"
    return "data:image/" + ext + ";base64," + b64


# ============================================================
# CSS BASE (tokens; @@PRIMARY@@/@@PRIMARY_TINT@@/@@BG@@ substituídos no build)
# ============================================================
CSS = r"""
@@FACES@@

@@TOKENS@@

* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'MBSans',system-ui,sans-serif; font-size:var(--fs-body); line-height:var(--lh-body); color:var(--c-ink); background:var(--c-canvas); }

/* Zera a margem de impressão do próprio browser. Sem isto o Chrome soma a margem
   padrão dele em cima da A4 já dimensionada aqui, e CADA página de 297mm transborda
   pra uma segunda página quase em branco — um handout de 4 páginas sai com 8.
   O defeito não aparece em screenshot (que é o que o preview.py faz), só na
   impressão de verdade: conferir sempre com `chromium --print-to-pdf`. */
@page { size: A4; margin: 0; }

/* ---------- PÁGINA A4 ---------- */
.a4 {
  width:210mm; height:297mm;
  background-color:#fff;   /* fallback sólido: o timbrado pode ter áreas transparentes (PNG) */
  background-image:@@BG@@;
  background-size:210mm 297mm; background-repeat:no-repeat;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  /* Pé de 30mm, não 22: a arte do timbrado (faixa laranja/vermelha + folha de bordo)
     sobe ~30mm. Com 22 a caixa dizia que havia espaço onde havia desenho, e o resultado
     era a folha de bordo cruzando caixa de resolução — em 12/08 o `verificar_aula.py`
     achou isso em 5 folhas da semana de impressão, duas delas revistas a olho no mesmo
     dia e dadas como limpas. É a mesma medida que o paginador chama de respiro. */
  padding:40mm 16mm 30mm 16mm;   /* página 1: 40mm topo (logo respira) */
  margin:0 auto 6mm auto;
  overflow:hidden;
  page-break-after:always;
  position:relative;
}
.a4.inner { padding-top:32mm; }   /* páginas 2+: 32mm evita sobreposição com o logo */
.a4:last-child { page-break-after:auto; }

@media print {
  body { background:none; }
  .a4 { margin:0; box-shadow:none; }
}

/* ---------- CABEÇALHO DO HANDOUT ---------- */
.hd-title { font-size:var(--fs-title); font-weight:800; color:var(--c-primary);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.hd-sub { font-size:var(--fs-body); color:var(--c-muted); margin-bottom:var(--sp-2); }
.hd-meta { font-size:var(--fs-meta); color:var(--c-meta); border-bottom:2px solid var(--c-primary);
  padding-bottom:var(--sp-1-5); margin-bottom:var(--sp-3);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- BANNERS DE SEÇÃO ---------- */
.sec { background:var(--c-primary); color:#fff; font-weight:700; font-size:var(--fs-section);
  padding:1.2mm var(--sp-3); border-radius:1.5mm; margin:var(--sp-3) 0 var(--sp-2) 0;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.sec.gold   { background:var(--c-gold); color:var(--c-ink); }
.sec.green  { background:var(--c-green); }
.sec.purple { background:var(--c-purple); }

/* ---------- CAIXAS DE CONTEÚDO ---------- */
.bex { border:1px solid var(--c-border); border-radius:2mm; padding:var(--sp-2) var(--sp-3); margin-bottom:var(--sp-2); }
.bex .tag { display:inline-block; background:var(--c-ink); color:#fff; font-size:var(--fs-tag);
  font-weight:700; padding:0.5mm var(--sp-2); border-radius:1mm; margin-bottom:var(--sp-1);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
/* Ver documentação do motor de materiais. */
.bex .tag.inline { margin-bottom:0; margin-right:1.5mm; vertical-align:baseline; }
.bex .fonte { font-size:var(--fs-caption); color:var(--c-meta); margin-right:1.5mm;
  white-space:nowrap; }
/* Ver documentação do motor de materiais. */
.bex.bex-extra { background:#F1F2F4; border-color:#9aa0a8;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.bex.bex-extra .tag { background:#5B6270; }
.bex.bex-enem .tag { background:var(--c-blue); }

/* Aquecimento: abre a lista com pré-requisitos. Dourado, que no padrão é a cor da
   diagnóstica — é disso que se trata, uma diagnóstica curta antes das questões reais. */
.bex.bex-aquecimento { background:#FFF7E6; border-color:#E0AE3A;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.bex.bex-aquecimento .tag { background:var(--c-gold); color:#3a2a00; }
.bex.bex-aquecimento table.lay td { font-size:9pt; }

/* lacuna para o aluno completar enquanto o professor fala */
.gap { display:inline-block; border-bottom:1.5px solid #999; min-width:28mm; height:4.5mm; vertical-align:bottom; }

/* ---------- WRITE-BOXES (espaço de resolução) ---------- */
.wb { border:1.5px dashed #999; border-radius:2mm; margin:var(--sp-1-5) 0; }
.wb-s { height:22mm; }  .wb-m { height:34mm; }  .wb-l { height:50mm; }  .wb-xl { height:70mm; }

/* rótulo curto acima de uma célula do mapa do quadro ("a>1", "0<a<1", "Quadrado") */
.rot { font-weight:800; font-size:var(--fs-meta); color:#444; margin-bottom:var(--sp-1); }
.center { text-align:center; }
.mini { font-size:8.4pt; }

/* tabela de valores a preencher no quadro (hl.tabela_valores) */
.tv { width:100%; border-collapse:collapse; table-layout:fixed; margin:var(--sp-1) 0 var(--sp-2); }
.tv th, .tv td { border:1px solid #aaa; text-align:center; padding:var(--sp-1); height:8mm; }
.tv th { background:#f3f4f6; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- CAIXAS DE FÓRMULA (MathJax) ---------- */
.fm { border:2px solid var(--c-primary); border-radius:2mm; padding:var(--sp-2) var(--sp-4); text-align:center;
  font-size:var(--fs-fm); margin:var(--sp-2) 0; background:var(--c-primary-tint);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.fm-fill { border:2px dashed var(--c-primary); border-radius:2mm; height:16mm; margin:var(--sp-2) 0;
  background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.fm-label { font-size:var(--fs-meta); color:var(--c-muted); margin-bottom:1mm; }

/* ---------- MACETE ---------- */
.macete { border:2px solid var(--c-gold); background:var(--c-gold-tint); border-radius:2mm;
  padding:var(--sp-2) var(--sp-3); margin:var(--sp-2) 0;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.macete b { color:#B07A00; }

/* ---------- QUESTÃO DO DIA ---------- */
.qd { border:2.5px solid var(--c-green); border-radius:2mm; padding:var(--sp-2) var(--sp-3);
  background:var(--c-green-tint); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.qd .qd-h { font-weight:800; color:var(--c-green); font-size:var(--fs-section);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- AUTOAVALIAÇÃO ---------- */
.aa { border:1.5px solid var(--c-purple); border-radius:2mm; padding:var(--sp-2) var(--sp-3);
  background:var(--c-purple-tint); font-size:var(--fs-meta);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.aa .aa-h { font-weight:800; color:var(--c-purple); }
.aa table { width:100%; border-collapse:collapse; }
.aa td { border:1px solid var(--c-purple-border); padding:var(--sp-1) var(--sp-1-5); }

/* ---------- TERMÔMETRO (autoavaliação padrão — emoji colorido, marcável) ---------- */
.term { border:1.5px solid var(--c-purple); border-radius:2mm; padding:var(--sp-2) var(--sp-3);
  background:var(--c-purple-tint); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.term .term-h { font-weight:800; color:var(--c-purple); font-size:var(--fs-section);
  margin-bottom:var(--sp-1); }
.term table { width:100%; border-collapse:collapse; font-size:var(--fs-meta); }
.term th, .term td { border:1px solid var(--c-purple-border); padding:1.0mm 2mm; }
.term th { background:var(--c-purple-tint); font-weight:700; text-align:left;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.term th.e { text-align:center; white-space:nowrap; font-weight:600; }
.term td.c { text-align:center; font-size:12pt; white-space:nowrap; color:var(--c-ink); }
.term .term-foot { margin-top:var(--sp-1-5); font-size:var(--fs-meta); }

/* ---------- TABELAS GENÉRICAS ---------- */
table.lay { width:100%; border-collapse:collapse; }
table.lay > tbody > tr > td { vertical-align:top; padding:0 var(--sp-1-5); }
table.lay > tbody > tr > td:first-child { padding-left:0; }
table.lay > tbody > tr > td:last-child { padding-right:0; }

/* ---------- RODAPÉ ---------- */
.pgnum { position:absolute; bottom:8mm; right:16mm; font-size:var(--fs-pgnum); color:#777; }

/* ============================================================
   A PELE — HO-01, aprovada por ele em 25/08

   Nasceu como camada solta (`goldens/HO-01-pele/pele.css` + `pele_v2.css`), aplicada por
   cima de uma folha real para poder ser comparada lado a lado sem arriscar o acervo. O
   golden continua lá e continua gerando o antes/depois; o que vale para as aulas novas é
   isto aqui.

   ## A regra dura desta parte da folha: NEUTRALIDADE DE ESPAÇO

   A primeira versão da pele foi medida com o `preview.py` e deu OVERFLOW de 34px e 12px,
   invadindo a zona segura de 30mm nas duas páginas. Nenhuma mudança era grande — contorno
   de 1px para 0,55mm, padding de seção de 1,2 para 1,5mm, numeral maior, papel de título
   com borda. Cada uma some sozinha; somadas em oito cartões e três seções, empurraram a
   folha para fora.

   Daí a regra que governa cada linha daqui: **só muda o que não ocupa espaço.**

     - `box-shadow` é de graça: fica FORA da caixa e não entra no fluxo;
     - `border-radius`, cor e `-webkit-text-stroke` também são de graça;
     - `border-width` e `padding` NÃO são: em caixa de altura automática eles somam, mesmo
       com `box-sizing:border-box`. Onde a identidade de parede pede traço mais grosso,
       a folha recusa e usa COR para dar o peso. Os 0,55mm são medida de parede, vista a
       três metros; numa A4 na mão, 1px de tinta já lê como contorno firme.

   Vem por último no arquivo de propósito: era o que a camada fazia, e é o que mantém o
   `!important` de cada linha reduzido a quatro casos, cada um com o motivo escrito.

   O que ela NÃO faz: não pinta o fundo da folha (regra dele — "para impressões de handout
   a cor do papel precisa ainda ser branca senão gasta muita tinta"), não mexe no tamanho
   das caixas de escrita, não mexe na ordem pedagógica.
   ============================================================ */

/* ---------- o título ----------
   Papel de título com campo amarelo e sombra sólida — o mesmo objeto da parede e da
   lâmina. O `padding` que ele ganha é devolvido em `margin` negativa: o bloco ocupa
   exatamente a mesma altura de antes, e é por isso que a página não desce.
   Rotação é permitida no papel (ele corrigiu isso em 24/08), mas o título do handout NÃO
   gira: fica ao lado do timbre institucional, que é reto. */
.hd-title {
  /* `block` + `fit-content`, e NÃO `inline-block`. Medido: `inline-block` cria o vão de
     linha de base embaixo do elemento — o espaço reservado para descendente, mesmo quando
     não há nenhum. São ~3px por elemento, e com título mais três a cinco seções isso somou
     15 a 20px por página. Numa folha com 104px de sobra, foi o que faltou para transbordar. */
  display:block; width:fit-content;
  background:var(--c-paper); color:var(--c-ink) !important;
  border:.4mm solid var(--c-ink);
  box-shadow:1.2mm 1.2mm 0 var(--sombra-titulo);
  padding:.8mm 3.4mm .6mm;
  /* A margem faz DUAS contas, e a primeira versão só fez uma.
     EM CIMA: devolve os 2,2mm que o campo ganhou (padding .8 + .6, borda .4 x 2).
     EMBAIXO: abre 1,2mm, que é exatamente o quanto a SOMBRA desce. Sem isso ela atravessa
     o subtítulo — foi o que o raster mostrou, "Geral, segmentária, paramétrica" saiu
     riscado. Sombra não ocupa espaço no fluxo, mas ocupa no papel. */
  margin:-2.2mm 0 1.2mm -1.2mm;
}

/* ---------- as seções ----------
   A barra de ponta a ponta vira PÍLULA: ocupa a largura do texto, não a da folha, e
   devolve o branco da margem direita. O `padding` vertical continua o original (1,2mm) —
   só o horizontal cresce, e horizontal não empurra a página. A cor de cada seção não muda:
   o código de cor é da spec.

   A ABA embaixo é o refinamento 1, e responde a uma queixa dele: "falta um pouco de
   fluidez". Diagnóstico no raster: a barra de ponta a ponta dizia "tudo abaixo de mim é
   meu, até a próxima barra"; a pílula rotula um ponto e FLUTUA. Trocamos a rigidez pela
   leveza e perdemos a continência junto. O triângulo é o gesto de etiqueta presa numa
   pilha de papel — devolve a continência sem devolver a tinta de ponta a ponta. Absoluto,
   então não ocupa fluxo. */
.sec { display:block; width:fit-content; border-radius:99px; padding:1.2mm 5mm;
  box-shadow:.9mm .9mm 0 var(--sombra-secao); position:relative; }
.sec::after {
  content:""; position:absolute; left:5mm; top:100%;
  border-left:1.6mm solid transparent; border-right:1.6mm solid transparent;
  border-top:1.4mm solid currentColor; opacity:.9;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}
/* A seção dourada tem tinta escura; a aba tem de seguir o FUNDO, não o texto. */
.sec.gold::after   { border-top-color:var(--c-gold); }
.sec.green::after  { border-top-color:var(--c-green); }
.sec.purple::after { border-top-color:var(--c-purple); }

/* ---------- os cartões e as caixas ----------
   Contorno de TINTA, na espessura original de 1px, mais a sombra sólida: o peso vem da
   cor, não da espessura. `.fm` é afirmação e ganha campo pálido; `.fm-fill` é LACUNA, o
   aluno escreve dentro, e continua tracejada — a diferença entre as duas tem de
   sobreviver à pele. `.wb` muda só a cor do traço: tamanho, margem e posição intocados.

   `!important` nestas quatro: `.bex-extra`, `.bex-aquecimento` e as variantes de `.fm`
   declaram `border-color` com especificidade maior, e a pele precisa vencer.

   UM RAIO SÓ: a primeira versão empilhava três arredondamentos — pílula 99px, cartão
   1,8mm, caixa de escrita 2mm. O olho lê isso como inconsistência, não como variedade. A
   pílula continua redonda porque é a única peça que É uma pílula. */
.bex { border-color:var(--c-ink) !important; box-shadow:1.2mm 1.2mm 0 var(--sombra-cartao); }
.fm  { background:var(--c-blue-pale); border-color:var(--c-ink) !important;
  box-shadow:1.1mm 1.1mm 0 var(--sombra-lacuna); }
.wb  { border-color:var(--c-ink) !important; }
.bex, .fm, .wb, .fm-fill { border-radius:1.8mm !important; }

/* ---------- a etiqueta ----------
   O quadradinho escuro vira numeral vazado — ordena sem pesar, e usa menos tinta que o
   bloco cheio. */
.bex .tag {
  background:transparent !important; color:transparent !important;
  font-weight:900;
  /* O numeral existe para ORDENAR: vazado no corpo pequeno original virou um artefato
     pálido. Cresce e ganha traço.
     `line-height:0` foi a primeira tentativa de crescer sem empurrar a linha, e ela
     CORTOU o glifo: com caixa de linha zero a parte de baixo do algarismo cai fora e o
     cartão a apara. Visível só no raster ampliado — no PDF em tamanho normal o "4"
     parecia apenas mal desenhado. A caixa de linha volta a existir (menor que 1, mas
     real) e a altura extra é devolvida por margem negativa. */
  font-size:12pt; line-height:.78; margin-top:-1.1mm; margin-bottom:-.7mm;
  -webkit-text-stroke:.32mm var(--c-blue-mid);
}
/* A etiqueta EM LINHA continua sólida: vazada no meio de uma frase, no corpo pequeno do
   enunciado, fica ilegível. Numeral vazado ordena; não informa dentro do texto. */
.bex .tag.inline {
  background:var(--c-ink) !important; color:#fff !important; -webkit-text-stroke:0;
}

/* ---------- a linha meta ----------
   O fio do cabeçalho passa a ser de tinta: o vermelho fica reservado para o que a
   instituição assina — o timbre —, e a folha perde uma hierarquia disputando atenção. */
.hd-meta { border-bottom-color:var(--c-ink) !important; }

/* ---------- a matemática, 1,15x ----------
   Medido: o MathJax desenha a Euler menor que a prosa no mesmo corpo nominal, e ele
   reclamou disso ("a matemática lê menor"). O primeiro teste, 1,3x, fechava o tamanho e
   abria um problema de PESO — ele viu como negrito e estava certo. No PDF a 1200 dpi, na
   linha "Calcule a distância de $P(3,2)$ até a reta", haste mediana como fração do em:

       prosa (Instrument Sans Regular)   8,8%
       matemática a 1,0x                 8,2%    mais leve que a prosa
       matemática a 1,15x                8,8%    igual à prosa
       matemática a 1,3x                10,1%    14% mais grossa

   Não há negrito em lugar nenhum e nunca houve: sem `font-weight`, sem variante bold da
   face, sem `stroke` nos caminhos do MathJax. O que engrossa é a ampliação, que leva a
   haste junto. 1,15 é onde tamanho e peso fecham ao mesmo tempo.

   `font-size` no `mjx-container`, e não `scale` na configuração do MathJax: assim a
   lâmina, que compartilha o `ma_math.js`, não muda junto. */
mjx-container { font-size:1.15em; }

/* ---------- o mapa do quadro fala a mesma língua ----------
   Refinamento de 25/08, e o diagnóstico é o que interessa: ele olhou as duas amostras e
   disse *"a de cilindros ainda dá pra refinar, a de mat1 tá legal"*. As duas usam a mesma
   biblioteca e saíram da mesma rodada.

   A diferença é de VOCABULÁRIO. Existem duas famílias de folha aqui dentro:

     - a LISTA de exercícios, feita de `.bex` / `.fm` / `.wb` — é a folha de Mat 1;
     - o MAPA DO QUADRO (`mapa()`, `exemplos()`), feito de `.exq` / `.campo` /
       `.campo-aberto` e de uma `.tag` solta, fora de `.bex` — é a folha de cilindros.

   A pele foi escrita olhando a primeira, e por isso a segunda ficou meio vestida: cartão de
   contorno cinza sem sombra ao lado de seção em pílula, e o numeral da questão como texto
   corrido — `.tag` fora de `.bex` não recebia estilo NENHUM, nem antes nem depois.

   `!important` aqui pelo mesmo motivo dos outros quatro casos: `.exq` e `.campo` são
   declarados em `CSS_QUADRO`, que é um `<style>` emitido dentro da página e portanto vence
   por ordem. A alternativa seria mover aquele bloco para cá, e ele mora separado de
   propósito — está escrito lá por quê.

   Continua valendo a neutralidade de espaço: contorno segue com a mesma espessura, padding
   intocado, e o numeral cresce dentro de uma caixa de linha menor que a que ele já ocupava
   (`.exq p` é 8,4pt com entrelinha 1,24, ou seja ~10,4pt; 12pt com entrelinha .78 dá
   ~9,4pt, e portanto não empurra a linha). */
.exq { border-color:var(--c-ink) !important; border-radius:1.8mm !important;
  box-shadow:1.2mm 1.2mm 0 var(--sombra-cartao); }
/* ---------- onde ele escreve ----------
   Ele, 25/08: *"E esses boxes onde eu escrevo as coisas, dá pra colocar tbm?"*

   São quatro classes para a mesma ideia, duas em cada família: `.fm-fill` e `.wb` na lista,
   `.campo` e `.campo-aberto` no mapa do quadro. Passam a ser vestidas pela MESMA regra, e
   é por isso que ela mora aqui embaixo junta em vez de espalhada em quatro lugares.

   O que muda: contorno de tinta e sombra sólida, como os cartões. O que NÃO muda: o
   tracejado. É ele que separa afirmação de lacuna — `.fm` é o que já está dito, `.fm-fill`
   e `.campo` são o que vai ser escrito —, e essa diferença tem de sobreviver à pele. A cor
   da frente sai daqui e fica onde continua informando: no rótulo (`.campo-lab`) e na
   seção. Sombra e cor são de graça; espessura e padding seguem intocados. */
.campo, .campo-aberto, .fm-fill {
  border-color:var(--c-ink) !important;
  border-radius:1.8mm !important;
  box-shadow:1.1mm 1.1mm 0 var(--sombra-lacuna);
}
/* `.wb` fica de fora da sombra, e a razão é de construção: ela mora SEMPRE dentro de um
   cartão — `.bex` na lista, `.exq` no mapa —, e cartão já tem sombra. Sombra dentro de
   sombra vira ruído: rasterizado, a página de prática ficou com quatorze relevos
   empilhados. As três irmãs de cima ficam soltas na folha e por isso precisam do relevo
   para existir como objeto; esta não precisa, porque o cartão já a contém. */
/* O numeral da questão no mapa do quadro — o mesmo objeto do `.bex .tag`, e portanto o
   mesmo desenho. Ver lá em cima por que `line-height:.78` e não `0`. */
.exq .tag {
  display:inline-block; font-size:12pt; line-height:.78; font-weight:900;
  margin-top:-1.1mm; margin-bottom:-.7mm; margin-right:1.2mm;
  color:transparent; -webkit-text-stroke:.32mm var(--c-blue-mid);
}
"""

# ============================================================
# MATHJAX (delimitador $...$ — conferir SEMPRE [["$","$"]])
# ============================================================
# A matemática do papel passou a ser composta pelo MESMO motor da lâmina em 23/08:
# `_padrao/ma_math.js` (MathJax 4.1.3 vendorizado, extensão Euler, base Fira), em modo
# delimitador — a folha continua escrevendo `$…$` como sempre escreveu.
#
# A regra da voz é a mesma nas duas superfícies: *MathJax compõe; Euler fala; Fira Bold
# enfatiza*. Ênfase é `\boldsymbol{}`, variante MATEMÁTICA negrito — nunca `font-weight`,
# que produz um negrito falso com espaçamento errado.
#
# O motor antigo (`mathjax/tex-svg.js`, v3, fonte Latin Modern) continua no repositório
# porque o visualizador de documentos do Modo Aula ainda o usa. Handout não usa mais.
MATHJAX = r"""
<script src="@@MATHJAX_SRC@@"></script>
"""

# Caminho absoluto do MathJax vendorizado (materials/_padrao/mathjax/tex-svg.js).
# Vendorizado (07/2026) para o material renderizar/imprimir sem depender do CDN.
MATHJAX_VENDORED = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                "ma_math.js")


def _require_math_runtime():
    """Fail closed before generating a handout without its offline math runtime."""
    import json
    from pathlib import Path
    root = Path(MATHJAX_VENDORED).parent
    manifest = root / "mathjax-runtime.json"
    entries = json.loads(manifest.read_text(encoding="utf-8"))["files"]
    missing = [entry["path"] for entry in entries
               if not (root / "mathjax" / "v4.1.3" / entry["path"]).is_file()]
    if missing or not Path(MATHJAX_VENDORED).is_file():
        raise FileNotFoundError("Runtime matemático incompleto; consulte docs/materials-engine.md. "
                                + ", ".join(missing[:5]))

# emoji de rosto em contorno (U+FE0E força traço preto, sem amarelo)
EMOJI_ROW = '&#128512;&#65038; &#128528;&#65038; &#128533;&#65038;'


# ============================================================
# BLOCOS
# ============================================================
def header_block(meta):
    """Cabeçalho completo da página 1 (título + subtítulo + linha meta)."""
    data = meta.get("data")
    data_html = (' &nbsp;|&nbsp; Data: ' + data) if data else ''
    # `rotulo_nome` existe para a folha que não é de um aluno só — o Open House de
    # 09/09 é preenchido por aluno E responsável, e "Nome" sozinho pede uma assinatura
    # que a peça não quer.
    rotulo = meta.get("rotulo_nome", "Nome")
    return (
        '<div class="hd-title">' + meta["titulo"] + '</div>'
        '<div class="hd-sub">' + meta["subtitulo"] + '</div>'
        '<div class="hd-meta"><b>' + meta["year"] + ' — ' + meta["turma"]
        + '</b>' + data_html
        + ' &nbsp;|&nbsp; ' + rotulo + ': ______________________________ </div>'
    )


def header_slim(meta):
    """Cabeçalho das páginas internas (só a linha meta, sem título grande)."""
    data = meta.get("data")
    data_html = (' &nbsp;|&nbsp; ' + data) if data else ''
    return (
        '<div class="hd-meta"><b>' + meta["titulo"] + '</b> &nbsp;&middot;&nbsp; '
        + meta["year"] + ' — ' + meta["turma"] + data_html + '</div>'
    )


# ===========================================================================
# BLOCOS APOSENTADOS EM 11/08/2026 — as "bordas da aula" saíram da folha do aluno
# ===========================================================================
#
# `docs/pedagogy.md`, seção 11, tira do handout a provocação
# Referência histórica omitida.
# 11/08, sobre estes quatro blocos:
#
#   "Some de vez. handout/mural/aula de exercício/revisão para a prova é o coração da
#    aula e não precisa dessas 'sujeiras'/instrumentos avaliativos. Diagnóstico/
#    devolutiva e exit slip (QD) fica."
#
# Ou seja: os INSTRUMENTOS continuam — o Passaporte da QD e a devolutiva têm folha
# própria, aplicada e recolhida. O que sai é a sombra deles dentro do handout.
#
# As funções continuam existindo e agora LEVANTAM ERRO. Apagá-las deixaria 53
# geradores quebrando com `AttributeError` a três linhas de distância do motivo; assim
# a mensagem diz o que fazer. `--legado` existe para reimprimir um handout antigo
# exatamente como ele foi para a gráfica, sem reescrever o gerador.
APOSENTADOS = os.environ.get("HANDOUT_LEGADO") != "1"


def _aposentado(nome, motivo):
    if APOSENTADOS:
        raise RuntimeError(
            "%s() saiu do handout em 11/08/2026: %s\n"
            "  Ver docs/pedagogy.md, seção 11.\n"
            "  Tire a chamada do gerador. Para reimprimir um handout antigo como ele\n"
            "  foi impresso, rode com HANDOUT_LEGADO=1." % (nome, motivo))
# Referência histórica omitida.
TERM_COLS = [
    ("Tranquilo", "&#128512;"),        # 😀
    ("Mais ou menos", "&#128528;"),    # 😐
    ("Preciso revisar", "&#128533;"),  # 😟
]


def termometro(topicos, titulo="&#127777;&#65039; Term&ocirc;metro &mdash; como estou nos t&oacute;picos?",
               pergunta_final="O t&oacute;pico que vou revisar primeiro em casa:"):
    """Autoavaliação PADRÃO (desde 22/07): tabela com um tópico por linha e três
    colunas marcáveis (Tranquilo 😀 / Mais ou menos 😐 / Preciso revisar 😟), com a
    bolinha ○ (&#9711;) pro aluno circular. Emoji colorido. Fecha com uma linha aberta.
    `topicos`: lista de strings (curtas) — os assuntos da aula.

    APOSENTADO em 11/08/2026 — autoavaliação de fechamento duplica a QD."""
    _aposentado("termometro", "autoavaliação de fechamento duplica a QD")
    head = ('<tr><th>T&oacute;pico</th>'
            + ''.join('<th class="e">' + lbl + ' ' + emo + '</th>' for lbl, emo in TERM_COLS)
            + '</tr>')
    rows = ''.join(
        '<tr><td>' + t + '</td>'
        + '<td class="c">&#9711;</td>' * len(TERM_COLS)
        + '</tr>'
        for t in topicos
    )
    foot = ('<div class="term-foot">' + pergunta_final
            + ' <span style="border-bottom:1px solid #999; display:inline-block; '
              'min-width:55mm">&nbsp;</span></div>') if pergunta_final else ''
    return (
        '<div class="term"><div class="term-h">' + titulo + '</div>'
        '<table><tbody>' + head + rows + '</tbody></table>'
        + foot + '</div>'
    )


def autoavaliacao(criterios, pergunta="O que ficou mais dif&iacute;cil?"):
    """[LEGADO] Autoavaliação antiga: lista de critérios + emojis em contorno numa
    coluna só. Mantida pra não quebrar handouts antigos já aprovados. Aulas NOVAS
    devem usar termometro() — ver decisão de 22/07 (emoji colorido, marcável por
    tópico).

    APOSENTADO em 11/08/2026 junto com termometro()."""
    _aposentado("autoavaliacao", "autoavaliação de fechamento duplica a QD")
    rows = ''.join(
        '<tr><td>' + c + '</td>'
        '<td style="width:20mm; white-space:nowrap">' + EMOJI_ROW + '</td></tr>'
        for c in criterios
    )
    return (
        '<div class="aa"><div class="aa-h">Autoavalia&ccedil;&atilde;o</div>'
        '<table><tbody>' + rows + '</tbody></table>'
        '<p style="margin-top:1mm">' + pergunta + ' ______________________</p>'
        '</div>'
    )


def qd(enunciado_html, wb_height="20mm"):
    """Compatibilidade com handouts antigos; novos usam o Passaporte da QD.

    APOSENTADO em 11/08/2026 — a QD tem folha própria."""
    _aposentado("qd", "a QD tem folha própria (Passaporte)")
    return (
        '<div class="qd"><div class="qd-h">&#128221; Quest&atilde;o do Dia</div>'
        '<p>' + enunciado_html + '</p>'
        '<div class="wb" style="height:' + wb_height + '; background:#fff"></div>'
        '</div>'
    )


def marca_passaporte(codigo):
    """O que fica no handout no lugar da QD, agora que ela é Passaporte.

    A rotina nova (agosto/2026): a QD sai da folha do aluno e vira uma folha própria —
    aplicação no fim da aula, recolhida na hora, devolutiva abrindo a aula seguinte.
    Mas **apagar** a célula da QD deixaria um buraco: a linha era de duas colunas e o
    handout já estava paginado com ela. Pior, o aluno olharia a folha e concluiria que
    hoje não tem QD.

    Então o lugar continua ocupado, e o que ele diz é para onde a QD foi.

    APOSENTADO em 11/08/2026: o buraco que este bloco tapava deixou de existir quando o
    handout parou de ser paginado com a célula da QD. O aluno recebe a folha do
    Passaporte na mão; não precisa de um aviso na outra folha.
    """
    _aposentado("marca_passaporte", "o Passaporte é entregue em folha própria")
    return (
        '<div class="qd"><div class="qd-h">&#128221; Passaporte da Quest&atilde;o do '
        'Dia</div><p>A QD de hoje <b>n&atilde;o est&aacute; nesta folha</b>: ela vem na '
        'folha do <b>Passaporte ' + codigo + '</b>, entregue no fim da aula e recolhida '
        'na hora. A <b>devolutiva</b> dela abre a pr&oacute;xima aula &mdash; &eacute; '
        'onde voc&ecirc; corrige a sua em outra cor e nomeia o erro.</p></div>')


def qd_autoavaliacao_row(qd_html, aa_html):
    """Compatibilidade com o layout antigo; não usar em handouts novos."""
    return (
        '<table class="lay"><tbody><tr>'
        '<td width="58%">' + qd_html + '</td>'
        '<td width="42%">' + aa_html + '</td>'
        '</tr></tbody></table>'
    )


# ===========================================================================
# O QUADRO PRÉ-CONSTRUÍDO — as duas formas do padrão de 11/08/2026
# ===========================================================================
#
# `docs/pedagogy.md` define o handout como quadro parcialmente
# pré-construído. Na prática ele tem duas partes, e elas se repetem em toda aula:
#
#   1. o MAPA DO QUADRO — a estrutura da teoria com o resultado em branco;
#   2. os EXEMPLOS — enunciado pronto, resolução em branco.
#
# Referência histórica omitida.
# geradores reescrevendo o mesmo CSS local — e já divergindo entre si: `.blank-line` de
# 28mm num, 24mm noutro; `.space` de 38mm num, 28mm noutro; e o terceiro com um
# vocabulário inteiro próprio (`.line`, `.exspace`, `.vt`). Três aulas da mesma semana,
# três dialetos, no primeiro dia do padrão novo.
#
# Pior: nenhum precisava existir. `.gap` já era a lacuna, `.wb` já era o espaço de
# resolução e `.bex` já era a caixa — tudo isto aqui embaixo, desde julho. Ninguém
# reescreve o que sabe que existe; então a correção não é proibir CSS local, é dar nome
# à forma e deixá-la a uma chamada de distância.


def mapa(celulas, largura=None):
    """A faixa de estrutura da teoria: N caixas lado a lado, cada uma com rótulo e o
    resultado em branco para ser escrito durante a aula.

        hl.mapa([("$a>1$", r'$a^u>a^v\\Longleftrightarrow$ ' + hl.gap()),
                 ("$0<a<1$", r'$a^u>a^v\\Longleftrightarrow$ ' + hl.gap())])

    `celulas`: lista de (rótulo, conteúdo_html). Rótulo vazio some.
    """
    if not celulas:
        return ""
    largura = largura or "%d%%" % (100 // len(celulas))
    tds = []
    for rotulo, conteudo in celulas:
        cabeca = ('<div class="rot">' + rotulo + "</div>") if rotulo else ""
        tds.append('<td width="' + largura + '"><div class="bex" '
                   'style="text-align:center">' + cabeca + conteudo + "</div></td>")
    return '<table class="lay"><tbody><tr>' + "".join(tds) + "</tr></tbody></table>"


def gap(largura="28mm"):
    """A lacuna que o aluno completa. Era `.blank-line` copiada em cada gerador."""
    return '<span class="gap" style="min-width:' + largura + '">&nbsp;</span>'


# ---------------------------------------------------------------------------
# Referência histórica omitida.
# ---------------------------------------------------------------------------
#
# Terceira forma do quadro montado, definida em 14/08/2026 a partir de
# Referência histórica omitida.
# certo: *"No caso da de cones pode replicar que a aula tá pronta. E até para as demais,
# inclusive nos exemplos. Essa mesma linha é que quero que os outros handouts sigam."*
#
# Difere do `mapa()` em duas coisas que ele cobrou no mesmo dia:
#
# - o campo tem a largura da FÓRMULA, não a da coluna (`H6a`): *"o espaço pra fórmulas
#   não é uma linha inteira. Avalie a fórmula e o espaço que ele realmente precisa"*;
# - a figura vem ROTULADA de material validado (`H6c`, `H8`) — eixo, `g`, `h`, `R`,
#   `2πR`. O que a folha não imprime é a fórmula, não o nome do elemento.
#
# O CSS mora aqui, e não em `CSS`, de propósito: `CSS` entra no carimbo
# `versao_da_biblioteca()`, e mexer nele marcaria os ~130 handouts do repo como "gerado
# com biblioteca velha" sem que uma linha do que eles imprimem tivesse mudado — ruído
# em cima de material que já foi para a gráfica. Como constante única, continua sendo
# uma fonte só: o defeito que `mapa()`/`exemplos()` existem para evitar era cada gerador
# escrever o SEU `.blank-line`, não haver dois blocos de CSS na biblioteca.
CSS_QUADRO = r"""
<style>
/* Respiro entre seções. Pedido dele em 15/08, depois de ver as seis folhas: "aumentar
   levemente o espaço entre seções, na parte inferior, me permite escrever algo embaixo
   da figura". O `.sec` global abre 3mm; aqui a faixa sobe para 5.5mm e cada linha de
   figuras fecha com 3.5mm. A margem é dele, não decoração: é onde a anotação cabe. */
.sec { margin-top:5.5mm; }
.qlinha { margin-bottom:3.5mm; }

.fig { display:block; max-width:100%; height:auto; margin:0 auto; }
/* 7.2pt, não 6.6: a legenda tem que ser LEGÍVEL, senão é tinta gasta. */
.fig-cap { font-size:7.2pt; color:var(--c-muted); text-align:center; margin-top:.6mm; line-height:1.18; }
.campo { border:1.3px dashed var(--c-primary); border-radius:1.4mm; background:#fff;
  margin:.5mm 0 1.6mm; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.campo-lab { font-size:7.4pt; font-weight:700; color:var(--c-primary);
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.campo-aberto { border:1.5px dashed #999; border-radius:2mm; }

.exq { border:1px solid var(--c-border); border-radius:1.6mm; padding:1.7mm 2mm 1mm;
  margin-bottom:1.7mm; }
.exq p { margin:0; font-size:8.4pt; line-height:1.24; }
/* UMA POR LINHA é o padrão, para alternativa e para item de questão. Dele, em 15/08:
   *"Quando digo alternativa é A) B) C) D). Eu prefiro quebras de linha do que tudo
   inline. Isso se aplica a questões com itens. Usar inline só quando precisar mesmo."*
   O `inline` continua existindo (`hl.exemplo(..., inline=True)`) para quando a linha é
   curta e a folha está no limite — é exceção, não default. */
.exq .alts { font-size:8.2pt; margin-top:1mm; }
.exq .alts li { list-style:none; margin:0 0 .9mm; line-height:1.25; }
.exq .alts.inline li { display:inline-block; margin-right:6mm; white-space:nowrap; }
.exq .itens { font-size:8.4pt; margin-top:1mm; }
.exq .itens li { list-style:none; margin:0 0 .9mm; line-height:1.25; }
.exq .itens.inline li { display:inline-block; margin-right:6mm; }
/* Tabela rotulada (hl.tabela_rotulada) — a forma da apostila da Escalada, p.99: título de
   coluna EM CIMA, título de linha À ESQUERDA, e o canto dizendo o que cruza com o quê.
   Dele, em 15/08: *"Na ativação bota duas tabelas com os títulos de cabeçalho e linha. No
   material da escalada tem um bom exemplo."* É o passo que falta antes da matriz: a
   tabela tem os rótulos, a matriz é a tabela com os rótulos apagados. */
.trot { border-collapse:collapse; table-layout:fixed; margin:.6mm 0 .8mm; font-size:8pt; }
.trot th, .trot td { border:1px solid #8a8a8a; text-align:center; padding:1mm .6mm; }
.trot th { background:var(--c-gold-tint); font-weight:700;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.trot th.canto { background:#fff; color:var(--c-muted); font-size:6.8pt; font-weight:600;
  line-height:1.1; }
.trot th.rlab { text-align:left; padding-left:1.6mm; }

/* Conteúdo JÁ IMPRESSO dentro do campo — a operação prestes a ser feita. */
.campo-dentro { padding:1.5mm 2mm; font-size:9pt; }

/* O espaço de resolução perdeu o pontilhado. Dele, no mesmo dia: "essa linha do espaço
   de resolução não é [importante]. O exemplo já está dentro de um box. Então é só
   manter o tamanho e tirar o pontilhado."
   A classe `wb` fica: é por ela que o `checar_handout.py` responde "o aluno resolve
   onde?". O espaço continua existindo — o que sumiu foi a borda. */
.exq .resolucao { border:none; margin:1mm 0 0; }
</style>
"""

# `materials/<Year>/<Turma>/<aula>/handout.html` → `materials/assets/images/`
ASSETS = "../../../assets/images/"


def figura(nome, largura, legenda="", base=ASSETS):
    """Figura validada, no tamanho em que o rótulo dela ainda se lê.

    `largura` em mm. Duas figuras lado a lado com tamanhos muito diferentes é defeito:
    *"não esse espaço gigantesco que vc deixou com uma figura gigante e outra pequena
    que nem da pra ver o que tá escrito"* (14/08).
    """
    img = ('<img class="fig" src="' + base + nome + '" style="width:' + largura
           + '" alt="">')
    return img + ('<div class="fig-cap">' + legenda + '</div>' if legenda else '')


# Alturas de campo por tipo do que vai dentro. A regra `H6a` diz que o campo tem o
# tamanho da fórmula; estas constantes são essa regra escrita uma vez só, para o bloco de
# álgebra não recomeçar a chutar. Dele, em 15/08, olhando os campos dos tipos de matriz:
# *"Lembra que te falei do box permitir caber a fórmula dentro? Isso vale pra matriz
# também. (…) Só não cabe matriz ali. Aumentar a altura do box pra poder escrever a
# matriz dentro."*
ALTURA_LINHA = "8mm"      # igualdade de uma linha: A = πRg
ALTURA_FRACAO = "13mm"    # fração escrita à mão: V = πR²h/3
ALTURA_MATRIZ_2 = "20mm"  # matriz 2×2 entre colchetes, escrita à mão
ALTURA_MATRIZ_3 = "26mm"  # matriz 3×3
# Operação ENTRE matrizes: cabem as duas parcelas e o resultado na mesma linha.
# Dele, em 15/08: *"para escrever sobre soma e produto de escalar precisa de bem
# mais espaço"*. Campo de operação é largo (80mm+) e alto — não é o campo de
# "escreva uma matriz identidade", que pede só a matriz.
ALTURA_OPERACAO = "30mm"


def campo(rotulo, largura, altura=ALTURA_LINHA, dentro=""):
    """Rótulo da relação + retângulo DO TAMANHO DO QUE VAI DENTRO.

    Uma igualdade de uma linha (`A = πRg`) pede ~38mm × 8mm; uma fração
    (`V = πR²h/3`) pede ~13mm de altura, porque ocupa duas linhas de escrita à mão; e um
    campo que vai receber uma **matriz** pede a altura da matriz — `ALTURA_MATRIZ_2` ou
    `ALTURA_MATRIZ_3`. Campo de 8mm com rótulo "Matriz identidade Iₙ" é o mesmo erro da
    caixa de largura total, só que na outra dimensão.

    `dentro` imprime a PARTIDA da conta dentro do campo — a operação montada até o sinal
    de igual, faltando só o resultado. Dele, em 15/08: *"Apesar de ser bom ter espaço, a
    folha toda só com boxes vazios não funciona tanto. É bom um escrito inicial, uma
    matriz ou uma operação prestes a ser feita para iniciar. Dá pra colocar algo dentro
    de um ou outro box."* Um ou outro: campo com partida é a âncora da seção (`H6i`), não
    o padrão de todos — se todos vierem montados não sobra o que montar.
    """
    return ('<div class="campo-lab">' + rotulo + '</div>'
            '<div class="campo" style="width:' + largura + ';height:' + altura + '">'
            + ('<div class="campo-dentro">' + dentro + '</div>' if dentro else '')
            + '</div>')


def campo_aberto(altura, rotulo=""):
    """Espaço livre ao lado da figura — onde ele puxa as retas e nomeia os elementos."""
    lab = ('<div class="campo-lab">' + rotulo + '</div>') if rotulo else ''
    return lab + '<div class="campo-aberto" style="height:' + altura + '"></div>'


def _lista(entradas, classe, inline):
    """a) … b) … c) …, uma por linha — que é o padrão desde 15/08."""
    itens = ''.join('<li><b>%s)</b> %s</li>' % (chr(97 + i), t)
                    for i, t in enumerate(entradas))
    return '<ul class="%s%s">%s</ul>' % (classe, ' inline' if inline else '', itens)


def exemplo(n, enunciado, altura, figura_html="", alternativas=(), largura_fig="34%",
            itens=(), inline=False):
    """Exemplo de material validado: enunciado (e figura) impressos, resolução em branco.

    `alternativas` vazio = questão aberta, que pede caixa grande. Com alternativas a
    caixa encolhe: *"quando tem alternativa em geral o espaço da alternativa já da pra
    usar pra resolver só exigindo um porquinho a mais"* (14/08). Ter alternativa não
    engessa a questão — ela continua sendo resolvida.

    `itens` são as letras da PRÓPRIA questão ("a) a geratriz; b) a área lateral"), que
    não são alternativas: cada uma é uma resposta a produzir. Vão em lista, como as
    alternativas, porque em 15/08 ele fechou a regra para os dois casos: *"Eu prefiro
    quebras de linha do que tudo inline. Isso se aplica a questões com itens."*

    `inline=True` volta ao comportamento antigo (tudo numa linha). É escape, para quando
    as entradas são curtíssimas e a folha está estourando — não é o default.

    A letra é minúscula porque é assim que ela aparece nos documentos de onde os
    enunciados vêm (Harmonia, ENEM, vestibulares) e trocar por maiúscula descolaria a
    folha da fonte que o aluno vai reencontrar na prova.
    """
    corpo = '<p><span class="tag">%02d</span> %s</p>' % (n, enunciado)
    if itens:
        corpo += _lista(itens, 'itens', inline)
    if alternativas:
        corpo += _lista(alternativas, 'alts', inline)
    if figura_html:
        larg_txt = "%d%%" % (100 - int(str(largura_fig).rstrip('%')))
        corpo = ('<table class="lay"><tbody><tr><td width="' + larg_txt + '">' + corpo
                 + '</td><td width="' + str(largura_fig) + '">' + figura_html
                 + '</td></tr></tbody></table>')
    # `altura=""` = a questão já traz o espaço de escrita dentro do enunciado (campos
    # rotulados, como em Heron: "Semiperímetro" e "Área"). Sem isso o gerador precisava
    # remendar o HTML por fora, e uma caixa branca extra no fim é espaço que a folha não
    # tem — ou, pior, uma linha vazia com borda logo abaixo do campo.
    if not altura:
        return '<div class="exq">' + corpo + '</div>'
    return ('<div class="exq">' + corpo + '<div class="wb resolucao" style="height:'
            + altura + '"></div></div>')


def matriz(linhas, anotacao_linhas="", anotacao_colunas="", tam="10pt", delim="barra"):
    """Uma matriz entre colchetes, em HTML — a "figura" da álgebra.

    Matriz não é geometria: é tipografia. Não precisa de SVG nem de figura importada, e
    montá-la aqui garante que ela nasce do mesmo lugar em toda folha do bloco de matrizes,
    determinantes e sistemas.

    `anotacao_linhas` / `anotacao_colunas` põem o rótulo ao lado e embaixo — é o que a
    apostila da Escalada faz à mão, com as chaves de "m linhas" e "n colunas" sobre a
    matriz genérica (ver `docs/pedagogy.md`, seção 3b). A do
    professor não pode ser recortada para a folha da escola porque carrega a marca d'água do
    curso dele; a estrutura, sim.
    """
    # `delim`: "barra" desenha |…| — a notação de DETERMINANTE; "colchete" desenha […],
# Referência histórica omitida.
# Referência histórica omitida.
    # (25/09) passa "colchete" para matriz e deixa a barra só no determinante — a folha
    # anterior escrevia A = |1 2 0| e a matriz parecia um determinante.
    def celula(c):
        vazia = str(c) == ""
        return ('<td style="padding:.6mm 2.4mm;text-align:center%s">%s</td>'
                % (";min-width:7mm;height:5mm" if vazia else "", "&nbsp;" if vazia else c))
    if delim == "colchete":
        n = len(linhas)

        def canto(i, lado):
            b = "border-%s:2px solid var(--c-ink)" % lado
            if i == 0:
                b += ";border-top:2px solid var(--c-ink)"
            if i == n - 1:
                b += ";border-bottom:2px solid var(--c-ink)"
            return '<td style="width:1.4mm;padding:0;%s"></td>' % b
        corpo = "".join("<tr>" + canto(i, "left") + "".join(celula(c) for c in L)
                        + canto(i, "right") + "</tr>" for i, L in enumerate(linhas))
        tab = ('<table style="display:inline-table;border-collapse:collapse;'
               'vertical-align:middle;font-size:%s"><tbody>%s</tbody></table>' % (tam, corpo))
    else:
        corpo = "".join("<tr>" + "".join(celula(c) for c in L) + "</tr>" for L in linhas)
        tab = ('<table style="display:inline-table;border-collapse:collapse;'
               'border-left:2px solid var(--c-ink);border-right:2px solid var(--c-ink);'
               'vertical-align:middle;font-size:%s"><tbody>%s</tbody></table>' % (tam, corpo))
    if anotacao_linhas:
        tab += ('<span style="font-size:7.4pt;font-weight:700;color:var(--c-red);'
                'margin-left:1.5mm">&larr; %s</span>' % anotacao_linhas)
    if anotacao_colunas:
        # `inline-block`, não `block`: com anotação de coluna a matriz continua sendo
        # um átomo na linha. Em bloco, `A · B` vira A em cima, ponto no meio, B embaixo —
        # foi o que aconteceu na primeira versão da folha de produto (26/08).
        tab = ('<span style="display:inline-block;text-align:center;vertical-align:middle">%s'
               '<span style="display:block;font-size:7.4pt;font-weight:700;'
               'color:var(--c-blue);margin-top:.6mm">%s</span></span>'
               % (tab, anotacao_colunas))
    return tab


def destaque(html, topo="1.2mm", alinhar="center", recuo="0"):
    """A expressão em LINHA PRÓPRIA, centralizada — ou encostada onde a conta começa.

    Matriz no meio da frase é armadilha de layout: `hl.matriz()` é uma `inline-table`, e o
    navegador quebra a linha entre o sinal e ela — sai "Determine X em X −" no fim de uma
    linha e a matriz sozinha no começo da outra, com o sinal órfão. Aconteceu em cinco
    exemplos das folhas de 25/08, 26/08 e 31/08 ao mesmo tempo, que é o sinal de que o
    lugar do conserto é aqui e não em cada gerador.

    Regra: **enunciado em prosa, expressão em linha própria** (`H6m`). O texto continua
    depois, se precisar.

    `alinhar="left"` põe a expressão **onde a conta começa**, e não no meio do box. Dele,
    em 15/08, sobre a 3×3 do exemplo de Sarrus: *"No exercício 2 colocar na posição de
    calcular o det. No local onde tá fica difícil."* Centralizada, a matriz fica no meio
    da caixa e o aluno não tem para onde repetir as duas colunas — o dispositivo cresce
    para a direita e para baixo, então a matriz precisa nascer no canto superior esquerdo
    do espaço de escrita. Vale para tudo que se resolve EM CIMA da expressão impressa
    (Sarrus, escalonamento, dispositivo prático), não para a que só é lida.
    """
    estilo = 'text-align:' + alinhar + ';margin-top:' + topo
    if recuo and recuo != "0":
        estilo += ';padding-left:' + recuo
    return '<div style="' + estilo + '">' + html + '</div>'


def tabela_rotulada(canto, colunas, linhas, altura_celula="7mm", largura="100%",
                    legenda=""):
    """A tabela com título de coluna e título de linha — o passo ANTES da matriz.

        hl.tabela_rotulada("loja &times; bolo", ["Bolo 1", "Bolo 2", "Bolo 3"],
                           [("Loja A", ["5", "3", "2"]), ("Loja B", ["2", "1", "4"])])

    Dele, em 15/08, mandando a página 99 da apostila da Escalada: *"Na ativação bota duas
    tabelas com os títulos de cabeçalho e linha."* A ativação não pode abrir com matriz
    crua: matriz é a tabela **depois** que os rótulos foram apagados, e o aluno que ainda
    não sabe o que é linha e o que é coluna não tem como ler duas matrizes soltas. Com o
    cabeçalho impresso, "linha × coluna" já está dito antes de a regra existir.

    `linhas`: `(rótulo, [células])` — células faltando saem VAZIAS, que é como se pede a
    tabela-resultado para o aluno completar. Só o rótulo (string) = linha inteira vazia.
    """
    cab = ('<tr><th class="canto">' + canto + '</th>'
           + ''.join('<th>' + c + '</th>' for c in colunas) + '</tr>')
    corpo = []
    for item in linhas:
        rot, celulas = (item, []) if isinstance(item, str) else item
        celulas = list(celulas) + ['&nbsp;'] * (len(colunas) - len(celulas))
        corpo.append('<tr><th class="rlab">' + rot + '</th>'
                     + ''.join('<td style="height:%s">%s</td>' % (altura_celula, c)
                               for c in celulas) + '</tr>')
    tab = ('<table class="trot" style="width:%s"><tbody>%s%s</tbody></table>'
           % (largura, cab, ''.join(corpo)))
    return tab + ('<div class="fig-cap">' + legenda + '</div>' if legenda else '')


def macete_produto(a, b, destaque=(0, 0), tam="9.5pt"):
    """O produto de matrizes disposto como quadrantes — o macete dele.

    Ele, em 15/08: *"faço tipo um plano cartesiano com o segundo quadrante pequeno.
    Coloco a primeira matriz no terceiro quadrante, a segunda matriz no primeiro
    quadrante e faço o produto de linha coluna se encontrando e me dando o resultado no
    quarto quadrante."*

    `A` fica embaixo à esquerda, `B` em cima à direita, e o resultado no encontro — cada
    célula do resultado está literalmente no cruzamento da sua linha (em `A`) com a sua
    coluna (em `B`). É por isso que o arranjo ensina: a regra "linha × coluna" deixa de
    ser ritual e vira posição na folha.

    `destaque` pinta uma linha de `A`, uma coluna de `B` e a célula do resultado onde
    elas se encontram — o caso que ele resolve no quadro antes de soltar a turma. As
    outras células do resultado ficam **vazias**: são o espaço de escrita.
    """
    di, dj = destaque
    # `--c-primary-tint` é claro demais para marcar linha e coluna no papel;
    # o dourado da diagnóstica é o realce que se enxerga impresso.
    realce = ("background:var(--c-gold-tint);-webkit-print-color-adjust:exact;"
              "print-color-adjust:exact;")

    def bloco(linhas, marca_linha=None, marca_coluna=None):
        corpo = []
        for i, L in enumerate(linhas):
            tds = []
            for j, c in enumerate(L):
                st = "padding:.7mm 2.6mm;text-align:center;"
                if (marca_linha is not None and i == marca_linha) or \
                   (marca_coluna is not None and j == marca_coluna):
                    st += realce
                tds.append('<td style="%s">%s</td>' % (st, c))
            corpo.append("<tr>" + "".join(tds) + "</tr>")
        return ('<table style="display:inline-table;border-collapse:collapse;'
                'border-left:2px solid var(--c-ink);border-right:2px solid var(--c-ink);'
                'font-size:%s"><tbody>%s</tbody></table>' % (tam, "".join(corpo)))

    vazio = []
    for i in range(len(a)):
        L = []
        for j in range(len(b[0])):
            st = ("padding:2.4mm 3.4mm;border:1.2px dashed var(--c-primary);"
                  "min-width:9mm;")
            if (i, j) == (di, dj):
                st += realce
            L.append('<td style="%s">&nbsp;</td>' % st)
        vazio.append("<tr>" + "".join(L) + "</tr>")
    resultado = ('<table style="display:inline-table;border-collapse:separate;'
                 'border-spacing:1.2mm"><tbody>%s</tbody></table>' % "".join(vazio))

    cel = 'style="padding:1.5mm 2mm;vertical-align:middle"'
    return (
        '<table class="lay"><tbody>'
        '<tr><td width="45%%" ' + cel + '>&nbsp;</td>'
        '<td width="55%%" ' + cel + '>' + bloco(b, marca_coluna=dj) + '</td></tr>'
        '<tr><td ' + cel + ' align="right">' + bloco(a, marca_linha=di) + '</td>'
        '<td ' + cel + '>' + resultado + '</td></tr>'
        '</tbody></table>')


def linha(celulas, respiro=True):
    """Uma faixa do quadro: células lado a lado, com respiro embaixo para ele anotar.

        hl.linha([("30%", hl.figura(...)), ("70%", hl.campo(...))])

    O respiro é o pedido de 15/08 — *"aumentar levemente o espaço entre seções, na parte
    inferior, me permite escrever algo embaixo da figura"*. Desligue com `respiro=False`
    quando duas faixas formam um bloco só.

    Existe também para tirar `<table class="lay"><tbody><tr>…` de dentro de seis
    geradores: multi-coluna continua sendo `<table>` com width explícito (Grid e Flex são
    proibidos no padrão), mas isso é detalhe da biblioteca, não de cada aula.
    """
    tds = ''.join('<td width="%s">%s</td>' % (larg, html) for larg, html in celulas)
    classe = 'lay qlinha' if respiro else 'lay'
    return '<table class="%s"><tbody><tr>%s</tr></tbody></table>' % (classe, tds)


def exemplos(itens, altura="wb-m", colunas=2, letras=True, centro=True):
    """Os exemplos da aula: enunciado impresso, resolução em branco.

        hl.exemplos([r'$3^{x^2-4}<1$', r'$4^x>8$', ...])

    `itens`: lista de enunciados em HTML — ou de (etiqueta, enunciado) quando a etiqueta
    não é a letra da ordem.

    `altura`: `wb-s` 22mm, `wb-m` 34mm, `wb-l` 50mm, `wb-xl` 70mm — ou uma medida
    literal (`"38mm"`) quando a conta pede um tamanho que não está na escala. O padrão
    manda dimensionar pela escrita que o aluno realmente faz, não por simetria, e uma
    escala fechada obrigaria a arredondar o espaço da conta para o degrau mais próximo.
    """
    def espaco():
        if altura and altura[0].isdigit():
            return '<div class="wb" style="height:' + altura + '"></div>'
        return '<div class="wb ' + altura + '"></div>'

    def rotulo(i):
        # None = sem etiqueta. Existe porque nem toda faixa de exemplos é chamada pelo
        # número em aula: quando são quatro equações curtas lado a lado, o "1." rouba
        # espaço da matemática e não serve pra nada — ninguém diz "resolva o exemplo 3".
        if letras is None:
            return ""
        return chr(65 + i) if letras else str(i + 1)

    caixas = []
    for i, item in enumerate(itens):
        if isinstance(item, (tuple, list)):
            etiqueta, enunciado = item
        else:
            etiqueta, enunciado = rotulo(i), item
        tag = ('<span class="tag">' + str(etiqueta) + "</span>") if etiqueta else ""
        # Equação curta centraliza e ganha corpo de fórmula; enunciado de texto fica
        # alinhado à esquerda no corpo do texto — centralizar parágrafo de duas linhas
        # atrapalha a leitura e foi o que saiu errado na primeira versão da prática do
# Referência histórica omitida.
        estilo = ('text-align:center; font-size:var(--fs-fm)' if centro
                  else 'text-align:left')
        caixas.append(
            '<div class="bex">' + tag
            + '<div style="' + estilo + '; margin:var(--sp-1) 0">' + enunciado
            + "</div>" + espaco() + "</div>")

    largura = "%d%%" % (100 // max(1, colunas))
    linhas, i = [], 0
    while i < len(caixas):
        faixa = caixas[i:i + colunas]
        # a última linha incompleta não estica a caixa: célula vazia mantém a coluna
        faixa += [""] * (colunas - len(faixa))
        linhas.append("<tr>" + "".join(
            '<td width="' + largura + '" style="vertical-align:top">' + c + "</td>"
            for c in faixa) + "</tr>")
        i += colunas
    return '<table class="lay"><tbody>' + "".join(linhas) + "</tbody></table>"


def tabela_valores(cabecalho, linhas):
    """A tabela que o aluno preenche com o professor.

        hl.tabela_valores(["$x$", "$-2$", "$-1$", "$0$", "$1$"],
                          ["$2^x$", r'$\\left(\\frac12\\right)^x$'])

    `linhas`: o rótulo de cada linha — as células ficam vazias, que é o ponto. Passar
    uma lista no lugar do rótulo preenche células (útil quando parte já vem pronta).
    """
    cab = "<tr>" + "".join("<th>" + c + "</th>" for c in cabecalho) + "</tr>"
    corpo = []
    for linha in linhas:
        celulas = linha if isinstance(linha, (tuple, list)) else [linha]
        celulas = list(celulas) + [""] * (len(cabecalho) - len(celulas))
        corpo.append("<tr>" + "".join("<td>" + c + "</td>" for c in celulas) + "</tr>")
    return '<table class="tv"><tbody>' + cab + "".join(corpo) + "</tbody></table>"


def page_first(meta, content_html, pgnum=None):
    """Página 1 (padding 40mm, cabeçalho completo)."""
    pg = ('<span class="pgnum">' + str(pgnum[0]) + ' / ' + str(pgnum[1]) + '</span>') if pgnum else ''
    return '<div class="a4">' + header_block(meta) + content_html + pg + '</div>'


def page_inner(meta, content_html, pgnum=None):
    """Páginas 2+ (padding 32mm, cabeçalho slim)."""
    pg = ('<span class="pgnum">' + str(pgnum[0]) + ' / ' + str(pgnum[1]) + '</span>') if pgnum else ''
    return '<div class="a4 inner">' + header_slim(meta) + content_html + pg + '</div>'


# ============================================================
# MONTAGEM FINAL (com checagens de sanidade)
# ============================================================
def build(meta, pages, out_dir, output_name="handout", *, letterhead_path=None):
    """Monta o HTML final e grava em out_dir/output_name.html.
    meta: dict com titulo, subtitulo, year, turma, data, theme ("mat1"/"mat2").
    pages: lista de strings (usar page_first/page_inner)."""
    theme = THEMES[meta.get("theme", "mat1")]
    paginador_src = os.path.relpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)),
                     "paginador_handout.js"), out_dir).replace(os.sep, "/")
    # Explicit opt-in only: institutional assets remain outside the public repo.
    letterhead = letterhead_path
    # Timbrado e MathJax referenciados por caminho RELATIVO ao out_dir (vendorizados,
    # 07/2026): evita 2,2 MB de base64 do timbrado + 2,1 MB do MathJax embutidos em
    # cada handout, e o material imprime/renderiza sem depender do CDN. O preview.py
    # reescreve esses caminhos para file:// absoluto ao copiar a aula pro sandbox.
    bg = "none"
    if letterhead is not None:
        if not os.path.isfile(letterhead):
            raise FileNotFoundError(letterhead)
        bg = "url(\'" + load_bg(os.fspath(letterhead)) + "\')"
    _require_math_runtime()
    mathjax_src = os.path.relpath(MATHJAX_VENDORED, out_dir).replace(os.sep, "/")
    css = (CSS.replace("@@TOKENS@@", _tokens_css(meta.get("theme", "mat1")))
              .replace("@@FACES@@", _faces_css())
              .replace("@@PRIMARY@@", theme["primary"])
              .replace("@@PRIMARY_TINT@@", theme["tint"])
              .replace("@@BG@@", bg))

    # ---- zona segura do timbrado, declarada em toda folha ----
    # O `preview.py` sabe cobrar `data-safe-bottom-mm` desde sempre, mas nenhum
    # gerador declarava o atributo: a checagem existia e nunca rodava, e foi por isso
    # que ele aprovou folha com a arte do timbre atravessando caixa de resolução.
    #
    # Injetado AQUI e não em `page_first`/`page_inner` porque 109 dos 116 geradores
    # montam `<div class="a4">` na mão e nunca chamam os construtores — mudança nos
    # construtores alcançaria 6 aulas. O `build()` é o funil por onde todas passam.
    pages = [re.sub(r'<div class="(a4[^"]*)"',
                    '<div class="\\1" data-safe-bottom-mm="%d"' % SAFE_BOTTOM_MM, p)
             for p in pages]

    html = (
        '<!DOCTYPE html>\n<html lang="pt-BR" data-math-delim="$"'
        # `math_inteira`: fórmula em linha não quebra no meio ("|x|" numa linha e "< 1"
        # na outra). Opt-in: os listões pedem (25/09); os handouts seguem como estão.
        + (' data-math-inteira' if meta.get("math_inteira") else '') + '>\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="handout-lib" content="' + versao_da_biblioteca() + '">\n'
        '<meta name="handout-ger" content="' + str(GERACAO) + '">\n'
        '<title>' + meta["titulo"] + '</title>\n'
        + MATHJAX.replace("@@MATHJAX_SRC@@", mathjax_src)
        + '<style>' + css + '</style>\n'
        '</head>\n<body>\n'
        + '\n'.join(pages) + '\n'
        # O paginador roda no navegador de quem imprime e decide onde a página quebra —
        # a mesma correção que as listas receberam. Ele NÃO reordena nada: num handout a
        # ordem é a aula. Conservador por construção: se o conteúdo não couber nas folhas
        # que o gerador declarou, ele não mexe. Ver `paginador_handout.js`.
        + '<script src="' + paginador_src + '"></script>\n'
        '</body>\n</html>'
    )

    # ---- Sanidade: caracteres de controle vindos de escapes LaTeX ----
    ctrl = [(i, hex(ord(c))) for i, c in enumerate(html) if ord(c) < 32 and c not in '\n']
    assert not ctrl, ("CARACTERES DE CONTROLE DETECTADOS (provável \\t \\b \\f \\r em LaTeX): "
                      + str(ctrl[:5]))
    # ---- Sanidade: o motor matemático está pendurado na folha ----
    # A pergunta é a mesma de antes — "esta folha ainda sabe compor `$…$`?" —, só que a
    # configuração saiu daqui e foi para o `ma_math.js`, compartilhado com a lâmina. As
    # duas metades precisam existir: o modo delimitador declarado no `<html>` e o script
    # carregado. Faltando qualquer uma, a folha imprime o TeX cru, e isso já aconteceu.
    assert 'data-math-delim="$"' in html, "modo delimitador ausente no <html>"
    assert "ma_math.js" in html, "motor matemático não referenciado"
    # ---- Sanidade: R$ sem escape — MathJax engole o par de cifrões e corrompe
    #      a frase inteira ("R$ 200 vira R$ 140" rende itálico sem espaços).
    #      Em preços, escrever sempre R\$ (processEscapes ligado). ----
    body = html.split("</head>", 1)[-1]
    # O par que interessa é o de PREÇO: "R$" colado a um número. A checagem literal
    # reprovava também a variável `$R$` — raio, em toda folha de sólidos de revolução —
    # que é matemática legítima e não tem nada a ver com moeda.
    preco_cru = re.search(r"R\$\s*\d", body)
    assert preco_cru is None, \
        "R$ sem escape no conteudo: use R\\$ (senao o MathJax trata como formula)"
    # E o cifrão SOZINHO antes de número, que é a mesma armadilha em material em inglês:
    # "$10 000. Mo owns a greenhouse worth about $30 000" virou UMA fórmula, e a frase
# Referência histórica omitida.
    # navegador a decodifica antes de o MathJax varrer o DOM. O escape é a barra.
    #
    # A primeira versão olhava `$` seguido de dígito e pronto. Isso reprovou a lista de
    # Triângulo Retângulo (02/09), que tem 87 fórmulas legítimas começando por número —
    # `$3\\text{ km}$`, `$0°<x<90°$`. Portão que reprova o certo é portão que se desliga.
    #
    # O que separa os dois casos não é o dígito, é o que vem DEPOIS do `$` de abertura:
# Referência histórica omitida.
    # "10 000. Mo owns a greenhouse worth about " — com ponto-e-espaço no meio, porque o
    # `$` não abria fórmula nenhuma, abria o preço da frase seguinte.
    #
    # Então: retiram-se os pares `$…$` que se parecem com fórmula (sem fim de frase
    # dentro), e o que sobrar de `$` antes de número é moeda de verdade.
    def _prosa(seg):
        """Um `$…$` que carrega fim de frase não é fórmula — é preço que engoliu texto."""
        return ". " in seg or len(seg) > 200

    ESCONDE_ESCAPADO = "\x00CIFRAO\x00"

    def _sem_formulas(texto):
        # A fórmula sai INTEIRA, delimitadores incluídos; o par suspeito fica intacto,
        # com os cifrões, que é justamente o que a busca de moeda precisa enxergar.
        # (A primeira tentativa deste conserto juntava os pedaços sem recolocar os
# Referência histórica omitida.
        # defeito que ele existe para pegar. Pego pelo teste abaixo, não pela revisão.)
        #
        # O `\$` ESCAPADO some antes de emparelhar, e volta depois. Sem isso ele conta
        # como delimitador e desloca em UM todo o emparelhamento seguinte: no listão de
        # Geometria Analítica (03/09) um `R\$` no enunciado 11 fazia a alternativa `$4$`
        # da questão 24 casar com o `$` da questão seguinte, e o portão acusava moeda
        # numa folha que não tinha nenhuma. Mesmo defeito de paridade que o portão do
        # `<` já tinha tido — escapado não é delimitador.
        texto = texto.replace("\\$", ESCONDE_ESCAPADO)
        texto = re.sub(r"\$([^$]*)\$",
                       lambda m: m.group(0) if _prosa(m.group(1)) else " ", texto)
        return texto.replace(ESCONDE_ESCAPADO, "\\$")

    dolar_cru = re.findall(r"(?<![\\A-Za-z])\$\s*\d", _sem_formulas(body))
    assert len(dolar_cru) < 2, \
        ("cifrao de moeda sem escape (%d ocorrencias): use \\$ — dois cifroes na mesma "
         "frase viram uma formula e a frase some" % len(dolar_cru))
    # ---- `<` que ABRE ETIQUETA dentro de fórmula ----
    #
    # Medido nas duas direções, na mesma folha (02/09):
    #
    #     `$0°<x<90°$`   ->  "Simplifique [fórmula], para $0°"   — some o fim da frase
    #     `$0°&lt;x&lt;90°$` ->  "Simplifique [fórmula], para [fórmula]."
    #
    # Mas NEM TODO `<` quebra, e a primeira versão deste portão reprovava a folha de
    # Logaritmos, que está correta: `base $0 < a < 1$` e `$\log_3(x-1) < 2$` compõem
    # perfeitamente. O parser de HTML só abre etiqueta quando o `<` é seguido de letra,
    # `/`, `!` ou `?`. `< ` com espaço é texto.
    #
    # Então a regra é essa, e não "todo `<`". Portão que reprova a folha certa é portão
    # que alguém desliga — foi o que aconteceu hoje com o assert do cifrão, e eu ia
    # repetir. O `>` nunca abre etiqueta e não entra aqui.
    conteudo = re.sub(r"<(script|style)\b.*?</\1>", " ", body,
                      flags=re.S | re.I)
    for i, seg in enumerate(re.split(r"(?<!\\)\$", conteudo)):
        if i % 2 == 0:
            continue
        mau = re.search(r"<[A-Za-z/!?]", seg)
        assert mau is None, (
            "`<` abrindo etiqueta dentro de formula: escreva &lt; — o HTML engole o "
            "resto da frase. Trecho: %s" % seg[:60])

    # ---- Sanidade: nada de Grid/Flex escapou para o conteúdo ----
    lowered = html.lower()
    assert 'display:grid' not in lowered and 'display:flex' not in lowered, \
        "Grid/Flexbox detectado — usar <table class=\"lay\"> (regra do padrão)!"
    # ---- Sanidade: toda imagem relativa referenciada existe no disco ----
    #      (um dos dois bugs reais do piloto foi imagem quebrada que só apareceu
    #      no screenshot; melhor falhar aqui do que imprimir handout sem figura)
    import re as _re
    for src in _re.findall(r'<img[^>]+src="([^"]+)"', body):
        if src.startswith("data:"):
            continue
        assert os.path.isfile(os.path.join(out_dir, src)), \
            "Imagem referenciada nao existe: " + src + " (relativo a " + out_dir + ")"

    os.makedirs(out_dir, exist_ok=True)
    # HANDOUT_CHECK: escreve ao lado, com outro nome, e não gera PDF. É o que permite
    # perguntar "este gerador ainda produz este handout?" sem destruir o handout para
    # descobrir. Existe porque em 12/08 o gerador do Tronco de Pirâmide produzia uma
    # aula DIFERENTE da que estava no disco — um commit refatorou o .py e nunca rodou —
    # e rodá-lo teria apagado a aula boa. O out_dir continua o mesmo de propósito: os
    # caminhos relativos (timbrado, MathJax, imagens) só são válidos a partir dele.
    if os.environ.get("HANDOUT_CHECK"):
        out_path = os.path.join(out_dir, output_name + ".__check__.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        return out_path
    out_path = os.path.join(out_dir, output_name + ".html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK ->", out_path, "(", len(html), "bytes,", len(pages), "páginas )")
# Referência histórica omitida.
    # definitivo só faz sentido DEPOIS que o lista_layout embrulha e o paginador monta a
    # folha, então quem gera lista chama o topdf de novo no fim — aqui fica a versão de
    # fluxo, que já serve para imprimir se nada mais rodar.
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    if __package__:
        from . import topdf
    else:
        import topdf  # noqa: E402
    pdf = topdf.gerar(out_path)
    if pdf:
        print("   PDF ->", os.path.basename(pdf), "(", topdf.paginas(pdf), "páginas )")
    return out_path
