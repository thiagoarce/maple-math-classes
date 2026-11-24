"""Fixed synthetic pilot; never load a real request or name here."""
import json
import os
from pathlib import Path
from tools.rendering import handout_lib as hl

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"test-artifacts"/"individual-pilot"
DATA=ROOT/"subjects/hs-mathematics/units/hs-matrices/pilot/fixture.json"

def main():
    data=json.loads(DATA.read_text(encoding="utf-8"))
    assert data["synthetic"] is True
    m=data["matrices"]
    def mat(name):
        return hl.matriz(m[name],delim="colchete")
    def pair(a,b):
        return '<div style="text-align:center;margin:2mm 0">'+a+' = '+mat(a)+' &nbsp;&nbsp; '+b+' = '+mat(b)+'</div>'
    def title(t):
        return '<div class="sec">'+t+'</div>'
    def q(n,text,height):
        return hl.exemplo(n,text,height)
    os.environ["SEM_PDF"]="1"
    OUT.mkdir(parents=True,exist_ok=True)
    meta={"titulo":"Produto de matrizes","subtitulo":"Recuperação: linha, coluna e significado","year":"HS","turma":"Piloto fictício","theme":"mat2"}
    p1=title("Antes de calcular")
    p1+=q(1,pair("A","B")+"Indique as ordens de $A$ e $B$. Os produtos $AB$ e $BA$ existem? Qual é a ordem de cada resultado? E a multiplicação elemento a elemento de $A$ e $B$?","23mm")
    p1+=title("Linha encontra coluna")
    p1+=q(2,"Use o esquema abaixo para obter $AB$. Escreva a conta que produz a célula destacada e complete a matriz."+hl.macete_produto(m["A"],m["B"]),"24mm")
    p1+=title("Compare duas operações")
    p1+=q(3,pair("C","D")+"Calcule $CD$ e, separadamente, multiplique os elementos de mesma posição. Compare os dois resultados.","30mm")
    p2=title("Transferência")
    p2+=q(4,pair("P","V")+"Cada linha de $P$ indica as quantidades de dois produtos em um kit; $V$ contém os custos unitários em reais. Calcule $PV$ e explique o significado de cada entrada.","40mm")
    p2+=q(5,"Um colega afirma: duas matrizes da mesma ordem sempre podem ser multiplicadas. Use duas matrizes de ordem $2\times3$ para decidir se a afirmação é verdadeira. Justifique.","30mm")
    p2+=title("Saída sem apoio")
    p2+=q(6,pair("E","F")+"Calcule $EF$, indique sua ordem e explique por que multiplicar posições correspondentes não é uma alternativa válida.","40mm")
    hl.build(meta,[hl.page_first(meta,p1,(1,2)),hl.page_inner(meta,p2,(2,2))],str(OUT),"student")
    # Key content deliberately separate from pupil pages. Fixed manual answers are checked independently.
    keymeta={**meta,"titulo":"GABARITO DOCENTE","subtitulo":"Produto de matrizes — resolução comentada","rotulo_nome":"Revisão"}
    def result(name):
        return hl.matriz(data["key"][name],delim="colchete")
    def answer(n,txt):
        return '<div class="bex"><p><span class="tag">%02d</span> %s</p></div>'%(n,txt)
    k=title("Resolução comentada")
    k+=answer(1,"$A$: $2\times3$; $B$: $3\times2$. $AB$: $2\times2$; $BA$: $3\times3$. Produto elemento a elemento não definido entre ordens distintas.")
    k+=answer(2,"$AB=$ "+result("AB")+". Primeira linha: $1\cdot2+2\cdot0+0\cdot3=2$ e $1\cdot1+2\cdot4+0\cdot(-2)=9$. Segunda: $-1\cdot2+3\cdot0+2\cdot3=4$ e $-1\cdot1+3\cdot4+2\cdot(-2)=7$.")
    k+=answer(3,"$CD=$ "+result("CD")+". Elemento a elemento: "+result("elementwise_CD")+". O primeiro elemento de $CD$ é $1\cdot2+2\cdot3=8$, não $1\cdot2=2$.")
    k+=answer(4,"$PV=$ "+result("PV")+". Kit 1: $2\cdot5+3\cdot2=16$ reais. Kit 2: $4\cdot5+1\cdot2=22$ reais. Cada linha é o custo total de um kit.")
    k+=answer(5,"Falsa: em $(2\times3)(2\times3)$, as dimensões internas 3 e 2 não coincidem.")
    k+=answer(6,"$EF=$ "+result("EF")+", ordem $1\times1$. $2\cdot4+(-1)\cdot2+3\cdot(-1)=3$. As ordens de $E$ e $F$ diferem.")
    k+=title("O que observar")
    k+='<p>O estudante explica a compatibilidade das dimensões, combina linha e coluna, distingue as duas operações e interpreta o custo. Retome apenas o passo em que houver dificuldade. A resposta numérica isolada não certifica domínio.</p>'
    hl.build(keymeta,[hl.page_first(keymeta,k,(1,1))],str(OUT),"teacher-key")
if __name__=="__main__":main()
