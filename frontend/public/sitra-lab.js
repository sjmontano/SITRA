/* ============================================================
   SITRA Lab — réplica visual del ejercicio de Blockchain en clase.
   Lógica 1:1 con el Python del profesor:
     Block(index, date, data, previous_hash, nonce, hash)
     create_hash(): sha256(f"{index}{date}{data}{previous_hash}{nonce}")
     mine(difficulty): while not hash.startswith(difficulty): nonce += 1
     BlockChain(genesis, difficulty) · get_last_block · add_block
   Diferencia: el minado corre por chunks async para no congelar el navegador.
   Persistencia: localStorage ("sitra-lab-chain").
   ============================================================ */
(function () {
  "use strict";

  var STORE_KEY = "sitra-lab-chain";
  var DIFF_KEY = "sitra-lab-difficulty";

  // --- SHA-256 nativo del navegador (Web Crypto) ---
  async function sha256Hex(text) {
    var bytes = new TextEncoder().encode(text);
    var digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map(function (b) { return b.toString(16).padStart(2, "0"); })
      .join("");
  }

  // --- Block: espejo de la clase Python ---
  function blockString(b) {
    return "" + b.index + b.date + b.data + b.previous_hash + b.nonce;
  }

  async function createHash(b) {
    return sha256Hex(blockString(b));
  }

  function makeBlock(index, data, previousHash, date) {
    return {
      index: index,
      date: date || new Date().toString(),
      data: data,
      previous_hash: previousHash || "",
      nonce: 0,
      hash: ""
    };
  }

  // --- Minado con progreso (chunks para no bloquear la UI) ---
  // onTick({nonce, hash}) se llama cada CHUNK iteraciones. Devuelve {cancelled:true} o el bloque minado.
  var CHUNK = 800;
  var cancelled = false;

  function cancelMine() { cancelled = true; }

  async function mineBlock(block, difficulty, onTick) {
    cancelled = false;
    block.hash = await createHash(block);
    while (!block.hash.startsWith(difficulty)) {
      if (cancelled) return { cancelled: true };
      for (var i = 0; i < CHUNK; i++) {
        block.nonce += 1;
        block.hash = await createHash(block);
        if (block.hash.startsWith(difficulty)) break;
      }
      if (onTick) onTick({ nonce: block.nonce, hash: block.hash });
      await new Promise(function (r) { setTimeout(r, 0); });
    }
    if (onTick) onTick({ nonce: block.nonce, hash: block.hash, done: true });
    return block;
  }

  // --- BlockChain: génesis + add + verify ---
  function loadChain() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || arr.length === 0) return null;
      return arr;
    } catch (e) { return null; }
  }

  function saveChain(chain) {
    localStorage.setItem(STORE_KEY, JSON.stringify(chain));
  }

  function getDifficulty() {
    return localStorage.getItem(DIFF_KEY) || "00";
  }

  function setDifficulty(d) {
    localStorage.setItem(DIFF_KEY, d);
  }

  function shortHash(h) {
    if (!h) return "—";
    return h.slice(0, 10) + "…" + h.slice(-6);
  }

  // Verifica toda la cadena: recomputa cada hash y revisa el encadenado + dificultad.
  // Devuelve { ok:true } o { ok:false, failIndex, reason }.
  async function verifyChain(chain, difficulty) {
    for (var i = 0; i < chain.length; i++) {
      var b = chain[i];
      var recomputed = await createHash(b);
      if (recomputed !== b.hash) {
        return { ok: false, failIndex: i, reason: "hash-recomputado-difiere" };
      }
      if (!b.hash.startsWith(difficulty)) {
        return { ok: false, failIndex: i, reason: "no-cumple-dificultad" };
      }
      if (i === 0) {
        if (b.index !== 0) return { ok: false, failIndex: i, reason: "genesis-indice" };
      } else if (b.previous_hash !== chain[i - 1].hash) {
        return { ok: false, failIndex: i, reason: "enlace-roto" };
      }
    }
    return { ok: true };
  }

  // --- API pública ---
  window.SitraLab = {
    sha256Hex: sha256Hex,
    makeBlock: makeBlock,
    createHash: createHash,
    mineBlock: mineBlock,
    cancelMine: cancelMine,
    loadChain: loadChain,
    saveChain: saveChain,
    getDifficulty: getDifficulty,
    setDifficulty: setDifficulty,
    shortHash: shortHash,
    verifyChain: verifyChain
  };
})();
