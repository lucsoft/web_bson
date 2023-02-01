import { assert } from "https://deno.land/std@0.175.0/testing/asserts.ts";

const target = import.meta.resolve("bson-cdn/lib/bson.mjs");
const types = import.meta.resolve("bson-cdn/bson.d.ts");

const req = await fetch(target);
assert(req.ok);
let text = await req.text();

text = `/// <reference types="./mod.d.ts" />\n` + text;

// Currently we just use fallback js impl but we could also replace it with WebCrypto API
text = text.replaceAll("import('node:crypto')", "null");

text = text.replaceAll(
  "Symbol.for('nodejs.util.inspect.custom')",
  "Symbol.for('Deno.customInspect')",
);

await Deno.writeTextFile("mod.js", text);

const reqTypes = await fetch(types);
assert(reqTypes.ok);
const textTypes = await reqTypes.text();

await Deno.writeTextFile("mod.d.ts", textTypes);
