"""Mural composition recovered from Module: Andaime Aberto. Trusted authored HTML only."""
import base64
import os
import re
import sys

DIR = os.path.dirname(os.path.abspath(__file__))
from . import identidade as idt
from . import topdf

# Mantida só porque scripts antigos importam. NÃO é limite de produção: em 04/08 ele
# fechou a questão — "só gera os murais e eu me organizo". Formato e quantidade seguem o
# que a AULA precisa; a parede é problema de quem está na sala.
MAX_ATIVOS = 6
FONT_DIR = os.path.join(DIR, "fontes")

# tema -> (cor forte, tinta do cartão, acento), derivado de `identidade.FRENTES`.
#
# Esta tabela era a ÚLTIMA das quatro bibliotecas a manter as cores escritas à mão, e a
# migração aqui é literalmente a devolução de uma dívida: as chaves `tinta_parede` e
# `acento_parede` da identidade EXISTEM porque foram extraídas daqui em 23/08. A identidade
# copiou desta tabela, e a tabela continuou sendo a fonte — as duas ficaram vivas, uma
# copiando a outra, que é exatamente o arranjo que faz duas cópias divergirem.
#
# Conferido: os cinco temas derivam idênticos ao que estava escrito, e as peças de parede
# saem com o mesmo hash.
#
# A parede usa `_parede` e não `_papel`. A distinção não é decorativa: o mesmo azul precisa
# de campo mais saturado numa peça vista a três metros do que numa folha A4 na mão.
CORES = {
    chave: (frente["forte"], frente["tinta_parede"], frente["acento_parede"])
    for chave, frente in idt.FRENTES.items()
}


