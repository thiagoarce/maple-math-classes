"""Synthetic A3 specimens using the recovered mural library."""
import os
from pathlib import Path
from tools.rendering import mural_lib as m, svg_mural as svg, mural_grande as g, mural_consulta as c, mural_plano as plan

OUT=Path(__file__).resolve().parents[1]/"test-artifacts"/"murals"

def main():
    os.environ["SEM_PDF"]="1"
    meta={"turma":"DEMONSTRAÇÃO","unidade":"Geometria espacial","chapeu":"CONSTRUÇÃO · VOLUME","idioma":"pt"}
    anchor=m.anchor_chart(meta,"Cavalieri","Mesma altura. Mesma área em cada nível.",
        [("RELAÇÃO","Áreas de seções correspondentes iguais implicam volumes iguais.")],
        coconstruir=["Registre com a turma a relação entre área da base, altura e volume."],
        altura_juntos=30,fig=m.figura(svg.cavalieri_prismas(),altura_mm=85,parede=False))
    m.build([anchor],str(OUT),"cavalieri",tema="mat2",pagesize="A3")
    ent={"turma":"DEMO","unidade":"Customer discovery","chapeu":"ENTREPRENEURSHIP","titulo":"Customers","idioma":"en","lang":"en"}
    board=m.painel_unidade(ent,["Identify a customer problem.","Distinguish evidence from assumptions.","Design a testable interview question."],
        ["What evidence could change our decision?"],["Customer","Evidence","Hypothesis"])
    m.build([board],str(OUT),"objectives",tema="entrep",pagesize="A3")
    bigmeta={"turma":"DEMO","chapeu":"MATEMÁTICA HS","unidade":"Geometria espacial","titulo":"Volume"}
    body=g.mapa(("GEOMETRIA","Volume","Área e altura"),[
        ("objeto","Prismas","V = área da base × altura"),
        ("fazer","Cavalieri","Compare áreas de seções correspondentes.")],700,830,tema="mat2")
    g.build(g.cartaz_livre(bigmeta,body,700,830,tema="mat2"),str(OUT),"big-map",700,830)
    body=c.chapeu("MATEMÁTICA HS · GEOMETRIA",x=30,y=24,corpo=14,tema="mat2")
    body+=c.chamada("VOLUME",x=50,y=70,w=600,h=95,corpo=70)
    body+=c.figura(svg.cavalieri_prismas(),x=60,y=220,w=580,h=248)
    body+=c.cartao("PRISMAS",r"$V=A_b\cdot h$",x=90,y=520,w=520,h=150,tema="mat2",corpo=38)
    c.build(c.montar("Volume",body,700,830,tema="mat2",math_src="../../tools/rendering/ma_math.js"),str(OUT),"consultation",700,830)
    item=plan._unidade("demo-volume","Demo","Volume","2027-01-04","10/02/2027")
    (OUT/"print-plan.md").write_text(plan.markdown([item]),encoding="utf-8")
    # New reference specimen: GS-01 grammar, not a reskin of the legacy A3 motor.
    fig=(OUT/"slope-geo.svg").read_text(encoding="utf-8")
    body=c.chapeu("MATEMÁTICA HS · GEOMETRIA ANALÍTICA",x=40,y=24,corpo=12,tema="mat2")
    body+=c.chamada("INCLINAÇÃO",x=55,y=65,w=510,h=90,corpo=60)
    body+=c.linha("VARIAÇÃO VERTICAL ÷ VARIAÇÃO HORIZONTAL",x=60,y=180,corpo=15)
    body+=c.figura(fig,x=42,y=220,w=410,h=320)
    body+=c.cartao("A RELAÇÃO",r"$m=\frac{\Delta y}{\Delta x}$",x=492,y=220,w=340,h=160,tema="mat2",corpo=38)
    body+=c.mao("Neste exemplo: 2 ÷ 4 = 1/2",x=500,y=400,w=320,corpo=14,cor=c.AZUL)
    body+=c.barra(r"$\Delta x\ne0$",["MESMA ORDEM DOS PONTOS","RETA VERTICAL: INCLINAÇÃO INDEFINIDA"],x=485,y=465,w=365,h=100,corpo=26,caps=11)
    c.build(c.montar("Inclinação",body,891,630,tema="mat2",math_src="../../tools/rendering/ma_math.js"),str(OUT),"slope-gs01",891,630)
if __name__=="__main__":main()
