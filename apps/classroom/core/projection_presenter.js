/* Minimal demo adapter: explicit second window, no roster, no resource URLs. */
(function () {
  "use strict";
  const button = document.getElementById("projectionBtn");
  const board = document.getElementById("board");
  const stage = document.getElementById("stage");
  const blackout = document.getElementById("blackout");
  let peer = null, interval = null;
  function stop() {
    clearInterval(interval); interval = null;
    if (peer && !peer.closed) peer.close();
    peer = null; button.setAttribute("aria-pressed", "false");
  }
  function send() {
    if (!peer || peer.closed) { stop(); return; }
    const visible = blackout.hidden && !stage.classList.contains("has-resource");
    peer.postMessage({type:"maple-demo-board", view:visible ? "board" : "blackout",
      mode:board.classList.contains("black") ? "black" : "white"}, location.origin);
  }
  button.addEventListener("click", () => {
    if (peer && !peer.closed) { stop(); return; }
    if (!window.isSecureContext || !/^https?:$/.test(location.protocol)) {
      alert("Abra a demonstração por localhost ou HTTPS."); return;
    }
    peer = window.open("projector.html", "_blank", "popup");
    if (!peer) { alert("Permita a abertura da segunda janela."); return; }
    button.setAttribute("aria-pressed", "true");
    send(); interval = setInterval(send, 400);
  });
  window.addEventListener("pagehide", stop);
})();
