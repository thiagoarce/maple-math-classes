"""Single-page custom-size gate for recovered large and consultation engines."""
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright
OUT=Path("test-artifacts/murals")
with sync_playwright() as p:
    browser=p.chromium.launch()
    for name in ("big-map","consultation"):
        ctx=browser.new_context(viewport={"width":2800,"height":3300})
        foreign=[]
        def route(r):
            if r.request.url.startswith(("http://127.0.0.1:8000/","data:","blob:")):r.continue_()
            else:foreign.append(r.request.url);r.abort()
        ctx.route("**/*",route)
        page=ctx.new_page()
        page.goto("http://127.0.0.1:8000/test-artifacts/murals/"+name+".html")
        page.evaluate("document.fonts.ready")
        if name=="consultation":
            page.wait_for_function("document.documentElement.dataset.mathReady==='ok'",timeout=30000)
            assert page.locator("mjx-container svg").count()>=1
            assert page.locator("mjx-merror,[data-mjx-error]").count()==0
        root=".cartaz" if name=="big-map" else ".folha"
        assert page.locator(root).count()==1
        problems=page.evaluate("""root=>{const f=document.querySelector(root),b=f.getBoundingClientRect();return [...f.querySelectorAll(root==='.cartaz'?'.no,.rodape,.tira':'.p')].filter(n=>{const a=n.getBoundingClientRect();return a.left<b.left-2||a.right>b.right+2||a.top<b.top-2||a.bottom>b.bottom+2||n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2}).map(n=>n.className)}""",root)
        assert not problems,problems
        assert not foreign,foreign
        pdf=OUT/(name+".pdf")
        page.pdf(path=str(pdf),prefer_css_page_size=True,print_background=True)
        with fitz.open(pdf) as d:
            assert len(d)==1
            pg=d[0]
            assert abs(pg.rect.width-700*72/25.4)<2 and abs(pg.rect.height-830*72/25.4)<2,pg.rect
            assert "volume" in pg.get_text().lower()
            pg.get_pixmap(matrix=fitz.Matrix(.5,.5)).save(OUT/(name+".png"))
        ctx.close()
        print("PASS: custom mural",name,flush=True)
    browser.close()
