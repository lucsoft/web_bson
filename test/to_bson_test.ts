import { assertEquals } from "../deps.ts";
import { deserialize, Document, ObjectId, serialize } from "../src/bson.ts";

Deno.test("[toBSON] Should correctly handle toBson function for an object", () => {
  // Test object
  const doc: Document = {
    hello: new ObjectId(),
    a: 1,
  };

  // Add a toBson method to the object
  doc.toBSON = () => ({ b: 1 });

  // Serialize the data
  // deno-lint-ignore ban-ts-comment
  //@ts-ignore
  let serializedData = serialize(doc, false, true);
  let deserializedDoc = deserialize(serializedData);
  assertEquals({ b: 1 }, deserializedDoc);

  // Serialize the data
  // deno-lint-ignore ban-ts-comment
  //@ts-ignore
  serializedData = serialize(doc, false, true);
  deserializedDoc = deserialize(serializedData);
  assertEquals({ b: 1 }, deserializedDoc);
});

Deno.test("[toBSON] Should correctly handle embedded toBson function for an object", () => {
  // Test object
  const doc: Document = {
    hello: new ObjectId(),
    a: 1,
    b: {
      d: 1,
    },
  };

  // Add a toBson method to the object
  doc.b.toBSON = () => ({ e: 1 });

  // Serialize the data

  // deno-lint-ignore ban-ts-comment
  //@ts-ignore
  let serializedData = serialize(doc, false, true);
  let deserializedDoc = deserialize(serializedData);
  assertEquals({ e: 1 }, deserializedDoc.b);

  // deno-lint-ignore ban-ts-comment
  //@ts-ignore
  serializedData = serialize(doc, false, true);
  deserializedDoc = deserialize(serializedData);
  assertEquals({ e: 1 }, deserializedDoc.b);
});

Deno.test("[toBSON] Should correctly serialize when embedded non object returned by toBSON", () => {
  // Test object
  const doc: Document = {
    hello: new ObjectId(),
    a: 1,
    b: {
      d: 1,
    },
  };

  // Add a toBson method to the object
  doc.b.toBSON = () => "hello";

  // Serialize the data
  // deno-lint-ignore ban-ts-comment
  //@ts-ignore
  let serializedData = serialize(doc, false, true);
  let deserializedDoc = deserialize(serializedData);
  assertEquals("hello", deserializedDoc.b);

  // Serialize the data
  // deno-lint-ignore ban-ts-comment
  //@ts-ignore
  serializedData = serialize(doc, false, true);
  deserializedDoc = deserialize(serializedData);
  assertEquals("hello", deserializedDoc.b);
});

Deno.test("[toBSON] Should fail when top level object returns a non object type", () => {
  // Test object
  const doc: Document = {
    hello: new ObjectId(),
    a: 1,
    b: {
      d: 1,
    },
  };

  // Add a toBson method to the object
  doc.toBSON = () => "hello";

  let test1 = false;
  let test2 = false;
  let serializedData;

  try {
    // deno-lint-ignore ban-ts-comment
    //@ts-ignore
    serializedData = serialize(doc, false, true);
    deserialize(serializedData);
  } catch (_err) {
    test1 = true;
  }

  try {
    // deno-lint-ignore ban-ts-comment
    //@ts-ignore
    serializedData = serialize(doc, false, true);
    deserialize(serializedData);
  } catch (_err) {
    test2 = true;
  }

  assertEquals(true, test1);
  assertEquals(true, test2);
});
