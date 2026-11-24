/* Modo Aula — relógio, cronômetro e temporizador regressivo. */
(function () {
  "use strict";

  if (window.__modoAulaTimeWidgetsV1) return;
  window.__modoAulaTimeWidgetsV1 = true;

  var slot = "maple-demo-volume";
  if (!slot) return;

  /* A barra de botões da casca não mora mais dentro da `.topbar`: virou o trilho
     em pé grudado na gaveta (ver `montarTrilho` em `modo_aula.js`). Procurar por
     `.topbar .toolbar` devolvia `null` e este script saía calado — o botão
     simplesmente não aparecia. Procure a barra, não o lugar dela. */
  var topToolbar = document.querySelector(".toolbar");
  var fullscreenButton = document.getElementById("fullscreenBtn");
  if (!topToolbar) return;

  var STORAGE_KEY = "maple-demo:classroom:time-widgets:v1:" + slot;
  var audioContext = null;
  var timerAlarmed = false;
  var tickHandle = null;
  var resizeTimers = Object.create(null);

  var state = readState();

  injectStyles();
  var launcher = createLauncher();
  var menu = createMenu();
  var widgets = {
    clock: createClockWidget(),
    stopwatch: createStopwatchWidget(),
    timer: createTimerWidget()
  };

  restoreWidgets();
  bindGlobalEvents();
  renderAll();
  startTicker();

  function defaultState() {
    return {
      version: 1,
      menuOpen: false,
      clock: {
        visible: false,
        expanded: false,
        rect: null
      },
      stopwatch: {
        visible: false,
        expanded: false,
        rect: null,
        running: false,
        accumulatedMs: 0,
        startedAt: null
      },
      timer: {
        visible: false,
        expanded: false,
        rect: null,
        running: false,
        totalMs: 5 * 60 * 1000,
        remainingMs: 5 * 60 * 1000,
        endsAt: null,
        finished: false
      }
    };
  }

  function readState() {
    var fallback = defaultState();
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!parsed || parsed.version !== 1) return fallback;
      ["clock", "stopwatch", "timer"].forEach(function (name) {
        parsed[name] = Object.assign({}, fallback[name], parsed[name] || {});
      });
      return Object.assign(fallback, parsed);
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) {}
  }

  function iconButton(label, icon, attrs) {
    attrs = attrs || "";
    return '<button type="button" class="time-icon-btn" title="' + label + '" aria-label="' + label + '" ' + attrs + '>' + icon + '</button>';
  }

  function createLauncher() {
    var button = document.createElement("button");
    button.id = "timeWidgetsBtn";
    button.type = "button";
    button.className = "icon-btn time-launcher";
    button.title = "Relógio e temporizadores";
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v5l3 2"></path></svg>';
    if (fullscreenButton && fullscreenButton.parentElement === topToolbar) topToolbar.insertBefore(button, fullscreenButton);
    else topToolbar.appendChild(button);
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMenu();
    });
    return button;
  }

  function createMenu() {
    var panel = document.createElement("div");
    panel.id = "timeWidgetsMenu";
    panel.className = "time-widget-menu";
    panel.hidden = true;
    panel.innerHTML = [
      '<button type="button" data-show-widget="clock"><span class="time-menu-symbol">◷</span><span><strong>Relógio</strong><small>Hora atual</small></span></button>',
      '<button type="button" data-show-widget="stopwatch"><span class="time-menu-symbol">⏱</span><span><strong>Cronômetro</strong><small>Tempo crescente</small></span></button>',
      '<button type="button" data-show-widget="timer"><span class="time-menu-symbol">◴</span><span><strong>Temporizador</strong><small>Contagem regressiva</small></span></button>'
    ].join("");
    document.body.appendChild(panel);
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("[data-show-widget]");
      if (!button) return;
      showWidget(button.getAttribute("data-show-widget"));
      closeMenu();
    });
    return panel;
  }

  function createShell(name, title, symbol, bodyHtml) {
    var element = document.createElement("section");
    element.className = "time-widget time-widget-" + name;
    element.setAttribute("data-time-widget", name);
    element.hidden = true;
    element.innerHTML = [
      '<header class="time-widget-head">',
        '<span class="time-widget-symbol">' + symbol + '</span>',
        '<strong>' + title + '</strong>',
        '<span class="time-widget-spacer"></span>',
        iconButton("Ampliar ou restaurar", "⛶", 'data-time-action="expand"'),
        iconButton("Fechar", "×", 'data-time-action="close"'),
      '</header>',
      '<div class="time-widget-body">' + bodyHtml + '</div>'
    ].join("");
    document.body.appendChild(element);
    bindShell(name, element);
    return element;
  }

  function createClockWidget() {
    return createShell("clock", "Relógio", "◷", [
      '<div class="clock-display" id="classClockTime">--:--</div>',
      '<div class="clock-seconds" id="classClockSeconds">--</div>',
      '<div class="clock-date" id="classClockDate"></div>'
    ].join(""));
  }

  function createStopwatchWidget() {
    return createShell("stopwatch", "Cronômetro", "⏱", [
      '<div class="stopwatch-display" id="classStopwatchDisplay">00:00.0</div>',
      '<div class="time-primary-controls">',
        iconButton("Iniciar ou pausar", "▶", 'data-stopwatch-action="toggle" class="time-icon-btn time-primary"'),
        iconButton("Zerar", "↺", 'data-stopwatch-action="reset"'),
      '</div>'
    ].join(""));
  }

  function createTimerWidget() {
    return createShell("timer", "Temporizador", "◴", [
      '<div class="timer-ring" id="classTimerRing"><div class="timer-display" id="classTimerDisplay">05:00</div></div>',
      '<div class="time-primary-controls">',
        iconButton("Iniciar ou pausar", "▶", 'data-timer-action="toggle" class="time-icon-btn time-primary"'),
        iconButton("Recomeçar", "↺", 'data-timer-action="reset"'),
        iconButton("Adicionar um minuto", "+1", 'data-timer-action="add-minute"'),
      '</div>',
      '<div class="timer-presets" aria-label="Tempos rápidos">',
        '<button type="button" data-timer-minutes="1">1 min</button>',
        '<button type="button" data-timer-minutes="3">3 min</button>',
        '<button type="button" data-timer-minutes="5">5 min</button>',
        '<button type="button" data-timer-minutes="10">10 min</button>',
        '<button type="button" data-timer-minutes="15">15 min</button>',
      '</div>',
      '<div class="timer-custom">',
        '<label><span>min</span><input id="classTimerMinutes" type="number" min="0" max="180" value="5" inputmode="numeric"></label>',
        '<span>:</span>',
        '<label><span>seg</span><input id="classTimerSeconds" type="number" min="0" max="59" value="0" inputmode="numeric"></label>',
        '<button type="button" data-timer-action="set">Definir</button>',
      '</div>'
    ].join(""));
  }

  function bindShell(name, element) {
    var head = element.querySelector(".time-widget-head");
    makeDraggable(name, element, head);
    makeResizable(name, element);

    element.addEventListener("click", function (event) {
      var actionButton = event.target.closest("[data-time-action]");
      if (actionButton) {
        var action = actionButton.getAttribute("data-time-action");
        if (action === "close") hideWidget(name);
        else if (action === "expand") toggleExpanded(name);
      }
    });
  }

  function makeDraggable(name, element, handle) {
    var drag = null;
    handle.addEventListener("pointerdown", function (event) {
      if (event.target.closest("button") || state[name].expanded) return;
      event.preventDefault();
      var rect = element.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        dx: event.clientX - rect.left,
        dy: event.clientY - rect.top
      };
      handle.setPointerCapture && handle.setPointerCapture(event.pointerId);
      element.classList.add("dragging");
    });
    handle.addEventListener("pointermove", function (event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      var x = event.clientX - drag.dx;
      var y = event.clientY - drag.dy;
      positionElement(element, x, y);
    });
    function end(event) {
      if (!drag || (event && drag.pointerId !== event.pointerId)) return;
      element.classList.remove("dragging");
      rememberRect(name, element);
      drag = null;
    }
    handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  }

  function makeResizable(name, element) {
    if (!window.ResizeObserver) return;
    var observer = new ResizeObserver(function () {
      if (element.hidden || state[name].expanded) return;
      clearTimeout(resizeTimers[name]);
      resizeTimers[name] = setTimeout(function () { rememberRect(name, element); }, 180);
    });
    observer.observe(element);
  }

  function defaultRect(name) {
    var width = name === "timer" ? 330 : 300;
    var height = name === "clock" ? 190 : name === "stopwatch" ? 205 : 360;
    var index = name === "clock" ? 0 : name === "stopwatch" ? 1 : 2;
    var x = Math.max(12, window.innerWidth - width - 24 - index * 28);
    var y = Math.max(72, 78 + index * 34);
    if (window.innerWidth < 640) {
      width = Math.min(width, window.innerWidth - 20);
      x = 10;
      y = 82 + index * 24;
    }
    return { x: x, y: y, width: width, height: height };
  }

  function applyRect(name, element) {
    var rect = state[name].rect || defaultRect(name);
    element.style.width = Math.max(220, rect.width || 280) + "px";
    element.style.height = Math.max(150, rect.height || 190) + "px";
    positionElement(element, rect.x || 10, rect.y || 80);
  }

  function positionElement(element, x, y) {
    var width = element.offsetWidth || 280;
    var height = element.offsetHeight || 180;
    var maxX = Math.max(6, window.innerWidth - width - 6);
    var maxY = Math.max(6, window.innerHeight - Math.min(height, window.innerHeight - 12) - 6);
    element.style.left = Math.max(6, Math.min(maxX, x)) + "px";
    element.style.top = Math.max(6, Math.min(maxY, y)) + "px";
    element.style.right = "auto";
    element.style.bottom = "auto";
  }

  function rememberRect(name, element) {
    if (element.hidden || state[name].expanded) return;
    var rect = element.getBoundingClientRect();
    state[name].rect = {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
    saveState();
  }

  function restoreWidgets() {
    Object.keys(widgets).forEach(function (name) {
      var element = widgets[name];
      applyRect(name, element);
      element.hidden = !state[name].visible;
      element.classList.toggle("expanded", !!state[name].expanded);
    });
    menu.hidden = !state.menuOpen;
    launcher.setAttribute("aria-expanded", state.menuOpen ? "true" : "false");
    updateLauncher();
  }

  function showWidget(name) {
    if (!widgets[name]) return;
    state[name].visible = true;
    widgets[name].hidden = false;
    if (!state[name].rect) applyRect(name, widgets[name]);
    widgets[name].style.zIndex = String(nextZ());
    saveState();
    updateLauncher();
    renderAll();
  }

  function hideWidget(name) {
    if (!widgets[name]) return;
    state[name].visible = false;
    state[name].expanded = false;
    widgets[name].classList.remove("expanded");
    widgets[name].hidden = true;
    saveState();
    updateLauncher();
  }

  function toggleExpanded(name) {
    var element = widgets[name];
    if (!element) return;
    if (!state[name].expanded) rememberRect(name, element);
    state[name].expanded = !state[name].expanded;
    element.classList.toggle("expanded", state[name].expanded);
    if (!state[name].expanded) applyRect(name, element);
    saveState();
  }

  function nextZ() {
    var max = 80;
    document.querySelectorAll(".time-widget").forEach(function (element) {
      max = Math.max(max, Number(element.style.zIndex) || 80);
    });
    return max + 1;
  }

  function toggleMenu() {
    state.menuOpen = !state.menuOpen;
    menu.hidden = !state.menuOpen;
    launcher.setAttribute("aria-expanded", state.menuOpen ? "true" : "false");
    if (state.menuOpen) positionMenu();
    saveState();
    updateLauncher();
  }

  function closeMenu() {
    state.menuOpen = false;
    menu.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    saveState();
    updateLauncher();
  }

  function positionMenu() {
    var rect = launcher.getBoundingClientRect();
    var width = Math.min(310, window.innerWidth - 16);
    menu.style.width = width + "px";
    var left = Math.min(window.innerWidth - width - 8, Math.max(8, rect.right - width));
    var top = Math.min(window.innerHeight - menu.offsetHeight - 8, rect.bottom + 8);
    menu.style.left = left + "px";
    menu.style.top = Math.max(8, top) + "px";
  }

  function updateLauncher() {
    var anyVisible = Object.keys(widgets).some(function (name) { return state[name].visible; });
    launcher.classList.toggle("active", state.menuOpen || anyVisible);
  }

  function bindGlobalEvents() {
    document.addEventListener("click", function (event) {
      if (!state.menuOpen) return;
      if (menu.contains(event.target) || launcher.contains(event.target)) return;
      closeMenu();
    });

    Object.keys(widgets).forEach(function (name) {
      widgets[name].addEventListener("pointerdown", function () {
        widgets[name].style.zIndex = String(nextZ());
      });
    });

    widgets.stopwatch.addEventListener("click", function (event) {
      var button = event.target.closest("[data-stopwatch-action]");
      if (!button) return;
      var action = button.getAttribute("data-stopwatch-action");
      if (action === "toggle") toggleStopwatch();
      else if (action === "reset") resetStopwatch();
    });

    widgets.timer.addEventListener("click", function (event) {
      var preset = event.target.closest("[data-timer-minutes]");
      if (preset) {
        setTimer(Number(preset.getAttribute("data-timer-minutes")) * 60 * 1000);
        return;
      }
      var button = event.target.closest("[data-timer-action]");
      if (!button) return;
      var action = button.getAttribute("data-timer-action");
      if (action === "toggle") toggleTimer();
      else if (action === "reset") resetTimer();
      else if (action === "add-minute") addTimerMinute();
      else if (action === "set") setTimerFromInputs();
    });

    document.addEventListener("keydown", function (event) {
      if (event.target && /input|textarea|select/i.test(event.target.tagName)) return;
      if (event.key.toLowerCase() === "t") {
        event.preventDefault();
        toggleMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (state.menuOpen) positionMenu();
      Object.keys(widgets).forEach(function (name) {
        var element = widgets[name];
        if (element.hidden || state[name].expanded) return;
        var rect = element.getBoundingClientRect();
        positionElement(element, rect.left, rect.top);
      });
    });

    document.addEventListener("visibilitychange", renderAll);
  }

  function startTicker() {
    clearInterval(tickHandle);
    tickHandle = setInterval(renderAll, 100);
  }

  function renderAll() {
    renderClock();
    renderStopwatch();
    renderTimer();
  }

  function renderClock() {
    var now = new Date();
    var time = widgets.clock.querySelector("#classClockTime");
    var seconds = widgets.clock.querySelector("#classClockSeconds");
    var date = widgets.clock.querySelector("#classClockDate");
    time.textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    seconds.textContent = now.toLocaleTimeString("pt-BR", { second: "2-digit" });
    date.textContent = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }

  function stopwatchElapsed() {
    var data = state.stopwatch;
    return Math.max(0, Number(data.accumulatedMs || 0) +
      (data.running && data.startedAt ? Date.now() - data.startedAt : 0));
  }

  function toggleStopwatch() {
    var data = state.stopwatch;
    if (data.running) {
      data.accumulatedMs = stopwatchElapsed();
      data.startedAt = null;
      data.running = false;
    } else {
      data.startedAt = Date.now();
      data.running = true;
    }
    saveState();
    renderStopwatch();
  }

  function resetStopwatch() {
    state.stopwatch.running = false;
    state.stopwatch.accumulatedMs = 0;
    state.stopwatch.startedAt = null;
    saveState();
    renderStopwatch();
  }

  function renderStopwatch() {
    var display = widgets.stopwatch.querySelector("#classStopwatchDisplay");
    var button = widgets.stopwatch.querySelector('[data-stopwatch-action="toggle"]');
    display.textContent = formatStopwatch(stopwatchElapsed());
    button.textContent = state.stopwatch.running ? "Ⅱ" : "▶";
    button.title = state.stopwatch.running ? "Pausar" : "Iniciar";
    widgets.stopwatch.classList.toggle("running", !!state.stopwatch.running);
  }

  function formatStopwatch(ms) {
    var totalTenths = Math.floor(ms / 100);
    var tenths = totalTenths % 10;
    var totalSeconds = Math.floor(totalTenths / 10);
    var seconds = totalSeconds % 60;
    var totalMinutes = Math.floor(totalSeconds / 60);
    var minutes = totalMinutes % 60;
    var hours = Math.floor(totalMinutes / 60);
    if (hours) return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) + "." + tenths;
    return pad(minutes) + ":" + pad(seconds) + "." + tenths;
  }

  function timerRemaining() {
    var data = state.timer;
    if (data.running && data.endsAt) return Math.max(0, data.endsAt - Date.now());
    return Math.max(0, Number(data.remainingMs || 0));
  }

  function toggleTimer() {
    var data = state.timer;
    primeAudio();
    if (data.running) {
      data.remainingMs = timerRemaining();
      data.endsAt = null;
      data.running = false;
    } else {
      if (timerRemaining() <= 0) data.remainingMs = data.totalMs || 5 * 60 * 1000;
      data.finished = false;
      timerAlarmed = false;
      data.endsAt = Date.now() + data.remainingMs;
      data.running = true;
    }
    saveState();
    renderTimer();
  }

  function resetTimer() {
    var data = state.timer;
    data.running = false;
    data.endsAt = null;
    data.remainingMs = data.totalMs || 5 * 60 * 1000;
    data.finished = false;
    timerAlarmed = false;
    saveState();
    renderTimer();
  }

  function addTimerMinute() {
    var data = state.timer;
    var remaining = timerRemaining() + 60 * 1000;
    data.remainingMs = remaining;
    data.totalMs = Math.max(data.totalMs || 0, remaining);
    if (data.running) data.endsAt = Date.now() + remaining;
    data.finished = false;
    timerAlarmed = false;
    saveState();
    renderTimer();
  }

  function setTimer(milliseconds) {
    var data = state.timer;
    milliseconds = Math.max(1000, Math.min(180 * 60 * 1000 + 59 * 1000, milliseconds));
    data.totalMs = milliseconds;
    data.remainingMs = milliseconds;
    data.running = false;
    data.endsAt = null;
    data.finished = false;
    timerAlarmed = false;
    syncTimerInputs();
    saveState();
    renderTimer();
  }

  function setTimerFromInputs() {
    var minutes = Number(widgets.timer.querySelector("#classTimerMinutes").value) || 0;
    var seconds = Number(widgets.timer.querySelector("#classTimerSeconds").value) || 0;
    setTimer(minutes * 60 * 1000 + Math.min(59, Math.max(0, seconds)) * 1000);
  }

  function syncTimerInputs() {
    var totalSeconds = Math.round((state.timer.totalMs || 0) / 1000);
    widgets.timer.querySelector("#classTimerMinutes").value = String(Math.floor(totalSeconds / 60));
    widgets.timer.querySelector("#classTimerSeconds").value = String(totalSeconds % 60);
  }

  function renderTimer() {
    var data = state.timer;
    var remaining = timerRemaining();
    if (data.running && remaining <= 0) finishTimer();

    remaining = timerRemaining();
    var display = widgets.timer.querySelector("#classTimerDisplay");
    var ring = widgets.timer.querySelector("#classTimerRing");
    var button = widgets.timer.querySelector('[data-timer-action="toggle"]');
    display.textContent = formatCountdown(remaining);
    button.textContent = data.running ? "Ⅱ" : "▶";
    button.title = data.running ? "Pausar" : "Iniciar";
    var total = Math.max(1, Number(data.totalMs || remaining || 1));
    var progress = Math.max(0, Math.min(1, remaining / total));
    ring.style.setProperty("--timer-progress", Math.round(progress * 360) + "deg");
    widgets.timer.classList.toggle("running", !!data.running);
    widgets.timer.classList.toggle("finished", !!data.finished);
  }

  function finishTimer() {
    var data = state.timer;
    data.running = false;
    data.endsAt = null;
    data.remainingMs = 0;
    data.finished = true;
    saveState();
    if (!timerAlarmed) {
      timerAlarmed = true;
      alarm();
    }
  }

  function formatCountdown(ms) {
    var totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
    var seconds = totalSeconds % 60;
    var totalMinutes = Math.floor(totalSeconds / 60);
    var minutes = totalMinutes % 60;
    var hours = Math.floor(totalMinutes / 60);
    return hours ? pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) : pad(totalMinutes) + ":" + pad(seconds);
  }

  function pad(value) {
    return String(Math.max(0, value)).padStart(2, "0");
  }

  function primeAudio() {
    try {
      var AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!audioContext) audioContext = new AudioCtor();
      if (audioContext.state === "suspended") audioContext.resume();
    } catch (error) {}
  }

  function alarm() {
    primeAudio();
    if (!audioContext) return;
    var now = audioContext.currentTime;
    [0, 0.38, 0.76].forEach(function (offset, index) {
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = index === 2 ? 1046 : 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.28);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(now + offset);
      oscillator.stop(now + offset + 0.3);
    });
  }

  function injectStyles() {
    if (document.getElementById("modoAulaTimeWidgetsCss")) return;
    var style = document.createElement("style");
    style.id = "modoAulaTimeWidgetsCss";
    style.textContent = [
      ".time-launcher{margin-left:1px}",
      ".time-widget-menu{position:fixed;z-index:130;padding:7px;border:1px solid #d8deea;border-radius:14px;background:rgba(255,255,255,.98);box-shadow:0 16px 42px rgba(23,32,51,.22);backdrop-filter:blur(10px)}",
      ".time-widget-menu>button{width:100%;display:flex;align-items:center;gap:10px;padding:10px;border:0;border-radius:10px;background:transparent;color:#172033;text-align:left;cursor:pointer}",
      ".time-widget-menu>button:hover{background:#eef4ff}.time-menu-symbol{width:38px;height:38px;display:grid;place-items:center;border-radius:10px;background:#eef4ff;color:#1e4999;font-size:22px}.time-widget-menu strong{display:block;font-size:13px}.time-widget-menu small{display:block;margin-top:2px;color:#667085;font-size:11px}",
      ".time-widget{position:fixed;z-index:80;min-width:220px;min-height:150px;resize:both;overflow:hidden;display:grid;grid-template-rows:auto 1fr;border:1px solid #d8deea;border-radius:18px;background:rgba(255,255,255,.97);box-shadow:0 18px 52px rgba(23,32,51,.24);backdrop-filter:blur(12px);color:#172033}",
      ".time-widget[hidden]{display:none!important}.time-widget.dragging{opacity:.94;box-shadow:0 24px 64px rgba(23,32,51,.32)}",
      ".time-widget-head{height:46px;display:flex;align-items:center;gap:8px;padding:6px 7px 6px 12px;border-bottom:1px solid #e2e7ef;background:#f8faff;cursor:move;touch-action:none}.time-widget-head strong{font-size:12px}.time-widget-symbol{font-size:20px;color:#1e4999}.time-widget-spacer{flex:1}",
      ".time-icon-btn{width:34px;height:34px;display:inline-grid;place-items:center;border:1px solid #d8deea;border-radius:9px;background:#fff;color:#172033;font:800 16px/1 system-ui;cursor:pointer}.time-icon-btn:hover{border-color:#9aabc8}.time-icon-btn.time-primary{background:#1e4999;border-color:#1e4999;color:#fff}",
      ".time-widget-body{min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px;overflow:auto}",
      ".time-widget.expanded{left:50%!important;top:50%!important;width:min(78vw,900px)!important;height:min(64vh,560px)!important;transform:translate(-50%,-50%);resize:none;z-index:160!important}.time-widget.expanded .time-widget-head{cursor:default}",
      ".clock-display,.stopwatch-display,.timer-display{font-variant-numeric:tabular-nums;letter-spacing:-.045em;color:#172033}.clock-display{font-size:clamp(52px,9vw,116px);font-weight:800;line-height:.95}.clock-seconds{margin-top:4px;color:#1e4999;font-size:18px;font-weight:800;font-variant-numeric:tabular-nums}.clock-date{margin-top:9px;color:#667085;font-size:13px;text-align:center;text-transform:capitalize}",
      ".stopwatch-display{font-size:clamp(44px,8vw,100px);font-weight:800;line-height:1}.time-primary-controls{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:16px}",
      ".timer-ring{--timer-progress:360deg;width:min(68%,220px);aspect-ratio:1;display:grid;place-items:center;border-radius:50%;background:conic-gradient(#1e4999 var(--timer-progress),#e7ebf2 0);position:relative}.timer-ring::before{content:'';position:absolute;inset:10px;border-radius:50%;background:#fff}.timer-display{position:relative;z-index:1;font-size:clamp(34px,6vw,72px);font-weight:850}",
      ".time-widget-timer.finished{animation:timerPulse .8s ease-in-out infinite alternate}.time-widget-timer.finished .timer-ring{background:#c0272d}.time-widget-timer.finished .timer-display{color:#c0272d}@keyframes timerPulse{from{box-shadow:0 18px 52px rgba(23,32,51,.24)}to{box-shadow:0 0 0 8px rgba(192,39,45,.22),0 22px 60px rgba(192,39,45,.32)}}",
      ".timer-presets{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin-top:12px}.timer-presets button,.timer-custom button{height:30px;padding:0 9px;border:1px solid #d8deea;border-radius:8px;background:#fff;color:#1e4999;font-size:11px;font-weight:800;cursor:pointer}.timer-presets button:hover,.timer-custom button:hover{background:#eef4ff}",
      ".timer-custom{display:flex;align-items:flex-end;justify-content:center;gap:5px;margin-top:9px}.timer-custom label{display:grid;gap:2px;color:#667085;font-size:9px;font-weight:800;text-align:center;text-transform:uppercase}.timer-custom input{width:54px;height:31px;border:1px solid #d8deea;border-radius:8px;background:#fff;color:#172033;font:750 14px/1 system-ui;text-align:center}",
      "body.board-focus .time-widget{z-index:170}body.board-focus .time-widget-menu{z-index:180}",
      "@media(max-width:640px){.time-widget{max-width:calc(100vw - 12px);max-height:calc(100vh - 12px)}.time-widget.expanded{width:calc(100vw - 12px)!important;height:min(72vh,560px)!important}.time-widget-body{padding:11px}.timer-presets{display:none}.clock-display{font-size:54px}.stopwatch-display{font-size:46px}.timer-ring{width:150px}.timer-display{font-size:38px}}"
    ].join("");
    document.head.appendChild(style);
  }
})();
