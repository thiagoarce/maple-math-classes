"""Desktop presentation gate for original slide motor and synthetic deck."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright, expect
OUT=Path("test-artifacts/slides")
def main():
    html=(OUT/"entrepreneurship-demo.html").read_text(encoding="utf-8")
    assert "SYNTHETIC-TEACHER-NOTE" not in html
    assert "SYNTHETIC-TEACHER-NOTE" in (OUT/"synthetic-teacher/entrepreneurship-demo.brief.md").read_text(encoding="utf-8")
    with sync_playwright() as p:
        browser=p.chromium.launch()
        ctx=browser.new_context(viewport={"width":1600,"height":900},reduced_motion="reduce")
        errors,foreign=[],[]
        ctx.route("**/*",lambda r:r.continue_() if r.request.url.startswith(("http://127.0.0.1:8000/","data:","blob:")) else (foreign.append(r.request.url),r.abort()))
        page=ctx.new_page()
        page.on("pageerror",lambda e:errors.append(str(e)))
        base="http://127.0.0.1:8000/test-artifacts/slides/"
        page.goto(base+"entrepreneurship-demo.html")
        expect(page.locator(".slide.active")).to_have_attribute("id","l1")
        page.keyboard.press("ArrowRight")
        expect(page.locator(".slide.active")).to_have_attribute("id","l2")
        page.keyboard.press("ArrowRight")
        expect(page.locator(".slide.active")).to_have_attribute("id","l3")
        responses=page.locator(".slide.active [data-reveal]")
        assert responses.count()==2
        expect(responses.nth(0)).not_to_have_class(re.compile(r"(?:^|\s)is-revealed(?:\s|$)"))
        expect(responses.nth(1)).not_to_have_class(re.compile(r"(?:^|\s)is-revealed(?:\s|$)"))
        before=responses.nth(0).bounding_box()
        page.keyboard.press("ArrowRight")
        expect(responses.nth(0)).to_have_class(re.compile(r"(?:^|\s)is-revealed(?:\s|$)"))
        expect(responses.nth(1)).not_to_have_class(re.compile(r"(?:^|\s)is-revealed(?:\s|$)"))
        after=responses.nth(0).bounding_box()
        assert before and after, "Reveal must preserve its allocated box"
        assert abs(before["x"]-after["x"])<1 and abs(before["y"]-after["y"])<1
        assert abs(before["width"]-after["width"])<1 and abs(before["height"]-after["height"])<1
        page.keyboard.press("ArrowRight")
        expect(responses.nth(1)).to_have_class(re.compile(r"(?:^|\s)is-revealed(?:\s|$)"))
        page.screenshot(path=str(OUT/"comparison.png"))
        page.keyboard.press("ArrowLeft")
        expect(responses.nth(1)).not_to_have_class(re.compile(r"(?:^|\s)is-revealed(?:\s|$)"))
        page.keyboard.press("ArrowRight")
        page.keyboard.press("ArrowRight")
        expect(page.locator(".slide.active")).to_have_attribute("id","l4")
        timer=page.locator(".slide.active [data-relogio]")
        expect(timer).to_have_text("1:00")
        timer.click()
        expect(timer).to_have_class(re.compile(r"(?:^|\s)correndo(?:\s|$)"))
        page.wait_for_function("document.querySelector('.slide.active [data-relogio]').textContent !== '1:00'")
        timer.click()
        assert "correndo" not in timer.get_attribute("class")
        timer.dblclick()
        expect(timer).to_have_text("1:00")
        page.screenshot(path=str(OUT/"workshop.png"))
        page.keyboard.press("ArrowRight")
        expect(page.locator(".slide.active")).to_have_attribute("id","l5")
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth+1")
        page.goto(base+"synthetic-teacher/instructor-demo.html")
        expect(page.locator(".slide.active .nota")).to_be_hidden()
        page.keyboard.press("n")
        expect(page.locator(".slide.active .nota")).to_be_visible()
        page.keyboard.press("n")
        expect(page.locator(".slide.active .nota")).to_be_hidden()
        assert not errors and not foreign,(errors,foreign)
        browser.close()
    print("PASS: slides navigation, progressive reveal, timer, separate notes and local requests")
if __name__=="__main__":
    main()
