import unittest
import xml.etree.ElementTree as ET
from tools.geometry.svg_plane import CartesianPlane

NS = {"s":"http://www.w3.org/2000/svg"}

class PlaneTests(unittest.TestCase):
    def plane(self):
        return CartesianPlane(xmin=-2,xmax=2,ymin=-2,ymax=2)
    def elements(self,p,tag):
        return ET.fromstring(p.render()).findall("s:"+tag,NS)
    def test_transform(self):
        p=self.plane()
        self.assertEqual(p.to_px(-2,-2),(20,180))
        self.assertEqual(p.to_px(2,2),(180,20))
        self.assertEqual(p.to_px(0,0),(100,100))
    def test_line_clipping(self):
        p=self.plane().line_through((0,0),(1,2))
        l=self.elements(p,"line")[0]
        self.assertEqual(tuple(float(l.get(k)) for k in ("x1","y1","x2","y2")),(60,180,140,20))
    def test_vertical_and_horizontal(self):
        p=self.plane().vertical_line(1).horizontal_line(-1)
        a,b=self.elements(p,"line")
        self.assertEqual(float(a.get("x1")),140)
        self.assertEqual(float(b.get("y1")),140)
    def test_outside_line(self):
        self.assertEqual(self.elements(self.plane().vertical_line(3),"line"),[])
    def test_segment_clipping(self):
        p=self.plane().segment((-4,0),(1,0))
        l=self.elements(p,"line")[0]
        self.assertEqual((float(l.get("x1")),float(l.get("x2"))),(20,140))
    def test_circle(self):
        p=self.plane().circle(0,0,1)
        self.assertEqual(float(self.elements(p,"circle")[0].get("r")),40)
        with self.assertRaises(ValueError): CartesianPlane(width=300).circle(0,0,.5)
        with self.assertRaises(ValueError): self.plane().circle(0,0,3)
    def test_label_escape(self):
        p=self.plane().point(0,0,'<script>&"')
        self.assertEqual(self.elements(p,"text")[0].text,'<script>&"')
        self.assertEqual(self.elements(p,"script"),[])
    def test_color_validation(self):
        with self.assertRaises(ValueError): self.plane().point(0,0,color="url(https://example.invalid)")
    def test_invalid_inputs(self):
        for kw in ({"xstep":0},{"xmin":5,"xmax":2},{"pad":110},{"ystep":.0001},{"width":float("nan")}):
            with self.subTest(kw=kw),self.assertRaises(ValueError): CartesianPlane(**kw)
        with self.assertRaises(ValueError): self.plane().line_through((1,1),(1,1))
    def test_y_axis_without_x_axis(self):
        p=CartesianPlane(xmin=-2,xmax=2,ymin=1,ymax=3).axes()
        self.assertEqual(len(self.elements(p,"line")),1)
        self.assertIn("2",[n.text for n in self.elements(p,"text")])
    def test_grid_and_determinism(self):
        def draw(): return self.plane().grid().axes().point(1,1,"A").render()
        self.assertEqual(draw(),draw())
        self.assertEqual(len(self.elements(self.plane().grid(),"line")),10)
        self.assertNotIn('id=',draw())

if __name__ == "__main__": unittest.main()
