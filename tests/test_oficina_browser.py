"""Synthetic browser test for anonymous Oficina, served locally."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = "http://127.0.0.1:8000/apps/oficina/"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 390, "height": 844})
        # Fixed random sequence: first family, times 11, lower bound 12.
        context.add_init_script("Math.random = () => 0;")
        foreign, errors = [], []
        def route(r):
            if r.request.url.startswith("http://127.0.0.1:8000/"):
                r.continue_()
            else:
                foreign.append(r.request.url)
                r.abort()
        context.route("**/*", route)
        page = context.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(URL)
        expect(page.locator(".of-conta")).to_have_text("12 × 11")
        expect(page.locator(".of-resultado")).to_be_empty()
        inp = page.get_by_role("textbox", name="Sua resposta")
        inp.fill("1/0")
        page.get_by_role("button", name="Conferir").click()
        assert inp.evaluate("(n) => !n.validity.valid")
        expect(page.locator(".of-resultado")).to_be_empty()
        inp.fill("100")
        page.get_by_role("button", name="Conferir").click()
        expect(page.locator(".of-resultado")).to_contain_text("132")
        expect(page.locator(".of-fala")).to_contain_text("Vezes 11")
        expect(page.get_by_role("button", name="Revisar (1)")).to_be_enabled()
        artifacts = Path(os.environ.get("MAPLE_TEST_ARTIFACTS", "test-artifacts"))
        artifacts.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(artifacts / "oficina-mobile.png"), full_page=True)
        page.get_by_role("button", name="Revisar (1)").click()
        expect(page.locator(".lousa-titulo")).to_contain_text("Revisão")
        inp.fill("132")
        page.get_by_role("button", name="Conferir").click()
        expect(page.locator(".of-certo")).to_contain_text("Saiu da revisão")
        expect(page.locator(".of-conta")).to_have_text("Nada para revisar!")
        page.get_by_role("button", name="Voltar ao treino").click()
        expect(page.locator(".of-conta")).to_have_text("12 × 11")
        page.get_by_role("button", name="Não sei").click()
        expect(page.get_by_role("button", name="Revisar (1)")).to_be_enabled()
        page.reload()
        expect(page.get_by_role("button", name="Revisar (0)")).to_be_disabled()
        expect(page.locator(".of-placar")).to_contain_text("0 de 0")
        assert page.evaluate("localStorage.length === 0 && sessionStorage.length === 0")
        assert not foreign, foreign
        assert not errors, errors
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        print("PASS: anonymous Oficina, invalid input, feedback, review, skip, reload and mobile layout")
        browser.close()

if __name__ == "__main__":
    main()
