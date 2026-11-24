"""Shared slide composition recovered from the existing teaching library."""
import base64

from .slides_motor import MOTOR
import html
import os
import sys
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from . import identidade as idt
from . import primitivas as pr

DIR = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(DIR, "fontes")

# (cor forte, campo claro, acento) — agora derivadas de `identidade.FRENTES`, que é onde a
# tabela mora desde 23/08.
#
# Antes eram três hexadecimais escritos aqui, e o comentário dizia "as mesmas de
# `mural_lib.CORES`" — o que já era a confissão do problema: a mesma decisão em dois lugares,
# combinada por comentário em vez de por código. `checar_identidade.py` marcava este arquivo
# como pendente por causa disso.
#
# Conferido, e é o ponto da migração: os valores derivados são IDÊNTICOS aos que estavam
# escritos. Migrar não foi mudar de cor — foi tirar a cor de dois lugares e deixar num.
#
# Os treze HTML do Y9 MUDARAM ao regerar, e não por causa disto: eles nunca tinham recebido
# o motor de reveal/focus, e pegaram os 143 blocos dele de uma vez. Conferido linha a linha
# no diff: **zero** ocorrências de cor entre as linhas alteradas.
TEMAS = {
    chave: (idt.FRENTES[chave]["forte"],
            idt.FRENTES[chave]["tinta_papel"],
            idt.FRENTES[chave]["acento_papel"])
    for chave in ("y9", "entrep")
}

# O leitor anotável do Y9 abre por âncora: `#sb-270` ou `#wb-236`.
LEITOR = ""
LIVROS = {}  # No private book collection in this profile.

# O papel do sistema. Estava escrito à mão em quatro lugares deste arquivo, e é exatamente
# o `identidade.NEUTROS["papel"]` — a mesma cor decidida duas vezes, que é como as cinco
# línguas visuais do repositório nasceram.
PAPEL = idt.NEUTROS["papel"]

# O vermelho de "acabou o tempo". O valor é o mesmo `#C0272D` de antes, mas o NOME importa:
# escrito à mão, ele era o vermelho da Mat 1 aparecendo num cronômetro do Y9 — coincidência
# de valor lida como decisão compartilhada. Vem da paleta FUNCIONAL, onde vermelho quer
# dizer alerta, e não da tabela de frentes, onde quer dizer Matemática 1.
ALERTA = idt.PALETA["vermelho"]


DIR_PADRAO = os.path.dirname(os.path.abspath(__file__))
# A raiz do repositório, que é de onde o acervo de páginas dos livros pendura.
RAIZ = os.path.dirname(os.path.dirname(DIR_PADRAO))


