/* ============================================================
   SITRA Hash — keccak256 autocontenido para el navegador.
   Sin dependencias: el `import "ethers"` en <script type=module>
   fallaba sin importmap y dejaba el boton Registrar muerto.
   API: window.SitraHash = { keccak256Hex, keccakOf, keccakOfBytes,
                             buildActaCanonica }
   keccak256("abc") = 4e03657aea45a94fc7e56d261c94a406a1658c85a5d10c831526335c7455c1b
   ============================================================ */
(function (root) {
  "use strict";

  var MASK64 = 0xffffffffffffffffn;

  var RC = [
    0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an,
    0x8000000080008000n, 0x000000000000808bn, 0x0000000080000001n,
    0x8000000080008081n, 0x8000000000008009n, 0x000000000000008an,
    0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
    0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n,
    0x8000000000008003n, 0x8000000000008002n, 0x8000000000000080n,
    0x000000000000800an, 0x800000008000000an, 0x8000000080008081n,
    0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n
  ];

  // r[x][y] — offsets de rotacion (FIPS-202 Tabla 2), en orden R[x + 5*y].
  var R = [
    0, 1, 62, 28, 27,
    36, 44, 6, 55, 20,
    3, 10, 43, 25, 39,
    41, 45, 15, 21, 8,
    18, 2, 61, 56, 14
  ];

  function rotl64(x, n) {
    n = BigInt(n);
    if (n === 0n) return x & MASK64;
    return ((x << n) | (x >> (64n - n))) & MASK64;
  }

  function keccakF(s) {
    var C = new BigUint64Array(5);
    var D = new BigUint64Array(5);
    var B = new BigUint64Array(25);
    for (var round = 0; round < 24; round++) {
      for (var x = 0; x < 5; x++) {
        C[x] = s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20];
      }
      for (var x2 = 0; x2 < 5; x2++) {
        D[x2] = C[(x2 + 4) % 5] ^ rotl64(C[(x2 + 1) % 5], 1);
      }
      for (var xi = 0; xi < 5; xi++) {
        for (var y = 0; y < 5; y++) {
          s[xi + 5 * y] = (s[xi + 5 * y] ^ D[xi]) & MASK64;
        }
      }
      for (var x3 = 0; x3 < 5; x3++) {
        for (var y3 = 0; y3 < 5; y3++) {
          B[y3 + 5 * ((2 * x3 + 3 * y3) % 5)] = rotl64(s[x3 + 5 * y3], R[x3 + 5 * y3]);
        }
      }
      for (var x4 = 0; x4 < 5; x4++) {
        for (var y4 = 0; y4 < 5; y4++) {
          s[x4 + 5 * y4] = (B[x4 + 5 * y4] ^ ((~B[(x4 + 1) % 5 + 5 * y4]) & B[(x4 + 2) % 5 + 5 * y4])) & MASK64;
        }
      }
      s[0] = (s[0] ^ RC[round]) & MASK64;
    }
  }

  function keccak256Bytes(msg) {
    var rate = 136; // 1088 bits
    var s = new BigUint64Array(25);
    var off = 0;
    while (off < msg.length) {
      var blockLen = Math.min(rate, msg.length - off);
      for (var i = 0; i < blockLen; i++) {
        var lane = (i / 8) | 0;
        var shift = BigInt((i % 8) * 8);
        s[lane] = (s[lane] ^ (BigInt(msg[off + i]) << shift)) & MASK64;
      }
      off += blockLen;
      if (blockLen === rate) {
        keccakF(s);
      }
    }
    // pad10*1 keccak (suffix 0x01): el ultimo bloque procesado incluye padding
    var padIndex = msg.length % rate;
    var laneP = (padIndex / 8) | 0;
    var shiftP = BigInt((padIndex % 8) * 8);
    s[laneP] = (s[laneP] ^ (0x01n << shiftP)) & MASK64;
    var lastLane = (rate - 1) / 8 | 0;
    var lastShift = BigInt(((rate - 1) % 8) * 8);
    s[lastLane] = (s[lastLane] ^ (0x80n << lastShift)) & MASK64;
    // OJO: si el mensaje llenaba el bloque exacto, el padding va en un bloque nuevo.
    // El codigo de arriba refleja el caso general solo si procesamos el bloque
    // parcial; como ya absorbimos todo sin permutar el parcial, permutamos una vez:
    keccakF(s);
    var out = new Uint8Array(32);
    for (var j = 0; j < 4; j++) {
      var v = s[j];
      for (var k = 0; k < 8; k++) {
        out[j * 8 + k] = Number((v >> BigInt(k * 8)) & 0xffn);
      }
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

  function keccakOf(obj) {
    var s = typeof obj === "string" ? obj : JSON.stringify(obj);
    return toHex(keccak256Bytes(utf8Bytes(s)));
  }

  function keccakOfBytes(u8) {
    return toHex(keccak256Bytes(u8 instanceof Uint8Array ? u8 : new Uint8Array(u8)));
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
    keccak256Bytes: keccak256Bytes,
    keccakOf: keccakOf,
    keccakOfBytes: keccakOfBytes,
    buildActaCanonica: buildActaCanonica
  };
})(typeof window !== "undefined" ? window : globalThis);
