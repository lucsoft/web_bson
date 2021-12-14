import {
  assertEquals,
  equal,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { Document, ObjectId, serialize } from "../src/bson.ts";
import { deserialize } from "../src/parser/deserializer.ts";

Deno.test("toBSON", async ({ step }) => {
  await step(
    "Should correctly handle toBson function for an object",
    () => {
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
      let serialized_data = serialize(doc, false, true);
      let deserialized_doc = deserialize(serialized_data);
      equal({ b: 1 }, deserialized_doc);

      // Serialize the data
      // deno-lint-ignore ban-ts-comment
      //@ts-ignore
      serialized_data = serialize(doc, false, true);
      deserialized_doc = deserialize(serialized_data);
      equal({ b: 1 }, deserialized_doc);
    },
  );

  await step(
    "Should correctly handle embedded toBson function for an object",
    () => {
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
      let serialized_data = serialize(doc, false, true);
      let deserialized_doc = deserialize(serialized_data);
      equal({ e: 1 }, deserialized_doc.b);

      // deno-lint-ignore ban-ts-comment
      //@ts-ignore
      serialized_data = serialize(doc, false, true);
      deserialized_doc = deserialize(serialized_data);
      equal({ e: 1 }, deserialized_doc.b);
    },
  );

  await step(
    "Should correctly serialize when embedded non object returned by toBSON",
    () => {
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
      let serialized_data = serialize(doc, false, true);
      let deserialized_doc = deserialize(serialized_data);
      equal("hello", deserialized_doc.b);

      // Serialize the data
      // deno-lint-ignore ban-ts-comment
      //@ts-ignore
      serialized_data = serialize(doc, false, true);
      deserialized_doc = deserialize(serialized_data);
      equal("hello", deserialized_doc.b);
    },
  );

  await step(
    "Should fail when top level object returns a non object type",
    () => {
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

      try {
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        var serialized_data = serialize(doc, false, true);
        deserialize(serialized_data);
      } catch (_err) {
        test1 = true;
      }

      try {
        // deno-lint-ignore ban-ts-comment
        //@ts-ignore
        serialized_data = serialize(doc, false, true);
        deserialize(serialized_data);
      } catch (_err) {
        test2 = true;
      }

      assertEquals(true, test1);
      assertEquals(true, test2);
    },
  );
});
