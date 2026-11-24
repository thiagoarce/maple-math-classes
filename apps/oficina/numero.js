/* Decimal brasileiro: vírgula decimal, ponto para milhar; ponto decimal quando não ambíguo. */
(function(root) {
  "use strict";
  function numero(t) {
    let s = String(t ?? "").trim().replace(/^R\$\s*/,"").replace(/\s*(?:%|°)$/,"").replace(/−/g,"-").trim();
    const f = s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    if (f) { const q = Number(f[1])/Number(f[2]); return Number.isFinite(q) ? q : null; }
    if (/^[+-]?\d{1,3}(?:[ \u00a0]\d{3})+(?:,\d+)?$/.test(s)) s=s.replace(/[ \u00a0]/g,"");
    if (/^[+-]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(s)) s=s.replace(/\./g,"");
    if (!/^[+-]?(?:\d+(?:[,.]\d+)?|[,.]\d+)$/.test(s)) return null;
    const n=Number(s.replace(",","."));
    return Number.isFinite(n)?n:null;
  }
  root.OFICINA_NUMERO=numero;
})(typeof window!=="undefined"?window:globalThis);