def _font_face(nome, arquivo, peso):
    caminho = os.path.join(FONT_DIR, arquivo)
    if not os.path.isfile(caminho):
        return ""
    with open(caminho, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    fmt = "woff2" if arquivo.endswith(".woff2") else "truetype"
    return ("@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
            "src:url(data:font/%s;base64,%s) format('%s');}\n"
            % (nome, peso, fmt, b64, fmt))


def _fontes_css():
    """Tipografia de *Andaime Aberto* (ver materials/_mural/filosofia_visual.md).

    Big Shoulders (condensada) dá grandeza sem gula de espaço — é o que permite título
    monumental numa A3 sem espremer o resto. Instrument Sans é a voz de conversa: neutra,
    crisp, sem maneirismo. Geist Mono, reduzida e espaçada, traz o rigor de caderno de
    laboratório para índices e marcas de registro. Nothing You Could Do é a única mão
    humana no sistema, e por isso só assina as áreas que a turma preenche."""
    return "".join([
        _font_face("MuralDisplay", "BigShoulders-Bold.ttf", 700),
        _font_face("MuralSans", "InstrumentSans-Regular.ttf", 400),
        _font_face("MuralSans", "InstrumentSans-Bold.ttf", 700),
        _font_face("MuralMono", "GeistMono-Regular.ttf", 400),
        _font_face("MuralMao", "NothingYouCouldDo-Regular.ttf", 400),
    ])


CSS = r"""
/* =====================================================================
   ANDAIME ABERTO — expressão visual (materials/_mural/filosofia_visual.md)
   Massa de cor, eixo, campo de conteúdo, território aberto. Retícula sentida
   e nunca impressa; filete de 0,4mm como unidade de peso; marcas de registro
   nos cantos porque cada folha é prancha de um sistema maior.
   ===================================================================== */
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'MuralSans',sans-serif; color:#1b1c1e; background:#6f7378; }
@page { size: @@PAGESIZE@@; margin: 0; }

/* Flexbox é proibido no handout (preview usa wkhtmltopdf) e necessário aqui: mural
   imprime sempre pelo Chrome, e o território aberto tem que tomar o que sobra da folha. */
.folha { background:@@PAPEL@@; margin:0 auto 10mm auto; position:relative; overflow:hidden;
  break-inside:avoid; page-break-inside:avoid; display:flex; flex-direction:column;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.folha + .folha { break-before:page; page-break-before:always; }
.a3 { width:297mm; height:420mm; }
.a3.paisagem { width:420mm; height:297mm; }
.a4 { width:210mm; height:297mm; }
@media print { body { background:none; } .folha { margin:0; } }

/* ---------- MASSA: campo chapado, sem contorno, sangrado ---------- */
.faixa { background:@@COR@@; color:@@PAPEL@@; padding:22mm 18mm 16mm; position:relative;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.a3.paisagem .faixa { padding:18mm 18mm 14mm; }
.a4 .faixa { padding:14mm 12mm 11mm; }
/* filete de acento: o pigmento volta em dose homeopática */
.faixa::after { content:""; position:absolute; left:18mm; right:18mm; bottom:0; height:1.4mm;
  background:@@ACENTO@@; -webkit-print-color-adjust:exact; print-color-adjust:exact; }

.indice { position:absolute; top:12mm; left:18mm; right:18mm;
  font-family:'MuralMono',monospace; font-size:11pt; letter-spacing:1.4mm;
  text-transform:uppercase; opacity:.72; }
.indice .dir { float:right; letter-spacing:1.1mm; }
.a4 .indice { top:7mm; left:12mm; right:12mm; font-size:9pt; }

.chapeu { font-family:'MuralMono',monospace; font-size:13pt; letter-spacing:2.2mm;
  text-transform:uppercase; opacity:.85; margin-bottom:5mm; }
/* 132pt -> 112pt: a faixa do título comia ~126mm de uma folha de 420mm (30%), e desde
   que entraram figuras esse espaço passou a ter dono. Big Shoulders é condensada, então
   112pt continua sendo lido da porta — e os 20mm liberados foram para o diagrama, que é
   o que de fato precisa ser visto de longe. */
.titulo { font-family:'MuralDisplay',sans-serif; font-size:112pt; line-height:1.02;
  letter-spacing:-.2mm; text-transform:uppercase; }
.a3.paisagem .titulo { font-size:104pt; }
.a4 .titulo { font-size:60pt; }

/* padding-bottom 30mm -> 36mm: a zona de co-construção é flex:1 e cresce até o limite
   do miolo, encostando no rodapé (que é absoluto, bottom:10mm). Não é transbordo — o
   checador passava — mas sobrepõe texto, e cartaz com duas coisas no mesmo lugar é
   defeito que só aparece impresso. */
.miolo { padding:15mm 18mm 36mm; flex:1 1 auto; display:flex; flex-direction:column;
  min-height:0; }
.a3.paisagem .miolo { padding:14mm 18mm 20mm; }
.miolo.espalhar { justify-content:space-between; }
.miolo.espalhar .campo { margin-bottom:0; }

/* ---------- PAINEL DA UNIDADE: densidade própria (30/07) ----------
   O painel não é anchor chart. O anchor chart tem UM conceito e vive de tamanho: quem lê
   está sentado a três metros. O painel é o que a coordenação pediu — título da unidade,
   ideias centrais, objetivos, perguntas essenciais — e é lido de perto, por quem levantou
   e foi até a parede conferir onde está.

   Com a métrica do anchor chart ele não cabe: cada `.campo` custa ~33mm só de moldura,
   então três blocos consomem 100mm antes da primeira palavra, e o título a 112pt come o
   resto. A primeira versão do painel do Y11 transbordou 185mm; enxugando o texto ao osso
   ainda sobravam 30mm fora da folha. O texto não era o problema — a métrica era.

   Título menor, moldura mais fina e corpo 24pt resolvem sem virar letra de handout: 24pt
   numa A3 continua sendo o dobro do corpo de um livro. */
/* ---------- A4 de parede (03/08) ----------
   "pode ser em A4, nem tudo precisa ser em A3, a parede não é infinita". A A4 tem
   METADE da área da A3, então herdar o corpo da A3 faria toda folha transbordar. Os
   tamanhos abaixo mantêm a MESMA proporção entre letra e folha: o cartaz encolhe
   inteiro, em vez de virar um A3 espremido. */
/* 72pt aqui era MAIOR que o A3 em proporção de folha: A4 tem 71% da linha do A3, então o
   equivalente aos 80pt do A3 são ~57pt, não 72. O efeito era a faixa de título comer um
   quarto da página e espremer a figura, que na folha de Pirâmides é o cartaz inteiro. */
.a4 .titulo { font-size:57pt; }
.a4 .chapeu { font-size:10pt; letter-spacing:1.6mm; }
.a4 .indice { font-size:8pt; }
.a4 .miolo { padding:10mm 12mm 24mm; }
.a4 .guia { font-size:21pt; margin-bottom:6mm; }
.a4 .campo { padding:6mm 7mm 6mm 8mm; margin-bottom:6mm; }
.a4 .campo .rot { font-size:9.5pt; letter-spacing:1.2mm; margin-bottom:3mm; }
.a4 .campo .txt { font-size:19pt; }
.a4 .lista { font-size:17pt !important; line-height:1.34; }
.a4 .mat { font-size:22pt; line-height:1.45; }
.a4 .marcador { font-size:19pt; }
/* O piso de 38mm da zona de co-construção foi calibrado para A3. Em A4 ele não encolheu
   junto com o resto, e duas zonas na mesma folha empurravam 42mm para fora da página —
   o que o checar_mural pegou. 27mm guarda a mesma proporção de folha (A4 é ~71% de A3)
   e continua sendo altura de escrever com giz grosso, que é o ponto do piso existir. */
.a4 .juntos { min-height:27mm; padding:5mm 7mm 3mm; }
.a4 .figura .leg { font-size:9pt; letter-spacing:1mm; }
.a4 .rodape { font-size:8pt; }

.folha.painel .titulo { font-size:78pt; }
.folha.painel .campo { padding:6mm 9mm 6mm 10mm; margin-bottom:6mm; }
.folha.painel .campo .rot { margin-bottom:3mm; }
.folha.painel .lista { font-size:24pt !important; line-height:1.3; }

/* voz de conversa: uma ideia, sem caixa */
.guia { flex:0 0 auto; font-size:31pt; font-weight:700; line-height:1.26; margin-bottom:10mm;
  max-width:92%; }
.a3.paisagem .guia { font-size:25pt; margin-bottom:8mm; }

/* ---------- CAMPO: tinta clara, filete de apoio, sem moldura ---------- */
.campo { flex:0 0 auto; background:@@TINTA@@; padding:9mm 10mm 9mm 11mm; margin-bottom:9mm;
  border-left:.9mm solid @@COR@@;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.campo .rot { font-family:'MuralMono',monospace; font-size:12pt; letter-spacing:1.8mm;
  text-transform:uppercase; color:@@COR@@; display:block; margin-bottom:5mm;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.campo .txt { font-size:28pt; line-height:1.36; }
/* tabela de referência (tríade dos polígonos regulares): é o formato em que uma
   consulta de parede se lê melhor — linha por polígono, coluna por grandeza. */
table.triade { width:100%; border-collapse:collapse; font-size:25pt; }
table.triade thead td { font-family:'MuralMono',monospace; font-size:12pt;
  letter-spacing:1.2mm; text-transform:uppercase; color:@@COR@@; padding-bottom:3mm;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
table.triade td { padding:4mm 3mm; border-top:.4mm solid @@COR@@; }
table.triade .p-nome { font-weight:700; }
table.triade .p-ang, table.triade .p-f { text-align:center; white-space:nowrap; }
table.triade .p-f { font-weight:700; }
.mat { font-size:32pt; font-weight:700; line-height:1.55; letter-spacing:-.1mm; }

.lista { font-size:26pt; line-height:1.42; }
.lista .item { margin-bottom:5mm; padding-left:13mm; text-indent:-13mm; }
.lista .marca { font-family:'MuralMono',monospace; font-size:15pt; color:@@COR@@;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- FIGURA: em geometria, o desenho É o conteúdo ----------
   Faltava, e num cartaz de Cavalieri isso não é detalhe: o princípio se enuncia em
   uma frase e se ENTENDE olhando as secções de mesma área em alturas diferentes.
   Cartaz de geometria sem figura é o resumo da aula, não a aula na parede.

   Os SVGs vêm de svg_solid.py/svg_plane.py, os mesmos dos handouts — width="100%" +
   viewBox, então escalam sem perder traço. Numa A3 a figura fica ~5x maior que no
   papel, e como o traço escala junto ela continua com a mesma leveza relativa. */
.figura { flex:0 0 auto; margin:0 0 9mm; text-align:center; }
.figura svg { display:block; margin:0 auto; }
.figura img { display:block; margin:0 auto; max-width:100%; }
.figura .leg { font-family:'MuralMono',monospace; font-size:12pt; letter-spacing:1.4mm;
  text-transform:uppercase; color:#8d9299; margin-top:4mm; }
/* A legenda é a voz "técnica" do sistema e vai em caixa alta — mas em Matemática a caixa
   CARREGA SIGNIFICADO: `h` (altura da pirâmide pequena) e `H` (da inteira) são grandezas
   diferentes, e o uppercase transformava a legenda "h para a pequena, H para a inteira"
   em "H PARA A PEQUENA, H PARA A INTEIRA" — a distinção que a folha existe para ensinar,
   apagada pelo CSS. Envolver o símbolo em <span class="sym"> preserva a caixa. */
.figura .leg .sym { text-transform:none; }
/* dentro de um campo a figura não leva margem própria nem legenda de sistema */
.campo .figura { margin:5mm 0 0; }
/* par de figuras lado a lado (ex.: reto x oblíquo, base x planificação) */
.fig-par { display:flex; gap:10mm; align-items:flex-end; justify-content:center; }
.fig-par > div { flex:1 1 0; min-width:0; }

/* ---------- TERRITÓRIO ABERTO: a parte da obra que é de outra pessoa ---------- */
/* PAUTA na zona de co-construção. Nota dele em 30/07: "o nosso exemplo em aula tbm não
   aparece o espaço pra escrever". Era uma caixa tracejada vazia — e caixa vazia num
   cartaz lê como sobra de diagramação, não como convite. Com pauta, o espaço diz quanto
   cabe e a escrita à mão sai reta de longe, que importa quando 17 pessoas vão ler.
   O gradiente desenha as linhas sem nenhum elemento extra no HTML. */
/* O PISO É DA ÁREA DE ESCRITA, NÃO DA CAIXA (correção de 04/08). Antes o `min-height`
   estava na `.juntos` inteira e o rótulo mora DENTRO dela — então um rótulo que quebrava
   em duas linhas comia a caixa e sobravam 3mm para escrever. Medido nas 22 zonas do
   repositório: 17 estavam abaixo de 20mm e três das minhas em A4 tinham 3, 3 e 5mm.
   Agora a caixa é flex-coluna, o rótulo é uma linha de altura livre e quem carrega o piso
   é a `.escrever` — assim o rótulo pode quebrar à vontade que o espaço de escrever não
   encolhe: a caixa é que cresce. Ele avisou disso em 30/07 ("não aparece o espaço pra
   escrever") e eu tinha resolvido só a aparência, não a medida. */
/* `flex:1 0 auto` — cresce, mas NÃO ENCOLHE. Com o `1 1 auto` de antes, o miolo espremia
   a caixa abaixo do conteúdo dela: a pauta vazava 9,5mm na primeira zona e 17mm na
   segunda, e a borda tracejada ficava no meio da área de escrever. Pior, o medidor não
   acusava — a pauta continuava dentro da folha, então "sobra 0mm" estava certo e mesmo
   assim o cartaz saía errado da gráfica. Não encolhendo, o excesso vira transbordo de
   folha, que o `checar_mural.py` pega. */
.juntos { flex:1 0 auto; display:flex; flex-direction:column;
  border:.6mm dashed @@COR@@; padding:7mm 9mm 3mm; margin-bottom:9mm;
  background:transparent;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
/* Piso de escrita: uma linha de marcador grosso tem ~10mm, então 22mm são duas
   linhas com folga — é o mínimo para a turma escrever de pé sem espremer. Não é
   maior porque a folha também precisa caber; onde 22mm não cabem, o que cede é o
   impresso, não o vazio. */
.escrever { flex:1 1 auto; min-height:22mm; }
.juntos.pauta .escrever { background-image:repeating-linear-gradient(
    to bottom, transparent 0, transparent 12mm, @@COR@@ 12mm, @@COR@@ 12.3mm);
  background-position:0 0; background-repeat:repeat-y;
  background-size:100% 12.3mm; }
.marcador { font-family:'MuralMao',cursive; font-size:27pt; color:@@COR@@;
  background:@@PAPEL@@; display:inline-block; padding-right:4mm;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- FLUXO: passos como pranchas de um sistema ---------- */
table.lay { width:100%; border-collapse:collapse; }
table.lay td { vertical-align:middle; }
.a3.paisagem table.lay { height:100%; }
.passo { background:@@TINTA@@; padding:9mm 8mm; height:100%; min-height:54mm;
  border-top:1.4mm solid @@COR@@;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.passo .n { font-family:'MuralMono',monospace; font-size:13pt; letter-spacing:1.4mm;
  color:@@COR@@; display:block; margin-bottom:4mm;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.passo .txt { font-size:29pt; font-weight:700; line-height:1.22; }
.seta { color:@@ACENTO@@; font-size:30pt; text-align:center; line-height:1;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* ---------- LINHA DO TEMPO ---------- */
.tl-data { font-family:'MuralDisplay',sans-serif; font-size:44pt; color:@@COR@@;
  text-align:center; line-height:1; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.tl-bola { width:4mm; height:4mm; background:@@COR@@; margin:0 auto;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.tl-linha { height:.6mm; background:@@COR@@; opacity:.35;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.tl-txt { font-size:23pt; text-align:center; line-height:1.3; padding:0 4mm; }

/* ---------- CARTÃO DE VOCABULÁRIO (A5) ---------- */
.vocab { height:130mm; background:@@TINTA@@; border-top:2.4mm solid @@COR@@;
  position:relative; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.vocab .topo { padding:9mm 9mm 0; }
.vocab .termo { font-family:'MuralDisplay',sans-serif; font-size:46pt; line-height:.9;
  text-transform:uppercase; color:@@COR@@;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.vocab .trad { font-family:'MuralMao',cursive; font-size:20pt; margin-top:3mm; color:#5c6067; }
.vocab .def { padding:5mm 9mm 0; font-size:21pt; line-height:1.34; }
.vocab .reg { position:absolute; bottom:6mm; left:9mm; right:9mm;
  font-family:'MuralMono',monospace; font-size:9pt; letter-spacing:1.2mm; color:#9aa0a8; }

/* ---------- CARTÃO EM BRANCO (A5): a palavra é escrita à mão ----------
   Ele escreve; o repo só dá o campo. A pauta é UMA linha, e é grossa: linha fina convida
   letra pequena, e este cartão é lido a dois metros. A área de baixo tem duas pautas
   finas, para uma definição curta — e é opcional de propósito, porque cartão que exige
   preenchimento completo é cartão que não é preenchido. */
.branco { height:130mm; background:#fff; border-top:2.4mm solid @@COR@@;
  position:relative; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.branco .pauta-termo { position:absolute; left:9mm; right:9mm; top:46mm;
  border-bottom:1.1mm solid @@COR@@; }
.branco .pauta-def { position:absolute; left:9mm; right:9mm;
  border-bottom:.4mm solid #cfcabf; }
.branco .reg { position:absolute; bottom:6mm; left:9mm; right:9mm;
  font-family:'MuralMono',monospace; font-size:9pt; letter-spacing:1.2mm; color:#9aa0a8;
  display:flex; justify-content:space-between; }

/* ---------- FAIXA DE TÍTULO: só a tarja, sem área delimitada ---------- */
.folha.faixas { display:flex; flex-direction:column; justify-content:center; padding:0; }
.fx { background:@@COR@@; color:@@PAPEL@@; padding:16mm 20mm 18mm; position:relative;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.fx-turma { font-family:'MuralMono',monospace; font-size:11pt; letter-spacing:2.2mm;
  text-transform:uppercase; opacity:.85; }
.fx-tit { font-family:'MuralDisplay',sans-serif; font-size:86pt; line-height:.92;
  text-transform:uppercase; margin-top:5mm; }
.fx-corte { height:26mm; border-bottom:.4mm dashed #b9bcc1; margin-bottom:26mm; }

/* ---------- MARCAS DE REGISTRO: esta folha é prancha de um sistema ---------- */
.registro { position:absolute; width:7mm; height:7mm; border:.4mm solid #c9ccd1; }
.registro.tl { top:6mm; left:6mm; border-right:0; border-bottom:0; }
.registro.tr { top:6mm; right:6mm; border-left:0; border-bottom:0; }
.registro.bl { bottom:6mm; left:6mm; border-right:0; border-top:0; }
.registro.br { bottom:6mm; right:6mm; border-left:0; border-top:0; }

.rodape { position:absolute; left:18mm; right:18mm; bottom:10mm;
  font-family:'MuralMono',monospace; font-size:10pt; letter-spacing:1.1mm;
  text-transform:uppercase; color:#8d9299; }
"""


def _doc(paginas, pagesize, tema, *, repertorio=False):
    cor, tinta, acento = CORES.get(tema, CORES["neutro"])
    css = (_fontes_css() + CSS.replace("@@PAGESIZE@@", pagesize)
           .replace("@@COR@@", cor).replace("@@TINTA@@", tinta)
           # O papel do sistema, que estava escrito à mão em cinco lugares do CSS. O
           # arquivo já falava por placeholder para cor, tinta e acento — o papel era o
           # único que continuava fixo no texto, e ninguém tinha reparado porque ele nunca
           # muda de peça para peça. Constante que não varia é a mais fácil de duplicar.
           .replace("@@PAPEL@@", idt.NEUTROS["papel"])
           .replace("@@ACENTO@@", acento))
    if not os.path.isfile(os.path.join(FONT_DIR, "BigShoulders-Bold.ttf")):
        css += "\n.titulo{font-size:80pt;line-height:1.08}.a3.paisagem .titulo{font-size:72pt}.a4 .titulo{font-size:48pt}"
    if repertorio:
        from . import mural_visual
        css += '\n' + mural_visual.css(tema)
    return ('<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n'
            '<title>Mural</title>\n<style>' + css + '</style>\n</head>\n<body>\n'
            + "\n".join(paginas) + '\n</body>\n</html>')


def _registros():
    """Cantos de registro: sinal de que a folha pertence a um sistema maior."""
    return ('<div class="registro tl"></div><div class="registro tr"></div>'
            '<div class="registro bl"></div><div class="registro br"></div>')


# ---------------------------------------------------------------- idioma ----
# Dele, em 18/08: *"o mural de math não pode ter português. A não ser bem em último caso
# (vocabulário)."*
#
# A regra é da AULA, não do repo: Y9 Math e Entrepreneurship seguem currículo canadense e
# são dadas em inglês. Um rótulo em português na parede dessas turmas contradiz a aula
# inteira — e estava lá desde sempre, porque a moldura do cartaz nasceu para as turmas de
# Ensino Médio, que são em português.
#
# A exceção que ele abriu é o VOCABULÁRIO: a tradução ao lado do termo em inglês é a única
# coisa que pode aparecer em português, e mesmo assim "bem em último caso".
ROTULOS = {
    "pt": dict(painel="PAINEL DA UNIDADE", ideias="Ideias centrais",
               aprender="O que vamos aprender", perguntas="Perguntas essenciais",
               palavras="Palavras da unidade", procedimento="PROCEDIMENTO",
               trocar="trocar ao fechar o t&oacute;pico",
               atualizar="atualizar a cada unidade",
               fim_unidade="fica at&eacute; o fim da unidade"),
    "en": dict(painel="UNIT BOARD", ideias="Big ideas",
               aprender="What we will learn", perguntas="Essential questions",
               palavras="Unit words", procedimento="HOW TO DO IT",
               trocar="comes down when the topic closes",
               atualizar="update every unit",
               fim_unidade="stays up until the end of the unit"),
}


def _rot(meta, chave):
    """O rótulo na língua da turma. Sem `idioma` no meta, fica em português — que é o que
    as turmas de Ensino Médio esperam e o que o repo sempre fez."""
    return ROTULOS.get(meta.get("idioma", "pt"), ROTULOS["pt"])[chave]


def _topo(meta, titulo, indice=""):
    ind = ('<div class="indice">%s<span class="dir">%s</span></div>'
           % (meta.get("turma", ""), indice)) if (meta.get("turma") or indice) else ""
    return ('<div class="faixa">' + ind + '<div class="chapeu">%s</div>'
            '<div class="titulo">%s</div></div>'
            % (meta.get("chapeu", meta.get("unidade", "")), titulo))


def _rodape(meta, quando=None):
    if quando is None:
        quando = _rot(meta, "trocar")
    return ('<div class="rodape">%s &nbsp;&mdash;&nbsp; %s</div>'
            % (meta.get("unidade", ""), quando)) + _registros()


def _lista(itens, corpo=None):
    """Corpo cai conforme o volume: oito itens a 27pt não cabem numa A3, e cartaz que
    transborda perde justamente o fim da lista, que é onde está o conteúdo novo."""
    if corpo is None:
        n = sum(1 + len(i) // 90 for i in itens)
        corpo = 27 if n <= 6 else (24 if n <= 9 else 21)
    return '<div class="lista" style="font-size:%dpt">' % corpo + "".join(
        '<div class="item"><span class="marca">&#9679;&nbsp;&nbsp;</span>%s</div>' % i
        for i in itens) + '</div>'


def peso_de_parede(svg, traco=2.6, corpo=1.9):
    """Reengorda um SVG de handout para peso de CARTAZ.

    Diagnóstico do professor (30/07): "no handout até funciona esses svg, mas para fim de
    impacto de mural elas são fracas". Ele propôs buscar imagem na internet; o problema,
    olhando de perto, não é ser vetor — é ser vetor **de handout, ampliado**. Traço de
    1,5px e rótulo de 8pt foram calibrados para uma figura de 5cm de papel. Escalados para
    30cm de parede, o traço continua fino em relação ao tamanho e o rótulo continua o
    mesmo corpo físico: some da distância de leitura de um cartaz.

    Aqui o traço multiplica por `traco` e o corpo do rótulo por `corpo`, sobre a mesma
    geometria. **Não toca em svg_solid.py de propósito:** os handouts aprovados dependem
    dele, e regenerar handout aprovado é re-aprovar handout (regra do repo). O engorda
    acontece na saída, só para o mural.
    """
    svg = re.sub(r'stroke-width="([\d.]+)"',
                 lambda m: 'stroke-width="%.2f"' % (float(m.group(1)) * traco), svg)
    svg = re.sub(r'font-size="([\d.]+)"',
                 lambda m: 'font-size="%.1f"' % (float(m.group(1)) * corpo), svg)
    # tracejado proporcional ao traço novo, senão vira linha quase cheia
    svg = re.sub(r'stroke-dasharray="([\d.]+),([\d.]+)"',
                 lambda m: 'stroke-dasharray="%.1f,%.1f"' % (float(m.group(1)) * traco,
                                                            float(m.group(2)) * traco), svg)
    return halo_no_texto(svg)


# cor do papel do mural — o halo tem que ser do fundo, não branco puro
# O papel, para quem escreve SVG à mão — `stroke=` de contorno de texto, por exemplo.
#
# Esta constante já existia com o hexadecimal dentro, e o meu `replace` cego a transformou
# em `"@@PAPEL@@"`: dentro do CSS o placeholder é trocado, mas em atributo de SVG ninguém
# troca, e cinco murais saíram com `stroke="@@PAPEL@@"` — contorno inválido, texto sem
# halo. Pego comparando pixel a pixel contra a versão commitada, não pelo portão.
PAPEL = idt.NEUTROS["papel"]


def halo_no_texto(svg, papel=PAPEL):
    """Põe um contorno da cor do papel ATRÁS de cada rótulo do SVG.

    Reclamação do professor (30/07): "para com esse negócio de letra em cima de linha, fica
    muito feio os gráficos assim". Ele está certo, e o `peso_de_parede` piorou o problema
    que já existia: os helpers põem o rótulo no meio da aresta, e com o traço 2,6× mais
    grosso a linha passou a **cortar o glifo**. No handout, com traço fino, dava para
    conviver; num A3 é a primeira coisa que se vê.

    `paint-order="stroke"` desenha o contorno primeiro e o preenchimento depois, então o
    contorno na cor do papel abre uma clareira sob a letra e a linha não a atravessa. É a
    solução padrão para rótulo sobre gráfico, e roda no Chrome e no PDF.

    Feito por transformação da saída, não em svg_solid: os handouts aprovados usam os
    mesmos helpers, e mexer neles seria regenerar (e re-aprovar) material aprovado.
    """
    def com_halo(m):
        tag = m.group(0)
        if "paint-order" in tag:
            return tag
        corpo = float(re.search(r'font-size="([\d.]+)"', tag).group(1)) \
            if re.search(r'font-size="([\d.]+)"', tag) else 10.0
        # 0,30 do corpo: grosso o bastante para abrir a clareira, fino o bastante para
        # não engordar a letra e virar outra fonte
        return tag[:-1] + (' paint-order="stroke" stroke="%s" stroke-width="%.1f" '
                           'stroke-linejoin="round">' % (papel, corpo * 0.30))[1:]

    return re.sub(r'<text[^>]*>', com_halo, svg)


def figura(svg, largura_mm=None, legenda=None, altura_mm=None, parede=True):
    """Um SVG como bloco de mural.

    **Controle a ALTURA, não a largura.** A largura é o que se pensa primeiro e a altura é
    o que consome a folha: na primeira tentativa dei 205mm de largura ao diagrama de
    Cavalieri (viewBox 230×200) e ele cresceu para 178mm de altura — sozinho, mais de
    metade do miolo da A3. As três folhas do mural de Prismas transbordaram de uma vez, e
    o `checar_mural.py` pegou (248mm, 75mm e 32mm fora da página). `altura_mm` fecha isso
    na raiz: o SVG escala pela altura e a largura acompanha.

    `largura_mm` continua existindo para diagrama largo e baixo (galeria, linha), onde o
    limite útil é mesmo a largura.
    """
    if parede:
        svg = peso_de_parede(svg)          # já aplica o halo no fim
    else:
        # halo SEMPRE, mesmo em figura que não precisa engordar. Ele é inofensivo onde não
        # há linha sob o rótulo e salva onde há — e `parede=False` não quer dizer "sem
        # linha", quer dizer "já nasceu com corpo de cartaz". Sem esta linha, 64 dos 82
        # rótulos dos murais ficavam sem halo, incluindo a galeria de polígonos.
        svg = halo_no_texto(svg)
    if altura_mm:
        # max-height no <svg> só funciona com height:auto e width:auto — com width="100%"
        # (como vêm de svg_solid) o navegador resolve a largura primeiro e ignora o teto.
        svg = svg.replace('<svg width="100%"',
                          '<svg width="auto" style="height:%dmm; width:auto"' % altura_mm, 1)
    estilo = ' style="max-width:%dmm; margin:0 auto"' % largura_mm if largura_mm else ""
    leg = '<div class="leg">%s</div>' % legenda if legenda else ""
    return '<div class="figura"><div%s>%s</div>%s</div>' % (estilo, svg, leg)


IMAGENS = os.path.join(DIR, "..", "assets", "images")


def imagem(nome, altura_mm=None, largura_mm=None, legenda=None, preferir="svg"):
    """External asset lookup disabled until rights and local asset roots are reviewed."""
    raise ValueError("External mural assets are not enabled in this profile")


def figuras_lado_a_lado(*svgs):
    """Duas ou três figuras na mesma linha — para comparação (reto × oblíquo)."""
    return ('<div class="figura"><div class="fig-par">'
            + "".join("<div>%s</div>" % s for s in svgs) + '</div></div>')


# ------------------------------------------------------------------ formatos ----
def anchor_chart(meta, titulo, guia, blocos, coconstruir=None, altura_juntos=None,
                 fig=None, folha="a3", rodape=None):
    """Um conceito por folha.

    `blocos`: (rótulo, html) do que é fato e não muda — sai impresso.
    `coconstruir`: rótulos das áreas que saem VAZIAS para fechar com a turma.
    `fig`: figura logo depois da frase-guia, antes dos campos — em geometria ela vem
    ANTES do texto, porque é por ela que o aluno entra no conceito.

    `folha="a4"` (03/08): *"pode ser em A4, nem tudo precisa ser em A3, a parede não é
    infinita"*. E ele tem razão — A3 era o único formato porque foi o primeiro, não
    porque todo cartaz precise dele. O A3 é para o que se consulta **de longe, no meio
    da aula** (Cavalieri, a tríade); o A4 serve o que se consulta **de perto, quando já
    se levantou** — uma nomenclatura, um quadro de fórmulas, um par de sólidos para
    reconhecer. Numa parede finita, dois A4 valem mais que um A3 se são dois assuntos.

    O CSS de A4 acompanha em `.folha.a4` — título, campos e listas encolhem na mesma
    proporção da folha. Sem isso o A4 sairia com corpo de A3 e transbordaria sempre."""
    partes = [_topo(meta, titulo, meta.get("indice", "ANCHOR")),
              '<div class="miolo">']
    if guia:
        partes.append('<div class="guia">%s</div>' % guia)
    if fig:
        partes.append(fig)
    for rot, html in blocos:
        partes.append('<div class="campo"><span class="rot">%s</span>'
                      '<div class="txt">%s</div></div>' % (rot, html))
    for rot in (coconstruir or []):
        # `altura_juntos` passa a valer para a ÁREA DE ESCRITA, não para a caixa (04/08).
        # Fixando a caixa, um rótulo de duas linhas comia a altura pedida e o que sobrava
        # para escrever era o resto — foi o que estourou o cartaz de Paralelepípedos, que
        # pedia 37mm de caixa e ficava com 18mm de pauta. Pedir altura de escrita é o que
        # se quer dizer quando se pede altura aqui.
        estilo = (' style="flex:0 0 %dmm;min-height:%dmm"' % (altura_juntos, altura_juntos)
                  if altura_juntos else "")
        partes.append('<div class="juntos pauta"><div class="marcador">%s</div>'
                      '<div class="escrever"%s></div></div>' % (rot, estilo))
    partes.append('</div>')
    # `rodape` existe porque nem todo cartaz é de tópico. O rodapé padrão manda TROCAR ao
    # fechar o tópico, e num cartaz de rotina de sala (o do English Wins é o caso) isso é
    # instrução errada na parede: ele fica o ano inteiro. Quem escreve o cartaz sabe qual
    # é a validade dele.
    return ('<div class="folha %s">' % folha + "".join(partes)
            + (_rodape(meta, rodape) if rodape else _rodape(meta)) + '</div>')


def painel_unidade(meta, objetivos, questoes, vocab, big_ideas=None, fig=None):
    """O painel que abre a unidade. É o único cartaz que não rotaciona."""
    partes = [_topo(meta, meta["titulo"], _rot(meta, "painel")),
              '<div class="miolo espalhar">']
    if big_ideas:
        partes.append('<div class="campo"><span class="rot">%s</span>'
                      '<div class="txt">%s</div></div>'
                      % (_rot(meta, "ideias"), _lista(big_ideas)))
    if fig:
        partes.append(fig)
    partes.append('<div class="campo"><span class="rot">%s</span>'
                  '<div class="txt">%s</div></div>'
                  % (_rot(meta, "aprender"), _lista(objetivos)))
    if questoes:
        partes.append('<div class="campo"><span class="rot">%s</span>'
                      '<div class="txt">%s</div></div>'
                      % (_rot(meta, "perguntas"), _lista(questoes)))
    if vocab:
        partes.append('<div class="campo"><span class="rot">%s</span>'
                      '<div class="txt" style="font-size:26pt;line-height:1.5">%s</div>'
                      '</div>' % (_rot(meta, "palavras"),
                                  " &nbsp;&bull;&nbsp; ".join(vocab)))
    partes.append('</div>')
    # `painel` liga a densidade própria deste formato — ver o bloco PAINEL DA UNIDADE no
    # CSS. Sem ela o painel herda a métrica do anchor chart e não cabe na folha.
    return ('<div class="folha a3 painel">' + "".join(partes)
            + _rodape(meta, _rot(meta, "fim_unidade")) + '</div>')


def cartoes_vocab(meta, termos):
    """Word wall: 4 cartões A5 por folha A4. `termos`: (termo, tradução, definição)."""
    cartoes = ['<div class="vocab"><div class="topo"><div class="termo">%s</div>'
               '<div class="trad">%s</div></div><div class="def">%s</div>'
               '<div class="reg">%s &nbsp;/&nbsp; %02d</div></div>'
               % (t, tr or "&nbsp;", d, meta.get("unidade", ""), i)
               for i, (t, tr, d) in enumerate(termos, 1)]
    folhas, atual = [], []
    for c in cartoes:
        atual.append(c)
        if len(atual) == 4:
            folhas.append(atual)
            atual = []
    if atual:
        atual += ['<div style="height:130mm"></div>'] * (4 - len(atual))
        folhas.append(atual)
    return "".join(
        '<div class="folha a4" style="padding:10mm 8mm"><table class="lay">'
        '<tr><td width="50%%" style="padding:3mm">%s</td>'
        '<td width="50%%" style="padding:3mm">%s</td></tr>'
        '<tr><td style="padding:3mm">%s</td><td style="padding:3mm">%s</td></tr>'
        '</table></div>' % tuple(g) for g in folhas)


def cartoes_branco(meta, quantos=12):
    """Word wall EM BRANCO: 4 cartões A5 por folha A4, para escrever à mão.

    Existe por causa da leitura das paredes da escola, em 18/08. A coluna de vocabulário
    da parede de Português é o item mais forte das cinco salas, e é o mais barato: uma
    palavra por cartão, **escrita à mão**, acrescentada toda semana. É a única coisa
    daquela sala que cresce.

    O `cartoes_vocab` imprime o termo. Este não imprime nada — e a diferença não é
    economia de tinta:

    - **palavra impressa não cresce.** Ela sai do gerador com a unidade inteira pronta, e
      a parede fica completa no primeiro dia. Parede completa parece instalada; parede que
      cresce parece habitada;
    - **palavra impressa não tem dono.** A letra de quem escreveu é o que faz o cartão ser
      da turma e não do sistema;
    - e a prova está na nossa própria parede: os dez cartões impressos da Unit 5 (ALGEBRA
      TILE, MONOMIAL, BINOMIAL…) estão lá parados desde julho.

    A etiqueta do rodapé sai de `meta["etiqueta"]`, e é curta de propósito: o nome inteiro
    da unidade quebrava em duas linhas e encostava no número. Sem `etiqueta`, cai no
    `unidade`.

    O número no rodapé é a ordem de entrada, e ele é a coisa mais útil do cartão: mostra
    de relance quantas palavras a unidade acumulou.
    """
    def cartao(i):
        return ('<div class="branco">'
                '<div class="pauta-termo"></div>'
                '<div class="pauta-def" style="top:78mm"></div>'
                '<div class="pauta-def" style="top:96mm"></div>'
                '<div class="reg"><span>%s</span><span>%02d</span></div>'
                '</div>' % (meta.get("etiqueta") or meta.get("unidade", ""), i))

    folhas, atual = [], []
    for i in range(1, quantos + 1):
        atual.append(cartao(i))
        if len(atual) == 4:
            folhas.append(atual)
            atual = []
    if atual:
        atual += ['<div style="height:130mm"></div>'] * (4 - len(atual))
        folhas.append(atual)
    return "".join(
        '<div class="folha a4" style="padding:10mm 8mm"><table class="lay">'
        '<tr><td width="50%%" style="padding:3mm">%s</td>'
        '<td width="50%%" style="padding:3mm">%s</td></tr>'
        '<tr><td style="padding:3mm">%s</td><td style="padding:3mm">%s</td></tr>'
        '</table></div>' % tuple(g) for g in folhas)


def fluxo(meta, titulo, passos, por_linha=3):
    """Procedimento em serpentina (A3 paisagem).

    Três por linha é o padrão: em cinco colunas cada passo ficava com 62mm e o texto caía
    para 17pt — ilegível de pé, que é como se lê mural. Com três, cada passo tem ~110mm e
    o texto fica em 26pt.

    Cada passo pode ser `str` ou `(texto, svg)`: no procedimento de geometria o passo
    "que polígono é a base?" ganha muito com a galeria de polígonos ao lado, porque a
    pergunta é de reconhecimento visual, não de leitura."""
    linhas, i = [], 0
    while i < len(passos):
        fatia = passos[i:i + por_linha]
        cels = []
        for j, p in enumerate(fatia):
            txt, svg = (p, None) if isinstance(p, str) else (p[0], p[1])
            # o chamador pode passar o SVG cru ou já embrulhado em figura() com altura
            fig = ("" if not svg else
                   svg if svg.startswith('<div class="figura"') else figura(svg))
            cels.append('<td style="padding:0 3mm"><div class="passo">'
                        '<div class="n">Passo %02d</div><div class="txt">%s</div>%s'
                        '</div></td>' % (i + j + 1, txt, fig))
            if j < len(fatia) - 1:
                cels.append('<td class="seta" style="width:20mm">&#10230;</td>')
        for _ in range(por_linha - len(fatia)):
            cels.append('<td style="width:20mm"></td><td></td>')
        linhas.append("<tr>%s</tr>" % "".join(cels))
        i += por_linha
        if i < len(passos):
            vazias = por_linha * 2 - 2
            linhas.append('<tr><td colspan="%d"></td>'
                          '<td class="seta" style="padding:5mm 0">&#10515;</td></tr>'
                          % vazias)
    return ('<div class="folha a3 paisagem">' + _topo(meta, titulo, _rot(meta, "procedimento"))
            + '<div class="miolo"><table class="lay">' + "".join(linhas)
            + '</table></div>' + _rodape(meta) + '</div>')


def linha_do_tempo(meta, titulo, marcos):
    """Onde estamos na unidade (A3 paisagem). `marcos`: (data, o quê)."""
    n = max(1, len(marcos))
    largura = 100 // n
    datas = "".join('<td width="%d%%"><div class="tl-data">%s</div></td>'
                    % (largura, d) for d, _ in marcos)
    bolas = "".join('<td><div class="tl-bola"></div></td>' for _ in marcos)
    textos = "".join('<td><div class="tl-txt">%s</div></td>' % t for _, t in marcos)
    return ('<div class="folha a3 paisagem">' + _topo(meta, titulo)
            + '<div class="miolo" style="padding-top:24mm">'
            '<table class="lay"><tr>%s</tr>'
            '<tr><td colspan="%d"><div class="tl-linha"></div></td></tr>'
            '<tr>%s</tr><tr><td colspan="%d" style="height:8mm"></td></tr><tr>%s</tr>'
            '</table></div>' % (datas, n, bolas, n, textos)
            + _rodape(meta, _rot(meta, "atualizar")) + '</div>')


def faixa_trabalho(meta, titulo, segundo=None):
    """Só o TÍTULO da área de trabalho da turma — duas faixas por A3 paisagem.

    Substitui a `moldura_trabalho`, e a razão é dele, em 18/08: *"não precisa de espaço,
    só um título às vezes é suficiente, que os alunos usam sulfite mesmo para colocar os
    trabalhos deles. Não precisa limitar espaço."*

    A moldura estava errada em duas coisas ao mesmo tempo. Ela **limitava a área** — e
    quem decide quanto trabalho cabe é a quantidade de trabalho, não o gerador; uma turma
    que produziu doze folhas não vai caber em quatro molduras A4. E ela trazia uma linha
    de *"Autor(a): ____"* que o aluno já escreve no próprio trabalho.

    Sobra o que a área realmente precisa: um título que diga o que é aquilo, grande o
    bastante para ser lido de longe. O resto da parede é da turma.

    Duas faixas por folha porque uma A3 inteira para uma tarja é desperdício; a linha
    tracejada no meio é onde cortar.
    """
    def banda(txt):
        return ('<div class="fx">'
                '<div class="fx-turma">%s</div>'
                '<div class="fx-tit">%s</div>'
                '</div>' % (meta.get("turma", ""), txt))

    corpo = banda(titulo)
    if segundo:
        corpo += '<div class="fx-corte"></div>' + banda(segundo)
    return '<div class="folha a3 paisagem faixas">%s</div>' % corpo


def moldura_trabalho(meta, chamada="Feito por gente desta turma"):
    """Moldura A4 para grampear trabalho de aluno.

    **Aposentada em 18/08** — ver `faixa_trabalho`, que é o que ele pediu no lugar. Fica
    no módulo porque outras turmas podem já ter impresso, e remover uma função que está
    em uso na parede de alguém é o tipo de limpeza que custa mais do que rende.
    """
    return ('<div class="folha a4">' + _topo(meta, chamada)
            + '<div class="miolo">'
            '<div class="juntos" style="height:172mm"></div>'
            '<div class="marcador" style="font-size:24pt">'
            'Autor(a): ______________________</div>'
            '</div></div>')


# ---------------------------------------------------------------------- build ----
def build(paginas, out_dir, nome, tema="neutro", pagesize="A3", *, repertorio=False):
    html = _doc(paginas, pagesize, tema, repertorio=repertorio)
    os.makedirs(out_dir, exist_ok=True)
    caminho = os.path.join(out_dir, nome + ".html")
    with open(caminho, "w", encoding="utf-8") as f:
        f.write(html)
    print("OK ->", caminho, "(", len(paginas), "folha(s),", pagesize, ")")
    pdf = None if os.environ.get("SEM_PDF") == "1" else topdf.gerar(caminho)
    if pdf:
        print("   PDF ->", os.path.basename(pdf), "(", topdf.paginas(pdf), "páginas )")
    return caminho


__all__ = ["anchor_chart", "painel_unidade", "cartoes_vocab", "fluxo", "linha_do_tempo",
           "moldura_trabalho", "faixa_trabalho", "build", "MAX_ATIVOS", "CORES"]
