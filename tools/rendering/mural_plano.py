"""Generic print plan extracted from Module's mural_plano.
No class roster, historical calendar or actual wall location stored here.
The wall is the teacher's decision: quantities are information, not a quota.
"""
from datetime import date, datetime
from pathlib import PurePosixPath

def _unidade(slug, turma, unidade, semana, ate, onde="a definir pelo docente", com_linha=True):
    pecas=[("mural_a3.pdf","A3 retrato",1,onde,"fim da unidade")]
    if com_linha:
        pecas.append(("mural_a3_paisagem.pdf","A3 paisagem",1,onde,"atualizar a cada unidade"))
    return dict(slug=slug,turma=turma,topico=unidade+" — painel da unidade",
                semana=semana,ativo=True,ate=ate,pecas=pecas)

def _dates(c):
    ini=date.fromisoformat(c["semana"])
    fim=datetime.strptime(c["ate"],"%d/%m/%Y").date()
    if fim<ini:raise ValueError("inverted validity")
    return ini,fim

def validate(conjuntos):
    seen=set()
    for c in conjuntos:
        _dates(c)
        if c["slug"] in seen:raise ValueError("duplicate set")
        seen.add(c["slug"])
        if not c["slug"] or any(x in c["slug"] for x in ("/","\\","..","|","\n","\r")):raise ValueError("invalid slug")
        if type(c["ativo"]) is not bool:raise ValueError("invalid status")
        for key in ("turma","topico"):
            if not isinstance(c[key],str) or any(x in c[key] for x in ("|","\n","\r")):raise ValueError("invalid text")
        for arquivo,formato,qtd,onde,quando in c["pecas"]:
            if PurePosixPath(arquivo).name!=arquivo or not arquivo.endswith(".pdf") or "\\" in arquivo:raise ValueError("invalid filename")
            if type(qtd) is not int or qtd<1:raise ValueError("invalid copies")
            for value in (arquivo,formato,onde,quando):
                if not isinstance(value,str) or any(x in value for x in ("|","\n","\r")):raise ValueError("invalid cell")
    return conjuntos

def ativos_por_turma(conjuntos, hoje=None):
    hoje=hoje or date.today()
    counts={}
    for c in validate(conjuntos):
        ini,fim=_dates(c)
        if not c["ativo"] or not ini<=hoje<=fim:continue
        # Same historical rule: distinct A3/A4 wall pieces, not copies or word-wall cards.
        n=sum(1 for p in c["pecas"] if p[1].startswith("A3") or p[1].strip()=="A4")
        counts[c["turma"]]=counts.get(c["turma"],0)+n
    return counts

def markdown(conjuntos, hoje=None):
    L=["# Plano de impressão do mural","","Gerado a partir do registro; não é uma auditoria de ocupação.",""]
    for c in validate(conjuntos):
        state=("semana de "+c["semana"]+" · até "+c["ate"]) if c["ativo"] else "arquivado"
        L += ["## "+c["turma"]+" — "+c["topico"],"",c["slug"]+" · "+state,"",
              "| Peça | Formato | Qtd | Onde colar | Quando sai |","|---|---|---:|---|---|"]
        for a,f,q,o,k in c["pecas"]:L.append(f"| `{a}` | {f} | {q} | {o} | {k} |")
        L.append("")
    L+=["## Carga por turma","","Informação, não limite. Inclui apenas A3/A4; peças grandes constam no inventário acima.",""]
    for t,n in sorted(ativos_por_turma(conjuntos,hoje).items()):L.append(f"- {t}: {n} folhas")
    return "\n".join(L)+"\n"
