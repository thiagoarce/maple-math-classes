"""Synthetic A3 print gate, with DOM bounds and PDF verification."""
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright
OUT=Path("test-artifacts/murals")
def main():
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for name,expected in [("cavalieri","Cavalieri"),("objectives","Customers"),("slope-classic","Inclinação"),("slope-hybrid","Inclinação")]:
            ctx=browser.new_context(viewport={"width":1300,"height":1700})
            foreign,errors=[],[]
            def route(r):
                if r.request.url.startswith(("http://127.0.0.1:8000/","data:","blob:")):r.continue_()
                else:foreign.append(r.request.url);r.abort()
            ctx.route("**/*",route)
            page=ctx.new_page()
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto("http://127.0.0.1:8000/test-artifacts/murals/"+name+".html")
            page.evaluate("document.fonts.ready")
            assert page.locator(".folha").count()==1
            problems=page.evaluate("""() => {
              const f=document.querySelector('.folha'),b=f.getBoundingClientRect();
              const foot=f.querySelector('.rodape').getBoundingClientRect();
              const nodes=[...f.querySelectorAll('.titulo,.guia,.campo,.figura,.juntos')];
              return nodes.filter(n=>{const a=n.getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1||a.top<b.top-1||a.bottom>b.bottom+1||(n.closest('.miolo')&&a.bottom>foot.top+1)||n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2}).map(n=>n.className);
            }""")
            assert not problems,problems
            assert not foreign and not errors,(foreign,errors)
            if name=="cavalieri":
                assert page.locator(".figura svg").count()==1
                assert page.locator(".juntos .escrever").count()==1
            if name.startswith("slope-"):
                assert page.locator(".figura svg").count()==1
                assert "2 ÷ 4" in page.locator("body").inner_text()
                assert page.locator(".mural-key").count()==(1 if name=="slope-hybrid" else 0)
                if name=="slope-hybrid":
                    assert page.locator(".mural-macete,.mural-attention").count()==2
                    assert page.locator(".mural-key svg").count()==1
                    assert page.locator(".mural-attention").evaluate("el=>getComputedStyle(el).backgroundColor")=="rgb(255, 225, 89)"
            path=OUT/(name+".pdf")
            page.pdf(path=str(path),prefer_css_page_size=True,print_background=True)
            with fitz.open(path) as d:
                assert len(d)==1
                pg=d[0]
                assert abs(pg.rect.width-841.89)<2 and abs(pg.rect.height-1190.55)<2,pg.rect
                assert expected.lower() in pg.get_text().lower(),pg.get_text()
                pg.get_pixmap(matrix=fitz.Matrix(1,1)).save(OUT/(name+".png"))
            print("PASS: A3 mural",name,flush=True)
            ctx.close()
        browser.close()
if __name__=="__main__":main()
