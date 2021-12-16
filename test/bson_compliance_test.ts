// deno-lint-ignore-file no-explicit-any
import { assertEquals, assertThrows } from "../test_deps.ts";
import {
  Binary,
  Code,
  DBRef,
  deserialize,
  Document,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  serialize,
  Timestamp,
} from "../src/bson.ts";
import { decodeHexString } from "../utils.ts";
import { corruptScenarios } from "./compliance/corrupt.ts";
import { validScenarios } from "./compliance/valid.ts";

const textEncoder = new TextEncoder();

// Read and parse the json file
for (let i = 0; i < corruptScenarios.documents.length; i++) {
  const doc = corruptScenarios.documents[i];
  if (doc.skip) continue;
  Deno.test(`[BSON Compliance] Pass all corrupt BSON scenarios ./compliance/corrupt.json, case: ${i} ${doc.error}`, () => {
    assertThrows(() => {
      // Create a buffer containing the payload
      const buffer = decodeHexString(doc.encoded);
      // Attempt to deserialize
      deserialize(buffer);
    });
  });
}

// Translate extended json to correctly typed doc
function translate(doc: Document, object: Document) {
  for (const name in doc) {
    if (
      typeof doc[name] === "number" ||
      typeof doc[name] === "string" ||
      typeof doc[name] === "boolean"
    ) {
      object[name] = doc[name];
    } else if (Array.isArray(doc[name])) {
      object[name] = translate(doc[name], []);
    } else if (doc[name].$numberLong) {
      object[name] = Long.fromString(doc[name].$numberLong);
    } else if (doc[name]["$undefined"]) {
      object[name] = null;
    } else if (doc[name].$date) {
      const date = new Date();
      date.setTime(parseInt(doc[name].$date.$numberLong, 10));
      object[name] = date;
    } else if (doc[name].$regexp) {
      object[name] = new RegExp(
        doc[name].$regexp,
        doc[name].$options || "",
      );
    } else if (doc[name].$oid) {
      object[name] = new ObjectId(doc[name].$oid);
    } else if (doc[name]["$binary"]) {
      object[name] = new Binary(
        textEncoder.encode(doc[name]["$binary"]),
        doc[name].$type || 1,
      );
    } else if (doc[name].$timestamp) {
      object[name] = Timestamp.fromBits(
        parseInt(doc[name].$timestamp.t, 10),
        parseInt(doc[name].$timestamp.i),
      );
    } else if (doc[name].$ref) {
      object[name] = new DBRef(
        doc[name].$ref,
        doc[name].$id,
        doc[name].$db,
      );
    } else if (doc[name]["$minKey"]) {
      object[name] = new MinKey();
    } else if (doc[name].$maxKey) {
      object[name] = new MaxKey();
    } else if (doc[name].$code) {
      object[name] = new Code(
        doc[name].$code,
        doc[name].$scope || {},
      );
    } else if (doc[name] != null && typeof doc[name] === "object") {
      object[name] = translate(doc[name], {});
    }
  }

  return object;
}

let i = 0;
for (const doc of validScenarios.documents as any[]) {
  Deno.test(`[BSON Compliance] Pass all valid BSON serialization scenarios ./compliance/valid.json scenario: #${i}`, () => {
    if (doc.skip) return;
    // Create a buffer containing the payload
    const expectedData = decodeHexString(doc.encoded);
    // Get the expectedDocument
    const expectedDocument = translate(doc.document, {});
    // Serialize to buffer
    const buffer = serialize(expectedDocument);
    // Validate the output
    assertEquals(
      expectedData,
      buffer,
    );
    // Attempt to deserialize
    const object = deserialize(buffer, { promoteLongs: false });
    // Validate the object
    assertEquals(JSON.stringify(expectedDocument), JSON.stringify(object));
  });
  i++;
}
