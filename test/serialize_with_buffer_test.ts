import { assertEquals, Buffer } from "../deps.ts";
import { deserialize, serializeWithBufferAndIndex } from "../src/bson.ts";

Deno.test("[serializeWithBuffer] correctly serialize into buffer using serializeWithBufferAndIndex", () => {
  // Create a buffer
  const b = Buffer.alloc(256);
  // Serialize from index 0
  let r = serializeWithBufferAndIndex({ a: 1 }, b);
  assertEquals(11, r);

  // Serialize from index r+1
  r = serializeWithBufferAndIndex({ a: 1 }, b, {
    index: r + 1,
  });
  assertEquals(23, r);

  // Deserialize the buffers
  let doc = deserialize(b.slice(0, 12));
  assertEquals({ a: 1 }, doc);
  doc = deserialize(b.slice(12, 24));
  assertEquals({ a: 1 }, doc);
});

Deno.test("[serializeWithBuffer] correctly serialize 3 different docs into buffer using serializeWithBufferAndIndex", () => {
  const MAXSIZE = 1024 * 1024 * 17;
  const bf = new Uint8Array(MAXSIZE);

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

  assertEquals(deserialize(bf.slice(0, 23)), data[0]);
  assertEquals(deserialize(bf.slice(23, 46)), data[1]);
  assertEquals(deserialize(bf.slice(46, 69)), data[2]);
});
