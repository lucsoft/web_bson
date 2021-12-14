import { Buffer } from "buffer";
import { equal } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { assertEquals } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { deserialize } from "../src/bson.ts";
import { serializeWithBufferAndIndex } from "../src/bson.ts";
import {} from "../src/bson.ts";

Deno.test("serializeWithBuffer", async ({ step }) => {
  await step(
    "correctly serialize into buffer using serializeWithBufferAndIndex",
    () => {
      // Create a buffer
      var b = Buffer.alloc(256);
      // Serialize from index 0
      var r = serializeWithBufferAndIndex({ a: 1 }, b);
      assertEquals(11, r);

      // Serialize from index r+1
      r = serializeWithBufferAndIndex({ a: 1 }, b, {
        index: r + 1,
      });
      assertEquals(23, r);

      // Deserialize the buffers
      var doc = deserialize(b.slice(0, 12));
      equal({ a: 1 }, doc);
      doc = deserialize(b.slice(12, 24));
      equal({ a: 1 }, doc);
    },
  );

  await step(
    "correctly serialize 3 different docs into buffer using serializeWithBufferAndIndex",
    () => {
      const MAXSIZE = 1024 * 1024 * 17;
      let bf = Buffer.alloc(MAXSIZE);

      const data = [
        {
          a: 1,
          b: new Date("2019-01-01"),
        },
        {
          a: 2,
          b: new Date("2019-01-02"),
        },
        {
          a: 3,
          b: new Date("2019-01-03"),
        },
      ];

      let idx = 0;
      data.forEach((item) => {
        idx = serializeWithBufferAndIndex(item, bf, {
          index: idx,
        }) + 1;
      });

      equal(deserialize(bf.slice(0, 23)), data[0]);
      equal(deserialize(bf.slice(23, 46)), data[1]);
      equal(deserialize(bf.slice(46, 69)), data[2]);
    },
  );
});
