/* Expõe uma ponte mínima para ferramentas adicionais sem acoplar o motor de tinta. */
(function () {
  "use strict";
  var core = window.ModoAulaInkCore;
  if (!core || core.__bridgeInstalled) return;
  core.__bridgeInstalled = true;
  window.__modoAulaInkBridge = true;
  core.instances = core.instances || [];
  var originalCreate = core.create;
  core.create = function (options) {
    var instance = originalCreate(options);
    instance.canvas = options.canvas;
    instance.laserCanvas = options.laserCanvas;
    instance.getStrokes = options.getStrokes;
    instance.setStrokes = options.setStrokes;
    instance.beforeChange = options.beforeChange;
    instance.rollbackChange = options.rollbackChange || function () {};
    instance.changed = options.changed;
    instance.disabled = options.disabled || function () { return false; };
    instance.getWidthForTool = options.getWidth;
    instance.getColorForTool = options.getColor;
    instance.normalizesWidth = !!options.normalizeWidth;
    options.canvas.__modoAulaInkInstance = instance;
    core.instances.push(instance);
    window.dispatchEvent(new CustomEvent("modo-aula-ink-instance", { detail: { instance: instance } }));
    return instance;
  };
})();
