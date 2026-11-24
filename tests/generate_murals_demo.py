"""Synthetic A3 specimens using the recovered mural library."""
import os
from pathlib import Path
from tools.rendering import mural_lib as m, svg_mural as svg

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
if __name__=="__main__":main()
