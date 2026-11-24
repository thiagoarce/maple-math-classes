/* Camada de imagens locais: arquivo, colar e arrastar; nunca entra no checkpoint KV. */
(function () {
  "use strict";
  if (window.MALocalImages) return;

  var DB = window.MAObjectDB;
  if (!DB) return;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function uid(prefix) {
    return crypto.randomUUID ? crypto.randomUUID() :
      prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  }
  function isImage(file) { return !!(file && /^(?:image\/(?:png|jpeg|webp|gif|bmp|avif))$/i.test(file.type || "") && file.size <= 15 * 1024 * 1024); }
  function dimensions(blob) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(blob);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve({ width: image.naturalWidth || 1, height: image.naturalHeight || 1 });
      };
      image.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Imagem inválida")); };
      image.src = url;
    });
  }

  function create(options) {
    var parent = options.parent;
    var layer = document.createElement("div");
    layer.className = "ma-object-layer";
    parent.insertBefore(layer, options.before || parent.firstChild);

    var state = { scope: "", items: [] };
    var urls = Object.create(null);
    var token = 0;
    var saveTimer = null;

    function rect() { return parent.getBoundingClientRect(); }
    function scope() { return String(options.getScope()); }
    function maxZ() {
      return state.items.reduce(function (max, item) { return Math.max(max, Number(item.z) || 0); }, 0);
    }
    function minZ() {
      return state.items.reduce(function (min, item) { return Math.min(min, Number(item.z) || 0); }, 0);
    }
    function clearUrls() {
      Object.keys(urls).forEach(function (id) { URL.revokeObjectURL(urls[id]); });
      urls = Object.create(null);
    }
    function save() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        if (state.scope) DB.put(DB.LAYOUTS, clone(state)).catch(function (error) {
          console.error("Falha ao salvar imagem local", error);
        });
      }, 160);
    }
    function get(id) {
      return state.items.find(function (item) { return item.id === id; }) || null;
    }
    function render() {
      var box = rect();
      var present = Object.create(null);
      state.items.slice().sort(function (a, b) { return (a.z || 0) - (b.z || 0); }).forEach(function (item) {
        present[item.id] = true;
        var image = layer.querySelector('[data-local-image="' + item.id + '"]');
        if (!image) {
          image = document.createElement("img");
          image.className = "ma-local-image";
          image.setAttribute("data-local-image", item.id);
          image.alt = item.name || "Imagem inserida";
          layer.appendChild(image);
          DB.get(DB.ASSETS, item.assetId).then(function (record) {
            if (!record || !record.blob || !image.isConnected) return;
            var url = URL.createObjectURL(record.blob);
            urls[item.id] = url;
            image.src = url;
          }).catch(function () {});
        }
        image.style.left = item.x * box.width + "px";
        image.style.top = item.y * box.height + "px";
        image.style.width = item.width * box.width + "px";
        image.style.height = item.height * box.height + "px";
        image.style.transform = "rotate(" + (item.rotation || 0) + "deg)";
        image.style.opacity = String(item.opacity == null ? 1 : item.opacity);
        image.style.zIndex = String(item.z || 0);
        /* Recorte: frações da imagem original cortadas de cada lado. `object-view-box`
           mostra só aquele pedaço, esticado para a caixa — que já tem a proporção dele. */
        var c = item.crop;
        if (c && (c.l || c.t || c.r || c.b)) {
          image.style.setProperty("object-view-box", "inset(" + [c.t, c.r, c.b, c.l].map(function (v) { return (v * 100).toFixed(3) + "%"; }).join(" ") + ")");
          image.setAttribute("data-crop", [c.l, c.t, c.r, c.b].join(","));
        } else {
          image.style.removeProperty("object-view-box");
          image.removeAttribute("data-crop");
        }
      });
      Array.prototype.slice.call(layer.querySelectorAll("[data-local-image]")).forEach(function (node) {
        var id = node.getAttribute("data-local-image");
        if (present[id]) return;
        if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; }
        node.remove();
      });
      if (options.onRender) options.onRender();
    }
    function load(force) {
      var next = scope();
      if (!force && next === state.scope) { render(); return Promise.resolve(); }
      var current = ++token;
      clearUrls();
      state = { scope: next, items: [] };
      render();
      return DB.get(DB.LAYOUTS, next).then(function (stored) {
        if (current !== token) return;
        state = stored && Array.isArray(stored.items) ? stored : { scope: next, items: [] };
        state.items.forEach(function (item) {
          if (item.opacity == null) item.opacity = 1;
          if (item.rotation == null) item.rotation = 0;
          if (item.z == null) item.z = 0;
        });
        render();
      }).catch(function () { render(); });
    }
    function insert(blob, name) {
      if (!isImage(blob)) return Promise.resolve(null);
      return dimensions(blob).then(function (size) {
        var assetId = uid("asset");
        return DB.put(DB.ASSETS, {
          id: assetId,
          blob: blob,
          name: name || "Imagem",
          type: blob.type,
          createdAt: new Date().toISOString()
        }).then(function () {
          var box = rect();
          var scale = Math.min(1, box.width * .42 / size.width, box.height * .42 / size.height);
          var width = Math.max(60, size.width * scale);
          var height = Math.max(60, size.height * scale);
          var item = {
            id: uid("image"),
            assetId: assetId,
            name: name || "Imagem",
            x: .5 - width / box.width / 2,
            y: .5 - height / box.height / 2,
            width: width / box.width,
            height: height / box.height,
            rotation: 0,
            opacity: 1,
            locked: false,
            z: maxZ() + 1,
            localOnly: true,
            createdAt: new Date().toISOString()
          };
          state.items.push(item);
          save();
          render();
          return item;
        });
      });
    }
    function insertFiles(files) {
      var result = Promise.resolve(null);
      Array.prototype.slice.call(files || []).filter(isImage).forEach(function (file) {
        result = result.then(function () { return insert(file, file.name); });
      });
      return result;
    }
    function remove(id) {
      state.items = state.items.filter(function (item) { return item.id !== id; });
      save();
      render();
    }
    function duplicate(id) {
      var original = get(id);
      if (!original) return null;
      var copy = clone(original);
      copy.id = uid("image");
      copy.x += .025;
      copy.y += .025;
      copy.z = maxZ() + 1;
      state.items.push(copy);
      save();
      render();
      return copy;
    }
    function reorder(id, direction) {
      var item = get(id);
      if (!item) return;
      item.z = direction === "front" ? maxZ() + 1 : minZ() - 1;
      save();
      render();
    }
    function changed() { save(); render(); }

    load(true);
    return {
      layer: layer,
      get: get,
      all: function () { return state.items; },
      snapshot: function () { return clone(state.items); },
      insert: insert,
      insertFiles: insertFiles,
      remove: remove,
      duplicate: duplicate,
      reorder: reorder,
      changed: changed,
      refresh: function () { return load(false); },
      reload: function () { return load(true); },
      render: render,
      maxZ: maxZ,
      getBlob: function (assetId) {
        return DB.get(DB.ASSETS, assetId).then(function (record) { return record && record.blob || null; });
      }
    };
  }

  window.MALocalImages = { create: create, isImage: isImage };
})();
