import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width,height in [(1440,900),(390,844)]:
            ctx=browser.new_context(viewport={"width":width,"height":height},reduced_motion="reduce")
            foreign,errors=[],[]
            def route(r):
                if r.request.url.startswith("http://127.0.0.1:8000/") or r.request.url.startswith("data:"):
                    r.continue_()
                else:
                    foreign.append(r.request.url);r.abort()
            ctx.route("**/*",route)
            page=ctx.new_page()
            page.on("pageerror",lambda e:errors.append(str(e)))
            page.goto("http://127.0.0.1:8000/apps/activities/")
            expect(page.locator("#passo h2")).to_have_text("Pergunta de entrada")
            page.locator("#passo").get_by_role("button",name="24",exact=True).click()
            expect(page.locator("#passo")).to_contain_text("Guardado nesta sessão.")
            page.get_by_role("button",name="Continuar",exact=True).click()
            expect(page.locator("#passo h2")).to_have_text("Dobre e observe")
            page.locator("#passo").get_by_role("button",name="×2",exact=True).click()
            page.locator("#passo").get_by_role("button",name="seta ÷2",exact=True).click()
            page.get_by_role("button",name="Retomar o palpite",exact=True).click()
            expect(page.locator("#passo")).to_contain_text("Você marcou 24")
            page.get_by_role("button",name="Continuar",exact=True).click()
            page.locator("#passo").get_by_role("button",name="a razão",exact=True).click()
            for _ in range(8):
                btn=page.locator("#passo").get_by_role("button",name="Escrever a próxima linha",exact=True)
                if not btn.count() or not btn.is_visible():break
                btn.click()
            expect(page.locator("#passo")).to_contain_text("150 páginas")
            page.get_by_role("button",name="Continuar",exact=True).click()
            expect(page.locator("#passo h2")).to_have_text("Prática")
            page.locator("#passo").get_by_role("button",name="R$ 48,00",exact=True).click()
            page.get_by_role("button",name="Continuar",exact=True).click()
            expect(page.locator("#passo h2")).to_have_text("Verificação de saída")
            expect(page.get_by_role("button",name="Entregar",exact=True)).to_be_disabled()
            page.locator("#passo").get_by_role("button",name="inversa",exact=True).click()
            page.get_by_role("button",name="Entregar",exact=True).click()
            expect(page.locator("#passo")).to_contain_text("1 de 1")
            expect(page.locator("#passo")).to_contain_text("Resultado desta tentativa.")
            assert page.evaluate("localStorage.length===0 && sessionStorage.length===0")
            assert not errors,errors
            assert not foreign,foreign
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+1")
            artifacts=Path(os.environ.get("MAPLE_TEST_ARTIFACTS","test-artifacts"))
            artifacts.mkdir(parents=True,exist_ok=True)
            page.screenshot(path=str(artifacts/f"activity-{width}.png"),full_page=True)
            ctx.close()
        browser.close()
    print("PASS: staged activity, prediction, feedback, example, practice and exit check on desktop/mobile")

if __name__=="__main__":
    main()
