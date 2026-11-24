/* Seleção, movimento, rotação e redimensionamento de tinta e imagens.
 *
 * Ele, 29/09: *"Não tem ferramenta de multiseleção ainda"* e *"inserir a imagem mas
 * quando redimensiona fica ruim, perde proporção, não tem como fixar a proporção se
 * quiser, dar crop etc."*
 *
 *  - Arrastar do vazio desenha um retângulo e seleciona tudo o que ele toca; Shift (ou
 *    Ctrl) + toque soma ou tira um objeto; Ctrl+A pega a página inteira.
 *  - O grupo move, gira, escala (sempre na mesma proporção), duplica, bloqueia, muda a
 *    opacidade e apaga junto — a tinta do grupo é UM desfazer.
 *  - Imagem sozinha: proporção travada por padrão, com botão para soltar; e Recortar,
 *    em que as alças passam a cortar em vez de escalar.
 *
 * A proporção se perdia porque era calculada nas frações da folha (largura/altura
 * normalizadas por dimensões diferentes); agora é calculada em pixels.
 */
(function () {
  "use strict";
  if (window.MASelection) return;

  var G = window.MAObjectGeometry;
  if (!G) return;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function uid(prefix) {
    return crypto.randomUUID ? crypto.randomUUID() :
      prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function rotatePoint(x, y, cx, cy, angle) {
    var cos = Math.cos(angle), sin = Math.sin(angle);
    var dx = x - cx, dy = y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  }
  function same(a, b) { return !!a && !!b && a.type === b.type && a.id === b.id; }
  /* Segmento contra retângulo (Liang–Barsky): o laço "toca" a tinta mesmo quando só
     cruza um lado de um retângulo desenhado, que tem cinco pontos e nenhum no meio. */
  function segmentHitsRect(x1, y1, x2, y2, r) {
    var t0 = 0, t1 = 1, dx = x2 - x1, dy = y2 - y1;
    var p = [-dx, dx, -dy, dy], q = [x1 - r.x, r.x + r.width - x1, y1 - r.y, r.y + r.height - y1];
    for (var i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] < 0) return false; continue; }
      var t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return true;
  }
  var ICONE = {
    duplicate: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    back: '<path d="M12 4v13M7 12l5 5 5-5M5 20h14"/>',
    front: '<path d="M12 20V7M7 12l5-5 5 5M5 4h14"/>',
    aspect: '<rect x="4" y="7" width="16" height="10" rx="1.5"/><path d="M9 7v10M15 7v10" stroke-dasharray="2 2"/>',
    crop: '<path d="M6 2v16h16"/><path d="M2 6h16v16"/>',
    delete: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'
  };
  function icone(nome) {
    return '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + ICONE[nome] + "</svg>";
  }

  function create(options) {
    var parent = options.parent;
    var ink = options.ink;
    var images = options.images;
    var overlay = document.createElement("div");
    overlay.className = "ma-selection-layer";
    parent.appendChild(overlay);

    var box = document.createElement("div");
    box.className = "ma-selection-box";
    box.innerHTML = [
      '<span class="ma-rotate-line"></span>',
      '<span class="ma-handle" data-handle="rotate"></span>',
      '<span class="ma-handle" data-handle="nw"></span>',
      '<span class="ma-handle" data-handle="ne"></span>',
      '<span class="ma-handle" data-handle="sw"></span>',
      '<span class="ma-handle" data-handle="se"></span>'
    ].join("");
    overlay.appendChild(box);
    var marquee = document.createElement("div");
    marquee.className = "ma-marquee";
    overlay.appendChild(marquee);
    var ghost = document.createElement("div");
    ghost.className = "ma-crop-ghost";
    overlay.appendChild(ghost);

    var tools = document.createElement("div");
    tools.className = "ma-object-toolbar";
    tools.innerHTML = [
      '<span class="ma-sel-count"></span>',
      '<button type="button" data-action="duplicate" title="Duplicar (Ctrl+D)">' + icone("duplicate") + '</button>',
      '<button type="button" data-action="aspect" title="Proporção travada — toque para soltar">' + icone("aspect") + '</button>',
      '<button type="button" data-action="crop" title="Recortar a imagem">' + icone("crop") + '</button>',
      '<button type="button" data-action="lock" title="Bloquear ou desbloquear">' + icone("lock") + '</button>',
      '<button type="button" data-action="back" title="Enviar para trás">' + icone("back") + '</button>',
      '<button type="button" data-action="front" title="Trazer para frente">' + icone("front") + '</button>',
      '<label title="Opacidade">◐ <input type="range" min="20" max="100" value="100" data-action="opacity"></label>',
      '<button type="button" data-action="delete" title="Excluir (Delete)">' + icone("delete") + '</button>'
    ].join("");
    parent.appendChild(tools);

    var active = false;
    var selected = [];
    var gesture = null;
    var opacityOriginal = null;
    var cropping = false;

    function rect() { return parent.getBoundingClientRect(); }
    function strokes() { return ink.getStrokes() || []; }
    function objectOf(ref) {
      if (!ref) return null;
      return ref.type === "image"
        ? images.get(ref.id)
        : strokes().find(function (stroke) { return stroke.id === ref.id; }) || null;
    }
    function live() {
      return selected.filter(function (ref) { return !!objectOf(ref); });
    }
    function single() { var l = live(); return l.length === 1 ? l[0] : null; }
    function singleImage() { var s = single(); return s && s.type === "image" ? images.get(s.id) : null; }
    function imageBounds(item) {
      var r = rect();
      return {
        x: item.x * r.width,
        y: item.y * r.height,
        width: item.width * r.width,
        height: item.height * r.height,
        rotation: item.rotation || 0
      };
    }
    /* Caixa alinhada aos eixos de uma imagem girada: é o que entra na caixa do grupo. */
    function imageAabb(item) {
      var b = imageBounds(item);
      var cx = b.x + b.width / 2, cy = b.y + b.height / 2, a = b.rotation * Math.PI / 180;
      var xs = [], ys = [];
      [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].forEach(function (c) {
        var q = rotatePoint(c[0], c[1], cx, cy, a); xs.push(q.x); ys.push(q.y);
      });
      var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
      return { x: minX, y: minY, width: Math.max.apply(null, xs) - minX, height: Math.max.apply(null, ys) - minY, rotation: 0 };
    }
    function boundsOf(ref) {
      var object = objectOf(ref);
      if (!object) return null;
      var r = rect();
      return ref.type === "image" ? imageAabb(object) : G.bounds(object, r.width, r.height);
    }
    function selectionBounds() {
      var list = live();
      if (!list.length) return null;
      if (list.length === 1 && list[0].type === "image") return imageBounds(images.get(list[0].id));
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      list.forEach(function (ref) {
        var b = boundsOf(ref);
        if (!b) return;
        minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
      });
      if (!isFinite(minX)) return null;
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY, rotation: 0 };
    }
    function point(event) {
      var r = rect();
      return {
        x: G.clamp(event.clientX - r.left, 0, r.width),
        y: G.clamp(event.clientY - r.top, 0, r.height),
        width: r.width || 1,
        height: r.height || 1
      };
    }
    function imageHit(item, p) {
      var b = imageBounds(item);
      var cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      var local = rotatePoint(p.x, p.y, cx, cy, -(item.rotation || 0) * Math.PI / 180);
      return local.x >= b.x && local.x <= b.x + b.width && local.y >= b.y && local.y <= b.y + b.height;
    }
    function hitTest(p) {
      var list = strokes();
      for (var i = list.length - 1; i >= 0; i--) {
        if (G.hit(list[i], p.x, p.y, 7, p.width, p.height)) return { type: "stroke", id: list[i].id };
      }
      var localImages = images.all().slice().sort(function (a, b) { return (b.z || 0) - (a.z || 0); });
      for (var j = 0; j < localImages.length; j++) {
        if (imageHit(localImages[j], p)) return { type: "image", id: localImages[j].id };
      }
      return null;
    }
    function inMarquee(m) {
      var r = rect(), found = [];
      strokes().forEach(function (stroke) {
        var pts = stroke.points || [];
        if (pts.length < 2) return;
        var hitAny = false;
        if (pts.length === 2) {
          var x = pts[0] * r.width, y = pts[1] * r.height;
          hitAny = x >= m.x && x <= m.x + m.width && y >= m.y && y <= m.y + m.height;
        }
        for (var i = 0; !hitAny && i < pts.length - 2; i += 2) {
          hitAny = segmentHitsRect(pts[i] * r.width, pts[i + 1] * r.height, pts[i + 2] * r.width, pts[i + 3] * r.height, m);
        }
        if (hitAny) found.push({ type: "stroke", id: stroke.id });
      });
      images.all().forEach(function (item) {
        var b = imageAabb(item);
        if (b.x <= m.x + m.width && b.x + b.width >= m.x && b.y <= m.y + m.height && b.y + b.height >= m.y) {
          found.push({ type: "image", id: item.id });
        }
      });
      return found;
    }
    function setSelected(value) {
      selected = !value ? [] : Array.isArray(value) ? value.slice() : [value];
      if (!singleImage()) cropping = false;
      render();
      if (options.onSelected) options.onSelected(selected.length ? clone(selected[0]) : null);
    }
    function render() {
      var list = live();
      var b = selectionBounds();
      marquee.classList.toggle("visible", !!(gesture && gesture.action === "marquee"));
      if (!active || !b || !list.length) {
        box.classList.remove("visible");
        tools.classList.remove("visible");
        ghost.classList.remove("visible");
        return;
      }
      var r = rect();
      box.classList.add("visible");
      box.classList.toggle("cropping", cropping);
      box.classList.toggle("group", list.length > 1);
      box.style.left = b.x + "px";
      box.style.top = b.y + "px";
      box.style.width = b.width + "px";
      box.style.height = b.height + "px";
      box.style.transform = "rotate(" + (b.rotation || 0) + "deg)";
      var image = singleImage();
      if (image && cropping) {
        var full = fullImageRect(image, r);
        ghost.style.left = full.x + "px";
        ghost.style.top = full.y + "px";
        ghost.style.width = full.width + "px";
        ghost.style.height = full.height + "px";
        ghost.style.transform = "rotate(" + (image.rotation || 0) + "deg)";
        ghost.style.transformOrigin = (b.x + b.width / 2 - full.x) + "px " + (b.y + b.height / 2 - full.y) + "px";
        ghost.classList.add("visible");
      } else ghost.classList.remove("visible");
      tools.style.left = G.clamp(b.x, 4, Math.max(4, r.width - 360)) + "px";
      tools.style.top = Math.max(4, b.y - 50) + "px";
      tools.classList.add("visible");
      tools.querySelector(".ma-sel-count").textContent = list.length > 1 ? list.length + " itens" : "";
      tools.querySelector('[data-action="aspect"]').hidden = !image;
      tools.querySelector('[data-action="crop"]').hidden = !image;
      if (image) {
        var livre = !!image.freeAspect;
        var botao = tools.querySelector('[data-action="aspect"]');
        botao.classList.toggle("active", !livre);
        botao.title = livre ? "Proporção livre — toque para travar" : "Proporção travada — toque para soltar";
        tools.querySelector('[data-action="crop"]').classList.toggle("active", cropping);
      }
      var objects = list.map(objectOf);
      tools.querySelector('[data-action="lock"]').classList.toggle("active", objects.every(function (o) { return o.locked; }));
      var first = objects[0];
      tools.querySelector('[data-action="opacity"]').value = String(Math.round((first.opacity == null ? 1 : first.opacity) * 100));
    }
    function setActive(value) {
      active = !!value;
      overlay.classList.toggle("active", active);
      if (!active) { cropping = false; setSelected(null); }
      render();
    }
    function hasStrokes(list) { return list.some(function (ref) { return ref.type === "stroke"; }); }
    function hasImages(list) { return list.some(function (ref) { return ref.type === "image"; }); }
    function beginStrokeChange() { ink.beforeChange(); }
    function finishStrokeChange(changed) {
      if (changed) { ink.redraw(); ink.changed(); }
      else ink.rollbackChange();
    }

    /* ---- recorte ---- */
    function cropOf(item) {
      var c = item.crop || {};
      return { l: c.l || 0, t: c.t || 0, r: c.r || 0, b: c.b || 0 };
    }
    /* A imagem inteira (sem recorte), em px, no referencial não girado da imagem. */
    function fullImageRect(item, r) {
      var c = cropOf(item);
      var w = item.width * r.width / Math.max(.02, 1 - c.l - c.r);
      var h = item.height * r.height / Math.max(.02, 1 - c.t - c.b);
      return { x: item.x * r.width - c.l * w, y: item.y * r.height - c.t * h, width: w, height: h };
    }
    function cropImage(item, original, handle, p) {
      var r = rect();
      var b = imageBounds(original);
      var cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      var local = rotatePoint(p.x, p.y, cx, cy, -(original.rotation || 0) * Math.PI / 180);
      var full = fullImageRect(original, r);
      var left = b.x, top = b.y, right = b.x + b.width, bottom = b.y + b.height;
      if (/w/.test(handle)) left = G.clamp(local.x, full.x, right - 20);
      if (/e/.test(handle)) right = G.clamp(local.x, left + 20, full.x + full.width);
      if (/n/.test(handle)) top = G.clamp(local.y, full.y, bottom - 20);
      if (/s/.test(handle)) bottom = G.clamp(local.y, top + 20, full.y + full.height);
      item.crop = {
        l: (left - full.x) / full.width,
        t: (top - full.y) / full.height,
        r: (full.x + full.width - right) / full.width,
        b: (full.y + full.height - bottom) / full.height
      };
      item.x = left / r.width;
      item.y = top / r.height;
      item.width = (right - left) / r.width;
      item.height = (bottom - top) / r.height;
    }

    /* ---- transformações ---- */
    function resizeImage(item, original, handle, p) {
      var r = rect();
      var x1 = original.x * r.width, y1 = original.y * r.height;
      var x2 = (original.x + original.width) * r.width;
      var y2 = (original.y + original.height) * r.height;
      var anchorX = /w/.test(handle) ? x2 : x1;
      var anchorY = /n/.test(handle) ? y2 : y1;
      var width = Math.max(24, Math.abs(p.x - anchorX));
      var height = Math.max(24, Math.abs(p.y - anchorY));
      if (!original.freeAspect) {
        var aspect = Math.max(.02, (x2 - x1) / Math.max(1, y2 - y1));
        if (width / height > aspect) height = width / aspect; else width = height * aspect;
      }
      item.x = (/w/.test(handle) ? anchorX - width : anchorX) / r.width;
      item.y = (/n/.test(handle) ? anchorY - height : anchorY) / r.height;
      item.width = width / r.width;
      item.height = height / r.height;
    }
    function rotateImage(item, original, p, startAngle) {
      var b = imageBounds(original);
      var angle = Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2));
      item.rotation = (original.rotation || 0) + (angle - startAngle) * 180 / Math.PI;
    }
    /* Grupo: cada objeto passa pela mesma transformação de pontos em px. */
    function applyToGroup(fn, imageFn) {
      var r = rect();
      gesture.originals.forEach(function (entry) {
        var object = objectOf(entry.ref);
        if (!object || entry.original.locked) return;
        if (entry.ref.type === "image") { imageFn(object, entry.original, r); return; }
        var pts = entry.original.points, out = [];
        for (var i = 0; i < pts.length; i += 2) {
          var q = fn(pts[i] * r.width, pts[i + 1] * r.height);
          out.push(q.x / r.width, q.y / r.height);
        }
        object.points = out;
      });
    }
    function groupMove(dx, dy) {
      applyToGroup(function (x, y) { return { x: x + dx, y: y + dy }; }, function (item, o, r) {
        item.x = o.x + dx / r.width; item.y = o.y + dy / r.height;
      });
    }
    function groupScale(handle, p) {
      var b = gesture.bounds;
      var ax = /w/.test(handle) ? b.x + b.width : b.x;
      var ay = /n/.test(handle) ? b.y + b.height : b.y;
      var s = Math.max(Math.abs(p.x - ax) / Math.max(1, b.width), Math.abs(p.y - ay) / Math.max(1, b.height));
      s = Math.max(.05, s);
      applyToGroup(function (x, y) { return { x: ax + (x - ax) * s, y: ay + (y - ay) * s }; }, function (item, o, r) {
        var cx = (o.x + o.width / 2) * r.width, cy = (o.y + o.height / 2) * r.height;
        var ncx = ax + (cx - ax) * s, ncy = ay + (cy - ay) * s;
        var w = o.width * r.width * s, h = o.height * r.height * s;
        item.x = (ncx - w / 2) / r.width; item.y = (ncy - h / 2) / r.height;
        item.width = w / r.width; item.height = h / r.height;
      });
    }
    function groupRotate(p) {
      var b = gesture.bounds;
      var cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      var delta = Math.atan2(p.y - cy, p.x - cx) - gesture.startAngle;
      applyToGroup(function (x, y) { return rotatePoint(x, y, cx, cy, delta); }, function (item, o, r) {
        var icx = (o.x + o.width / 2) * r.width, icy = (o.y + o.height / 2) * r.height;
        var q = rotatePoint(icx, icy, cx, cy, delta);
        item.x = (q.x - o.width * r.width / 2) / r.width;
        item.y = (q.y - o.height * r.height / 2) / r.height;
        item.rotation = (o.rotation || 0) + delta * 180 / Math.PI;
      });
    }

    function down(event) {
      if (!active || (options.available && !options.available())) return;
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      var p = point(event);
      var handleNode = event.target.closest && event.target.closest("[data-handle]");
      var list = live();
      var additive = event.shiftKey || event.ctrlKey || event.metaKey;
      var action = "move";
      if (handleNode && list.length) action = handleNode.getAttribute("data-handle");
      else {
        var target = hitTest(p);
        if (!target) {
          if (!additive) setSelected(null);
          if (cropping) { cropping = false; render(); }
          gesture = { action: "marquee", start: p, base: additive ? list : [] };
          marquee.style.left = p.x + "px"; marquee.style.top = p.y + "px";
          marquee.style.width = "0px"; marquee.style.height = "0px";
          if (overlay.setPointerCapture) overlay.setPointerCapture(event.pointerId);
          render();
          return;
        }
        var already = list.some(function (ref) { return same(ref, target); });
        if (additive) {
          setSelected(already ? list.filter(function (ref) { return !same(ref, target); }) : list.concat([target]));
          return;
        }
        if (!already) setSelected(target);
        list = live();
      }
      var b = selectionBounds();
      gesture = {
        action: action,
        start: p,
        moved: false,
        bounds: b,
        originals: list.map(function (ref) { return { ref: ref, original: clone(objectOf(ref)) }; }),
        startAngle: Math.atan2(p.y - (b.y + b.height / 2), p.x - (b.x + b.width / 2))
      };
      if (hasStrokes(list)) beginStrokeChange();
      if (overlay.setPointerCapture) overlay.setPointerCapture(event.pointerId);
    }
    function move(event) {
      if (!gesture) return;
      event.preventDefault();
      var p = point(event);
      var dx = p.x - gesture.start.x, dy = p.y - gesture.start.y;
      if (gesture.action === "marquee") {
        var m = { x: Math.min(p.x, gesture.start.x), y: Math.min(p.y, gesture.start.y), width: Math.abs(dx), height: Math.abs(dy) };
        marquee.style.left = m.x + "px"; marquee.style.top = m.y + "px";
        marquee.style.width = m.width + "px"; marquee.style.height = m.height + "px";
        marquee.classList.add("visible");
        gesture.rect = m;
        return;
      }
      if (!gesture.moved && Math.hypot(dx, dy) < 2) return;
      gesture.moved = true;
      var entries = gesture.originals;
      if (entries.length === 1) {
        var entry = entries[0], object = objectOf(entry.ref);
        if (!object || entry.original.locked) return;
        if (entry.ref.type === "image") {
          if (gesture.action === "move") { var r0 = rect(); object.x = entry.original.x + dx / r0.width; object.y = entry.original.y + dy / r0.height; }
          else if (gesture.action === "rotate") rotateImage(object, entry.original, p, gesture.startAngle);
          else if (cropping) cropImage(object, entry.original, gesture.action, p);
          else resizeImage(object, entry.original, gesture.action, p);
          images.render();
        } else {
          var r = rect();
          if (gesture.action === "move") G.move(object, entry.original, dx, dy, r.width, r.height);
          else if (gesture.action === "rotate") {
            var bb = G.bounds(entry.original, r.width, r.height);
            var angle = Math.atan2(p.y - (bb.y + bb.height / 2), p.x - (bb.x + bb.width / 2));
            G.rotate(object, entry.original, angle - gesture.startAngle, r.width, r.height);
          } else G.resize(object, entry.original, gesture.action, p, r.width, r.height);
          ink.redraw();
        }
      } else {
        if (gesture.action === "move") groupMove(dx, dy);
        else if (gesture.action === "rotate") groupRotate(p);
        else groupScale(gesture.action, p);
        if (hasStrokes(entries.map(function (e) { return e.ref; }))) ink.redraw();
        if (hasImages(entries.map(function (e) { return e.ref; }))) images.render();
      }
      render();
    }
    function up(event) {
      if (!gesture) return;
      var g = gesture;
      gesture = null;
      if (g.action === "marquee") {
        marquee.classList.remove("visible");
        var found = g.rect && (g.rect.width > 3 || g.rect.height > 3) ? inMarquee(g.rect) : [];
        var next = g.base.slice();
        found.forEach(function (ref) { if (!next.some(function (x) { return same(x, ref); })) next.push(ref); });
        setSelected(next);
      } else {
        var refs = g.originals.map(function (e) { return e.ref; });
        if (hasStrokes(refs)) finishStrokeChange(g.moved);
        if (g.moved && hasImages(refs)) images.changed();
      }
      if (event && overlay.releasePointerCapture) {
        try { overlay.releasePointerCapture(event.pointerId); } catch (error) {}
      }
      render();
    }

    /* ---- ações do quadrinho ---- */
    function duplicate() {
      var list = live();
      if (!list.length) return;
      var copies = [];
      if (hasStrokes(list)) beginStrokeChange();
      list.forEach(function (ref) {
        if (ref.type === "image") {
          var copyImage = images.duplicate(ref.id);
          if (copyImage) copies.push({ type: "image", id: copyImage.id });
          return;
        }
        var copyStroke = clone(objectOf(ref));
        copyStroke.id = uid("stroke");
        for (var i = 0; i < copyStroke.points.length; i += 2) {
          copyStroke.points[i] += .02;
          copyStroke.points[i + 1] += .02;
        }
        strokes().push(copyStroke);
        copies.push({ type: "stroke", id: copyStroke.id });
      });
      if (hasStrokes(list)) finishStrokeChange(true);
      setSelected(copies);
    }
    function remove() {
      var list = live();
      if (!list.length) return;
      list.filter(function (ref) { return ref.type === "image"; }).forEach(function (ref) { images.remove(ref.id); });
      if (hasStrokes(list)) {
        beginStrokeChange();
        ink.setStrokes(strokes().filter(function (stroke) {
          return !list.some(function (ref) { return ref.type === "stroke" && ref.id === stroke.id; });
        }));
        finishStrokeChange(true);
      }
      setSelected(null);
    }
    function toggleLock() {
      var list = live();
      if (!list.length) return;
      var lock = !list.every(function (ref) { return objectOf(ref).locked; });
      if (hasStrokes(list)) beginStrokeChange();
      list.forEach(function (ref) { objectOf(ref).locked = lock; });
      if (hasStrokes(list)) finishStrokeChange(true);
      if (hasImages(list)) images.changed();
      render();
    }
    function reorder(direction) {
      var list = live();
      if (!list.length) return;
      list.filter(function (ref) { return ref.type === "image"; }).forEach(function (ref) { images.reorder(ref.id, direction); });
      if (!hasStrokes(list)) return;
      beginStrokeChange();
      var all = strokes();
      var moving = all.filter(function (s) { return list.some(function (ref) { return ref.type === "stroke" && ref.id === s.id; }); });
      var rest = all.filter(function (s) { return moving.indexOf(s) < 0; });
      ink.setStrokes(direction === "front" ? rest.concat(moving) : moving.concat(rest));
      finishStrokeChange(true);
      render();
    }
    function opacity(value, commit) {
      var list = live();
      if (!list.length) return;
      if (opacityOriginal == null) opacityOriginal = list.map(function (ref) { var o = objectOf(ref); return o.opacity == null ? 1 : o.opacity; });
      var next = G.clamp(Number(value) / 100, .2, 1);
      list.forEach(function (ref) { objectOf(ref).opacity = next; });
      if (hasStrokes(list)) ink.redraw();
      if (hasImages(list)) images.render();
      if (commit) {
        if (hasStrokes(list)) {
          list.forEach(function (ref, i) { if (ref.type === "stroke") objectOf(ref).opacity = opacityOriginal[i]; });
          beginStrokeChange();
          list.forEach(function (ref) { if (ref.type === "stroke") objectOf(ref).opacity = next; });
          finishStrokeChange(true);
        }
        if (hasImages(list)) images.changed();
        opacityOriginal = null;
      }
      render();
    }
    function toggleAspect() {
      var image = singleImage();
      if (!image) return;
      image.freeAspect = !image.freeAspect;
      images.changed();
      render();
    }
    function toggleCrop() {
      if (!singleImage()) return;
      cropping = !cropping;
      render();
    }
    function selectAll() {
      var all = strokes().map(function (s) { return { type: "stroke", id: s.id }; })
        .concat(images.all().map(function (i) { return { type: "image", id: i.id }; }));
      setSelected(all);
    }

    overlay.addEventListener("pointerdown", down);
    overlay.addEventListener("pointermove", move);
    overlay.addEventListener("pointerup", up);
    overlay.addEventListener("pointercancel", up);
    tools.addEventListener("pointerdown", function (event) { event.stopPropagation(); });
    tools.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-action]");
      if (!button) return;
      var action = button.getAttribute("data-action");
      if (action === "duplicate") duplicate();
      else if (action === "delete") remove();
      else if (action === "lock") toggleLock();
      else if (action === "aspect") toggleAspect();
      else if (action === "crop") toggleCrop();
      else if (action === "front" || action === "back") reorder(action);
    });
    var opacityControl = tools.querySelector('[data-action="opacity"]');
    opacityControl.addEventListener("input", function () { opacity(opacityControl.value, false); });
    opacityControl.addEventListener("change", function () { opacity(opacityControl.value, true); });
    document.addEventListener("keydown", function (event) {
      if (!active || (event.target && (/input|textarea|select/i.test(event.target.tagName) || event.target.isContentEditable))) return;
      if (options.available && !options.available()) return;
      var key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && key === "a") { event.preventDefault(); selectAll(); return; }
      if (!live().length) return;
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); remove(); }
      else if ((event.ctrlKey || event.metaKey) && key === "d") { event.preventDefault(); duplicate(); }
      else if (event.key === "Escape") { if (cropping) { cropping = false; render(); } else setSelected(null); }
      else if (event.key === "Enter" && cropping) { cropping = false; render(); }
    }, true);

    if (window.ResizeObserver) new ResizeObserver(render).observe(parent);
    return {
      setActive: setActive,
      isActive: function () { return active; },
      select: setSelected,
      render: render,
      clear: function () { setSelected(null); },
      getSelected: function () { return selected.length ? clone(selected[0]) : null; },
      getAll: function () { return clone(live()); }
    };
  }

  window.MASelection = { create: create };
})();
