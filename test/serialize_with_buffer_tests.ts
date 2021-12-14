import { Buffer } from "buffer";
import {} from "../src/bson.ts";

Deno.test("serializeWithBuffer", () => {
  /**
   * @ignore
   */
  Deno.test(
    "correctly serialize into buffer using serializeWithBufferAndIndex",
    () =>
      // Create a buffer
      var b = Buffer.alloc(256);
      // Serialize from index 0
      var r = serializeWithBufferAndIndex({ a: 1 }, b);
      assert(11).to.equal(r);

      // Serialize from index r+1
      r = serializeWithBufferAndIndex({ a: 1 }, b, {
        index: r + 1,
      });
      assert(23).to.equal(r);

      // Deserialize the buffers
      var doc = deserialize(b.slice(0, 12));
      assert({ a: 1 }).to.deep.equal(doc);
      doc = deserialize(b.slice(12, 24));
      assert({ a: 1 }).to.deep.equal(doc);
    },
  );

  Deno.test(
    "correctly serialize 3 different docs into buffer using serializeWithBufferAndIndex",
    () =>
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

      assert(deserialize(bf.slice(0, 23))).to.deep.equal(data[0]);
      assert(deserialize(bf.slice(23, 46))).to.deep.equal(data[1]);
      assert(deserialize(bf.slice(46, 69))).to.deep.equal(data[2]);
    },
  );
});
