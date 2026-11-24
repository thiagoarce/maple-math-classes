from playwright.sync_api import sync_playwright, expect
from pathlib import Path
def main():
    with sync_playwright() as p:
        browser=p.chromium.launch()
        for width,height in [(1440,900),(390,844)]:
            ctx=browser.new_context(viewport={"width":width,"height":height})
            foreign,errors=[],[]
            def route(r):
                if r.request.url.startswith("http://127.0.0.1:8000/"):r.continue_()
                else:foreign.append(r.request.url);r.abort()
            ctx.route("**/*",route)
            page=ctx.new_page()
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto("http://127.0.0.1:8000/apps/planning/")
            expect(page.locator(".lesson")).to_have_count(3)
            page.locator("#subject").select_option("hs-mathematics")
            expect(page.locator(".lesson")).to_have_count(1)
            page.locator("#level").select_option("Y12")
            expect(page.locator(".lesson")).to_have_count(0)
            page.locator("#level").select_option("Y11")
            page.get_by_role("button",name="Ver planejamento").click()
            expect(page.locator("dialog")).to_be_visible()
            expect(page.locator(".plano-bloco")).to_have_count(4)
            page.get_by_role("button",name="Preparar texto para Toddle").click()
            expect(page.get_by_label("Texto de planejamento")).to_be_visible()
            assert "Objetivo" in page.get_by_label("Texto de planejamento").input_value()
            assert "Entendo que aprendi" in page.get_by_label("Texto de planejamento").input_value()
            assert page.locator("dialog a").count()==2
            assert page.evaluate("localStorage.length===0 && sessionStorage.length===0")
            assert not errors and not foreign,(errors,foreign)
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
            Path("test-artifacts").mkdir(exist_ok=True)
            page.screenshot(path=f"test-artifacts/planning-{width}.png")
            ctx.close()
        browser.close()
    print("PASS: planning filters, detail, text export and mobile layout")
if __name__=="__main__":main()
