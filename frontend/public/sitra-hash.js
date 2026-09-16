/* ============================================================
   SITRA Hash — SHA-256 autocontenido para el navegador.
   Replica lo del profe en clase: sha256(index + date + data ...)
   Aqui: hashPDF = SHA-256(bytes archivo), hashEvento = SHA-256(acta).
   Sincrono y sin dependencias (igual que sitra-lab.js pero sync
   para no volver async el formulario de Registrar).
   API: window.SitraHash = { sha256Of, sha256OfBytes,
                             buildActaCanonica }
   SHA-256("abc") = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
   NOTA: las firmas EIP-712 del contrato siguen usando keccak
   interno de Ethereum (estandar). Solo las huellas de
   documentos usan SHA-256 como en clase.
   ============================================================ */
(function (root) {
  "use strict";

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

  function sha256Bytes(msg) {
    var bytes = msg instanceof Uint8Array ? msg : new Uint8Array(msg || []);
    var bitLen = bytes.length * 8;
    // padding: 0x80 + ceros + longitud 64 bits big-endian
    var withOne = bytes.length + 1;
    var padLen = (64 - ((withOne + 8) % 64)) % 64;
    var total = withOne + padLen + 8;
    var buf = new Uint8Array(total);
    buf.set(bytes, 0);
    buf[bytes.length] = 0x80;
    // longitud en bits como 64-bit big endian (alto luego bajo)
    var hi = Math.floor(bitLen / 4294967296), lo = bitLen >>> 0;
    buf[total - 8] = (hi >>> 24) & 0xff;
    buf[total - 7] = (hi >>> 16) & 0xff;
    buf[total - 6] = (hi >>> 8) & 0xff;
    buf[total - 5] = hi & 0xff;
    buf[total - 4] = (lo >>> 24) & 0xff;
    buf[total - 3] = (lo >>> 16) & 0xff;
    buf[total - 2] = (lo >>> 8) & 0xff;
    buf[total - 1] = lo & 0xff;

    var h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
    var h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
    var w = new Array(64);

    for (var off = 0; off < total; off += 64) {
      for (var i = 0; i < 16; i++) {
        w[i] = ((buf[off + i * 4] << 24) | (buf[off + i * 4 + 1] << 16) |
                (buf[off + i * 4 + 2] << 8) | buf[off + i * 4 + 3]) >>> 0;
      }
      for (var t = 16; t < 64; t++) {
        var s0 = (rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3)) >>> 0;
        var s1 = (rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10)) >>> 0;
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }
      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (var j = 0; j < 64; j++) {
        var S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
        var ch = ((e & f) ^ (~e & g)) >>> 0;
        var t1 = (h + S1 + ch + K[j] + w[j]) >>> 0;
        var S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
        var maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
        var t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0;
      h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0;
      h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }

    var out = new Uint8Array(32);
    var hs = [h0, h1, h2, h3, h4, h5, h6, h7];
    for (var k = 0; k < 8; k++) {
      out[k * 4] = (hs[k] >>> 24) & 0xff;
      out[k * 4 + 1] = (hs[k] >>> 16) & 0xff;
      out[k * 4 + 2] = (hs[k] >>> 8) & 0xff;
      out[k * 4 + 3] = hs[k] & 0xff;
    }
    return out;
  }

  function toHex(u8) {
    var s = "0x";
    for (var i = 0; i < u8.length; i++) {
      s += u8[i].toString(16).padStart(2, "0");
    }
    return s;
  }

  function utf8Bytes(str) {
    return new TextEncoder().encode(str);
  }

  function sha256Of(obj) {
    var s = typeof obj === "string" ? obj : JSON.stringify(obj);
    return toHex(sha256Bytes(utf8Bytes(s)));
  }

  function sha256OfBytes(u8) {
    return toHex(sha256Bytes(u8 instanceof Uint8Array ? u8 : new Uint8Array(u8 || [])));
  }

  function buildActaCanonica(o) {
    o = o || {};
    var item = String(o.item || "RECURSO");
    return JSON.stringify({
      detalle: item,
      entrega: o.entrega || "Secretaria",
      estado_acta: o.estado_acta || "ENTREGA",
      fecha: o.fecha || new Date().toISOString().slice(0, 10),
      item: item.split("|")[0].trim(),
      observaciones: "",
      responsable_entrega: o.responsable_entrega || "Secretaria",
      responsable_recibe: o.responsable_recibe || "Institucion A"
    });
  }

  root.SitraHash = {
    sha256Bytes: sha256Bytes,
    sha256Of: sha256Of,
    sha256OfBytes: sha256OfBytes,
    buildActaCanonica: buildActaCanonica,
    // Alias de compatibilidad (antes keccak). Apuntan a SHA-256.
    keccak256Bytes: sha256Bytes,
    keccakOf: sha256Of,
    keccakOfBytes: sha256OfBytes
  };
})(typeof window !== "undefined" ? window : globalThis);
