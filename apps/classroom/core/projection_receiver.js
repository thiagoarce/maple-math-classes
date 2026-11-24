/* Accept presentation state only from the opening window on the same origin. */
(function () {
  "use strict";
  const cover = document.getElementById("cover");
  const board = document.getElementById("board");
  const parent = window.opener;
  let last = 0;
  window.addEventListener("message", event => {
    if (!parent || event.source !== parent || event.origin !== location.origin) return;
    const d = event.data;
    if (!d || d.type !== "maple-demo-board" || !["board","blackout"].includes(d.view)
      || !["white","black"].includes(d.mode)) return;
    last = Date.now();
    board.classList.toggle("black", d.mode === "black");
    cover.hidden = d.view === "board";
  });
  setInterval(() => { if (!parent || parent.closed || Date.now() - last > 1800) cover.hidden = false; }, 300);
})();
