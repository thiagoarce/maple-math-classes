"""Cartesian diagrams as portable SVG; no dependencies outside Python."""
import math
import xml.etree.ElementTree as ET


def _finite(*values):
    if not all(math.isfinite(v) for v in values):
        raise ValueError("Coordinates and dimensions must be finite")


def _fmt(value):
    return format(value, ".12g")


def _color(value):
    # Accept only literal hex colors; no external SVG paint servers or CSS URLs.
    if not isinstance(value, str) or len(value) not in (4, 7) or value[0] != "#" or any(c not in "0123456789abcdefABCDEF" for c in value[1:]):
        raise ValueError("Expected a hexadecimal color")
    return value


class CartesianPlane:
    C_RED, C_BLUE, C_GREEN = "#C0272D", "#1D4999", "#2E7D32"
    C_GOLD, C_PURPLE = "#B87900", "#6B3FA0"
    C_INK, C_GRID, C_AXIS = "#1a1a1a", "#e3e3e3", "#666666"

    def __init__(self, width=200, height=200, xmin=-1, xmax=6, ymin=-1, ymax=6,
                 xstep=1, ystep=1, pad=20):
        _finite(width, height, xmin, xmax, ymin, ymax, xstep, ystep, pad)
        if not (xmin < xmax and ymin < ymax and pad >= 0 and width > 2*pad and height > 2*pad and xstep > 0 and ystep > 0):
            raise ValueError("Invalid window, padding or grid step")
        dx, dy = xmax-xmin, ymax-ymin
        _finite(dx, dy, dx/xstep, dy/ystep)
        if max(dx/xstep, dy/ystep) > 1000:
            raise ValueError("At most 1000 grid intervals per axis")
        self.width, self.height, self.pad = width, height, pad
        self.xmin, self.xmax, self.ymin, self.ymax = xmin, xmax, ymin, ymax
        self.xstep, self.ystep = xstep, ystep
        self.sx, self.sy = (width-2*pad)/dx, (height-2*pad)/dy
        _finite(self.sx, self.sy)
        self.root = ET.Element("svg", {"xmlns":"http://www.w3.org/2000/svg", "width":"100%", "viewBox":f"0 0 {_fmt(width)} {_fmt(height)}"})

    def to_px(self, x, y):
        _finite(x, y)
        return round(self.pad+(x-self.xmin)*self.sx, 4), round(self.height-self.pad-(y-self.ymin)*self.sy, 4)

    def _element(self, tag, text=None, **attrs):
        node = ET.SubElement(self.root, tag, {k.replace("_", "-"): str(v) for k,v in attrs.items()})
        node.text = None if text is None else str(text)
        return node

    def _line(self, a, b, color, width, dash=False):
        _finite(width)
        if width <= 0:
            raise ValueError("Stroke width must be positive")
        x1,y1 = self.to_px(*a)
        x2,y2 = self.to_px(*b)
        attrs = {"stroke_dasharray":"3,2"} if dash else {}
        self._element("line", x1=x1, y1=y1, x2=x2, y2=y2, stroke=_color(color), stroke_width=width, **attrs)

    def _ticks(self, lo, hi, step):
        # Multiples of the step, anchored at zero rather than at the window edge.
        first, last = math.ceil(lo/step-1e-10), math.floor(hi/step+1e-10)
        return (i*step for i in range(first,last+1))

    def grid(self, color=None):
        color = color or self.C_GRID
        for x in self._ticks(self.xmin,self.xmax,self.xstep):
            self._line((x,self.ymin),(x,self.ymax),color,.5)
        for y in self._ticks(self.ymin,self.ymax,self.ystep):
            self._line((self.xmin,y),(self.xmax,y),color,.5)
        return self

    def axes(self, label_x="x", label_y="y", show_ticks=True):
        if self.ymin <= 0 <= self.ymax:
            self._line((self.xmin,0),(self.xmax,0),self.C_AXIS,1.2)
            self.label(self.xmax,0,label_x,dx=-2,dy=-5,anchor="end")
            if show_ticks:
                for x in self._ticks(self.xmin,self.xmax,self.xstep):
                    if x: self.label(x,0,_fmt(x),dy=10,size=7)
        if self.xmin <= 0 <= self.xmax:
            self._line((0,self.ymin),(0,self.ymax),self.C_AXIS,1.2)
            self.label(0,self.ymax,label_y,dx=5,dy=3,anchor="start")
            if show_ticks:
                for y in self._ticks(self.ymin,self.ymax,self.ystep):
                    if y: self.label(0,y,_fmt(y),dx=-4,dy=2,size=7,anchor="end")
        return self

    def label(self,x,y,text,color=None,size=9,anchor="middle",italic=False,dx=0,dy=0):
        _finite(size,dx,dy)
        if size <= 0 or anchor not in ("start","middle","end"):
            raise ValueError("Invalid label size or anchor")
        px,py = self.to_px(x,y)
        self._element("text",text,x=px+dx,y=py+dy,font_size=size,text_anchor=anchor,
                      font_style="italic" if italic else "normal",font_family="sans-serif",fill=_color(color or self.C_INK))
        return self

    def point(self,x,y,label=None,color=None,dx=5,dy=-5,r=2.4):
        _finite(r)
        if r <= 0: raise ValueError("Radius must be positive")
        color = _color(color or self.C_RED)
        px,py = self.to_px(x,y)
        self._element("circle",cx=px,cy=py,r=r,fill=color)
        if label is not None: self.label(x,y,label,color=color,dx=dx,dy=dy,anchor="start")
        return self

    def _clip(self,p1,p2,lo,hi):
        x,y = p1; u,v = p2
        _finite(x,y,u,v)
        dx,dy = u-x,v-y
        _finite(dx,dy)
        for origin,d,lower,upper in ((x,dx,self.xmin,self.xmax),(y,dy,self.ymin,self.ymax)):
            if d == 0:
                if not lower <= origin <= upper: return None
            else:
                a,b = sorted(((lower-origin)/d,(upper-origin)/d))
                lo,hi = max(lo,a),min(hi,b)
                if lo > hi: return None
        return (x+lo*dx,y+lo*dy),(x+hi*dx,y+hi*dy)

    def segment(self,p1,p2,color=None,width=1.6,dash=False):
        clipped = self._clip(p1,p2,0,1)
        if clipped: self._line(*clipped,color or self.C_BLUE,width,dash)
        return self

    def line_through(self,p1,p2,color=None,width=1.8):
        if tuple(p1)==tuple(p2): raise ValueError("A line requires two distinct points")
        clipped = self._clip(p1,p2,-math.inf,math.inf)
        if clipped: self._line(*clipped,color or self.C_BLUE,width)
        return self

    def horizontal_line(self,y,color=None,width=1.8):
        return self.segment((self.xmin,y),(self.xmax,y),color or self.C_GREEN,width)

    def vertical_line(self,x,color=None,width=1.8):
        return self.segment((x,self.ymin),(x,self.ymax),color or self.C_PURPLE,width)

    def circle(self,cx,cy,r,color=None,width=1.8,dash=False,fill="none"):
        _finite(cx,cy,r,width)
        if r <= 0 or width <= 0 or not math.isclose(self.sx,self.sy,rel_tol=1e-9):
            raise ValueError("Circle requires a positive radius, stroke and equal axis scales")
        if not (self.xmin <= cx-r <= cx+r <= self.xmax and self.ymin <= cy-r <= cy+r <= self.ymax):
            raise ValueError("Circle must fit within the window")
        px,py=self.to_px(cx,cy)
        attrs={"stroke_dasharray":"4,3"} if dash else {}
        self._element("circle",cx=px,cy=py,r=round(r*self.sx,4),fill="none" if fill=="none" else _color(fill),stroke=_color(color or self.C_RED),stroke_width=width,**attrs)
        return self

    def render(self):
        return ET.tostring(self.root,encoding="unicode")
