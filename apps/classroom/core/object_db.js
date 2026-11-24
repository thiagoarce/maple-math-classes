/* Armazenamento local de imagens avulsas do Modo Aula. Nunca usa KV. */
(function () {
  "use strict";
  if (window.MAObjectDB) return;

  var NAME = "maple-demo-classroom-assets";
  var VERSION = 1;
  var ASSETS = "assets";
  var LAYOUTS = "layouts";

  function open() {
    return new Promise(function (resolve, reject) {
      var request = indexedDB.open(NAME, VERSION);
      request.onupgradeneeded = function () {
        var db = request.result;
        if (!db.objectStoreNames.contains(ASSETS)) db.createObjectStore(ASSETS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(LAYOUTS)) db.createObjectStore(LAYOUTS, { keyPath: "scope" });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function get(store, key) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var request = db.transaction(store, "readonly").objectStore(store).get(key);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
      }).finally(function () { db.close(); });
    });
  }

  function put(store, value) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(store, "readwrite");
        transaction.objectStore(store).put(value);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error); };
      }).finally(function () { db.close(); });
    });
  }

  function remove(store, key) {
    return open().then(function (db) {
      return new Promise(function (resolve, reject) {
        var transaction = db.transaction(store, "readwrite");
        transaction.objectStore(store).delete(key);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error); };
      }).finally(function () { db.close(); });
    });
  }

  window.MAObjectDB = {
    ASSETS: ASSETS,
    LAYOUTS: LAYOUTS,
    get: get,
    put: put,
    remove: remove
  };
})();
