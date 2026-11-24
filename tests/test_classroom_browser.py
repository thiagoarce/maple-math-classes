"""Synthetic end-to-end gate. Run against a local HTTP server only."""
from pathlib import Path
import os
from playwright.sync_api import sync_playwright, expect

URL = "http://127.0.0.1:8000/apps/classroom/"
def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        errors = []
        foreign = []
        def route(r):
            if r.request.url.startswith("http://127.0.0.1:8000/") or r.request.url.startswith(("blob:", "data:")):
                r.continue_()
            else:
                foreign.append(r.request.url)
                r.abort()
        context.route("**/*", route)
        context.on("page", lambda page: page.on("pageerror", lambda e: errors.append(str(e))))
        page = context.new_page()
        page.goto(URL)
        expect(page.locator("#boardInkCanvas")).to_be_visible()
        expect(page.locator("#boardSaveStatus")).to_have_text("salvo")
        def stroke(target, x=240, y=190):
            box = target.bounding_box()
            assert box and box["width"] > x + 80 and box["height"] > y + 60
            page.mouse.move(box["x"]+x, box["y"]+y)
            page.mouse.down()
            page.mouse.move(box["x"]+x+80, box["y"]+y+60, steps=12)
            page.mouse.up()
        def ink_count():
            return page.evaluate("""async () => {
              const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('maple-demo-classroom',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
              try {return await new Promise((resolve,reject)=>{const q=db.transaction('sessions','readonly').objectStore('sessions').get('maple-demo-volume|board');q.onsuccess=()=>resolve(q.result?.surfaces.white.strokes.length || 0);q.onerror=()=>reject(q.error)})}
              finally {db.close()}
            }""")
        stroke(page.locator("#boardInkCanvas"))
        expect(page.locator("#boardSaveStatus")).to_have_text("salvo")
        assert ink_count() == 1
        page.locator('#boardTools [data-action="undo"]').click()
        expect(page.locator("#boardSaveStatus")).to_have_text("salvo")
        assert ink_count() == 0
        page.locator('#boardTools [data-action="redo"]').click()
        expect(page.locator("#boardSaveStatus")).to_have_text("salvo")
        assert ink_count() == 1
        page.reload()
        expect(page.locator("#boardSaveStatus")).to_have_text("salvo")
        assert ink_count() == 1
        print("PASS: board ink, undo/redo, reload", flush=True)
        artifacts = Path(os.environ.get("MAPLE_TEST_ARTIFACTS", "test-artifacts"))
        artifacts.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(artifacts / "board.png"))
        page.locator(".ma-aula-botao").click()
        with page.expect_popup() as popup:
            page.locator(".ma-aula .item").filter(has_text="Projetar lousa").click()
        proj = popup.value
        expect(proj.locator("#cover")).to_be_hidden()
        expect(proj.locator("#projectorBoardInkCanvas")).to_be_visible()
        proj.wait_for_function("""() => {const c=document.querySelector('#projectorBoardInkCanvas');return c && c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)}""")
        page.keyboard.press("k")
        expect(proj.locator("#board")).to_have_class("black")
        page.keyboard.press("b")
        expect(proj.locator("#board")).not_to_have_class("black")
        page.keyboard.press("x")
        expect(proj.locator("#cover")).to_be_visible()
        page.keyboard.press("Escape")
        expect(proj.locator("#cover")).to_be_hidden()
        print("PASS: two real browser windows, ink, backgrounds, blackout", flush=True)
        page.locator(".ma-aula-botao").click()
        page.locator(".ma-aula .item").filter(has_text="Laboratório de volumetria").click()
        expect(page.locator("#resourceFrame")).to_be_visible()
        expect(proj.locator("#cover")).to_be_visible()
        page.keyboard.press("b")
        expect(proj.locator("#cover")).to_be_hidden()
        proj.screenshot(path=str(artifacts / "projector.png"))
        proj.close()
        page.keyboard.press("c")
        calc = page.locator(".ma-calc-flutua")
        expect(calc).to_be_visible()
        for key in ["C", "2", "+", "3", "×", "4", "="]:
            calc.locator('[data-tecla="'+key+'"]').click()
        expect(calc.locator(".ma-calc-num")).to_have_text("14")
        calc.locator('[data-acao="fechar"]').click()
        expect(calc).to_be_hidden()
        print("PASS: calculator UI precedence", flush=True)
        page.locator('#boardTools button[title="Formas e linhas"]').click()
        page.locator('.ma-shape-menu.open [data-shape="square"]').click()
        stroke(page.locator(".ma-shape-layer.active"), 400, 300)
        expect(page.locator("#boardSaveStatus")).to_have_text("salvo")
        assert ink_count() == 2
        page.locator('#boardTools [data-tool="pen"]').click()
        page.locator('#boardTools button[title="Régua, esquadro e transferidor"]').click()
        page.locator('.ma-instrument-menu.open [data-add="ruler"]').click()
        expect(page.locator(".ma-ruler")).to_be_visible()
        assert page.locator(".ma-ruler svg [data-tick]").count() == 101
        for unit in range(11):
            label = page.locator(f".ma-ruler svg [data-unit=\"{unit}\"]")
            tick = page.locator(f".ma-ruler svg [data-tick=\"{unit*10}\"]")
            assert abs(float(label.get_attribute("x")) - float(tick.get_attribute("x1"))) < 1e-8
        page.screenshot(path=str(artifacts / "geometry.png"))
        page.locator(".ma-ruler .close").click()
        expect(page.locator(".ma-ruler")).to_be_hidden()
        for kind, ratio in [("square", 1.0), ("protractor", 2.0)]:
            page.locator('#boardTools button[title="Régua, esquadro e transferidor"]').click()
            page.locator(f'.ma-instrument-menu.open [data-add="{kind}"]').click()
            node = page.locator(f".ma-{kind}")
            expect(node).to_be_visible()
            def aspect():
                return node.evaluate("(n) => n.offsetWidth / n.offsetHeight")
            assert abs(aspect() - ratio) < .025
            handle = node.locator(".resize").bounding_box()
            page.mouse.move(handle["x"]+handle["width"]/2, handle["y"]+handle["height"]/2)
            page.mouse.down()
            page.mouse.move(handle["x"]+handle["width"]/2+65, handle["y"]+handle["height"]/2+25, steps=8)
            page.mouse.up()
            assert abs(aspect() - ratio) < .025
            if kind == "protractor":
                assert node.locator("[data-angle]").count() == 181
                assert node.locator('[data-angle="90"]').evaluate("(n) => Math.abs(+n.getAttribute('x1')-190)<1e-8")
                page.screenshot(path=str(artifacts / "protractor.png"))
            node.locator(".close").click()
            expect(node).to_be_hidden()
        print("PASS: shape, ruler ticks and instrument aspect ratios", flush=True)
        page.goto(URL+"pdf.html")
        expect(page.locator("#loading")).to_be_hidden(timeout=30000)
        expect(page.locator("#pageLabel")).to_have_text("1 / 2")
        page.locator("#fitHeightBtn").click()
        expect(page.locator("#pdfInkCanvas")).to_be_visible()
        stroke(page.locator("#pdfInkCanvas"), 120, 120)
        expect(page.locator("#saveStatus")).to_have_text("salvo neste computador")
        page.locator("#nextPage").click()
        expect(page.locator("#pageLabel")).to_have_text("2 / 2")
        expect(page.locator("#loading")).to_be_hidden()
        page.locator("#prevPage").click()
        expect(page.locator("#pageLabel")).to_have_text("1 / 2")
        expect(page.locator("#loading")).to_be_hidden()
        expect(page.locator("#saveStatus")).to_have_text("salvo neste computador")
        def pdf_ink_counts():
            return page.evaluate("""async () => {
              const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('maple-demo-classroom',1);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});
              try {return await new Promise((resolve,reject)=>{const q=db.transaction('sessions','readonly').objectStore('sessions').get('folha|/apps/classroom/fixtures/volume-demo.pdf');q.onsuccess=()=>resolve([q.result?.pages['1']?.strokes.length || 0,q.result?.pages['2']?.strokes.length || 0]);q.onerror=()=>reject(q.error)})}
              finally {db.close()}
            }""")
        assert pdf_ink_counts() == [1, 0]
        page.reload()
        expect(page.locator("#loading")).to_be_hidden(timeout=30000)
        expect(page.locator("#pageLabel")).to_have_text("1 / 2")
        expect(page.locator("#saveStatus")).to_have_text("salvo neste computador")
        assert pdf_ink_counts() == [1, 0]
        page.wait_for_function("""() => {const c=document.querySelector('#pdfInkCanvas');return c && c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)}""")
        page.screenshot(path=str(artifacts / "pdf.png"))
        print("PASS: PDF.js runtime, render, zoom, annotation, page isolation and reload", flush=True)
        assert not foreign, foreign
        assert not errors, errors
        browser.close()
if __name__ == "__main__":
    main()
