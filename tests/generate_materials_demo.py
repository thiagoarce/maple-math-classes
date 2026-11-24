"""Authorial synthetic specimen, never real student material."""
import os
from pathlib import Path
from tools.rendering import handout_lib as hl, lista_fluxo as lf, lista_layout as ll

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"test-artifacts"/"materials"
def main():
    OUT.mkdir(parents=True,exist_ok=True)
    os.environ["SEM_PDF"]="1" # PDF generated only after readiness in browser gate
    meta={"titulo":"Proporcionalidade","subtitulo":"Quadro de construção","year":"HS","turma":"Demonstração","theme":"mat2"}
    content='<div class="sec">Razão constante</div>'+hl.campo(r'$\frac{y}{x}=$',"50mm")
    content+=hl.exemplo(1,r"Se $y=3x$, determine $y$ para $x=8$.","28mm")
    content+='<div class="sec">Produto constante</div>'+hl.campo(r'$x\cdot y=$',"50mm")
    content+=hl.exemplo(2,r"Se $xy=48$, determine $y$ para $x=6$.","28mm")
    hl.build(meta,[hl.page_first(meta,content,(1,1))],str(OUT),"handout")
    meta={**meta,"titulo":"Lista de prática","subtitulo":"Proporção e transferência","math_inteira":True}
    # Stable identity in the statement survives the original optimizer's renumbering.
    blocks=[]
    for i in range(1,13):
        blocks.append(f'<div class="bex" data-exercise="{i}"><p><span class="tag">{i:02}</span> ITEM-{i:02}: Se $y={i+2}x$, determine $y$ para $x={i+3}$.</p><div class="wb" style="height:22mm"></div></div>')
    seed=hl.build(meta,[hl.page_first(meta,"".join(blocks),(1,1))],str(OUT),"list-seed")
    css,mathjax,m,questions,extra=lf.extrair(Path(seed).read_text(encoding="utf-8"))
    assert len(questions)==12
    rel=os.path.relpath(ROOT/"tools/rendering/paginador.js",OUT).replace(os.sep,"/")
    (OUT/"list.html").write_text(ll.montar(css,mathjax,m,questions,extra,rel),encoding="utf-8")
    (OUT/"answers.txt").write_text("Handout: 24; 8\n"+"\n".join(f"ITEM-{i:02}: {(i+2)*(i+3)}" for i in range(1,13)),encoding="utf-8")
if __name__=="__main__":
    main()
