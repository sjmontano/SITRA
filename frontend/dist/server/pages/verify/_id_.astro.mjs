import { c as createComponent, m as maybeRenderHead, r as renderTemplate, a as addAttribute, b as createAstro } from '../../chunks/astro/server_xKRVUfkf.mjs';
import 'kleur/colors';
import 'clsx';
export { renderers } from '../../renderers.mjs';

async function loadVerify(id) {
  const r = await fetch(`${undefined                          }/resources/verify/${id}`);
  const j = await r.json();
  const chain = (j.onchain || []).map((e) => ({ ...e, hashEvento: String(e.hashEvento ?? ""), hashPDF: String(e.hashPDF ?? ""), from: String(e.from ?? ""), to: String(e.to ?? ""), timestamp: String(e.timestamp ?? "") }));
  const last = chain[chain.length - 1];
  if (!last) return { onchain: [], offchain: j.offchain || null, custodio: null, okEvento: false };
  const okEvento = !!(j.offchain && String(j.offchain.hash_evento).toLowerCase() === last.hashEvento.toLowerCase());
  return { onchain: chain, offchain: j.offchain || null, custodio: last.to, okEvento };
}

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  const data = await loadVerify(id);
  return renderTemplate`${maybeRenderHead()}<h1>Custodia ${id}</h1> <p>Custodio actual: ${data.custodio}</p> <p>Hash evento coincide: ${String(data.okEvento)}</p> <p><small>Este registro NO afirma verdad física ni localización. Solo prueba doble firma en orden append-only.</small></p> <ul>${data.onchain.map((e) => renderTemplate`<li>${e.eventType} ${e.from} → ${e.to} ${e.timestamp}</li>`)}</ul> <img${addAttribute(`https://api.qrserver.com/v1/create-qr-code/?data=/verify/${id}`, "src")} alt="QR">`;
}, "D:/Estudio/Colegio Mayor del Cauca/Sistemas Distribuidos/custodia-blockchain/frontend/src/pages/verify/[id].astro", void 0);

const $$file = "D:/Estudio/Colegio Mayor del Cauca/Sistemas Distribuidos/custodia-blockchain/frontend/src/pages/verify/[id].astro";
const $$url = "/verify/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
