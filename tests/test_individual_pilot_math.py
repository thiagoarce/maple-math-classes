"""Independent numerical check against the manual key; synthetic input."""
import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/"subjects/hs-mathematics/units/hs-matrices/pilot/fixture.json"
d=json.loads(p.read_text(encoding="utf-8"))
assert d["synthetic"] is True
m,k=d["matrices"],d["key"]
def shape(a):
    assert a and a[0] and all(len(row)==len(a[0]) for row in a)
    return len(a),len(a[0])
def product(a,b):
    n,c=shape(a)
    r,z=shape(b)
    if c!=r:raise ValueError("Incompatible dimensions")
    return [[sum(a[i][q]*b[q][j] for q in range(c)) for j in range(z)] for i in range(n)]
for name in ("AB","CD","PV","EF"):
    assert product(m[name[0]],m[name[1]])==k[name],name
assert [*shape(product(m["B"],m["A"]))]==k["BA_shape"]
assert [*shape(product(m["A"],m["B"]))]==k["AB_shape"]
assert [[x*y for x,y in zip(a,b)] for a,b in zip(m["C"],m["D"])]==k["elementwise_CD"]
assert k["CD"]!=k["elementwise_CD"]
assert shape(m["A"])!=shape(m["B"])
assert shape(m["E"])!=shape(m["F"])
try:product(m["A"],m["A"])
except ValueError:pass
else:raise AssertionError("Same order is not sufficient")
print("PASS: six synthetic matrix tasks, manual key and numerical invariants")
