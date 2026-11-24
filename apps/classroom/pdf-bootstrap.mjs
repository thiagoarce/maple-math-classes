// Local dependency only. Never fall back to a CDN or load an arbitrary PDF.
const loading = document.getElementById("loading");
const status = document.getElementById("saveStatus");
try {
  if (!window.isSecureContext) throw Error("Abra em http://localhost ou HTTPS.");
  const lib = await import("./pdf-runtime/node_modules/pdfjs-dist/build/pdf.mjs");
  if (lib.version !== "6.5.438") throw Error("Versão PDF.js inesperada.");
  window.pdfjsLib = lib;
  const script = document.createElement("script");
  script.src = "core/pdf.js";
  script.onerror = () => { loading.textContent = "Motor local do PDF não carregado."; };
  document.body.appendChild(script);
} catch (e) {
  loading.textContent = "PDF indisponível. Instale o runtime local conforme o README. " + e.message;
  status.textContent = "dependência pendente";
}
