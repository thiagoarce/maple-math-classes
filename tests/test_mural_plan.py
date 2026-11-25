from datetime import date
from tools.rendering import mural_plano as p, mural_grande as g
a=p._unidade("demo","Demo","Matrizes","2027-01-04","10/02/2027")
a["pecas"][0]=("mural_a3.pdf","A3 retrato",3,"docente decide","fim")
a["pecas"].append(("vocab.pdf","A5",4,"docente decide","fim"))
assert p.ativos_por_turma([a],date(2027,1,4))=={"Demo":2}
assert p.ativos_por_turma([a],date(2027,1,3))=={}
assert p.ativos_por_turma([a],date(2027,2,11))=={}
assert "| 3 |" in p.markdown([a],date(2027,1,4))
try:p.validate([a,a])
except ValueError:pass
else:raise AssertionError("duplicate")
assert "3" in g.grade_de(891,630)
print("PASS: print plan dates, copies, counts and large-format equivalence")
