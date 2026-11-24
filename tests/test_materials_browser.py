"""A4 print gate for synthetic specimens; no network outside local server."""
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright

OUT=Path("test-artifacts/materials")
def main():
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for name in ("handout","list"):
            ctx=browser.new_context(viewport={"width":1200,"height":1400})
            page=ctx.new_page()
            errors,foreign=[],[]
            page.on("pageerror",lambda e:errors.append(str(e)))
            def route(r):
                if r.request.url.startswith(("http://127.0.0.1:8000/","data:","blob:")):
                    r.continue_()
                else:
                    foreign.append(r.request.url);r.abort()
            ctx.route("**/*",route)
            page.goto("http://127.0.0.1:8000/test-artifacts/materials/"+name+".html")
            page.wait_for_function("document.documentElement.dataset.mathReady === 'ok'",timeout=30000)
            page.wait_for_function("document.documentElement.hasAttribute('data-paginado')",timeout=30000)
            attrs=page.evaluate("""() => ({p:document.documentElement.dataset.paginado, giant:document.documentElement.dataset.gigantes, overflow:document.documentElement.dataset.estouro, pages:document.querySelectorAll('.a4').length, math:document.querySelectorAll('mjx-container svg').length, error:document.querySelectorAll('mjx-merror,[data-mjx-error]').length})""")
            assert attrs["p"] not in ("erro","apertado"),attrs
            assert not attrs["giant"] and not attrs["overflow"],attrs
            assert attrs["math"]>=2 and not attrs["error"],attrs
            assert not errors and not foreign,(errors,foreign)
            if name=="list":
                assert page.locator(".a4 .bex").count()==12
            pdf=OUT/(name+".pdf")
            page.pdf(path=str(pdf),prefer_css_page_size=True,print_background=True)
            with fitz.open(pdf) as d:
                assert len(d)==attrs["pages"],(name,len(d),attrs)
                all_text=" ".join(pg.get_text() for pg in d)
                for pg in d:
                    assert abs(pg.rect.width-595.28)<2 and abs(pg.rect.height-841.89)<2,pg.rect
                    assert len(pg.get_text().strip())>30
                    pg.get_pixmap(matrix=fitz.Matrix(1.4,1.4)).save(OUT/f"{name}-{pg.number+1}.png")
                if name=="list":
                    for i in range(1,13):
                        assert all_text.count(f"ITEM-{i:02}")==1,(i,all_text)
            print("PASS:",name,attrs,flush=True)
            ctx.close()
        browser.close()
if __name__=="__main__":
    main()
