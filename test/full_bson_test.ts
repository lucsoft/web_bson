import { Binary, BSONRegExp, ObjectId } from "../src/bson.ts";
import { Buffer } from "buffer";
import { BinaryParser } from "./tools/binary_parser.ts";
import { deserialize } from "../src/bson.ts";
import { serialize } from "../src/bson.ts";
import {
  assert,
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { equal } from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { Document } from "../src/bson.ts";

Deno.test("Full BSON", ({ step }) => {
  /**
   * @ignore
   */
  step("Should Correctly Deserialize object", () => {
    // deno-fmt-ignore
    var bytes = [ 95, 0, 0, 0, 2, 110, 115, 0, 42, 0, 0, 0, 105, 110, 116, 101, 103, 114, 97, 116, 105, 111, 110, 95, 116, 101, 115, 116, 115, 95, 46, 116, 101, 115, 116, 95, 105, 110, 100, 101, 120, 95, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 8, 117, 110, 105, 113, 117, 101, 0, 0, 3, 107, 101, 121, 0, 12, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 0, 2, 110, 97, 109, 101, 0, 4, 0, 0, 0, 97, 95, 49, 0, 0,
    ];
    var serialized_data = "";
    // Convert to chars
    for (var i = 0; i < bytes.length; i++) {
      serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
    }

    var object = deserialize(Buffer.from(serialized_data, "binary"));
    assertEquals("a_1", object.name);
    assertEquals(false, object.unique);
    assertEquals(1, object.key.a);
  });

  /**
   * @ignore
   */
  step(
    "Should Correctly Deserialize object with all types",
    () => {
      // deno-fmt-ignore
      const bytes = [ 26,  1,  0,  0,  7, 95,105,100,  0,161,190, 98, 75,118,169,  3,  0,  0,  3,  0,  0,  4, 97,114,114, 97,121,  0, 26,  0,  0,  0, 16, 48,  0,  1,  0,  0,  0, 16, 49,  0,  2,  0,  0,  0, 16, 50,  0,  3,  0,  0,  0,  0,  2,115,116,114,105,110,103,  0,  6,  0,  0,  0,104,101,108,108,111,  0,  3,104, 97,115,104,  0, 19,  0,  0,  0, 16, 97,  0,  1,  0,  0,  0, 16, 98,  0,  2,  0,  0,  0,  0,  9,100, 97,116,101,  0,161,190, 98, 75,  0,  0,  0,  0,  7,111,105,100,  0,161,190, 98, 75, 90,217, 18,  0,  0,  1,  0,  0,  5, 98,105,110, 97,114,121,  0,  7,  0,  0,  0,  2,  3,  0,  0,  0, 49, 50, 51, 16,105,110,116,  0, 42,  0,  0,  0,  1,102,108,111, 97,116,  0,223,224, 11,147,169,170, 64, 64, 11,114,101,103,101,120,112,  0,102,111,111, 98, 97,114,  0,105,  0,  8, 98,111,111,108,101, 97,110,  0,  1, 15,119,104,101,114,101,  0, 25,  0,  0,  0, 12,  0,  0,  0,116,104,105,115, 46,120, 32, 61, 61, 32, 51,  0,  5,  0,  0,  0,  0,  3,100, 98,114,101,102,  0, 37,  0,  0,  0,  2, 36,114,101,102,  0,  5,  0,  0,  0,116,101,115,116,  0,  7, 36,105,100,  0,161,190, 98, 75,  2,180,  1,  0,  0,  2,  0,  0,  0, 10,110,117,108,108,  0,  0, ];
      let serialized_data = "";
      // Convert to chars
      for (let i = 0; i < bytes.length; i++) {
        serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
      }

      const object = deserialize(Buffer.from(serialized_data, "binary"));
      assertEquals("hello", object.string);
      assert([equal, 3], object.array);
      assertEquals(1, object.hash.a);
      assertEquals(2, object.hash.b);
      assert(object.date != null);
      assert(object.oid != null);
      assert(object.binary != null);
      assertEquals(42, object.int);
      assertEquals(33.3333, object.float);
      assert(object.regexp != null);
      assertEquals(true, object.boolean);
      assert(object.where != null);
      assert(object.dbref != null);
      assert(object["null"] == null);
    },
  );

  /**
   * @ignore
   */
  step("Should Serialize and Deserialize String", () => {
    var test_string = { hello: "world" };
    var serialized_data = serialize(test_string);
    equal(test_string, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Integer 5",
    () => {
      var test_number = { doc: 5 };
      var serialized_data = serialize(test_number);
      equal(test_number, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize null value",
    () => {
      const test_null = { doc: null };
      const serialized_data = serialize(test_null);
      const object = deserialize(serialized_data);
      equal(test_null, object);
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize undefined value",
    () => {
      const test_undefined = { doc: undefined };
      const serialized_data = serialize(test_undefined);
      const object = deserialize(serialized_data);
      assertEquals(undefined, object.doc);
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Number 3",
    () => {
      var test_number = { doc: 5.5 };
      var serialized_data = serialize(test_number);
      equal(test_number, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Integers",
    () => {
      var test_int = { doc: 42 };
      var serialized_data = serialize(test_int);
      equal(test_int, deserialize(serialized_data));

      test_int = { doc: -5600 };
      serialized_data = serialize(test_int);
      equal(test_int, deserialize(serialized_data));

      test_int = { doc: 2147483647 };
      serialized_data = serialize(test_int);
      equal(test_int, deserialize(serialized_data));

      test_int = { doc: -2147483648 };
      serialized_data = serialize(test_int);
      equal(test_int, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Object",
    () => {
      var doc = { doc: { age: 42, name: "Spongebob", shoe_size: 9.5 } };
      var serialized_data = serialize(doc);
      equal(doc, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Array",
    () => {
      var doc = { doc: [1, 2, "a", "b"] };
      var serialized_data = serialize(doc);
      equal(doc, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Array with added on functions",
    () => {
      var doc = { doc: [1, 2, "a", "b"] };
      var serialized_data = serialize(doc);
      equal(doc, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize A Boolean",
    () => {
      var doc = { doc: true };
      var serialized_data = serialize(doc);
      equal(doc, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize a Date",
    () => {
      var date = new Date();
      //(2009, 11, 12, 12, 00, 30)
      date.setUTCDate(12);
      date.setUTCFullYear(2009);
      date.setUTCMonth(11 - 1);
      date.setUTCHours(12);
      date.setUTCMinutes(0);
      date.setUTCSeconds(30);
      var doc = { doc: date };
      var serialized_data = serialize(doc);
      equal(doc, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  step("Should Correctly Serialize and Deserialize Oid", () => {
    var doc: Document = { doc: new ObjectId() };
    var serialized_data = serialize(doc);
    //@ts-ignore
    assert(
      doc.doc.toHexString(),
      deserialize(serialized_data).doc.toHexString(),
    );
  });

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Buffer",
    () => {
      var doc = { doc: Buffer.from("123451234512345") };
      var serialized_data = serialize(doc);

      assertEquals(
        "123451234512345",
        deserialize(serialized_data).doc.buffer.toString("ascii"),
      );
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Buffer with promoteBuffers option",
    () => {
      var doc = { doc: Buffer.from("123451234512345") };
      var serialized_data = serialize(doc);

      var options = { promoteBuffers: true };
      assertEquals(
        "123451234512345",
        deserialize(serialized_data, options).doc.toString("ascii"),
      );
    },
  );

  /**
   * @ignore
   */
  step("Should Correctly encode Empty Hash", () => {
    var test_code = {};
    var serialized_data = serialize(test_code);
    equal(test_code, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Ordered Hash",
    () => {
      var doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
      var serialized_data = serialize(doc);
      var decoded_hash = deserialize(serialized_data).doc;
      var keys = [];
      for (var name in decoded_hash) keys.push(name);
      assertEquals(["b", "a", "c", "d"], keys);
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize Regular Expression",
    () => {
      var doc = { doc: /foobar/im };
      var serialized_data = serialize(doc);
      var doc2 = deserialize(serialized_data);
      assertEquals(doc.doc.toString(), doc2.doc.toString());
    },
  );

  /**
   * @ignore
   */
  step(
    "Should Correctly Serialize and Deserialize a Binary object",
    () => {
      var bin = new Binary();
      var string = "binstring";
      for (var index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }
      var doc = { doc: bin };
      var serialized_data = serialize(doc);
      var deserialized_data = deserialize(serialized_data);
      assertEquals(doc.doc.value(), deserialized_data.doc.value());
    },
  );

  step(
    "Should Correctly Serialize and Deserialize a ArrayBuffer object",
    () => {
      const arrayBuffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
      const doc = { arrayBuffer };
      const serialized_data = serialize(doc);
      const deserialized_data = deserialize(serialized_data);

      assert((deserialized_data.arrayBuffer as Uint8Array).byteLength != 0);
    },
  );

  step(
    "Should Correctly Serialize and Deserialize a Float64Array object",
    () => {
      const floats = new Float64Array([12.34]);
      const doc = { floats };
      const serialized_data = serialize(doc);
      const deserialized_data = deserialize(serialized_data);

      assert(deserialized_data.floats != null);
      assert(deserialized_data.floats == 12.34);
    },
  );

  step(
    "Should Correctly fail due to attempting serialization of illegal key values",
    () => {
      var k = Buffer.alloc(15);
      for (var i = 0; i < 15; i++) k[i] = 0;

      k.write("hello");
      k[6] = 0x06;
      k.write("world", 10);

      var v = Buffer.alloc(65801);
      for (i = 0; i < 65801; i++) v[i] = 1;
      v[0] = 0x0a;
      var doc: Document = {};
      doc[k.toString()] = v.toString();

      // Should throw due to null character
      assertThrows(() =>
        serialize(doc, {
          checkKeys: true,
        })
      );
    },
  );

  step(
    "Should correctly fail to serialize regexp with null bytes",
    () => {
      const doc: Document = {};
      assertThrows(() => {
        doc.test = new RegExp("a\0b"); // eslint-disable-line no-control-regex
        serialize(doc, {
          checkKeys: true,
        });
      });
    },
  );

  step(
    "Should correctly fail to serialize BSONRegExp with null bytes",
    () => {
      const doc: Document = {};
      assertThrows(() => {
        doc.test = new BSONRegExp("a\0b");
        serialize(doc, {
          checkKeys: true,
        });
      });
    },
  );
});