def _fonte(nome, arquivo, peso):
    caminho = os.path.join(FONT_DIR, arquivo)
    if not os.path.isfile(caminho):
        return ""
    with open(caminho, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    if arquivo.endswith(".woff2"):
        fmt, tipo = "woff2", "font/woff2"
    elif arquivo.endswith(".otf"):
        fmt, tipo = "opentype", "font/otf"
    else:
        fmt, tipo = "truetype", "font/ttf"
    return ("@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
            "font-display:block;src:url(data:%s;base64,%s) format('%s');}\n"
            % (nome, peso, tipo, b64, fmt))


# As SEIS faces do vocabulário, com os mesmos nomes das SL-* — é isso que faz o CSS de
# `primitivas.py` valer aqui sem uma linha de tradução. Big Shoulders saiu: a voz de
# display do sistema é Archivo Black, decidida em 24/08 ao congelar as dezesseis lâminas.
FACES = [("PrDisplay", "archivoblack-400.woff2", 900),
         ("PrAssunto", "ComicNeue-Bold.ttf", 700),
         ("PrSans", "InstrumentSans-Regular.ttf", 400),
         ("PrSans", "InstrumentSans-Bold.ttf", 700),
         ("PrMono", "GeistMono-Regular.ttf", 400),
         ("PrMao", "NothingYouCouldDo-Regular.ttf", 400),
         ("PrMath", "Euler-Math.otf", 400)]


def _fontes():
    return "".join(_fonte(*f) for f in FACES)


# `CSS` é raw string (o bloco tem chaves de CSS por todo lado, e transformá-lo em f-string
# exigiria dobrar cada uma — 190 linhas de risco por um token). O placeholder é o mesmo
# padrão que o `handout_lib` já usa para `@@TOKENS@@` e `@@FACES@@`: troca na saída, não na
# fonte.
# =============================================================== a superfície ====
# A lâmina do deck passa a ser a MESMA superfície das SL-*: 320 × 180 mm, que é 16:9
# exato. Ele, 25/08, olhando o Car Rental nas duas línguas: *"sim, quero os decks de
# amanhã em diante todos nesse modelo novo."*
#
# O que muda de fundo não é a cor, é a RÉGUA. O deck media tudo em `vw`/`vh` com `clamp`,
# e por isso cada objeto tinha um tamanho negociado com a janela: o traço de um cartão
# dependia da largura da tela, o respiro entre dois blocos dependia da altura. Agora o
# milímetro é uma variável só (`--mm`), a lâmina inteira é escrita nele, e a régua encolhe
# junto com a janela. A proporção entre traço, corpo e respiro fica idêntica no notebook,
# no projetor de 1920 e na TV da sala — que é o motivo de medir em milímetro na parede e
# no papel, agora valendo também na tela.
#
# `--mm` é `min(largura/320, altura/180)`: manda quem apertar primeiro. Sobra `--ground`
# em volta, que é o fundo atrás da peça, o mesmo das páginas de conferência dos goldens.
CSS = r"""
*{box-sizing:border-box;margin:0;padding:0}
/* `--mm` mora na raiz, não na lâmina: a navegação é irmã do slide e também mede nele. */
html{--mm:min(0.3125vw,0.5555vh)}
html,body{width:100%;height:100%;overflow:hidden;background:var(--ground)}
body{font-family:'PrSans',system-ui,sans-serif;color:var(--ink);display:grid;place-items:center}

.slide{display:none;width:100vw;height:100vh;place-items:center}
.slide.active{display:grid}

/* A lâmina: papel, retícula sentida, e nada encostando na borda. */
.lam{position:relative;width:calc(320 * var(--mm));height:calc(180 * var(--mm));
  background:var(--wall);border-radius:calc(2.5 * var(--mm));overflow:hidden;
  box-shadow:0 calc(2 * var(--mm)) calc(6 * var(--mm)) rgba(18,50,95,.12);
  display:flex;flex-direction:column}

/* CABEÇALHO — olho na cor da frente à esquerda, meta em monoespaçada à direita. É o
   mesmo par das SL-*, e substitui a faixa verde cheia que ocupava 23% da lâmina antiga
   dizendo apenas o número do slide. */
.cab{position:relative;z-index:2;display:flex;justify-content:space-between;
  align-items:baseline;gap:calc(6 * var(--mm));padding:calc(7 * var(--mm)) calc(11 * var(--mm)) 0}
.olho{color:var(--forte);font:700 calc(2.8 * var(--mm))/1 'PrSans',sans-serif;
  letter-spacing:calc(.5 * var(--mm));text-transform:uppercase;white-space:nowrap}
.meta{color:#8A93A0;font:400 calc(2.8 * var(--mm))/1 'PrMono',ui-monospace,monospace;
  letter-spacing:calc(.5 * var(--mm));text-transform:uppercase;text-align:right}

/* PALCO — o nome fica: é o que o portão de transbordo mede desde 17/08. */
.palco{position:relative;z-index:2;flex:1;min-height:0;
  padding:calc(4 * var(--mm)) calc(11 * var(--mm)) calc(3 * var(--mm));
  display:flex;flex-direction:column;justify-content:center;gap:calc(5 * var(--mm))}
/* Duas colunas quando a família pede: enunciado à esquerda, objeto à direita. */
.palco.duas{display:grid;grid-template-columns:1.02fr .98fr;gap:calc(8 * var(--mm));
  align-items:center}
.esq{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;
  gap:calc(5 * var(--mm));min-width:0}

/* TÍTULO — Archivo Black, caixa-alta, e o apoio em Instrument Sans logo abaixo. O papel
   de título amarelo NÃO é o padrão: ele é a entrada editorial e só aparece onde a família
   pede (abertura e problema), porque a regra do vocabulário é uma por peça. */
.tit{display:flex;flex-direction:column;gap:calc(1.6 * var(--mm));min-width:0}
/* O papel de título tem sombra sólida de 1.8mm PARA BAIXO. Com o gap padrão o apoio
   entrava por baixo dela e a primeira linha saía cortada — visto no raster de sexta. */
.tit:has(.pr-papel){gap:calc(4.6 * var(--mm))}
.tit h1{font:900 calc(11.2 * var(--mm))/.95 'PrDisplay',Impact,sans-serif;
  text-transform:uppercase;letter-spacing:calc(-.05 * var(--mm))}
.tit .sub{font:400 calc(4.6 * var(--mm))/1.25 'PrSans',sans-serif;color:#5B6672;max-width:44ch}
.pr-papel{font-family:'PrAssunto',sans-serif;font-weight:700;
  font-size:calc(10.4 * var(--mm));padding:calc(2.6 * var(--mm)) calc(6 * var(--mm)) calc(3.4 * var(--mm));
  border-width:calc(.7 * var(--mm));
  box-shadow:calc(1.8 * var(--mm)) calc(1.8 * var(--mm)) 0 var(--ink)}
.mat{font-family:'PrMath',Georgia,serif;font-weight:400}

/* CARTÃO DE CONTEÚDO — substitui o `.campo` tingido com filete à esquerda. Branco, borda
   de tinta, sombra sólida translúcida, e a pílula que o nomeia POR CIMA da borda. */
.obj{position:relative;background:#fff;border:calc(.55 * var(--mm)) solid var(--ink);
  border-radius:calc(1.8 * var(--mm));
  box-shadow:calc(1.3 * var(--mm)) calc(1.3 * var(--mm)) 0 @@SOMBRA14@@;
  transform:rotate(.5deg);padding:calc(12 * var(--mm)) calc(7 * var(--mm)) calc(7 * var(--mm))}
.obj .rot{position:absolute;top:calc(3.2 * var(--mm));left:calc(6 * var(--mm));
  font-size:calc(2.7 * var(--mm));padding:calc(1.6 * var(--mm)) calc(3.6 * var(--mm))}
.enunciado{font:700 calc(6.2 * var(--mm))/1.22 'PrSans',sans-serif}
.enunciado b{color:var(--forte)}
.enunciado-hero{margin:0;font:700 calc(7.6 * var(--mm))/1.14 'PrSans',sans-serif;max-width:22ch}
.destaque{font:900 calc(12 * var(--mm))/1 'PrDisplay',Impact,sans-serif;color:var(--forte)}
.mao{color:var(--coral);font:400 calc(4.6 * var(--mm))/1 'PrMao',cursive;
  display:inline-block;transform:rotate(-1.4deg)}

/* DADO — um por linha, rótulo colorido à esquerda. Vem da SL-04, e é o que substitui
   parágrafo dentro de bloco tingido. */
.dados{display:flex;flex-direction:column;gap:calc(3 * var(--mm));align-self:stretch}
.dado{display:flex;align-items:baseline;gap:calc(3.4 * var(--mm));
  padding:calc(2.4 * var(--mm)) calc(4 * var(--mm));background:#fff;
  border:calc(.45 * var(--mm)) solid var(--ink);border-radius:calc(1.8 * var(--mm));
  box-shadow:calc(.8 * var(--mm)) calc(.8 * var(--mm)) 0 @@SOMBRA12@@}
.dado .rotulo{color:var(--forte);font:700 calc(2.9 * var(--mm))/1 'PrSans',sans-serif;
  letter-spacing:calc(.4 * var(--mm));text-transform:uppercase;white-space:nowrap;
  min-width:calc(22 * var(--mm))}
.dado .txt{font:700 calc(5.6 * var(--mm))/1.15 'PrSans',sans-serif}

/* TRILHA — o roteiro e o fechamento. O fio atravessa as paradas por trás dos nós: sem
   ele, blocos alinhados viram dashboard, que é anti-padrão nomeado na identidade. É a
   gramática da SL-02, com o numeral vazado ordenando sem pesar. */
.trilha{position:relative;display:flex;flex-direction:column;gap:calc(4.2 * var(--mm));
  /* sem teto, a coluna do tempo ia parar na borda da lâmina e o olho perdia o par
     "o quê ↔ quantos minutos", que é a única coisa que esta lâmina precisa entregar */
  max-width:calc(215 * var(--mm))}
.obj .trilha{max-width:none}
/* Um item só não é percurso: sem fio e sem numeral, senão a lâmina promete uma lista
   que não existe — foi o que apareceu no fechamento de quinta, com um "1" solitário. */
.trilha.uma:before{display:none}
.trilha.uma .bloco{grid-template-columns:minmax(0,1fr) auto}
.trilha.uma .bloco .n{display:none}
.trilha:before{content:"";position:absolute;left:calc(3.2 * var(--mm));
  top:calc(3 * var(--mm));bottom:calc(3 * var(--mm));width:calc(.5 * var(--mm));
  background:var(--grid)}
.trilha .bloco{position:relative;display:grid;
  grid-template-columns:calc(9 * var(--mm)) minmax(0,1fr) auto;
  gap:calc(3.6 * var(--mm));align-items:baseline}
.trilha .bloco .n{font:900 calc(6.3 * var(--mm))/.9 'PrDisplay',Impact,sans-serif;
  color:transparent;-webkit-text-stroke:calc(.35 * var(--mm)) var(--forte);
  /* o numeral tapa o fio que passa por trás; dentro do cartão o fundo é branco, e sem
     esta segunda regra aparecia um retângulo cor de papel dentro do cartão */
  background:var(--wall);text-align:center}
.obj .trilha .bloco .n{background:#fff}
.trilha .bloco .oq{font:400 calc(5.2 * var(--mm))/1.2 'PrSans',sans-serif}
.trilha .bloco .oq b{font-weight:700}
.trilha .bloco .qt{font:400 calc(2.8 * var(--mm))/1 'PrMono',ui-monospace,monospace;
  color:#8A93A0;letter-spacing:calc(.4 * var(--mm));white-space:nowrap}

/* ESCADA — a diferenciação da ativação. Os nomes de classe são contrato com o
   `EXTRAS` (`.escada`, `.nivel`, `.aberto`, `[data-pista]`): mudar aqui quebraria a
   tecla que abre o próximo nível. */
.escada{display:flex;flex-direction:column;gap:calc(3 * var(--mm))}
.escada .nivel{display:grid;grid-template-columns:auto minmax(0,1fr);
  gap:calc(4 * var(--mm));align-items:baseline;padding:calc(2.4 * var(--mm)) calc(4 * var(--mm));
  background:#fff;border:calc(.45 * var(--mm)) solid var(--muted);
  border-radius:calc(1.8 * var(--mm));opacity:.4;transition:opacity .18s}
.escada .nivel.aberto{opacity:1;border-color:var(--ink);
  box-shadow:calc(.8 * var(--mm)) calc(.8 * var(--mm)) 0 @@SOMBRA12@@}
.escada .nivel .grau{font:900 calc(4.6 * var(--mm))/1 'PrDisplay',Impact,sans-serif;
  color:var(--muted);text-transform:uppercase}
.escada .nivel.aberto .grau{color:var(--forte)}
.escada .nivel .txt{font:400 calc(4.8 * var(--mm))/1.2 'PrSans',sans-serif}
.escada .nivel .txt b{font-weight:700;color:var(--forte)}
.escada .pista{color:var(--coral);font:400 calc(4 * var(--mm))/1 'PrMao',cursive;
  transform:rotate(-1.2deg);align-self:flex-start}

/* DUPLAS — dois papéis, dois cartões, sem um vencer por tamanho (regra da SL-06). */
.duplas{display:grid;grid-template-columns:1fr 1fr;gap:calc(6 * var(--mm))}
.duplas .papel{position:relative;background:#fff;
  border:calc(.55 * var(--mm)) solid var(--ink);border-radius:calc(1.8 * var(--mm));
  box-shadow:calc(1.3 * var(--mm)) calc(1.3 * var(--mm)) 0 @@SOMBRA14@@;
  padding:calc(10 * var(--mm)) calc(5 * var(--mm)) calc(5 * var(--mm))}
.duplas .papel .quem{position:absolute;top:calc(3 * var(--mm));left:calc(5 * var(--mm))}
.duplas .papel p{font:400 calc(5 * var(--mm))/1.2 'PrSans',sans-serif}

/* CARTÕES — dois ou três casos lado a lado, com a mesma largura e a mesma altura.
   Vem do runtime local que a semana 14–18/09 escreveu à mão (`deck_v2.css`), e é a única
   coisa que ele tinha e o vocabulário não: a lâmina em que a turma COMPARA casos — três
   soluções erradas, dois polígonos, duas rotas. `.duplas` não serve porque ela nomeia
   parceiro A e parceiro B; aqui os cartões são casos, não pessoas.

   A resposta de cada cartão desce para o rodapé do cartão e entra por `data-reveal`, um
   índice por cartão: o objeto não se move quando ela aparece, que é a regra do reveal. */
.cartoes{display:grid;gap:calc(6 * var(--mm));align-items:stretch;min-height:0}
.cartoes.dois{grid-template-columns:1fr 1fr}
.cartoes.tres{grid-template-columns:repeat(3,1fr)}
/* Quatro casos cabem numa fila só: são rótulos curtos de classificação, não explicações.
   O corpo encolhe junto, senão a quarta coluna vira uma coluna de palavras quebradas. */
.cartoes.quatro{grid-template-columns:repeat(4,1fr);gap:calc(4 * var(--mm))}
.cartoes.quatro .cartao{padding:calc(9.5 * var(--mm)) calc(4 * var(--mm)) calc(4 * var(--mm))}
.cartoes.quatro .cartao p{font-size:calc(3.9 * var(--mm))}
.cartoes.quatro .cartao .conta{font-size:calc(5 * var(--mm))}
.cartoes .cartao{position:relative;display:flex;flex-direction:column;
  gap:calc(3 * var(--mm));background:#fff;
  border:calc(.55 * var(--mm)) solid var(--ink);border-radius:calc(1.8 * var(--mm));
  box-shadow:calc(1.3 * var(--mm)) calc(1.3 * var(--mm)) 0 @@SOMBRA14@@;
  padding:calc(10.5 * var(--mm)) calc(5 * var(--mm)) calc(5 * var(--mm))}
.cartoes .cartao .selo{position:absolute;top:calc(3 * var(--mm));left:calc(5 * var(--mm))}
.cartoes .cartao p{font:400 calc(4.4 * var(--mm))/1.26 'PrSans',sans-serif}
.cartoes .cartao b{font-weight:700;color:var(--forte)}
/* A conta é o objeto herói do cartão: ela é o que a turma lê primeiro, de longe. */
.cartoes .cartao .conta{font:700 calc(6.4 * var(--mm))/1.15 'PrSans',sans-serif}
/* Euler tem altura-x baixa, e uma fração composta em 1 em ao lado de um texto em 1 em
   parece menor do que ele. O cartão que traz CONTA e o cartão que traz AFIRMAÇÃO têm de
   pesar igual na parede, senão a turma lê primeiro o que grita, não o que importa. */
.cartoes .cartao .conta mjx-container[jax="SVG"]{font-size:128%}
.cartoes .cartao .resposta{margin-top:auto;padding-left:calc(3.4 * var(--mm));
  border-left:calc(1.2 * var(--mm)) solid var(--forte);
  font:700 calc(4.2 * var(--mm))/1.24 'PrSans',sans-serif}

/* PÁGINAS DO LIVRO — a miniatura é o objeto, e ela abre a página inteira num clique.
   Isto é decisão antiga do Y9, e das boas: "SB p.348" escrito não serve quando a turma
   precisa OLHAR o exemplo. A miniatura diz de qual página se está falando de longe, e o
   clique resolve a leitura de perto sem tirar ninguém do deck.

   A moldura é a do vocabulário — traço de tinta e sombra sólida, como o cartão —, não a
   borda cinza que o runtime local usava. É o mesmo objeto da família, com o conteúdo do
   livro dentro. */
.paginas{display:flex;gap:calc(5 * var(--mm));align-items:flex-end;justify-content:center;
  min-height:0}
/* A largura manda, e a altura segue a proporção da página. A primeira versão fixava a
   ALTURA em 92 mm: com três páginas na mesma fila, a largura disponível apertava antes, o
   `object-fit` encaixava a imagem no meio de uma caixa alta demais e sobrava uma faixa
   vazia embaixo de cada miniatura — que foi o transbordo de 7 px na prática de terça.
   Dividindo a fila em partes iguais, três páginas cabem sem sobra e uma página só cresce
   até o teto. */
.paginas .pag{display:flex;flex:1 1 0;flex-direction:column;align-items:center;min-width:0;
  max-width:calc(76 * var(--mm));gap:calc(1.8 * var(--mm));
  text-decoration:none;color:var(--ink)}
.paginas .pag img{width:100%;height:auto;max-height:calc(92 * var(--mm));
  object-fit:contain;background:#fff;border-radius:calc(1 * var(--mm));
  border:calc(.55 * var(--mm)) solid var(--ink);
  box-shadow:calc(1.3 * var(--mm)) calc(1.3 * var(--mm)) 0 @@SOMBRA14@@}
/* O rótulo não quebra em duas linhas: com três páginas na fila, "STUDENT BOOK P.340 ·
   ENLARGE" partia no meio e a segunda linha ficava órfã embaixo da miniatura. Com a
   página à vista, a forma curta basta — ela diz QUAL página, e a imagem diz o resto. */
.paginas .pag span{font:400 calc(2.6 * var(--mm))/1 'PrMono',ui-monospace,monospace;
  letter-spacing:calc(.3 * var(--mm));text-transform:uppercase;color:#5B6672;
  white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.paginas .pag:hover img{border-color:var(--forte)}
.paginas .pag:hover span{color:var(--forte)}
/* Quando a fila divide a lâmina com texto, ela cede altura — nunca legibilidade do
   rótulo, que continua no mesmo corpo. */
.paginas.media .pag{max-width:calc(54 * var(--mm))}
.paginas.media .pag img{max-height:calc(62 * var(--mm))}

/* Quando a página é o objeto da lâmina, ela não entra dentro do cartão branco: o cartão
   é uma moldura, e a página já tem a sua. Este é o lado direito sem moldura. */
.paginas-obj{display:flex;align-items:center;justify-content:center;min-height:0}
.instrucao-livro{font:400 calc(4.6 * var(--mm))/1.26 'PrSans',sans-serif;max-width:40ch}
.instrucao-livro b{font-weight:700;color:var(--forte)}

/* RECORTE — o trecho exato da página, do tamanho de explicar. A miniatura diz ONDE
   estamos; o recorte mostra O QUE se discute, sem a turma caçar o exercício na página
   inteira e sem redesenhar um enunciado que já existe impresso. */
/* `overflow:hidden` explícito: a imagem da página é maior que a janela por definição —
   é isso que recortar significa —, e é o SVG que a corta. O valor inicial já é esse, mas
   escrito aqui ele para de depender do agente de usuário e de quem for ler este CSS. */
.recorte{display:block;overflow:hidden;width:100%;max-height:calc(96 * var(--mm));
  background:#fff;
  border-radius:calc(1 * var(--mm));border:calc(.55 * var(--mm)) solid var(--ink);
  box-shadow:calc(1.3 * var(--mm)) calc(1.3 * var(--mm)) 0 @@SOMBRA14@@}
/* Dentro de um cartão ou do objeto, o recorte não leva moldura própria: a peça já tem a
   dela, e duas molduras concêntricas fazem o trecho do livro parecer um adesivo colado. */
/* Dentro de um cartão ou do objeto, o recorte não leva moldura própria: a peça já tem a
   dela, e duas molduras concêntricas fazem o trecho do livro parecer um adesivo colado. */
.obj .recorte,.cartao .recorte{box-shadow:none;border:0;border-radius:0}
/* E dentro do cartão ele cede altura: o cartão ainda precisa caber o selo, o texto e a
   resposta revelável. Sem este teto, um recorte em pé (o Example 3, de 335 × 370)
   empurrava o cartão para fora da lâmina. */
.cartao .recorte{max-height:calc(68 * var(--mm))}

/* FOCO — a tela de UM momento cujo objeto é o trecho do livro (U8 em diante: um arquivo
   por momento, não um deck). O título estreita e o recorte ganha a largura, porque é ele
   que a turma lê do fundo da sala. Um recorte sozinho pode ocupar a altura do palco; dois
   empilhados dividem. Classe opt-in: nenhum deck antigo usa `foco`. */
.palco.duas.foco{grid-template-columns:.5fr 1.5fr}
.palco.foco .enunciado .recorte{max-height:calc(52 * var(--mm))}
.palco.foco .enunciado>span:only-child .recorte{max-height:calc(116 * var(--mm))}

/* TABELA DE TRADUÇÃO — frase à esquerda, álgebra à direita. */
.traducao{border-collapse:collapse;width:100%;
  font:400 calc(5 * var(--mm))/1.2 'PrSans',sans-serif}
.traducao thead td{font:700 calc(2.9 * var(--mm))/1 'PrSans',sans-serif;color:var(--forte);
  letter-spacing:calc(.4 * var(--mm));text-transform:uppercase;
  padding-bottom:calc(2 * var(--mm))}
.traducao tbody td{padding:calc(2.6 * var(--mm)) calc(3 * var(--mm)) calc(2.6 * var(--mm)) 0;
  border-top:calc(.35 * var(--mm)) solid var(--grid)}
.traducao tbody td:last-child{font-weight:700;color:var(--forte);text-align:right;
  font-family:'PrMath',Georgia,serif}

/* LINHA DO TEMPO — a unidade tem começo e fim, e o fio é o que faz enxergar onde estamos.
   Mesma razão do fio da trilha. */
.tempo-trilho{position:relative;padding-top:calc(3 * var(--mm))}
.tempo-fio{position:absolute;left:0;right:0;top:calc(5 * var(--mm));
  height:calc(.5 * var(--mm));background:var(--grid)}
.paradas{position:relative;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;
  gap:calc(5 * var(--mm))}
.parada{position:relative;padding-top:calc(11 * var(--mm))}
.parada:before{content:"";position:absolute;top:calc(3.2 * var(--mm));left:0;
  width:calc(3.6 * var(--mm));height:calc(3.6 * var(--mm));border-radius:50%;
  background:var(--wall);border:calc(.55 * var(--mm)) solid var(--muted)}
.parada.agora:before{background:var(--forte);border-color:var(--forte)}
.parada .quando{position:absolute;top:calc(3.4 * var(--mm));left:calc(6 * var(--mm));
  font:400 calc(2.8 * var(--mm))/1 'PrMono',ui-monospace,monospace;color:#8A93A0;
  letter-spacing:calc(.4 * var(--mm));text-transform:uppercase}
.parada.agora .quando{color:var(--forte)}
.parada .nome{font:900 calc(4.6 * var(--mm))/1 'PrDisplay',Impact,sans-serif;
  text-transform:uppercase;margin-bottom:calc(1.6 * var(--mm))}
.parada .oque{font:400 calc(3.8 * var(--mm))/1.25 'PrSans',sans-serif;color:#5B6672}
.parada .entrega{margin-top:calc(2.4 * var(--mm))}
.parada .entrega.vazia{color:var(--muted);font:400 calc(3 * var(--mm))/1 'PrMono',monospace;
  text-transform:uppercase;letter-spacing:calc(.4 * var(--mm))}

/* AÇÃO — o botão que abre o leitor anotável ou o destino externo. Vira crachá: papel
   amarelo, sombra dourada, rotação forte. Ele NOMEIA um movimento, que é a função do
   crachá de rota no vocabulário. */
.acoes{display:flex;flex-wrap:wrap;gap:calc(4 * var(--mm));align-items:center}
.acao{display:inline-block;text-decoration:none;
  padding:calc(2.4 * var(--mm)) calc(4.5 * var(--mm));background:#fff;
  border:calc(.55 * var(--mm)) solid var(--ink);border-radius:calc(5 * var(--mm));
  box-shadow:calc(1 * var(--mm)) calc(1 * var(--mm)) 0 @@SOMBRA14@@;
  color:var(--ink);font:900 calc(3.4 * var(--mm))/1 'PrDisplay',Impact,sans-serif;
  text-transform:uppercase;transform:rotate(-1.6deg)}
.acao.forte{background:var(--paper);
  box-shadow:calc(1 * var(--mm)) calc(1 * var(--mm)) 0 var(--gold);color:var(--forte);
  transform:rotate(-3deg)}

/* CRONÔMETRO — `[data-relogio]` é contrato com o `EXTRAS`. O visor é o objeto herói da
   lâmina de prática, e por isso é o único lugar em que o display passa de 12 mm. */
.relogio{display:grid;grid-template-columns:auto minmax(0,1fr);gap:calc(8 * var(--mm));
  align-items:center}
.relogio .visor{font:900 calc(34 * var(--mm))/.82 'PrDisplay',Impact,sans-serif;
  color:var(--ink);cursor:pointer;user-select:none;letter-spacing:calc(-.4 * var(--mm))}
.relogio .visor.correndo{color:var(--forte)}
.relogio .visor.fim{color:@@ALERTA@@}
.relogio .instr{font:400 calc(5 * var(--mm))/1.22 'PrSans',sans-serif}
.relogio .instr .toque{display:block;margin-top:calc(3 * var(--mm));color:#8A93A0;
  font:400 calc(2.6 * var(--mm))/1 'PrMono',ui-monospace,monospace;
  letter-spacing:calc(.4 * var(--mm));text-transform:uppercase}

/* CRONÔMETRO DE CANTO — o mesmo motor `data-relogio` do visor herói, no tamanho de quem
   acompanha uma atividade que já está rodando. O visor de 34 mm da `pratica` é o objeto
   principal daquela lâmina; aqui o objeto principal são os cartões, e o tempo é apoio.
   Sem isto, uma caça ao erro de 25 min ficaria com o tempo só no rodapé, em 2,8 mm. */
.crono{position:absolute;top:calc(1.5 * var(--mm));right:calc(11 * var(--mm));z-index:3;
  background:none;border:0;padding:0;cursor:pointer;user-select:none;
  font:700 calc(5.4 * var(--mm))/1 'PrMono',ui-monospace,monospace;color:var(--forte)}
.crono.correndo{color:var(--coral)}
.crono.fim{color:@@ALERTA@@}
/* O cronômetro mora na faixa do cabeçalho, logo abaixo da meta. O título é a única coisa
   que poderia chegar até ali, então na lâmina que tem cronômetro ele para antes. */
.lam:has(.crono) .tit h1{max-width:21ch}

/* CÓDIGO — o número que a turma digita (Kahoot, formulário). É leitura de 5 m: nada mais
   na lâmina disputa com ele. */
.codigo{font:900 calc(26 * var(--mm))/.85 'PrDisplay',Impact,sans-serif;color:var(--forte);
  letter-spacing:calc(.6 * var(--mm))}
/* O DESTINO, quando ele é para ser DIGITADO. Ver a regra em `link()`. */
.destino{font:900 calc(16 * var(--mm))/.9 'PrDisplay',Impact,sans-serif;color:var(--ink);
  letter-spacing:calc(.2 * var(--mm))}

/* VÍDEO na lâmina. O quadro NÃO gira: vale para ele a mesma razão de a matemática nunca
   girar — é superfície viva, não papel. */
.tv{display:grid;gap:calc(3 * var(--mm));justify-items:center;min-height:0}
.tv .quadro{position:relative;width:100%;max-width:calc(196 * var(--mm));aspect-ratio:16/9;
  background:#000;border:calc(.55 * var(--mm)) solid var(--ink);
  border-radius:calc(1.8 * var(--mm));overflow:hidden;
  box-shadow:calc(1.3 * var(--mm)) calc(1.3 * var(--mm)) 0 @@SOMBRA14@@}
.tv .quadro iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.tv .fora{font:400 calc(2.8 * var(--mm))/1 'PrMono',ui-monospace,monospace;
  letter-spacing:calc(.4 * var(--mm));text-transform:uppercase;color:#8A93A0}
.tv .fora a{color:var(--forte)}

/* LISTAS auxiliares que algumas lâminas usam. */
.casos{margin:0;padding-left:1.4em;font:400 calc(4.6 * var(--mm))/1.25 'PrSans',sans-serif}
.casos li{margin-bottom:calc(2 * var(--mm))}
.casos .perg{display:block;margin-top:.15em;color:var(--forte);font-weight:700}
.lista-quiz{margin:0;padding-left:1.5em;font:400 calc(4.4 * var(--mm))/1.3 'PrSans',sans-serif}
.lista-quiz li{margin-bottom:calc(1.2 * var(--mm));opacity:.55}
.lista-quiz li.foco{opacity:1;font-weight:700;color:var(--forte)}
.apontar{margin-top:calc(2.4 * var(--mm));font-weight:800;color:var(--forte);
  font-size:calc(4.4 * var(--mm))}
.preencher{display:inline-block;min-width:60%;padding:.3em .5em;
  border:calc(.5 * var(--mm)) dashed var(--gold);background:@@OURO10@@;
  border-radius:calc(1.4 * var(--mm))}
.cantos{display:grid;grid-template-columns:1fr 1fr;gap:calc(3.6 * var(--mm)) calc(5 * var(--mm))}
.cantos .canto{background:#fff;border:calc(.45 * var(--mm)) solid var(--ink);
  border-radius:calc(1.8 * var(--mm));
  box-shadow:calc(.8 * var(--mm)) calc(.8 * var(--mm)) 0 @@SOMBRA12@@;
  padding:calc(3 * var(--mm)) calc(3.6 * var(--mm));
  font:400 calc(4 * var(--mm))/1.2 'PrSans',sans-serif}
.cantos .canto .tag{display:block;margin-bottom:calc(1.6 * var(--mm));color:var(--forte);
  font:700 calc(2.7 * var(--mm))/1 'PrSans',sans-serif;letter-spacing:calc(.4 * var(--mm));
  text-transform:uppercase}

/* RODAPÉ e NOTA. A nota é DELE e a lâmina está na parede: some por padrão, volta no `N`.
   O teto de altura com rolagem continua — sem ele, nota de dez linhas empurrava as
   últimas para trás da navegação. */
.rodape{position:relative;z-index:2;display:flex;justify-content:space-between;
  align-items:baseline;gap:calc(5 * var(--mm));
  padding:0 calc(11 * var(--mm)) calc(6 * var(--mm));
  font:400 calc(2.6 * var(--mm))/1 'PrMono',ui-monospace,monospace;
  letter-spacing:calc(.4 * var(--mm));text-transform:uppercase;color:#8A93A0}
.rodape .nota{display:none;max-width:52%;text-align:right;text-transform:none;
  letter-spacing:0;white-space:pre-line;font-family:'PrSans',sans-serif;
  font-size:calc(3.4 * var(--mm));line-height:1.3;color:#5B6672}
body.com-notas .rodape .nota{display:block}
body.com-notas .rodape{flex-direction:column;align-items:stretch;gap:calc(2 * var(--mm))}
body.com-notas .rodape .nota{max-width:100%;text-align:left;
  max-height:calc(58 * var(--mm));overflow-y:auto;padding-right:calc(2 * var(--mm));
  border-top:calc(.35 * var(--mm)) solid var(--forte);padding-top:calc(2 * var(--mm))}
/* Com a nota aberta o palco CEDE, e a lâmina não cresce. */
body.com-notas .palco{flex:1 1 auto;min-height:0}

.nav{position:fixed;right:calc(6 * var(--mm));bottom:calc(4 * var(--mm));z-index:9;
  display:flex;align-items:center;gap:calc(2 * var(--mm));
  font:400 calc(2.8 * var(--mm))/1 'PrMono',ui-monospace,monospace;color:#8A93A0}
.nav button{width:calc(8 * var(--mm));height:calc(8 * var(--mm));
  border:calc(.45 * var(--mm)) solid var(--muted);border-radius:calc(1.4 * var(--mm));
  background:var(--wall);color:var(--ink);font-size:calc(3.6 * var(--mm));cursor:pointer}
.nav button:hover{border-color:var(--forte);color:var(--forte)}

@media print{
  html,body{display:block;overflow:visible;background:#fff}
  .slide,.slide.active{display:grid;width:100%;height:100vh;page-break-after:always}
  .nav{display:none}
}
"""

# A navegação saiu daqui e virou `slides_motor.py`, compartilhada com o `slides_lib.py`.
# O que ficou é o que só existe nestes decks e depende da marcação deles: o cronômetro da
# lâmina, a escada de níveis e as notas do professor. Unificar isso também seria inventar
# acoplamento entre duas famílias que de fato desenham coisas diferentes.
EXTRAS = r"""<script>
(function () {
  "use strict";

  /* Cronômetro da prática: um toque começa, outro pausa, dois toques zeram. Fica na
     lâmina porque o comando e o tempo são a mesma instrução — mandar a turma praticar
     "por 12 minutos" e não mostrar o tempo é pedir que confiem na memória do professor. */
  [].slice.call(document.querySelectorAll("[data-relogio]")).forEach(function (visor) {
    var total = Math.max(1, Number(visor.getAttribute("data-relogio")) || 60);
    var restante = total, timer = null;

    function pinta() {
      var m = Math.floor(restante / 60), s = restante % 60;
      visor.textContent = m + ":" + (s < 10 ? "0" : "") + s;
      visor.classList.toggle("correndo", !!timer && restante > 0);
      visor.classList.toggle("fim", restante <= 0);
    }
    function parar() { clearInterval(timer); timer = null; pinta(); }
    visor.addEventListener("click", function () {
      if (timer) { parar(); return; }
      if (restante <= 0) restante = total;
      timer = setInterval(function () {
        restante -= 1;
        if (restante <= 0) { restante = 0; parar(); }
        pinta();
      }, 1000);
      pinta();
    });
    visor.addEventListener("dblclick", function () { parar(); restante = total; pinta(); });
    pinta();
  });

  /* A escada sobe com a seta para baixo, ou clicando nela. A seta para a direita
     continua sendo "próxima lâmina" — são dois movimentos diferentes e não podem
     compartilhar a mesma tecla, senão ele passa da ativação sem querer. */
  function subirEscada(escada) {
    var fechados = [].slice.call(escada.querySelectorAll(".nivel:not(.aberto)"));
    if (!fechados.length) return false;
    fechados[0].classList.add("aberto");
    /* A pista é irmã da escada, não filha — procurar dentro devolvia `null` e o
       contador ficava congelado em "faltam 4" com os cinco níveis já abertos. */
    var pista = escada.parentElement && escada.parentElement.querySelector("[data-pista]");
    if (pista) {
      var faltam = fechados.length - 1;
      /* Os três rótulos vêm do HTML, escritos pelo `build` na língua do deck — a lib
         passou a ter tabela de idioma em 31/08, e um literal aqui reintroduziria o
         inglês numa lâmina em português. */
      var rot = document.body.dataset;
      pista.textContent = faltam
        ? (faltam > 1 ? rot.nivVarios : rot.nivUm).replace("{n}", faltam)
        : rot.nivFim;
    }
    return true;
  }
  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key !== "ArrowDown") return;
    /* Pergunta ao DOM qual lâmina está ativa em vez de confiar no contador interno:
       qualquer coisa que troque a lâmina por fora — um link com âncora, o próprio
       teste — deixaria os dois fora de sincronia, e a seta agiria na lâmina errada. */
    var ativa = document.querySelector(".slide.active");
    var escada = ativa && ativa.querySelector(".escada");
    if (escada) { e.preventDefault(); subirEscada(escada); }
  });
  document.addEventListener("click", function (e) {
    var escada = e.target.closest(".escada");
    if (escada) subirEscada(escada);
  });

  /* N mostra e esconde as anotações do professor. Fechadas por padrão: a lâmina é
     projetada, e a nota da ativação é o gabarito. */
  document.addEventListener("keydown", function (e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === "n" || e.key === "N") document.body.classList.toggle("com-notas");
  });

}());
</script>"""

SCRIPT = MOTOR + EXTRAS


# --------------------------------------------------------------------- idioma ----
#
# As lâminas do Y9 são em INGLÊS porque a aula é em inglês — é a razão escrita em três
# lugares desta lib. Mas a lib é o motor, não a língua: o Open House de 09/09 é uma aula
# em português, com as famílias na sala e questões do ENEM, e projetar "by the end of this
# lesson" para pais brasileiros seria o mesmo defeito, do outro lado.
#
# Então os rótulos fixos saem do corpo das famílias e viram tabela. `idioma("pt")` no topo
# do gerador troca todos de uma vez, e o padrão continua sendo o inglês.

ROTULOS = {
    "en": {
        "html_lang": "en",
        "objetivos": "by the end of this lesson",
        "problema": "Problem",
        "livro": "in the book",
        "fechamento": "say it back",
        "parceiro_a": "Partner A",
        "parceiro_b": "Partner B",
        "frase_diz": "What the sentence says",
        "frase_escreve": "What you write",
        "niveis_um": "{n} more level to unlock",
        "niveis_varios": "{n} more levels to unlock",
        "niveis_fim": "all levels unlocked",
        "sem_nota": "no new grade",
        "toque_tempo": "Click to start or pause; double-click to reset",
        "toque": "tap the clock to start · two taps reset it",
        "ampliar": "enlarge",
        "anotar": "annotate",
    },
    "pt": {
        "html_lang": "pt-BR",
        "objetivos": "ao fim desta meia hora vocês vão conseguir",
        "problema": "Questão",
        "livro": "no material",
        "fechamento": "o que fica",
        "parceiro_a": "Aluno",
        "parceiro_b": "Responsável",
        "frase_diz": "O que a frase diz",
        "frase_escreve": "O que você escreve",
        "niveis_um": "falta {n} passo",
        "niveis_varios": "faltam {n} passos",
        "niveis_fim": "todos os passos abertos",
        "sem_nota": "não vale nota",
        "toque_tempo": "Um toque começa ou pausa; dois toques zeram",
        "toque": "toque no tempo para começar · dois toques zeram",
        "ampliar": "ampliar",
        "anotar": "anotar",
    },
}
_IDIOMA = ["en"]


def idioma(codigo):
    """Troca a língua dos rótulos fixos. Chamar no topo do gerador, antes das lâminas."""
    if codigo not in ROTULOS:
        raise ValueError("idioma desconhecido: %r (use %s)"
                         % (codigo, " ou ".join(sorted(ROTULOS))))
    _IDIOMA[0] = codigo


def T(chave):
    return ROTULOS[_IDIOMA[0]][chave]


def _e(texto):
    """Escapa o que vai para um campo de TEXTO da lâmina (título, tempo, item de lista).

    O gate da entidade existe porque em 17/08 um título saiu projetado como
    `Discussion 4 &mdash; and if only one country charges?` — com o `&mdash;` literal, em
    corpo 60, na parede da sala. A causa é sutil: nesta lib alguns campos são HTML cru
    (o enunciado do `problema`, os papéis do `duplas`, o `sub`) e outros são texto puro
    (título, item de roteiro, ponto de fechamento). Escrever entidade nos primeiros é
    certo; nos segundos, o `escape` transforma o `&` em `&amp;` e a entidade aparece.

    Quem escreve o deck não tem como saber de cabeça qual campo é qual — então quem sabe
    avisa. Travessão e ponto médio são caracteres: escrever `—` e `·` direto funciona nos
    dois lados, e é a correção, não um contorno.
    """
    texto = str(texto or "")
    achado = re.search(r"&(?:[a-zA-Z][a-zA-Z0-9]{1,9}|#[0-9]{1,6}|#x[0-9a-fA-F]{1,6});",
                       texto)
    if achado:
        raise ValueError(
            "entidade HTML %r num campo de texto da lâmina — ele seria projetado "
            "literal. Escreva o caractere (— · – …) em vez da entidade.\n  em: %s"
            % (achado.group(0), texto[:120]))
    return html.escape(texto)


# --------------------------------------------------------------------- lâminas ----
#
# Cada família devolve `(tipo, marca, titulo, sub, corpo, nota)`. Desde 25/08 o `corpo`
# carrega TAMBÉM o título: quem compõe é a família, não o `build`.
#
# A mudança não é de arrumação. O `build` desenhava uma faixa de título igual em toda
# lâmina, e isso é o "andaime rígido" que a SL-01 recusa por escrito: numa lâmina
# projetada o título disputa a tela com o objeto matemático, e onde o objeto é o herói o
# título tem de recuar. Com a composição na família, a abertura e o problema entram pelo
# papel de título amarelo (a entrada editorial, uma por peça) e as demais entram por um
# título de display que cede espaço ao que importa.
#
# `titulo` e `sub` continuam no retorno porque o briefing e o portão de tempo leem os dois.


def _titulo(titulo, sub, papel=False):
    """A entrada da lâmina. `papel=True` usa o papel de título amarelo do vocabulário."""
    cabeca = pr.papel_titulo(_e(titulo)) if papel else "<h1>%s</h1>" % _e(titulo)
    return ('<div class="tit">%s%s</div>'
            % (cabeca, ('<p class="sub">%s</p>' % sub) if sub else ""))


def abertura(titulo, sub, conseguir, nota=""):
    """Nome da aula e o que a turma vai conseguir fazer no fim dela.

    A `nota` é o lugar certo da lista de MATERIAIS: ela é a primeira lâmina, ele abre o
    deck por ela, e a tecla `N` mostra só para quem está no computador. Material
    projetado na parede é ruído para a turma e sai da tela justamente quando ele
    precisaria conferir.

    Entra pelo papel de título, como a SL-01: é a capa da aula.
    """
    itens = "".join('<div class="bloco"><span class="n">%d</span>'
                    '<span class="oq">%s</span><span class="qt"></span></div>'
                    % (i, _e(x)) for i, x in enumerate(conseguir, 1))
    corpo = ('<div class="esq">%s</div>'
             '<div class="obj"><span class="pr-pilula tinta rot">%s</span>'
             '<div class="trilha%s">%s</div></div>'
             % (_titulo(titulo, sub, papel=True), _e(T("objetivos")),
                " uma" if len(conseguir) == 1 else "", itens))
    return ("abertura", "aula", titulo, sub, corpo, nota, "duas")


def roteiro(titulo, sub, blocos):
    """Os blocos da aula com o tempo de cada um. `blocos` = [(nome, minutos)].

    Gramática da SL-02: o percurso é um FIO, não uma pilha. O fio atravessa as paradas por
    trás dos numerais vazados — sem ele, blocos alinhados viram dashboard.
    """
    linhas = "".join(
        '<div class="bloco"><span class="n">%d</span><span class="oq">%s</span>'
        '<span class="qt">%s min</span></div>' % (i, _e(nome), _e(minutos))
        for i, (nome, minutos) in enumerate(blocos, 1))
    corpo = '%s<div class="trilha">%s</div>' % (_titulo(titulo, sub), linhas)
    return ("roteiro", "plano", titulo, sub, corpo, "")


def problema(titulo, sub, enunciado, tempo="", nota="", rotulo=None, relogio=None):
    """`rotulo` troca o selo do campo.

    Nem toda lâmina desta forma é uma pergunta: a de 21/08 que relembra o quiz da aula
    anterior é CONTEXTO, e chamá-la de "Problem" fazia a turma procurar uma pergunta que
    não estava ali. Ele resumiu assim: *"não dá pra entender só olhando o slide do que se
    trata a aula"*.

    Gramática da SL-04: o enunciado domina, o papel de título entra pela esquerda e a
    resposta NÃO aparece. Sem área pautada — o Y9 resolve no caderno, e pauta na tela
    prometeria um lugar de escrever que não existe.
    """
    corpo = ('%s<div class="esq">%s</div>'
             '<div class="obj"><span class="pr-pilula tinta rot">%s</span>'
             '<p class="enunciado">%s</p></div>'
             % (_crono(relogio), _titulo(titulo, sub, papel=True),
                _e(rotulo or T("problema")), enunciado))
    return ("problema", tempo or "problema", titulo, sub, corpo, nota, "duas")


def desafio(titulo, sub, niveis, tempo="", nota=""):
    """Escada de níveis para a ativação. `niveis` = [(rótulo, enunciado)].

    O primeiro nasce aberto; os demais acendem com a seta para baixo ou com um clique.
    A dificuldade tem que crescer na MONTAGEM da equação — variável dos dois lados,
    parênteses, fração do que sobrou —, não no tamanho da conta.
    """
    linhas = []
    for i, (grau, texto) in enumerate(niveis):
        linhas.append('<div class="nivel%s"><span class="grau">%s</span>'
                      '<span class="txt">%s</span></div>'
                      % (" aberto" if i == 0 else "", _e(grau), texto))
    corpo = ('%s<div class="escada">%s</div>'
             '<div class="pista" data-pista>%s</div>'
             % (_titulo(titulo, sub), "".join(linhas),
                _e((T("niveis_um") if max(0, len(niveis) - 1) == 1
                    else T("niveis_varios")).replace("{n}", str(max(0, len(niveis) - 1))))))
    return ("desafio", tempo or "desafio", titulo, sub, corpo, nota)


def linha_do_tempo(titulo, sub, etapas, tempo="", nota="", relogio=None,
                   agora=0):
    """Panorama de uma unidade: por onde ela passa e o que se entrega em cada parada.

    `etapas` = [(quando, nome, o_que, entrega)] — `entrega` pode ser "" quando a parada
    não carrega instrumento avaliativo, e ela é desenhada com destaque justamente porque
    é a pergunta que o aluno faz primeiro.

    Horizontal e não empilhada: a unidade tem começo e fim, e a leitura da esquerda para
    a direita é o que faz o aluno enxergar onde está hoje. Três a quatro paradas cabem;
    mais que isso vira tabela e perde a função.
    """
    colunas = []
    for i, (quando, nome, o_que, entrega) in enumerate(etapas):
        colunas.append(
            '<div class="parada%s">'
            '<div class="quando">%s</div>'
            '<div class="nome">%s</div>'
            '<div class="oque">%s</div>'
            '%s</div>'
            # `agora` era fixo na primeira parada. Num arco que começa no que já passou
            # — "feito · HOJE · depois" — isso acende a parada errada, e a turma lê o
            # passado como se fosse o agora.
            % (" agora" if i == agora else "", _e(quando), _e(nome), o_que,
               ('<div class="entrega">%s</div>' % pr.pilula(_e(entrega))) if entrega else
               ('<div class="entrega vazia">%s</div>' % _e(T("sem_nota")))))
    corpo = ('%s%s<div class="tempo-trilho"><div class="tempo-fio"></div>'
             '<div class="paradas">%s</div></div>'
             % (_crono(relogio), _titulo(titulo, sub), "".join(colunas)))
    # `tempo` existe porque o portão de minutagem (S13) só isenta abertura e roteiro: uma
    # lâmina de panorama SEM tempo declarado some da conta, que é o defeito que o portão
    # foi feito para pegar. O padrão vazio mantém a marca antiga ("unidade") para quem
    # gerar deck sem `duracao`.
    return ("linha", tempo or "unidade", titulo, sub, corpo, nota)


def palavras(titulo, sub, pares, nota="", tempo=""):
    """Tradução do enunciado para álgebra. `pares` = [(frase, algebra)].

    A coluna da direita compõe em Euler: ali é notação, e notação é a voz da face
    matemática. A da esquerda é fala, e fica em Instrument Sans.
    """
    linhas = "".join("<tr><td>%s</td><td>%s</td></tr>" % (_e(a), _e(b)) for a, b in pares)
    corpo = ('%s<table class="traducao"><thead><tr><td>%s</td>'
             '<td>%s</td></tr></thead><tbody>%s</tbody></table>'
             % (_titulo(titulo, sub), _e(T("frase_diz")), _e(T("frase_escreve")), linhas))
    return ("palavras", tempo or "modelar", titulo, sub, corpo, nota)


def livro(titulo, sub, paginas_, instrucao, tempo="", nota="", miniaturas=False,
          relogio=None):
    raise ValueError('Resource not enabled in the local public profile')

def duplas(titulo, sub, papel_a, papel_b, tempo="", nota="", relogio=None):
    """Dois papéis, dois cartões — e nenhum vence por tamanho (regra da SL-06).

    `relogio` é opcional e em minutos: bloco de duplas com tempo fechado ganha o
    cronômetro de canto, porque o tempo do rodapé não se lê do fundo da sala.
    """
    corpo = ('%s%s<div class="duplas">'
             '<div class="papel">%s<p>%s</p></div>'
             '<div class="papel">%s<p>%s</p></div></div>'
             % (_crono(relogio), _titulo(titulo, sub),
                pr.pilula(_e(T("parceiro_a"))), papel_a,
                pr.pilula(_e(T("parceiro_b")), cor="ameixa"), papel_b))
    return ("duplas", tempo or "duplas", titulo, sub, corpo, nota)


def _pagina_jpg(livro_, numero, arquivo=None):
    """Onde mora a imagem daquela página. `arquivo` usa uma cópia local do pacote.

    O caminho sai com `@@LIVROS@@` na frente e quem resolve é o `build`, que é o único
    que sabe em que pasta o deck vai cair. Cada gerador de semana escrevia
    `../../../../math-y9/Books/...` à mão, o que significa que um deck que mudasse de
    profundidade quebrava em silêncio — a miniatura vira um ícone de imagem quebrada, e
    isso só aparece na projeção.
    """
    raise ValueError('Book assets are not enabled in the local public profile')


def paginas(lista, media=False):
    raise ValueError('Resource not enabled in the local public profile')

def recorte(livro_, numero, x, y, largura, altura, descricao, arquivo=None):
    raise ValueError('Resource not enabled in the local public profile')

def _crono(minutos):
    """O cronômetro de canto, para a família em que o tempo é apoio e não o objeto herói.

    Mesmo motor `data-relogio` do visor da `pratica` — um toque começa, dois zeram. Não é
    um segundo motor: é o mesmo, num tamanho que não disputa com o conteúdo da lâmina.
    """
    if not minutos:
        return ""
    return ('<button class="crono" type="button" data-relogio="%d" title="%s">%d:00</button>'
            % (int(minutos) * 60, _e(T("toque_tempo")), int(minutos)))


def cartoes(titulo, sub, itens, tempo="", nota="", cor="tinta", relogio=None):
    """Dois ou três CASOS lado a lado, para a turma comparar. `itens` = [(selo, corpo,
    resposta)] — `resposta` pode ser "" quando o cartão não tem nada a revelar.

    É a composição que a semana 14–18/09 escreveu à mão num runtime local, e a única que
    faltava aqui: a lâmina da caça ao erro põe três soluções erradas em paralelo, e
    `duplas` não serve porque ela nomeia parceiro A e parceiro B — ali os cartões são
    casos, não pessoas.

    Cada resposta entra com o seu próprio índice de `data-reveal`: o professor abre a do
    cartão que a turma acabou de discutir, e os outros dois continuam fechados. Sem
    índice, uma seta abriria os três de uma vez e a caça ao erro terminaria na primeira.

    `corpo` e `resposta` são HTML — quem chama compõe negrito, `<span data-math>` e
    figura. O selo é escapado aqui porque é rótulo, não composição.
    """
    if not 2 <= len(itens) <= 4:
        raise ValueError("cartoes aceita de 2 a 4 casos — recebi %d" % len(itens))
    blocos = []
    for i, item in enumerate(itens, 1):
        selo, corpo_cartao = item[0], item[1]
        resposta = item[2] if len(item) > 2 else ""
        blocos.append(
            '<div class="cartao"><span class="selo">%s</span>%s%s</div>'
            % (pr.pilula(_e(selo), cor=cor), corpo_cartao,
               ('<p class="resposta" data-reveal="%d">%s</p>' % (i, resposta))
               if resposta else ""))
    corpo = ('%s%s<div class="cartoes %s">%s</div>'
             % (_crono(relogio), _titulo(titulo, sub),
                {2: "dois", 3: "tres", 4: "quatro"}[len(itens)], "".join(blocos)))
    return ("cartoes", tempo or "comparar", titulo, sub, corpo, nota)


def termos_espalhados(titulo, sub, linhas, revelar=False, tempo="", nota=""):
    """Termos grandes para seleção; o reveal muda a marca, nunca a posição.

    `linhas` = [[("Problem", True), ("Logo", False)], ...]. A primeira tela não dá
    pistas por cor, peso ou agrupamento. Na correção, os itens verdadeiros recebem a cor
    da frente e sublinhado; os distratores ficam cinza e riscados. Usar quando reconhecer
    ou selecionar é a própria ação da turma — não como decoração de uma explicação.
    """
    if not linhas or any(not linha or len(linha) > 3 for linha in linhas):
        raise ValueError("termos_espalhados aceita de 1 a 3 termos por linha")
    itens = []
    for indice_linha, linha in enumerate(linhas):
        posicoes = ([1], [1, 64], [1, 33, 75])[len(linha) - 1]
        for coluna, (texto, correto) in enumerate(linha):
            cor = "var(--forte)" if revelar and correto else ("#929292" if revelar else "var(--ink)")
            decoracao = "underline" if revelar and correto else ("line-through" if revelar else "none")
            itens.append(
                "<span style='position:absolute;left:%s%%;top:%s%%;"
                "font:700 calc(5.8 * var(--mm))/1.2 PrSans,sans-serif;white-space:nowrap;"
                "color:%s;text-decoration:%s'>%s</span>"
                % (posicoes[coluna], indice_linha * (100 / len(linhas)), cor, decoracao, _e(texto)))
    corpo = (_titulo(titulo, sub) +
             "<div style='position:relative;height:calc(100 * var(--mm));width:100%%'>%s</div>"
             % "".join(itens))
    return ("termos", tempo or "selecionar", titulo, sub, corpo, nota)


def matriz_classificacao(titulo, sub, colunas, linhas, celulas, tempo="", nota=""):
    """Matriz 2 × 2 para revelar duas decisões de classificação ao mesmo tempo.

    `celulas` segue a ordem das linhas e cada item é `(rótulo, exemplo)`. A composição
    só deve ser usada quando os dois eixos são essenciais para entender cada quadrante.
    """
    if len(colunas) != 2 or len(linhas) != 2 or len(celulas) != 2 or any(len(x) != 2 for x in celulas):
        raise ValueError("matriz_classificacao exige dois eixos e quatro células")

    def celula(conteudo):
        nome, exemplo = conteudo
        return ("<td style='border:1px solid var(--ink);padding:calc(5 * var(--mm));width:42%%'>"
                "<b style='color:var(--forte)'>%s</b><br>%s</td>" % (_e(nome), _e(exemplo)))

    corpo = _titulo(titulo, sub)
    corpo += ("<table style='width:100%%;border-collapse:collapse;"
              "font:400 calc(5.5 * var(--mm))/1.3 PrSans,sans-serif'>"
              "<tr><th></th><th>%s</th><th>%s</th></tr>" % (_e(colunas[0]), _e(colunas[1])))
    for rotulo, conteudo in zip(linhas, celulas):
        corpo += ("<tr><th style='padding-right:calc(3 * var(--mm))'>%s</th>%s%s</tr>"
                  % (_e(rotulo), celula(conteudo[0]), celula(conteudo[1])))
    corpo += "</table>"
    return ("matriz", tempo or "classificar", titulo, sub, corpo, nota)


def modelo_com_postits(titulo, asset, postits=(), tempo="", nota=""):
    raise ValueError('Resource not enabled in the local public profile')

def pratica(titulo, sub, instrucao, minutos, paginas_=None, nota="", miniaturas=False,
            paginas=None):
    """O tempo e o comando são a MESMA instrução, e por isso dividem a lâmina.

    Mandar a turma praticar "por 12 minutos" e não mostrar o tempo é pedir que confiem na
    memória do professor. O visor é o objeto herói: é o único display que passa de 12 mm.

    `miniaturas=True` muda quem é o herói. Numa prática de livro, o objeto da lâmina é a
    PÁGINA — a turma precisa reconhecer de longe em qual delas está —, e aí o visor de
    34 mm sai do meio e o tempo sobe para o canto de cima, no mesmo motor. É a forma que
    os decks de agosto já usavam e que vale a pena manter: página grande, tempo visível,
    comando curto embaixo.

    `paginas` continua aceito com o nome antigo, porque nove geradores chamam assim.
    """
    paginas_ = paginas_ or paginas or []
    if paginas_ or miniaturas:
        raise ValueError('Book assets are not enabled in this profile')
    botoes = "".join(
        '<a class="acao" href="%s#%s-%d" target="_blank" rel="noopener">'
        '%s p.%d</a>' % (LEITOR, entrada[0], entrada[1], LIVROS[entrada[0]][4], entrada[1])
        for entrada in paginas_)
    acoes = ('<div class="acoes">%s</div>' % botoes) if botoes else ""
    if miniaturas and paginas_:
        # Com a página à direita, o botão do leitor não pode repetir o rótulo da
        # miniatura: as duas coisas diziam "Student Book p.340" uma embaixo da outra, e a
        # segunda parecia um eco. A miniatura AMPLIA; o botão leva ao leitor onde se
        # ESCREVE por cima. O verbo é o que separa os dois.
        anotar = "".join(
            '<a class="acao" href="%s#%s-%d" target="_blank" rel="noopener">%s p.%d</a>'
            % (LEITOR, e[0], e[1], _e(T("anotar")), e[1]) for e in paginas_)
        corpo = ('%s<div class="esq">%s<p class="instrucao-livro">%s</p>'
                 '<div class="acoes">%s</div></div>'
                 '<div class="paginas-obj">%s</div>'
                 % (_crono(minutos), _titulo(titulo, sub), instrucao, anotar,
                    _fila([(e[0], e[1]) + tuple(e[2:3]) for e in paginas_])))
        return ("pratica", "%d min" % minutos, titulo, sub, corpo, nota, "duas")
    else:
        corpo = ('%s<div class="relogio"><div class="visor" data-relogio="%d">%d:00</div>'
                 '<div class="instr">%s<span class="toque">%s</span></div></div>%s'
                 # O aviso estava escrito em PORTUGUÊS dentro da família, e a `pratica` é
                 # a lâmina mais projetada do Y9 — uma turma que tem aula em inglês lia
                 # "toque no tempo para começar" na parede, do lado de um comando em
                 # inglês. Rótulo é rótulo: sai por `T()` como todos os outros e segue o
                 # `idioma()` declarado pelo gerador.
                 % (_titulo(titulo, sub), minutos * 60, minutos, instrucao,
                    _e(T("toque")), acoes))
    return ("pratica", "%d min" % minutos, titulo, sub, corpo, nota)


def link(titulo, sub, rotulo, endereco, codigo="", nota="", extras=(), tempo="",
         relogio=None):
    raise ValueError('Resource not enabled in the local public profile')

def video(titulo, sub, youtube_id, tempo="", nota="", curto=""):
    raise ValueError('Resource not enabled in the local public profile')

def fechamento(titulo, sub, pontos, nota="", tempo=""):
    """O que fica, e o gancho da próxima aula (SL-08)."""
    itens = "".join('<div class="bloco"><span class="n">%d</span>'
                    '<span class="oq">%s</span><span class="qt"></span></div>'
                    % (i, _e(x)) for i, x in enumerate(pontos, 1))
    corpo = ('<div class="esq">%s</div>'
             '<div class="obj"><span class="pr-pilula tinta rot">%s</span>'
             '<div class="trilha%s">%s</div></div>'
             % (_titulo(titulo, sub), _e(T("fechamento")),
                " uma" if len(pontos) == 1 else "", itens))
    return ("fechamento", tempo or "fechar", titulo, sub, corpo, nota, "duas")

# ----------------------------------------------------------------------- build ----

def _campos(lamina):
    """As lâminas devolvem 6 campos, e as de duas colunas devolvem 7.

    O sétimo é o LEIAUTE ("duas"), e ele existe porque a composição passou a ser decisão
    da família em 25/08. Padronizar aqui em vez de obrigar toda família a devolver um
    campo vazio evita que uma família nova esqueça o sétimo e quebre o `build` — o modo de
    falha que o portão de tempo já pegou uma vez, quando uma lâmina voltou sem `marca`.
    """
    campos = list(lamina)
    while len(campos) < 7:
        campos.append("")
    return campos


def _minutos(marca):
    m = re.match(r"\s*(\d+)\s*min", str(marca or ""))
    return int(m.group(1)) if m else None


def conferir_tempo(laminas, duracao, folga=0.05):
    """A aula cabe no tempo que ela tem? Devolve o relatório e levanta se não couber.

    Dele, em 17/08: *"veja o tempo usado para conseguir dar conta de tudo"*. A Green
    Economy do Y10 tinha um roteiro projetado somando 95 min e lâminas somando 99 — os
    20 min de discussão do roteiro eram 24 nas lâminas —, numa aula de 100. Ou seja: ela
    só fechava se nada atrasasse, se ninguém falasse a mais e se o Chromebook ligasse na
    primeira tentativa. Na prática, o que é cortado nessa hora é sempre o fim: o
    fechamento e a conferência da entrega.

    Duas somas, porque elas erram de formas diferentes:

    - a do **roteiro** é a promessa feita à turma na segunda lâmina;
    - a das **lâminas** é o que a aula realmente pede minuto a minuto.

    Divergir entre as duas é o erro mais comum e o mais invisível: o roteiro diz 20, as
    quatro lâminas de discussão pedem 24, e ninguém soma. Aqui as duas são conferidas
    contra a duração real e uma contra a outra.

    A folga mínima é de 5%% (5 min numa aula de 100): é o tempo que a turma leva para
    entrar, sentar e ligar a máquina, e ele não aparece em lâmina nenhuma.

    `folga=0` declara que a aula aloca o período inteiro DE PROPÓSITO. Existe porque o
    `math-y9/AGENTS.md` de 15/09 passou a exigir que a sequência da spec e o roteiro do
    card "fechem exatamente a duração da aula": quando a spec do professor aloca os 50 min,
    o deck que os exibe não pode dizer 47. O parâmetro não desliga a conferência — as duas
    somas continuam sendo comparadas entre si e contra o teto —, ele só move o teto, e
    obriga quem declara a escrever no gerador por quê. Sem ele, a saída seria apagar o
    `duracao=`, que desliga o portão inteiro em silêncio.
    """
    das_laminas = sum(_minutos(m) or 0 for _t, m, *_r in laminas)
    sem_tempo = [t for t, m, tit, *_r in laminas
                 if _minutos(m) is None and t not in ("abertura", "roteiro")]
    do_roteiro = 0
    for lamina in laminas:
        tipo, _m, _tit, _sub, corpo, _n, _leiaute = _campos(lamina)
        if tipo == "roteiro":
            do_roteiro += sum(int(x) for x in re.findall(r">(\d+) min<", corpo))

    teto = int(duracao * (1 - folga))
    relatorio = ("tempo: roteiro %d min · lâminas %d min · aula %d min (teto %d%s)"
                 % (do_roteiro, das_laminas, duracao, teto,
                    ", folga declarada 0" if not folga else ""))
    problemas = []
    if do_roteiro > teto:
        problemas.append("o roteiro projetado promete %d min numa aula de %d — sem folga "
                         "nenhuma para entrar, sentar e ligar a máquina"
                         % (do_roteiro, duracao))
    if das_laminas > teto:
        problemas.append("as lâminas pedem %d min numa aula de %d" % (das_laminas, duracao))
    if do_roteiro and abs(do_roteiro - das_laminas) > 3:
        problemas.append("o roteiro (%d min) e as lâminas (%d min) discordam em %d min — "
                         "uma das duas está mentindo para a turma"
                         % (do_roteiro, das_laminas, abs(do_roteiro - das_laminas)))
    if sem_tempo:
        problemas.append("lâmina(s) sem tempo declarado, que somem da conta: %s"
                         % ", ".join(sem_tempo))
    if problemas:
        raise ValueError("%s\n  - %s" % (relatorio, "\n  - ".join(problemas)))
    return relatorio


def briefing(titulo_da_aula, turma, data, laminas, relatorio=""):
    """A aula inteira em uma página de texto, para ele ler ANTES — sem abrir o deck.

    Dele, em 17/08: *"não quero mais ter que toda vez antes da aula ficar perguntando do
    que se trata"*. Ele tinha razão e o problema era de embalagem, não de conteúdo: o que
    ele precisava saber já existia, mas espalhado — o roteiro no card do painel, o que
    preparar na nota da primeira lâmina, a resposta esperada de cada pergunta na nota da
    lâmina dela, e tudo isso só visível abrindo o deck e apertando `N`, lâmina por lâmina.

    Esta função não escreve nada novo: ela **deriva**. Uma cópia à mão divergiria do deck
    na primeira correção, e aí existiriam duas versões da aula. Como sai das lâminas, ler o
    briefing e projetar o deck é ler a mesma coisa duas vezes.

    O que entra: a ordem da aula com os minutos, o que cada lâmina põe na parede e, em
    destaque, a nota de condução — que é onde moram os exemplos esperados, o erro típico e
    o plano B.
    """
    L = ["# %s — %s, %s" % (titulo_da_aula, turma, data), ""]
    if relatorio:
        L += ["> %s" % relatorio, ""]
    L += ["> **Arquivo gerado** a partir das lâminas. Não editar à mão: corrigir o deck.",
          "> Ler antes da aula. O deck do aluno não contém estas notas por padrão.",
          ""]
    for i, lamina in enumerate(laminas, 1):
        tipo, marca, titulo, sub, _corpo, nota, _leiaute = _campos(lamina)
        L.append("## %d. %s  ·  %s" % (i, titulo, marca))
        if sub:
            L.append("")
            L.append(re.sub(r"<[^>]+>", "", sub))
        # O roteiro é a única lâmina cujo CORPO é informação de planejamento: os blocos
        # com seus minutos. Sem isto o briefing começaria pela terceira lâmina.
        if tipo == "roteiro":
            L.append("")
            for nome, minutos in re.findall(
                    r'<span class="oq">(.*?)</span><span class="qt">(\d+) min</span>',
                    _corpo):
                L.append("- **%s min** — %s" % (minutos, html.unescape(nome)))
        if nota:
            L.append("")
            for linha in str(nota).split("\n"):
                L.append("> " + linha.strip())
        L.append("")
    return "\n".join(L)


def build(pasta, nome_do_arquivo, titulo_da_aula, turma, data, laminas, tema="y9",
          duracao=None, matematica=False, folga=0.05, *, briefing_dir=None, instructor_notes=False):
    """`matematica` liga o `ma_math.js`, e escolhe por qual das duas portas dele.

    - `True` — modo DELIMITADOR: o MathJax varre a página inteira por `$…$`.
    - `"nos"` — modo NÓ: compõe só o que estiver marcado com `<span data-math>`.

    É OPT-IN, e tem de continuar sendo: os decks do Y9 escrevem preço em dólar no corpo
    das lâminas — "$4.00 base fare plus $2.75" está em quatro deles —, e ligar o modo
    delimitador para todos faria o MathJax comer o trecho entre dois cifrões, que é
    exatamente o defeito contra o qual o `handout_lib` já tem uma asserção.

    O modo NÓ existe para essa mesma razão, um passo adiante: numa lâmina o cifrão é
    dinheiro com muito mais frequência do que é delimitador. Marcar o nó diz exatamente
    o que é matemática e devolve o `$` ao texto — e é o modo que a semana 14–18/09 usa.
    Quem escolhe é o gerador da aula, e `True` continua valendo para quem já dependia
    dele.
    """
    if not laminas:
        raise ValueError('Empty deck')
    if instructor_notes and briefing_dir is None:
        raise ValueError('Instructor notes require explicit private briefing directory')
    if matematica:
        from .handout_lib import _require_math_runtime
        _require_math_runtime()
    forte, campo, acento = TEMAS.get(tema, TEMAS["y9"])
    total = len(laminas)
    if duracao:
        build.ultimo_tempo = conferir_tempo(laminas, duracao, folga=folga)
    partes = []
    for i, lamina in enumerate(laminas, 1):
        tipo, marca, titulo, sub, corpo, nota, leiaute = _campos(lamina)
        # O título NÃO é mais desenhado aqui: quem compõe é a família (ver o bloco de
        # lâminas). O `build` monta a moldura — papel, retícula, olho, meta, rodapé — e a
        # família decide o que domina a tela.
        partes.append(
            '<section class="slide%s" id="l%d"><div class="lam">'
            '<div class="pr-reticula"></div>'
            '<header class="cab"><span class="olho">%s</span>'
            '<span class="meta">%s · %s</span></header>'
            '<main class="palco%s">%s</main>'
            '<footer class="rodape"><span>%s · %s · %02d/%02d</span>'
            '<span class="nota">%s</span></footer></div></section>'
            # O `tipo` da lâmina ("abertura", "problema", "fechar") NÃO sobe para o
            # cabeçalho: é vocabulário meu, em português, e a lâmina do Y9 é projetada
            # para uma turma que tem aula em inglês. Ele continua no rodapé, pequeno,
            # onde já estava, junto com o tempo do bloco.
            % (" active" if i == 1 else "", i,
               _e(turma), _e(titulo_da_aula), _e(data),
               (" " + leiaute) if leiaute else "", corpo,
               _e(tipo), _e(marca), i, total, _e(nota if instructor_notes else "")))

    mathjax = ('<script src="%s"></script>'
               % os.path.relpath(os.path.join(DIR_PADRAO, "ma_math.js"),
                                 os.path.abspath(pasta)).replace(os.sep, "/")
               ) if matematica else ""
    # Os rótulos do contador de níveis descem para o `<body>`: o JS lê de lá, para não
    # reintroduzir inglês literal numa lâmina em português.
    niveis_attrs = (' data-niv-um="%s" data-niv-varios="%s" data-niv-fim="%s"'
                    % (_e(T("niveis_um")), _e(T("niveis_varios")), _e(T("niveis_fim"))))
    # Tudo como `%s` no template: `+` no meio de um literal formatado é armadilha, porque
    # `%` liga mais forte que `+` e a formatação passaria a valer só no último pedaço.
    # Só o modo delimitador estampa o atributo; o modo nó carrega o mesmo helper e
    # deixa o `$` da lâmina ser dinheiro.
    abre_html = ('<!doctype html><html lang="%s"%s>'
                 % (ROTULOS[_IDIOMA[0]]["html_lang"],
                    ' data-math-delim="$"' if matematica is True else ""))
    doc = ("%s<head><meta charset=\"utf-8\">"
           "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
           "<title>%s</title>%s"
           "<style>%s%s%s:root{--forte:%s;--campo:%s;--acento:%s}</style>"
           "</head><body data-slides-hash=\"1\"%s>%s"
           '<div class="nav"><button data-ant type="button">&#8592;</button>'
           '<span data-conta>1 / %d</span>'
           '<button data-prox type="button">&#8594;</button></div>%s</body></html>'
           # `pr.css` vem ANTES do CSS da lâmina: ele declara `--ink`, `--wall`,
           # `--ground`, `--gold`, `--coral`, `--grid`, `--muted` e as classes `pr-*`, e o
           # resto do deck é escrito em cima disso. Vocabulário primeiro, composição
           # depois — a mesma ordem das SL-*.
           % (abre_html, _e(titulo_da_aula), mathjax,
              _fontes(), pr.css(unidade="var"),
              CSS.replace("@@PAPEL@@", PAPEL)
                 .replace("@@PAPEL35@@", idt.rgba(PAPEL, .35))
                 # O `--acento` de todas as frentes é este dourado; o fundo da `.preencher`
                 # o repetia à mão em `rgba()`, forma que o portão de identidade só passou
                 # a enxergar em 25/08. CSS não sabe pôr alfa numa `var()` sem
                 # `color-mix`, então o valor entra montado daqui.
                 .replace("@@OURO10@@", idt.rgba(idt.PALETA["ouro"], .10))
                 # A sombra sólida translúcida do vocabulário é a TINTA da identidade
                 # (#172f43) com alfa. Eu tinha copiado `rgba(23,47,67,.14)` literal dos
                 # goldens, e o portão de identidade pegou: é a mesma cor decidida duas
                 # vezes, que é exatamente como as cinco línguas visuais nasceram.
                 .replace("@@SOMBRA14@@", idt.rgba(idt.NEUTROS["tinta"], .14))
                 .replace("@@SOMBRA12@@", idt.rgba(idt.NEUTROS["tinta"], .12))
                 .replace("@@ALERTA@@", ALERTA),
              forte, campo, acento,
              niveis_attrs, "".join(partes), total, SCRIPT))

    # O acervo de páginas dos livros entra aqui, e só aqui: `paginas()` e `recorte()`
    # escrevem `@@LIVROS@@` porque não sabem onde o deck vai cair, e o `build` sabe. Assim
    # um deck que mude de pasta continua encontrando a página — o caminho é recalculado no
    # build, em vez de estar escrito à mão em cada gerador de semana.
    os.makedirs(pasta, exist_ok=True)
    destino = os.path.join(pasta, nome_do_arquivo)
    with open(destino, "w", encoding="utf-8") as f:
        f.write(doc)

    # O briefing sai junto, sempre. Deck sem briefing é deck que só se entende abrindo.
    if briefing_dir is not None:
        os.makedirs(briefing_dir, exist_ok=True)
        brief = os.path.join(briefing_dir, os.path.splitext(nome_do_arquivo)[0] + ".brief.md")
        with open(brief, "w", encoding="utf-8") as f:
            f.write(briefing(titulo_da_aula, turma, data, laminas,
                             getattr(build, "ultimo_tempo", "") if duracao else ""))
    return destino
