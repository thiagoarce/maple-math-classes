"""Synthetic Entrepreneurship deck, using the recovered library."""
from pathlib import Path
from tools.rendering import slides_y9_lib as s

OUT=Path(__file__).resolve().parents[1]/"test-artifacts"/"slides"
def main():
    s.idioma("en")
    notes="SYNTHETIC-TEACHER-NOTE: ask for evidence before choosing."
    slides=[
        s.abertura("Customer discovery","Entrepreneurship · demonstration",["Compare two customer problems.","Choose evidence to test a hypothesis."],nota=notes),
        s.problema("Which problem?","Predict before discussing.","A fictional team wants to improve the school lunch queue. Is a new app the first thing to build?",rotulo="THINK",nota=notes),
        s.cartoes("Compare evidence","Which statement supports the problem?",[
            ("CASE A","<p>Eight fictional interviews mention long waits.</p>","Evidence about a customer problem."),
            ("CASE B","<p>The team likes blue logos.</p>","Preference, not evidence about waiting.")],nota=notes),
        s.pratica("Test your hypothesis","Pair workshop","Write one interview question and explain what answer would change your decision.",1,nota=notes),
        s.fechamento("Exit reflection","What changed?",["State a customer problem.","Name the evidence you still need."],nota=notes),
    ]
    s.build(str(OUT),"entrepreneurship-demo.html","Customer discovery","Entrepreneurship","Demo",slides,tema="entrep",briefing_dir=str(OUT/"synthetic-teacher"))
    # Verify the existing teacher-only notes mode separately, with synthetic data.
    s.build(str(OUT/"synthetic-teacher"),"instructor-demo.html","Customer discovery","Entrepreneurship","Demo",slides,tema="entrep",briefing_dir=str(OUT/"synthetic-teacher"),instructor_notes=True)
if __name__=="__main__":
    main()
