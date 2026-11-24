/* Modo Aula — núcleo vetorial compartilhado: tinta suave, laser e reconhecimento por espera. */ (function () {
  "use strict";
  if (window.ModoAulaInkCore) return;
  var HOLD_MS = 620;
  var LASER_MS = 1800;
  /* Quanto a ponta precisa andar para DESFAZER um encaixe já feito. Em coordenadas
     normalizadas: 0,018 é ~2% da tela, uns 2 cm num projetor de 100 cm. Bem acima do
     tremor da mão parada e do solavanco de levantar a caneta, e bem abaixo de um
     movimento com intenção de continuar desenhando. */
  var UNSNAP_MIN = 0.018;
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function uid(prefix) {
    return crypto.randomUUID
      ? crypto.randomUUID()
      : (prefix || "i") + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function distanceToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax,
      dy = by - ay;
    if (!dx && !dy) return Math.hypot(px - ax, py - ay);
    var t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = clamp(t, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
  function rdp(points, epsilon) {
    if (points.length <= 2) return points.slice();
    var max = 0,
      index = 0;
    for (var i = 1; i < points.length - 1; i++) {
      var d = distanceToSegment(
        points[i].x,
        points[i].y,
        points[0].x,
        points[0].y,
        points[points.length - 1].x,
        points[points.length - 1].y,
      );
      if (d > max) {
        max = d;
        index = i;
      }
    }
    if (max <= epsilon) return [points[0], points[points.length - 1]];
    var left = rdp(points.slice(0, index + 1), epsilon);
    var right = rdp(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  function pathLength(points) {
    var total = 0;
    for (var i = 1; i < points.length; i++)
      total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    return total;
  }
  function bounds(points) {
    var xs = points.map(function (p) {
      return p.x;
    });
    var ys = points.map(function (p) {
      return p.y;
    });
    var minX = Math.min.apply(Math, xs),
      maxX = Math.max.apply(Math, xs);
    var minY = Math.min.apply(Math, ys),
      maxY = Math.max.apply(Math, ys);
    return {
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }
  function polygonArea(points) {
    var area = 0;
    for (var i = 0; i < points.length; i++) {
      var a = points[i],
        b = points[(i + 1) % points.length];
      area += a.x * b.y - b.x * a.y;
    }
    return Math.abs(area) / 2;
  }
  function dedupeCorners(points, threshold) {
    var result = [];
    points.forEach(function (p) {
      var last = result[result.length - 1];
      if (!last || Math.hypot(p.x - last.x, p.y - last.y) > threshold) result.push(p);
    });
    if (
      result.length > 2 &&
      Math.hypot(
        result[0].x - result[result.length - 1].x,
        result[0].y - result[result.length - 1].y,
      ) < threshold
    )
      result.pop();
    return result;
  }
  function normalizedToPixels(stroke, width, height) {
    var result = [];
    for (var i = 0; i < (stroke.points || []).length; i += 2)
      result.push({
        x: stroke.points[i] * width,
        y: stroke.points[i + 1] * height,
        p: Number((stroke.pressure || [])[i / 2]) || 0.5,
      });
    return result;
  }
  function pixelsToStroke(stroke, points, width, height, shape) {
    var copy = clone(stroke);
    copy.points = [];
    copy.pressure = [];
    points.forEach(function (p) {
      copy.points.push(p.x / width, p.y / height);
      copy.pressure.push(Math.round((p.p == null ? 0.5 : p.p) * 1000) / 1000);
    });
    if (shape) copy.shape = shape;
    else delete copy.shape;
    return copy;
  }
  function linePoints(a, b) {
    return [
      { x: a.x, y: a.y, p: a.p },
      { x: b.x, y: b.y, p: b.p },
    ];
  }
  function ellipsePoints(box, pressure) {
    var result = [],
      steps = 72;
    var cx = (box.minX + box.maxX) / 2,
      cy = (box.minY + box.maxY) / 2;
    var rx = Math.max(2, box.width / 2),
      ry = Math.max(2, box.height / 2);
    for (var i = 0; i <= steps; i++) {
      var angle = (Math.PI * 2 * i) / steps;
      result.push({ x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry, p: pressure });
    }
    return result;
  }
  function closedPolygon(vertices, pressure) {
    var result = vertices.map(function (p) {
      return { x: p.x, y: p.y, p: pressure };
    });
    if (result.length) result.push({ x: result[0].x, y: result[0].y, p: pressure });
    return result;
  }
  function rectanglePoints(box, pressure) {
    return closedPolygon(
      [
        { x: box.minX, y: box.minY },
        { x: box.maxX, y: box.minY },
        { x: box.maxX, y: box.maxY },
        { x: box.minX, y: box.maxY },
      ],
      pressure,
    );
  }
  function ellipseFit(points, box) {
    var cx = (box.minX + box.maxX) / 2,
      cy = (box.minY + box.maxY) / 2;
    var rx = box.width / 2,
      ry = box.height / 2;
    if (rx < 8 || ry < 8) return Infinity;
    var total = 0,
      count = 0;
    points.forEach(function (p) {
      var r = Math.sqrt(Math.pow((p.x - cx) / rx, 2) + Math.pow((p.y - cy) / ry, 2));
      total += Math.abs(1 - r);
      count++;
    });
    return count ? total / count : Infinity;
  }
  /* Cantos agudos de um traço fechado: simplifica com RDP, tira o ponto final que repete
     o inicial e junta vértices quase alinhados (virada menor que 35°). */
  function cantosAgudos(points, diagonal) {
    var fechado = points.slice();
    var simples = rdp(fechado, Math.max(6, diagonal * 0.06));
    var v = dedupeCorners(simples, Math.max(8, diagonal * 0.08));
    var mudou = true;
    while (mudou && v.length > 2) {
      mudou = false;
      for (var i = 0; i < v.length; i++) {
        if (viradaEm(v, i) < 35) { v.splice(i, 1); mudou = true; break; }
      }
    }
    return v;
  }
  /* Quanto o traço vira no vértice i, em graus (0 = segue reto). */
  function viradaEm(v, i) {
    var a = v[(i - 1 + v.length) % v.length], b = v[i], c = v[(i + 1) % v.length];
    var u1 = Math.atan2(b.y - a.y, b.x - a.x), u2 = Math.atan2(c.y - b.y, c.x - b.x);
    var d = Math.abs(u2 - u1) * 180 / Math.PI;
    return d > 180 ? 360 - d : d;
  }
  function anguloInterno(v, i) { return 180 - viradaEm(v, i); }
  function distanciaMediaAoPoligono(points, v) {
    var total = 0;
    points.forEach(function (p) {
      var melhor = Infinity;
      for (var i = 0; i < v.length; i++) {
        var a = v[i], b = v[(i + 1) % v.length];
        melhor = Math.min(melhor, distanceToSegment(p.x, p.y, a.x, a.y, b.x, b.y));
      }
      total += melhor;
    });
    return points.length ? total / points.length : Infinity;
  }
  function todosQuaseRetos(v) {
    for (var i = 0; i < v.length; i++) if (Math.abs(anguloInterno(v, i) - 90) > 20) return false;
    return true;
  }
  /* Triângulo com um ângulo a 12° do reto: acerta para 90° exatos, projetando o vértice
     reto no círculo de Tales do lado oposto. */
  function retoSeQuase(v) {
    for (var i = 0; i < 3; i++) {
      if (Math.abs(anguloInterno(v, i) - 90) <= 12) {
        var a = v[(i + 1) % 3], c = v[(i + 2) % 3], b = v[i];
        var mx = (a.x + c.x) / 2, my = (a.y + c.y) / 2, r = Math.hypot(a.x - c.x, a.y - c.y) / 2;
        var ang = Math.atan2(b.y - my, b.x - mx);
        var novo = v.slice();
        novo[i] = { x: mx + r * Math.cos(ang), y: my + r * Math.sin(ang) };
        return { pontos: novo, reto: true };
      }
    }
    return { pontos: v, reto: false };
  }
  function retanguloPelos(v, box) {
    var ang = Math.atan2(v[1].y - v[0].y, v[1].x - v[0].x);
    var inclinacao = Math.abs(((ang * 180 / Math.PI) % 90 + 90) % 90);
    if (inclinacao < 10 || inclinacao > 80) {
      return [{ x: box.minX, y: box.minY }, { x: box.maxX, y: box.minY },
              { x: box.maxX, y: box.maxY }, { x: box.minX, y: box.maxY }];
    }
    var cx = 0, cy = 0;
    v.forEach(function (p) { cx += p.x / 4; cy += p.y / 4; });
    var cos = Math.cos(-ang), sin = Math.sin(-ang);
    var loc = v.map(function (p) {
      var dx = p.x - cx, dy = p.y - cy;
      return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
    });
    var w = 0, h = 0;
    loc.forEach(function (p) { w += Math.abs(p.x) / 4; h += Math.abs(p.y) / 4; });
    var c2 = Math.cos(ang), s2 = Math.sin(ang);
    return [[-w, -h], [w, -h], [w, h], [-w, h]].map(function (q) {
      return { x: cx + q[0] * c2 - q[1] * s2, y: cy + q[0] * s2 + q[1] * c2 };
    });
  }
  function quaseQuadrado(v) {
    var l1 = Math.hypot(v[1].x - v[0].x, v[1].y - v[0].y), l2 = Math.hypot(v[2].x - v[1].x, v[2].y - v[1].y);
    return Math.abs(l1 - l2) / Math.max(l1, l2) < 0.12;
  }
  function recognize(raw, width, height) {
    if (!raw || raw.points.length < 4) return null;
    var points = normalizedToPixels(raw, width, height);
    var box = bounds(points);
    var diagonal = Math.hypot(box.width, box.height);
    if (diagonal < 24) return null;
    var start = points[0],
      end = points[points.length - 1];
    var maxLineError = 0;
    points.forEach(function (p) {
      maxLineError = Math.max(
        maxLineError,
        distanceToSegment(p.x, p.y, start.x, start.y, end.x, end.y),
      );
    });
    if (maxLineError <= Math.max(6, diagonal * 0.075))
      return pixelsToStroke(raw, linePoints(start, end), width, height, "line");
    var closeDistance = Math.hypot(start.x - end.x, start.y - end.y);
    var length = pathLength(points);
    /* Fechado quando o fim volta perto de qualquer ponto do primeiro quarto do traço, e
       não só do ponto inicial: à mão, o fim costuma passar um pouco do começo. */
    var inicio = points.slice(0, Math.max(2, Math.floor(points.length / 4)));
    inicio.forEach(function (p) { closeDistance = Math.min(closeDistance, Math.hypot(p.x - end.x, p.y - end.y)); });
    var closed = closeDistance <= Math.max(18, diagonal * 0.2) && length >= diagonal * 2;
    if (!closed) return null;
    /* Formas fechadas — refeito em 29/09. Ele: *"desenho um triangulo ele vira um
       retangulo, desenho um retangulo vira uma elipse"*. A ordem antiga perguntava
       primeiro "é elipse?", com tolerância folgada: um retângulo à mão cabia nela. E o
       ponto de chegada, que coincide com o de partida, entrava como um quarto canto do
       triângulo. Agora a pergunta é quantos cantos AGUDOS o traço tem; elipse só quando
       não há canto nenhum. */
    var ellipseError = ellipseFit(points, box);
    var cantos = cantosAgudos(points, diagonal);
    /* Elipse ou polígono: qual das duas passa mais perto dos pontos desenhados. Contar
       cantos sozinho não basta — o círculo simplificado vira um octógono. */
    var erroElipse = ellipseError * (box.width + box.height) / 4;
    var erroPoligono = cantos.length >= 3 ? distanciaMediaAoPoligono(points, cantos) : Infinity;
    if (ellipseError < 0.22 && box.width > 20 && box.height > 20 &&
        (cantos.length <= 2 || erroElipse < erroPoligono * 0.85))
      return pixelsToStroke(raw, ellipsePoints(box, 0.5), width, height, "ellipse");
    if (cantos.length <= 1) return null;
    if (cantos.length === 2) return null;
    if (polygonArea(cantos) < diagonal * diagonal * 0.04) return null;
    if (cantos.length === 3) {
      var tri = retoSeQuase(cantos);
      return pixelsToStroke(raw, closedPolygon(tri.pontos, 0.5), width, height,
        tri.reto ? "right-triangle" : "triangle");
    }
    if (cantos.length === 4 && todosQuaseRetos(cantos)) {
      /* Retângulo de lados quase na horizontal e vertical vira o da caixa; girado,
         vira o retângulo girado que melhor passa pelos quatro cantos. */
      var ret = retanguloPelos(cantos, box);
      return pixelsToStroke(raw, closedPolygon(ret, 0.5), width, height,
        quaseQuadrado(ret) ? "square" : "rectangle");
    }
    if (cantos.length <= 8)
      return pixelsToStroke(raw, closedPolygon(cantos, 0.5), width, height, "polygon");
    if (ellipseError < 0.22)
      return pixelsToStroke(raw, ellipsePoints(box, 0.5), width, height, "ellipse");
    return null;
  }
  function simplifyStroke(stroke, width, height) {
    var points = normalizedToPixels(stroke, width, height);
    if (points.length < 2) return null;
    return pixelsToStroke(
      stroke,
      rdp(points, stroke.tool === "highlighter" ? 1.3 : 0.85),
      width,
      height,
      stroke.shape || null,
    );
  }
  function smoothPath(ctx, points, width, height) {
    if (points.length < 2) return;
    var px = function (i) {
      return points[i] * width;
    };
    var py = function (i) {
      return points[i + 1] * height;
    };
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    if (points.length === 4) {
      ctx.lineTo(px(2), py(2));
      return;
    }
    for (var i = 2; i < points.length - 2; i += 2) {
      var midX = (px(i) + px(i + 2)) / 2;
      var midY = (py(i) + py(i + 2)) / 2;
      ctx.quadraticCurveTo(px(i), py(i), midX, midY);
    }
    ctx.quadraticCurveTo(
      px(points.length - 2),
      py(points.length - 2),
      px(points.length - 2),
      py(points.length - 2),
    );
  }
  function straightPath(ctx, points, width, height) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0] * width, points[1] * height);
    for (var i = 2; i < points.length; i += 2)
      ctx.lineTo(points[i] * width, points[i + 1] * height);
  }
  function strokePixelWidth(stroke, surfaceWidth) {
    var value = Number(stroke.width) || 4;
    return value <= 0.2 ? value * surfaceWidth : value;
  }
  function pressureAt(stroke, index) {
    var value = Number((stroke.pressure || [])[index]);
    return isFinite(value) && value > 0 ? value : 0.5;
  }
  function pressureFactor(value, tool) {
    return tool === "highlighter" ? 1 : 0.62 + clamp(value, 0.08, 1) * 0.78;
  }
  function drawStroke(ctx, stroke, width, height) {
    var points = stroke.points || [];
    if (points.length < 2) return;
    var baseWidth = strokePixelWidth(stroke, width);
    ctx.save();
    ctx.globalAlpha = stroke.opacity == null ? 1 : stroke.opacity;
    ctx.strokeStyle = stroke.color || "#1e4999";
    ctx.fillStyle = ctx.strokeStyle;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (points.length === 2) {
      ctx.beginPath();
      ctx.arc(
        points[0] * width,
        points[1] * height,
        Math.max(0.75, (baseWidth * pressureFactor(pressureAt(stroke, 0), stroke.tool)) / 2),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();
      return;
    }
    if (stroke.shape) {
      ctx.lineWidth = Math.max(1, baseWidth);
      if (stroke.shape === "ellipse") smoothPath(ctx, points, width, height);
      else straightPath(ctx, points, width, height);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (stroke.tool === "highlighter") {
      ctx.lineWidth = Math.max(1, baseWidth);
      smoothPath(ctx, points, width, height);
      ctx.stroke();
      ctx.restore();
      return;
    }
    for (var i = 0; i < points.length - 2; i += 2) {
      var p = (pressureAt(stroke, i / 2) + pressureAt(stroke, i / 2 + 1)) / 2;
      ctx.lineWidth = Math.max(1, baseWidth * pressureFactor(p, stroke.tool));
      ctx.beginPath();
      ctx.moveTo(points[i] * width, points[i + 1] * height);
      ctx.lineTo(points[i + 2] * width, points[i + 3] * height);
      ctx.stroke();
    }
    ctx.restore();
  }
  function strokeHit(stroke, x, y, radius, width, height) {
    var points = stroke.points || [];
    if (points.length < 2) return false;
    var threshold = radius + strokePixelWidth(stroke, width) / 2;
    if (points.length === 2)
      return Math.hypot(x - points[0] * width, y - points[1] * height) <= threshold;
    for (var i = 0; i < points.length - 2; i += 2)
      if (
        distanceToSegment(
          x,
          y,
          points[i] * width,
          points[i + 1] * height,
          points[i + 2] * width,
          points[i + 3] * height,
        ) <= threshold
      )
        return true;
    return false;
  }
  function densify(stroke, width, height, spacing) {
    var points = stroke.points || [],
      values = stroke.pressure || [],
      out = [];
    if (points.length === 2)
      return [{ x: points[0] * width, y: points[1] * height, p: values[0] || 0.5 }];
    for (var i = 0; i < points.length - 2; i += 2) {
      var ax = points[i] * width,
        ay = points[i + 1] * height;
      var bx = points[i + 2] * width,
        by = points[i + 3] * height;
      var pa = Number(values[i / 2]) || 0.5,
        pb = Number(values[i / 2 + 1]) || pa;
      var steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / spacing));
      for (var s = 0; s < steps; s++) {
        var t = s / steps;
        out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, p: pa + (pb - pa) * t });
      }
    }
    out.push({
      x: points[points.length - 2] * width,
      y: points[points.length - 1] * height,
      p: Number(values[values.length - 1]) || 0.5,
    });
    return out;
  }
  function splitStroke(stroke, cx, cy, radius, width, height, randomId) {
    if (!strokeHit(stroke, cx, cy, radius, width, height)) return null;
    var dense = densify(stroke, width, height, Math.max(2, radius * 0.28));
    var runs = [],
      run = [];
    dense.forEach(function (p) {
      var outside =
        Math.hypot(p.x - cx, p.y - cy) >
        radius + Math.max(0.5, strokePixelWidth(stroke, width) * 0.45);
      if (outside) run.push(p);
      else if (run.length) {
        if (run.length > 1) runs.push(run);
        run = [];
      }
    });
    if (run.length > 1) runs.push(run);
    return runs
      .map(function (items) {
        var copy = pixelsToStroke(stroke, rdp(items, 0.8), width, height, null);
        copy.id = randomId();
        return copy;
      })
      .filter(function (item) {
        return item.points.length >= 4;
      });
  }
  function hexToRgba(hex, alpha) {
    var value = String(hex || "#ef233c").replace("#", "");
    if (value.length === 3)
      value = value
        .split("")
        .map(function (c) {
          return c + c;
        })
        .join("");
    return (
      "rgba(" +
      parseInt(value.slice(0, 2), 16) +
      "," +
      parseInt(value.slice(2, 4), 16) +
      "," +
      parseInt(value.slice(4, 6), 16) +
      "," +
      alpha +
      ")"
    );
  }
  function create(options) {
    var canvas = options.canvas,
      laserCanvas = options.laserCanvas;
    var ctx = canvas.getContext("2d"),
      laserCtx = laserCanvas.getContext("2d");
    var tool = options.tool || "pen";
    var drawing = null,
      pointerDown = false,
      erasing = false,
      eraserChanged = false;
    var activePointerId = null,
      activePointerType = "";
    var holdTimer = null,
      snapped = false,
      rawBeforeSnap = null;
    var laserGestures = [],
      laserGesture = null,
      laserFrame = 0,
      renderFrame = 0;
    var eraserCursor = options.eraserCursor || null;
    function size() {
      var rect = canvas.getBoundingClientRect();
      return { width: rect.width || 1, height: rect.height || 1 };
    }
    /* Guia de régua: `window.ModoAulaInkGuias` é uma lista de funções (clientX,
       clientY) → {ax, ay, dx, dy} (reta em px de tela, direção unitária) ou null.
       Se o traço COMEÇA encostado numa borda, todos os pontos dele são projetados
       nela — é o lápis correndo pela régua. */
    var guiaAtiva = null;
    function guiaNoInicio(event) {
      var guias = window.ModoAulaInkGuias || [];
      for (var i = 0; i < guias.length; i++) {
        try {
          var g = guias[i](event.clientX, event.clientY);
          if (g) return g;
        } catch (error) {}
      }
      return null;
    }
    function point(event) {
      var rect = canvas.getBoundingClientRect();
      var cx = event.clientX,
        cy = event.clientY;
      if (guiaAtiva) {
        var t = (cx - guiaAtiva.ax) * guiaAtiva.dx + (cy - guiaAtiva.ay) * guiaAtiva.dy;
        cx = guiaAtiva.ax + t * guiaAtiva.dx;
        cy = guiaAtiva.ay + t * guiaAtiva.dy;
      }
      var x = clamp(cx - rect.left, 0, rect.width);
      var y = clamp(cy - rect.top, 0, rect.height);
      return {
        x: x,
        y: y,
        nx: rect.width ? x / rect.width : 0,
        ny: rect.height ? y / rect.height : 0,
        width: rect.width,
        height: rect.height,
      };
    }
    function currentWidth() {
      return Math.max(1, Number(options.getWidth(tool)) || 4);
    }
    function color() {
      return options.getColor(tool);
    }
    function pressure(event) {
      if (!options.getPressure() || tool !== "pen") return 0.5;
      var value = Number(event && event.pressure);
      if (!isFinite(value) || value <= 0) return 0.5;
      return clamp(value, 0.05, 1);
    }
    function isEraser() {
      return tool === "eraserPartial" || tool === "eraserStroke";
    }
    function samePointer(event) {
      return (
        activePointerId === null ||
        !event ||
        event.pointerId == null ||
        event.pointerId === activePointerId
      );
    }
    function contactLost(event) {
      return !!(
        pointerDown &&
        event &&
        event.buttons != null &&
        (event.buttons & 1) === 0 &&
        (activePointerType === "mouse" ||
          event.pointerType === "mouse" ||
          Number(event.pressure || 0) <= 0)
      );
    }
    function scheduleHold() {
      clearTimeout(holdTimer);
      if (!drawing || guiaAtiva || (tool !== "pen" && tool !== "highlighter")) return;
      /* Já encaixado e parado não reagenda: o listener de pointermove chama isto a cada
         movimento, inclusive nos residuais que agora não desfazem mais o encaixe. Sem
         esta saída, o temporizador voltava a rodar sobre a forma já pronta, chamando
         `recognize()` e `onSnap` de novo a cada 620ms enquanto a caneta estivesse
         parada em cima do papel. */
      if (snapped) return;
      holdTimer = setTimeout(function () {
        if (!drawing || !pointerDown) return;
        var s = size();
        var recognized = recognize(drawing, s.width, s.height);
        if (!recognized) return;
        rawBeforeSnap = clone(drawing);
        Object.keys(drawing).forEach(function (key) {
          delete drawing[key];
        });
        Object.assign(drawing, recognized);
        snapped = true;
        redraw();
        if (options.onSnap) options.onSnap(drawing.shape);
      }, HOLD_MS);
    }
    /* Os dois botões da caneta.
     *
     * o professor, 13/08: *"ele tem uns botões laterais sem uso. E às vezes ao escrever o
     * botão direito do mouse aplica"*. As duas frases são o mesmo evento. O Wacom One
     * manda o botão de baixo como clique direito e o de cima como clique do meio; o
     * `begin` recusava qualquer botão que não fosse a ponta e saía ANTES do
     * `preventDefault`, então o menu de contexto abria no meio da escrita.
     *
     * A regra é: o botão só vale se já estiver apertado QUANDO A PONTA ENCOSTA. Apertar
     * no meio de um traço não faz nada — que é justamente o esbarrão que ele descreve.
     *
     * A escolha de qual botão faz o quê não é arbitrária. O de baixo é o que o dedo
     * esbarra, então ele ganha o laser: se sair sem querer, o pior que acontece é um
     * risco vermelho que some sozinho em 1,8s. A borracha, que apaga de verdade, fica
     * no de cima, que exige ir buscar. */
    var ATALHO_BARRIL = { 2: "laser", 4: "eraserPartial" };
    var ferramentaAntesDoBarril = null;

    function atalhoDoBarril(event) {
      var apertados = Number(event.buttons || 0);
      if (apertados & 2) return ATALHO_BARRIL[2];
      if (apertados & 4) return ATALHO_BARRIL[4];
      return null;
    }

    function begin(event) {
      if (options.disabled && options.disabled()) return;
      if (event.isPrimary === false || activePointerId !== null) return;
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();

      var atalho = atalhoDoBarril(event);
      if (atalho && atalho !== tool) {
        ferramentaAntesDoBarril = tool;
        setTool(atalho);
      }
      pointerDown = true;
      activePointerId = event.pointerId == null ? "__legacy__" : event.pointerId;
      activePointerType = event.pointerType || "mouse";
      if (canvas.setPointerCapture && event.pointerId != null) {
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch (error) {}
      }
      guiaAtiva = tool === "pen" || tool === "highlighter" ? guiaNoInicio(event) : null;
      var p = point(event);
      if (tool === "laser") {
        laserGesture = {
          id: uid("laser"),
          color: color(),
          width: currentWidth(),
          points: [],
          startedAt: performance.now(),
          endedAt: null,
        };
        laserGestures.push(laserGesture);
        addLaser(p);
        return;
      }
      if (isEraser()) {
        options.beforeChange();
        erasing = true;
        eraserChanged = eraseAt(p);
        return;
      }
      options.beforeChange();
      drawing = {
        id: uid("stroke"),
        tool: tool,
        color: color(),
        width: options.normalizeWidth ? currentWidth() / Math.max(1, p.width) : currentWidth(),
        opacity: tool === "highlighter" ? 0.26 : 1,
        points: [p.nx, p.ny],
        pressure: [pressure(event)],
        createdAt: new Date().toISOString(),
      };
      options.getStrokes().push(drawing);
      snapped = false;
      rawBeforeSnap = null;
      redraw();
      scheduleHold();
    }
    function move(event, renderNow) {
      if (!samePointer(event)) return;
      if (contactLost(event)) {
        end(event);
        return;
      }
      if (options.disabled && options.disabled()) return;
      updateCursor(event);
      var p = point(event);
      if (tool === "laser" && pointerDown && laserGesture) {
        event.preventDefault();
        addLaser(p);
        return;
      }
      if (erasing && isEraser()) {
        event.preventDefault();
        eraserChanged = eraseAt(p) || eraserChanged;
        return;
      }
      if (!drawing || !pointerDown || (tool !== "pen" && tool !== "highlighter")) return;
      event.preventDefault();
      var points = drawing.points;
      var lx = points[points.length - 2],
        ly = points[points.length - 1];
      var avanco = Math.hypot(p.nx - lx, p.ny - ly);

      /* Desfazer o encaixe é decisão separada de continuar o traço, e com limiar MUITO
         maior — UNSNAP_MIN contra os 0,0011 de amostragem.

         Antes o desencaixe vinha antes do limiar e disparava em QUALQUER pointermove.
         Como o listener processa até 8 eventos coalescidos e uma caneta manda 120-240
         por segundo, bastava o tremor de segurar parado — ou os eventos que o navegador
         emite no instante em que a ponta levanta — para restaurar o traço cru. O `end()`
         então via `snapped === false` e simplificava o rabisco.

         o professor, 12/08, descrevendo exatamente isso: *"ele ameaça desenhar mas aí ao tirar
         a ponta da caneta ele vira traço torto de novo"*.

         Também não desfaz enquanto a ponta está saindo: pressão caindo a quase zero é
         levantar a caneta, não corrigir o desenho. */
      if (snapped && rawBeforeSnap) {
        var levantando =
          activePointerType === "pen" && isFinite(Number(event.pressure)) && Number(event.pressure) <= 0.02;
        if (avanco >= UNSNAP_MIN && !levantando) {
          Object.keys(drawing).forEach(function (key) {
            delete drawing[key];
          });
          Object.assign(drawing, rawBeforeSnap);
          snapped = false;
          rawBeforeSnap = null;
          points = drawing.points;
          lx = points[points.length - 2];
          ly = points[points.length - 1];
        } else {
          /* Encaixado e parado: o traço já é a forma. Não acumula ponto, senão o
             movimento residual da mão volta a entortar a geometria por dentro. */
          return;
        }
      }

      if (avanco < 0.0011) return;
      points.push(p.nx, p.ny);
      drawing.pressure.push(pressure(event));
      if (renderNow !== false) queueRedraw();
    }
    function end(event) {
      if (!samePointer(event)) return;
      var pointerId = activePointerId;
      clearTimeout(holdTimer);
      if (renderFrame) {
        cancelAnimationFrame(renderFrame);
        renderFrame = 0;
      }
      pointerDown = false;
      activePointerId = null;
      activePointerType = "";
      guiaAtiva = null;
      if (drawing) {
        var s = size();
        var finalStroke = snapped ? drawing : simplifyStroke(drawing, s.width, s.height);
        var strokes = options.getStrokes();
        strokes[strokes.length - 1] = finalStroke || drawing;
        drawing = null;
        snapped = false;
        rawBeforeSnap = null;
        redraw();
        options.changed();
      }
      if (erasing) {
        erasing = false;
        if (eraserChanged) options.changed();
        else options.rollbackChange();
        eraserChanged = false;
      }
      if (laserGesture) {
        laserGesture.endedAt = performance.now();
        laserGesture = null;
      }
      /* Soltou a ponta: a ferramenta volta a ser a que estava escolhida na barra. O
         botão da caneta é modificador momentâneo, não troca de ferramenta. */
      if (ferramentaAntesDoBarril) {
        setTool(ferramentaAntesDoBarril);
        ferramentaAntesDoBarril = null;
      }
      if (pointerId !== null && pointerId !== "__legacy__" && canvas.releasePointerCapture) {
        try {
          canvas.releasePointerCapture(pointerId);
        } catch (error) {}
      }
    }
    function addLaser(p) {
      var now = performance.now();
      laserGesture.points.push({ x: p.nx, y: p.ny, t: now });
      if (laserGesture.points.length > 240)
        laserGesture.points.splice(0, laserGesture.points.length - 240);
    }
    function eraseAt(p) {
      var radius = Math.max(4, currentWidth());
      var strokes = options.getStrokes();
      if (tool === "eraserStroke") {
        var kept = strokes.filter(function (stroke) {
          return !strokeHit(stroke, p.x, p.y, radius, p.width, p.height);
        });
        if (kept.length === strokes.length) return false;
        options.setStrokes(kept);
        redraw();
        return true;
      }
      var changed = false,
        next = [];
      strokes.forEach(function (stroke) {
        var pieces = splitStroke(stroke, p.x, p.y, radius, p.width, p.height, function () {
          return uid("piece");
        });
        if (pieces === null) next.push(stroke);
        else {
          changed = true;
          Array.prototype.push.apply(next, pieces);
        }
      });
      if (changed) {
        options.setStrokes(next);
        redraw();
      }
      return changed;
    }
    function redraw() {
      var s = size();
      ctx.clearRect(0, 0, s.width, s.height);
      var strokes = options.getStrokes();
      strokes
        .filter(function (stroke) {
          return stroke.tool === "highlighter";
        })
        .forEach(function (stroke) {
          drawStroke(ctx, stroke, s.width, s.height);
        });
      strokes
        .filter(function (stroke) {
          return stroke.tool !== "highlighter";
        })
        .forEach(function (stroke) {
          drawStroke(ctx, stroke, s.width, s.height);
        });
    }
    function queueRedraw() {
      if (renderFrame) return;
      renderFrame = requestAnimationFrame(function () {
        renderFrame = 0;
        redraw();
      });
    }
    function drawLaser(now) {
      var s = size();
      laserCtx.clearRect(0, 0, s.width, s.height);
      laserGestures = laserGestures.filter(function (gesture) {
        var end = gesture.endedAt || now;
        return now - end < LASER_MS;
      });
      laserGestures.forEach(function (gesture) {
        if (!gesture.points.length) return;
        var end = gesture.endedAt || now;
        var alpha = clamp(1 - (now - end) / LASER_MS, 0, 1);
        laserCtx.save();
        laserCtx.globalAlpha = alpha;
        laserCtx.strokeStyle = gesture.color;
        laserCtx.lineWidth = Math.max(2, gesture.width);
        laserCtx.lineCap = "round";
        laserCtx.lineJoin = "round";
        laserCtx.shadowColor = hexToRgba(gesture.color, alpha);
        laserCtx.shadowBlur = 10;
        if (gesture.points.length === 1) {
          laserCtx.fillStyle = gesture.color;
          laserCtx.beginPath();
          laserCtx.arc(
            gesture.points[0].x * s.width,
            gesture.points[0].y * s.height,
            Math.max(2, gesture.width / 2),
            0,
            Math.PI * 2,
          );
          laserCtx.fill();
        } else {
          var flat = [];
          gesture.points.forEach(function (p) {
            flat.push(p.x, p.y);
          });
          smoothPath(laserCtx, flat, s.width, s.height);
          laserCtx.stroke();
        }
        laserCtx.restore();
      });
    }
    function tick(now) {
      drawLaser(now);
      laserFrame = requestAnimationFrame(tick);
    }
    function updateCursor(event) {
      if (!eraserCursor) return;
      if (!isEraser()) {
        eraserCursor.style.display = "none";
        return;
      }
      var diameter = currentWidth() * 2;
      eraserCursor.style.width = diameter + "px";
      eraserCursor.style.height = diameter + "px";
      if (event) {
        eraserCursor.style.left = event.clientX + "px";
        eraserCursor.style.top = event.clientY + "px";
        eraserCursor.style.display = "block";
      }
    }
    function setTool(next) {
      tool = next;
      canvas.classList.toggle("eraser-active", isEraser());
      canvas.classList.toggle("laser-active", tool === "laser");
      updateCursor();
    }
    function resize(width, height, dpr) {
      dpr = dpr || Math.min(window.devicePixelRatio || 1, 2);
      [canvas, laserCanvas].forEach(function (item) {
        item.width = Math.max(1, Math.round(width * dpr));
        item.height = Math.max(1, Math.round(height * dpr));
        item.style.width = width + "px";
        item.style.height = height + "px";
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      laserCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }
    /* Sem isto o botão de baixo da caneta abre o menu do navegador em cima da folha —
       e ele abre mesmo quando o traço já começou, porque o `begin` devolve cedo. Numa
       superfície de escrita não existe uso legítimo para o menu de contexto. */
    canvas.addEventListener("contextmenu", function (event) { event.preventDefault(); });
    canvas.addEventListener("pointerdown", begin);
    canvas.addEventListener("pointermove", function (event) {
      var samples = event.getCoalescedEvents ? event.getCoalescedEvents() : [];
      if (!samples || !samples.length) samples = [event];
      else {
        samples = samples.slice(Math.max(0, samples.length - 8));
        samples.push(event);
      }
      samples.forEach(function (sample) {
        move(sample, true);
      });
      scheduleHold();
    });
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("lostpointercapture", end);
    canvas.addEventListener("pointerleave", function () {
      if (eraserCursor) eraserCursor.style.display = "none";
    });
    window.addEventListener("blur", function () {
      if (activePointerId !== null) end({ pointerId: activePointerId });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && activePointerId !== null) end({ pointerId: activePointerId });
    });
    laserFrame = requestAnimationFrame(tick);
    return {
      setTool: setTool,
      redraw: redraw,
      resize: resize,
      updateCursor: updateCursor,
      /* Laser vindo de outra janela — a tela de projeção espelhando o professor.
       *
       * Entra na MESMA lista que o laser local, então herda o rastro, o brilho e o
       * apagar em 1800ms sem uma segunda implementação para divergir. É por isso que
       * isto mora aqui e não num script de espelho: o desenho do laser é do núcleo.
       *
       * `evento.fim` fecha o gesto e deixa o rastro apagar sozinho. Um gesto que
       * nunca receber `fim` (a janela do professor fechou no meio) some igual, porque
       * o filtro de `drawLaser` usa `endedAt || now`. */
      laserRemoto: function (evento) {
        if (!evento || !evento.id) return;
        var gesto = null;
        for (var i = 0; i < laserGestures.length; i++) {
          if (laserGestures[i].id === evento.id) { gesto = laserGestures[i]; break; }
        }
        if (!gesto) {
          if (evento.fim) return;
          gesto = {
            id: evento.id,
            color: evento.cor || color(),
            width: evento.largura || currentWidth(),
            points: [],
            startedAt: performance.now(),
            endedAt: null,
          };
          laserGestures.push(gesto);
        }
        if (evento.fim) { gesto.endedAt = performance.now(); return; }
        gesto.points.push({ x: evento.x, y: evento.y, t: performance.now() });
        if (gesto.points.length > 240) gesto.points.splice(0, gesto.points.length - 240);
      },
      /* O gesto de laser em andamento, reduzido ao que a outra janela precisa: quem é o
         gesto e onde a ponta está agora. Devolve `null` quando não há laser no papel. */
      laserAtivo: function () {
        if (!laserGesture || !laserGesture.points.length) return null;
        var ultimo = laserGesture.points[laserGesture.points.length - 1];
        return {
          id: laserGesture.id,
          cor: laserGesture.color,
          largura: laserGesture.width,
          x: ultimo.x,
          y: ultimo.y
        };
      },
      getTool: function () {
        return tool;
      },
      destroy: function () {
        cancelAnimationFrame(laserFrame);
        if (renderFrame) cancelAnimationFrame(renderFrame);
        clearTimeout(holdTimer);
      },
    };
  }
  window.ModoAulaInkCore = { create: create, recognize: recognize, drawStroke: drawStroke };
})();
