import { assert } from "https://deno.land/std@0.220.1/testing/asserts.ts";

const target = import.meta.resolve("bson-cdn/lib/bson.mjs");
const types = import.meta.resolve("bson-cdn/bson.d.ts");

const req = await fetch(target);
assert(req.ok);
let text = await req.text();

text = `/// <reference types="./mod.d.ts" />\n` + text;

// Just to remove this import. its already dead code.
text = text.replaceAll("import('node:crypto')", "null");

// Never use nodeJsByteUtils
text = text.replace(
  "const ByteUtils = hasGlobalBuffer ? nodeJsByteUtils : webByteUtils;",
  "const ByteUtils = webByteUtils;",
);

text = text.replaceAll(
  "Symbol.for('nodejs.util.inspect.custom')",
  "Symbol.for('Deno.customInspect')",
);

const reqTypes = await fetch(types);
assert(reqTypes.ok);
const textTypes = await reqTypes.text();

await Deno.writeTextFile("mod.js", text);
await Deno.writeTextFile("mod.d.ts", textTypes);
