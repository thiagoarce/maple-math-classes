/* Geometria compartilhada para selecionar e transformar tinta vetorial. */
(function () {
  "use strict";
  if (window.MAObjectGeometry) return;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function distanceToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay;
    if (!dx && !dy) return Math.hypot(px - ax, py - ay);
    var t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = clamp(t, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function pixelWidth(stroke, width) {
    var value = Number(stroke.width) || 4;
    return value <= .2 ? value * width : value;
  }
  function bounds(stroke, width, height) {
    var points = stroke && stroke.points || [];
    if (points.length < 2) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < points.length; i += 2) {
      var x = points[i] * width, y = points[i + 1] * height;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    var pad = Math.max(5, pixelWidth(stroke, width) / 2);
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(12, maxX - minX + pad * 2),
      height: Math.max(12, maxY - minY + pad * 2),
      rotation: 0
    };
  }
  function hit(stroke, x, y, radius, width, height) {
    var points = stroke && stroke.points || [];
    if (points.length < 2) return false;
    var threshold = radius + pixelWidth(stroke, width) / 2;
    if (points.length === 2) return Math.hypot(x - points[0] * width, y - points[1] * height) <= threshold;
    for (var i = 0; i < points.length - 2; i += 2) {
      if (distanceToSegment(
        x, y,
        points[i] * width, points[i + 1] * height,
        points[i + 2] * width, points[i + 3] * height
      ) <= threshold) return true;
    }
    return false;
  }
  function move(stroke, original, dx, dy, width, height) {
    stroke.points = original.points.map(function (value, index) {
      var delta = index % 2 === 0 ? dx / width : dy / height;
      return clamp(value + delta, -2, 3);
    });
  }
  function resize(stroke, original, handle, point, width, height) {
    var box = bounds(original, width, height);
    if (!box) return;
    var anchorX = /w/.test(handle) ? box.x + box.width : box.x;
    var anchorY = /n/.test(handle) ? box.y + box.height : box.y;
    var newWidth = Math.max(12, Math.abs(point.x - anchorX));
    var newHeight = Math.max(12, Math.abs(point.y - anchorY));
    var scaleX = newWidth / Math.max(1, box.width);
    var scaleY = newHeight / Math.max(1, box.height);
    stroke.points = original.points.map(function (value, index) {
      var size = index % 2 === 0 ? width : height;
      var anchor = index % 2 === 0 ? anchorX : anchorY;
      var scale = index % 2 === 0 ? scaleX : scaleY;
      return (anchor + (value * size - anchor) * scale) / size;
    });
  }
  function rotate(stroke, original, delta, width, height) {
    var box = bounds(original, width, height);
    if (!box) return;
    var cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    var cos = Math.cos(delta), sin = Math.sin(delta);
    stroke.points = [];
    for (var i = 0; i < original.points.length; i += 2) {
      var x = original.points[i] * width - cx;
      var y = original.points[i + 1] * height - cy;
      stroke.points.push((cx + x * cos - y * sin) / width, (cy + x * sin + y * cos) / height);
    }
  }

  window.MAObjectGeometry = {
    clamp: clamp,
    bounds: bounds,
    hit: hit,
    move: move,
    resize: resize,
    rotate: rotate
  };
})();
