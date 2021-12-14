import { Buffer } from "buffer";
import {
  Binary,
  BinarySizes,
  BSON_INT32_MAX,
  BSONError,
  BSONRegExp,
  BSONSymbol,
  calculateObjectSize,
  Code,
  DBRef,
  Decimal128,
  deserialize,
  deserializeStream,
  Document,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  serialize,
  serializeWithBufferAndIndex,
  Timestamp,
} from "../src/bson.ts";
import {
  assert,
  assertEquals,
  assertThrows,
  equal,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { BinaryParser } from "./tools/binary_parser.ts";
import { equals } from "https://deno.land/std@0.117.0/bytes/mod.ts";

/**
 * Module for parsing an ISO 8601 formatted string into a Date object.
 */
const ISO_REGEX =
  /^(\d{4})(-(\d{2})(-(\d{2})(T(\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|((\+|-)(\d{2}):(\d{2}))))?)?)?$/;
const ISODate = (string: any) => {
  if (typeof string.getTime === "function") {
    return string;
  }

  const match = string.match(ISO_REGEX);
  if (!match) {
    throw new BSONError(`Invalid ISO 8601 date given: ${string}`);
  }

  let date = new Date();
  date.setUTCFullYear(Number(match[1]));
  date.setUTCMonth(Number(match[3]) - 1 || 0);
  date.setUTCDate(Number(match[5]) || 0);
  date.setUTCHours(Number(match[7]) || 0);
  date.setUTCMinutes(Number(match[8]) || 0);
  date.setUTCSeconds(Number(match[10]) || 0);
  date.setUTCMilliseconds(Number("." + match[12]) * 1000 || 0);

  if (match[13] && match[13] !== "Z") {
    let h = Number(match[16]) || 0,
      m = Number(match[17]) || 0;

    h *= 3600000;
    m *= 60000;

    let offset = h + m;
    if (match[15] === "+") offset = -offset;

    date = new Date(date.valueOf() + offset);
  }

  return date;
};

Deno.test("BSON", async ({ step }) => {
  /**
   * @ignore
   */
  await step("Should Correctly convert ObjectId to itself", () => {
    const myObject = new ObjectId();
    const newObject = new ObjectId(myObject);
    equal(myObject, newObject);
  });

  /**
   * @ignore
   */
  await step("Should Correctly Deserialize object", () => {
    // deno-fmt-ignore
    const bytes = [95, 0, 0, 0, 2, 110, 115, 0, 42, 0, 0, 0, 105, 110, 116, 101, 103, 114, 97, 116, 105, 111, 110, 95, 116, 101, 115, 116, 115, 95, 46, 116, 101, 115, 116, 95, 105, 110, 100, 101, 120, 95, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 8, 117, 110, 105, 113, 117, 101, 0, 0, 3, 107, 101, 121, 0, 12, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 0, 2, 110, 97, 109, 101, 0, 4, 0, 0, 0, 97, 95, 49, 0, 0];
    let serialized_data = "";
    // Convert to chars
    for (let i = 0; i < bytes.length; i++) {
      serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
    }

    const object = deserialize(Buffer.from(serialized_data, "binary"));
    assertEquals("a_1", object.name);
    assertEquals(false, object.unique);
    assertEquals(1, object.key.a);
  });

  /**
   * @ignore
   */
  await step("Should Correctly Deserialize object with all types", () => {
    // deno-fmt-ignore
    const bytes = [ 26, 1, 0, 0, 7, 95, 105, 100, 0, 161, 190, 98, 75, 118, 169, 3, 0, 0, 3, 0, 0, 4, 97, 114, 114, 97, 121, 0, 26, 0, 0, 0, 16, 48, 0, 1, 0, 0, 0, 16, 49, 0, 2, 0, 0, 0, 16, 50, 0, 3, 0, 0, 0, 0, 2, 115, 116, 114, 105, 110, 103, 0, 6, 0, 0, 0, 104, 101, 108, 108, 111, 0, 3, 104, 97, 115, 104, 0, 19, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 16, 98, 0, 2, 0, 0, 0, 0, 9, 100, 97, 116, 101, 0, 161, 190, 98, 75, 0, 0, 0, 0, 7, 111, 105, 100, 0, 161, 190, 98, 75, 90, 217, 18, 0, 0, 1, 0, 0, 5, 98, 105, 110, 97, 114, 121, 0, 7, 0, 0, 0, 2, 3, 0, 0, 0, 49, 50, 51, 16, 105, 110, 116, 0, 42, 0, 0, 0, 1, 102, 108, 111, 97, 116, 0, 223, 224, 11, 147, 169, 170, 64, 64, 11, 114, 101, 103, 101, 120, 112, 0, 102, 111, 111, 98, 97, 114, 0, 105, 0, 8, 98, 111, 111, 108, 101, 97, 110, 0, 1, 15, 119, 104, 101, 114, 101, 0, 25, 0, 0, 0, 12, 0, 0, 0, 116, 104, 105, 115, 46, 120, 32, 61, 61, 32, 51, 0, 5, 0, 0, 0, 0, 3, 100, 98, 114, 101, 102, 0, 37, 0, 0, 0, 2, 36, 114, 101, 102, 0, 5, 0, 0, 0, 116, 101, 115, 116, 0, 7, 36, 105, 100, 0, 161, 190, 98, 75, 2, 180, 1, 0, 0, 2, 0, 0, 0, 10, 110, 117, 108, 108, 0, 0, ];
    let serialized_data = "";

    // Convert to chars
    for (let i = 0; i < bytes.length; i++) {
      serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
    }

    const object = deserialize(Buffer.from(serialized_data, "binary"));
    // Perform tests
    assertEquals("hello", object.string);
    equal([1, 2, 3], object.array);
    assertEquals(1, object.hash.a);
    assert(2, object.hash.b);
    assert(object.date != null);
    assert(object.oid != null);
    assert(object.binary != null);
    assertEquals(42, object.int);
    assertEquals(33.3333, object.float);
    assert(object.regexp != null);
    assertEquals(true, object.boolean);
    assert(object.where != null);
    assert(object.dbref != null);
  });

  /**
   * @ignore
   */
  await step("Should Serialize and Deserialize String", () => {
    let test_string = { hello: "world" };
    let serialized_data = serialize(test_string, {
      checkKeys: false,
    });

    serializeWithBufferAndIndex(test_string, serialized_data, {
      checkKeys: false,
      index: 0,
    });

    equal(test_string, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  await step("Should Serialize and Deserialize Empty String", () => {
    let test_string = { hello: "" };
    let serialized_data = serialize(test_string);
    let serialized_data2 = Buffer.alloc(calculateObjectSize(test_string));
    serializeWithBufferAndIndex(test_string, serialized_data2);

    equals(serialized_data, serialized_data2);
    equal(test_string, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Integer 5",
    () => {
      let test_number = { doc: 5 };

      let serialized_data = serialize(test_number);
      let serialized_data2 = Buffer.alloc(
        calculateObjectSize(test_number),
      );
      serializeWithBufferAndIndex(test_number, serialized_data2);
      equals(serialized_data, serialized_data2);
      equal(test_number, deserialize(serialized_data));
      equal(test_number, deserialize(serialized_data2));
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize null value",
    () => {
      let test_null = { doc: null };
      let serialized_data = serialize(test_null);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(test_null));
      serializeWithBufferAndIndex(test_null, serialized_data2);
      equals(serialized_data, serialized_data2);

      let object = deserialize(serialized_data);
      assertEquals(null, object.doc);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Number 1",
    () => {
      let test_number = { doc: 5.5 };
      let serialized_data = serialize(test_number);

      let serialized_data2 = Buffer.alloc(
        calculateObjectSize(test_number),
      );
      serializeWithBufferAndIndex(test_number, serialized_data2);
      equals(serialized_data, serialized_data2);

      equal(test_number, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Integer",
    () => {
      let test_int = { doc: 42 };
      let serialized_data = serialize(test_int);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      equals(serialized_data, serialized_data2);
      equal(test_int.doc, deserialize(serialized_data).doc);

      test_int = { doc: -5600 };
      serialized_data = serialize(test_int);

      serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      equals(serialized_data, serialized_data2);
      equal(test_int.doc, deserialize(serialized_data).doc);

      test_int = { doc: 2147483647 };
      serialized_data = serialize(test_int);

      serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      equals(serialized_data, serialized_data2);
      equal(test_int.doc, deserialize(serialized_data).doc);

      test_int = { doc: -2147483648 };
      serialized_data = serialize(test_int);

      serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      equals(serialized_data, serialized_data2);
      equal(test_int.doc, deserialize(serialized_data).doc);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Object",
    () => {
      let doc = { doc: { age: 42, name: "Spongebob", shoe_size: 9.5 } };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      equal(doc.doc.age, deserialize(serialized_data).doc.age);
      equal(doc.doc.name, deserialize(serialized_data).doc.name);
      equal(doc.doc.shoe_size, deserialize(serialized_data).doc.shoe_size);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should correctly ignore undefined values in arrays",
    () => {
      let doc = { doc: { notdefined: undefined } };
      let serialized_data = serialize(doc, {
        ignoreUndefined: true,
      });
      let serialized_data2 = Buffer.alloc(
        calculateObjectSize(doc, {
          ignoreUndefined: true,
        }),
      );
      serializeWithBufferAndIndex(doc, serialized_data2, {
        ignoreUndefined: true,
      });

      equals(serialized_data, serialized_data2);
      let doc1 = deserialize(serialized_data);

      equal(undefined, doc1.doc.notdefined);
    },
  );

  await step(
    "Should correctly serialize undefined array entries as null values",
    () => {
      let doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
      let serialized_data = serialize(doc, {
        ignoreUndefined: true,
      });
      let serialized_data2 = Buffer.alloc(
        calculateObjectSize(doc, {
          ignoreUndefined: true,
        }),
      );
      serializeWithBufferAndIndex(doc, serialized_data2, {
        ignoreUndefined: true,
      });
      equals(serialized_data, serialized_data2);
      let doc1 = deserialize(serialized_data);
      equal(undefined, doc1.doc.notdefineassertEqualsd);
      assert(null, doc1.a[2]);
    },
  );

  await step(
    "Should correctly serialize undefined array entries as undefined values",
    () => {
      let doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
      let serialized_data = serialize(doc, {
        ignoreUndefined: false,
      });
      let serialized_data2 = Buffer.alloc(
        calculateObjectSize(doc, {
          ignoreUndefined: false,
        }),
      );
      serializeWithBufferAndIndex(doc, serialized_data2, {
        ignoreUndefined: false,
      });

      // console.log("======================================== 0")
      // console.log(serialized_data.toString('hex'))
      // console.log(serialized_data2.toString('hex'))

      equals(serialized_data, serialized_data2);
      let doc1 = deserialize(serialized_data);
      let doc2 = deserialize(serialized_data2);
      // console.log("======================================== 0")
      // console.dir(doc1)
      // console.dir(doc2)

      equal(null, doc1.doc.notdefined);
      equal(null, doc2.doc.notdefined);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Array",
    () => {
      let doc = { doc: [1, 2, "a", "b"] };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized = deserialize(serialized_data);
      assertEquals(doc.doc[0], deserialized.doc[0]);
      assertEquals(doc.doc[1], deserialized.doc[1]);
      assertEquals(doc.doc[2], deserialized.doc[2]);
      assertEquals(doc.doc[3], deserialized.doc[3]);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Buffer",
    () => {
      let doc = { doc: Buffer.from("hello world") };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized = deserialize(serialized_data);
      assert(deserialized.doc instanceof Binary);
      assertEquals("hello world", deserialized.doc.toString());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Buffer with promoteBuffers option",
    () => {
      let doc = { doc: Buffer.from("hello world") };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized = deserialize(serialized_data, {
        promoteBuffers: true,
      });
      assert(Buffer.isBuffer(deserialized.doc));
      assertEquals("hello world", deserialized.doc.toString());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Number 4",
    () => {
      let doc: Document = { doc: BSON_INT32_MAX + 10 };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized = deserialize(serialized_data);
      // assert(deserialized.doc instanceof Binary);
      assertEquals(BSON_INT32_MAX + 10, deserialized.doc);
    },
  );

  //   /**
  //    * @ignore
  //    */
  //    step(
  //     "Should Correctly Serialize and Deserialize Array with added on functions",
  //     () => {
  //       Array.prototype.toXml = () => {};
  //       let doc = { doc: [1, 2, "a", "b"] };
  //       let serialized_data = serialize(doc);

  //       let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
  //       serializeWithBufferAndIndex(doc, serialized_data2);
  //       equals(serialized_data, serialized_data2);

  //       let deserialized = deserialize(serialized_data);
  //       assertEquals(doc.doc[0], deserialized.doc[0]);
  //       assertEquals(doc.doc[1], deserialized.doc[1]);
  //       assertEquals(doc.doc[2], deserialized.doc[2]);
  //       assertEquals(doc.doc[3], deserialized.doc[3]);
  //     },
  //   );

  /**
   * @ignore
   */
  await step("Should correctly deserialize a nested object", () => {
    let doc = { doc: { doc: 1 } };
    let serialized_data = serialize(doc);

    let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);

    equal(doc.doc.doc, deserialize(serialized_data).doc.doc);
  });

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize A Boolean",
    () => {
      let doc = { doc: true };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      assertEquals(doc.doc, deserialize(serialized_data).doc);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize a Date",
    () => {
      let date = new Date();
      //(2009, 11, 12, 12, 00, 30)
      date.setUTCDate(12);
      date.setUTCFullYear(2009);
      date.setUTCMonth(11 - 1);
      date.setUTCHours(12);
      date.setUTCMinutes(0);
      date.setUTCSeconds(30);
      let doc = { doc: date };
      let serialized_data = serialize(doc);
      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);

      equals(serialized_data, serialized_data2);

      let doc1 = deserialize(serialized_data);
      equal(doc, doc1);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize a Date from another VM",
    () => {
      const vm: any = undefined;
      let script = "date1 = new Date();",
        ctx = vm.createContext({
          date1: null,
        });
      vm.runInContext(script, ctx, "myfile.vm");

      let date = ctx.date1;
      //(2009, 11, 12, 12, 00, 30)
      date.setUTCDate(12);
      date.setUTCFullYear(2009);
      date.setUTCMonth(11 - 1);
      date.setUTCHours(12);
      date.setUTCMinutes(0);
      date.setUTCSeconds(30);
      let doc = { doc: date };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);
      assertEquals(doc.doc.date, deserialize(serialized_data).doc.date);
    },
  );

  /**
   * @ignore
   */
  await step("Should Correctly Serialize nested doc", () => {
    let doc = {
      string: "Strings are great",
      decimal: 3.14159265,
      bool: true,
      integer: 5,

      subObject: {
        moreText: "Bacon ipsum dolor.",
        longKeylongKeylongKeylongKeylongKeylongKey: "Pork belly.",
      },

      subArray: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      anotherString: "another string",
    };

    let serialized_data = serialize(doc);

    let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);
  });

  /**
   * @ignore
   */
  await step("Should Correctly Serialize and Deserialize Oid", () => {
    const doc: Document = { doc: new ObjectId() };
    const serialized_data = serialize(doc);

    const serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);

    const deserializedDoc = deserialize(serialized_data);
    assert(deserializedDoc.doc instanceof ObjectId);
    assertEquals(doc.doc.toHexString(), deserializedDoc.doc.toHexString());
  });

  /**
   * @ignore
   */
  await step("Should Correctly encode Empty Hash", () => {
    let doc = {};
    let serialized_data = serialize(doc);

    let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);

    equal(doc, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Ordered Hash",
    () => {
      let doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let decoded_hash = deserialize(serialized_data).doc;
      let keys = [];

      for (let name in decoded_hash) keys.push(name);
      equal(["b", "a", "c", "d"], keys);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Regular Expression",
    () => {
      // Serialize the regular expression
      let doc = { doc: /foobar/im };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);

      assertEquals(doc.doc.toString(), doc2.doc.toString());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize a Binary object",
    () => {
      let bin = new Binary();
      let string = "binstring";
      for (let index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }

      let doc = { doc: bin };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);

      equal(doc.doc.value(), deserialized_data.doc.value());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize a Type 2 Binary object",
    () => {
      let bin = new Binary(
        Buffer.from("binstring"),
        BinarySizes.SUBTYPE_BYTE_ARRAY,
      );
      let string = "binstring";
      for (let index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }

      let doc = { doc: bin };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);

      equal(doc.doc.value(), deserialized_data.doc.value());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize DBRef",
    () => {
      let oid = new ObjectId();
      let doc = { dbref: new DBRef("namespace", oid, undefined, {}) };

      let serialized_data = serialize(doc);
      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equal(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);
      equal(doc, doc2);
      assert(doc2.dbref.oid.equal(), oid.toHexString());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize partial DBRef",
    () => {
      let id = new ObjectId();
      let doc = { name: "something", user: { $ref: "username", $id: id } };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);
      assertEquals("something", doc2.name);
      assertEquals("username", doc2.user.collection);
      assertEquals(id.toString(), doc2.user.oid.toString());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize simple Int",
    () => {
      let doc = { doc: 2147483648 };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);
      equal(doc.doc, doc2.doc);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Long Integer",
    () => {
      let doc = { doc: Long.fromNumber(9223372036854775807) };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equals(deserialized_data.doc));

      doc = { doc: Long.fromNumber(-9223372036854775) };
      serialized_data = serialize(doc);
      deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equals(deserialized_data.doc));

      doc = { doc: Long.fromNumber(-9223372036854775809) };
      serialized_data = serialize(doc);
      deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equals(deserialized_data.doc));
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Deserialize Large Integers as Number not Long",
    () => {
      function roundTrip(val: number) {
        let doc = { doc: val };
        let serialized_data = serialize(doc);

        let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
        serializeWithBufferAndIndex(doc, serialized_data2);
        equals(serialized_data, serialized_data2);

        let deserialized_data = deserialize(serialized_data);
        equal(doc, deserialized_data.doc);
      }

      roundTrip(2 ** 52);
      roundTrip(2 ** 53 - 1);
      roundTrip(2 ** 53);
      roundTrip(-Math.pow(2, 52));
      roundTrip(-Math.pow(2, 53) + 1);
      roundTrip(-Math.pow(2, 53));
      roundTrip(2 ** 65); // Too big for Long.
      roundTrip(-Math.pow(2, 65));
      roundTrip(9_223_372_036_854_775_807);
      roundTrip(1_234_567_890_123_456_800); // Bigger than 2^53, stays a double.
      roundTrip(-1_234_567_890_123_456_800);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Timestamp as subclass of Long",
    () => {
      let long = Long.fromNumber(9223372036854775807);
      let timestamp = Timestamp.fromNumber(9223372036854775807);
      assert(long instanceof Long);
      assert(!(long instanceof Timestamp));
      assert(timestamp instanceof Timestamp);
      assert(timestamp instanceof Long);

      let test_int = { doc: long, doc2: timestamp };
      let serialized_data = serialize(test_int);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      assert(test_int.doc.equals(deserialized_data.doc));
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Always put the id as the first item in a hash",
    () => {
      let hash = { doc: { not_id: 1, _id: 2 } };
      let serialized_data = serialize(hash);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(hash));
      serializeWithBufferAndIndex(hash, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      let keys = [];

      for (let name in deserialized_data.doc) {
        keys.push(name);
      }

      equal(["not_id", "equal"], keys);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize a User defined Binary object",
    () => {
      let bin = new Binary();
      bin.sub_type = BinarySizes.SUBTYPE_USER_DEFINE;
      let string = "binstring";
      for (let index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }

      let doc = { doc: bin };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);
      let deserialized_data = deserialize(serialized_data);

      equal(
        deserialized_data.equal.sub_type,
        BinarySizes.SUBTYPE_USER_DEFINE,
      );
      equal(doc.doc.value(), deserialized_data.doc.value());
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize a Code object",
    () => {
      let doc = { doc: { doc2: new Code("this.a > i", { i: 1 }) } };
      let serialized_data = serialize(doc);
      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      equal(doc.doc.doc2.code, deserialized_data.doc.doc2.code);
      equal(doc.doc.doc2.scope?.i, deserialized_data.doc.doc2.scope.i);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly serialize and deserialize and embedded array",
    () => {
      let doc = {
        a: 0,
        b: [
          "tmp1",
          "tmp2",
          "tmp3",
          "tmp4",
          "tmp5",
          "tmp6",
          "tmp7",
          "tmp8",
          "tmp9",
          "tmp10",
          "tmp11",
          "tmp12",
          "tmp13",
          "tmp14",
          "tmp15",
          "tmp16",
        ],
      };

      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      equal(doc.a, deserialized_data.a);
      equal(doc.b, deserialized_data.b);
    },
  );

  /**
   * @ignore
   */
  await step("Should Correctly Serialize and Deserialize UTF8", () => {
    // Serialize utf8
    let doc = {
      name: "本荘由利地域に洪水警報",
      name1: "öüóőúéáűíÖÜÓŐÚÉÁŰÍ",
      name2: "abcdedede",
      name3: "本荘由利地域に洪水警報",
      name4: "abcdedede",
      本荘由利地域に洪水警報: "本荘由利地域に洪水警報",
      本荘由利地本荘由利地: {
        本荘由利地域に洪水警報: "本荘由利地域に洪水警報",
        地域に洪水警報本荘由利: "本荘由利地域に洪水警報",
        洪水警報本荘地域に洪水警報本荘由利: "本荘由利地域に洪水警報",
      },
    };
    let serialized_data = serialize(doc);

    let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);

    let deserialized_data = deserialize(serialized_data);
    equal(doc, deserialized_data);
  });

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize query object",
    () => {
      let doc = {
        count: "remove_with_no_callback_bug_test",
        query: {},
        fields: null,
      };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      equal(doc, deserialized_data);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize empty query object",
    () => {
      let doc = {};
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      equal(doc, deserialized_data);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize array based doc",
    () => {
      let doc = { b: [1, 2, 3], _id: new ObjectId() };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let deserialized_data = deserialize(serialized_data);
      assert(doc.b, deserialized_data.b);
      equal(doc, deserialized_data);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize and Deserialize Symbol",
    () => {
      if (BSONSymbol != null) {
        // symbols are deprecated, so upgrade to strings... so I'm not sure
        // we really need this test anymore...
        //let doc = { b: [new BSONSymbol('test')] };

        let doc = { b: ["test"] };
        let serialized_data = serialize(doc);
        let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
        serializeWithBufferAndIndex(doc, serialized_data2);
        equals(serialized_data, serialized_data2);

        let deserialized_data = deserialize(serialized_data);
        equal(doc, deserialized_data);
        assertEquals(typeof deserialized_data.b[0], "string");
      }
    },
  );

  /**
   * @ignore
   */
  await step("Should handle Deeply nested document", () => {
    const doc: Document = { a: { b: { c: { d: 2 } } } };
    const serialized_data = serialize(doc);

    const serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);

    const deserialized_data = deserialize(serialized_data);
    equal(doc, deserialized_data);
  });

  //   /**
  //    * @ignore
  //    */
  //    await step("Should handle complicated all typed object", () => {
  //     // First doc
  //     let date = new Date();
  //     let oid = new ObjectId();
  //     let string = "binstring";
  //     let bin = new Binary();
  //     for (let index = 0; index < string.length; index++) {
  //       bin.put(string.charAt(index));
  //     }

  //     let doc = {
  //       string: "hello",
  //       array: [1, 2, 3],
  //       hash: { a: 1, b: 2 },
  //       date: date,
  //       oid: oid,
  //       binary: bin,
  //       int: 42,
  //       float: 33.3333,
  //       regexp: /regexp/,
  //       boolean: true,
  //       long: date.getTime(),
  //       where: new Code("this.a > i", { i: 1 }),
  //       dbref: new DBRef("namespace", oid, "integration_tests_"),
  //     };

  //     // Second doc
  //     oid = ObjectId.createFromHexString(oid.toHexString());
  //     string = "binstring";
  //     bin = new Binary();
  //     for (let index = 0; index < string.length; index++) {
  //       bin.put(string.charAt(index));
  //     }

  //     let doc2 = {
  //       string: "hello",
  //       array: [1, 2, 3],
  //       hash: { a: 1, b: 2 },
  //       date: date,
  //       oid: oid,
  //       binary: bin,
  //       int: 42,
  //       float: 33.3333,
  //       regexp: /regexp/,
  //       boolean: true,
  //       long: date.getTime(),
  //       where: new Code("this.a > i", { i: 1 }),
  //       dbref: new DBRef("namespace", oid, "integration_tests_"),
  //     };

  //     let serialized_data = serialize(doc);

  //     let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
  //     serializeWithBufferAndIndex(doc, serialized_data2);

  //     equal(serialized_data, serialized_data2);

  //     serialized_data2 = serialize(doc2, false, true);

  //     equal(serialized_data, serialized_data2);
  //   });

  //   /**
  //    * @ignore
  //    */
  //    step(
  //     "Should Correctly Serialize Complex Nested Object",
  //     () => {
  //       let doc = {
  //         email: "email@email.com",
  //         encrypted_password: "password",
  //         friends: ["4db96b973d01205364000006", "4dc77b24c5ba38be14000002"],
  //         location: [72.4930088, 23.0431957],
  //         name: "Amit Kumar",
  //         password_salt: "salty",
  //         profile_fields: [],
  //         username: "amit",
  //         _id: new ObjectId(),
  //       };

  //       let serialized_data = serialize(doc);

  //       let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
  //       serializeWithBufferAndIndex(doc, serialized_data2);
  //       equals(serialized_data, serialized_data2);

  //       let doc2 = doc;
  //       doc2._id = ObjectId.createFromHexString(doc2._id.toHexString());
  //       serialized_data2 = serialize(doc2, false, true);

  //       for (let i = 0; i < serialized_data2.length; i++) {
  //         assertEquals(serialized_data2[i], serialized_data[i]);
  //       }
  //     },
  //   );

  //   /**
  //    * @ignore
  //    */
  //    await step("Should correctly massive doc", () => {
  //     let oid1 = new ObjectId();
  //     let oid2 = new ObjectId();
  //     // JS doc
  //     let doc = {
  //       dbref2: new DBRef("namespace", oid1, "integration_tests_"),
  //       _id: oid2,
  //     };

  //     let doc2 = {
  //       dbref2: new DBRef(
  //         "namespace",
  //         ObjectId.createFromHexString(oid1.toHexString()),
  //         "integration_tests_",
  //       ),
  //       _id: ObjectId.createFromHexString(oid2.toHexString()),
  //     };

  //     let serialized_data = serialize(doc);
  //     let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
  //     serializeWithBufferAndIndex(doc, serialized_data2);
  //     equal(serialized_data, serialized_data2);

  //     serialized_data2 = serialize(doc2, false, true);
  //     equal(serialized_data, serialized_data2);
  //   });

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize/Deserialize regexp object",
    () => {
      let doc = { b: /foobaré/ };

      let serialized_data = serialize(doc);

      let serialized_data2 = new Uint8Array(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      serialized_data2 = serialize(doc);

      for (let i = 0; i < serialized_data2.length; i++) {
        assertEquals(serialized_data2[i], serialized_data[i]);
      }
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize/Deserialize complicated object",
    () => {
      let doc = {
        a: { b: { c: [new ObjectId(), new ObjectId()] } },
        d: { f: 1332.3323 },
      };

      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);

      equal(doc, doc2);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize/Deserialize nested object",
    () => {
      let doc = {
        _id: { date: new Date(), gid: "6f35f74d2bea814e21000000" },
        value: {
          b: { countries: { "--": 386 }, total: 1599 },
          bc: { countries: { "--": 3 }, total: 10 },
          gp: { countries: { "--": 2 }, total: 13 },
          mgc: { countries: { "--": 2 }, total: 14 },
        },
      };

      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);

      equal(doc, doc2);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should Correctly Serialize/Deserialize nested object with even more nesting",
    () => {
      let doc = {
        _id: {
          date: { a: 1, b: 2, c: new Date() },
          gid: "6f35f74d2bea814e21000000",
        },
        value: {
          b: { countries: { "--": 386 }, total: 1599 },
          bc: { countries: { "--": 3 }, total: 10 },
          gp: { countries: { "--": 2 }, total: 13 },
          mgc: { countries: { "--": 2 }, total: 14 },
        },
      };

      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc2 = deserialize(serialized_data);
      equal(doc, doc2);
    },
  );

  /**
   * @ignore
   */
  await step("Should Correctly Serialize empty name object", () => {
    let doc = {
      "": "test",
      bbbb: 1,
    };
    let serialized_data = serialize(doc);
    let doc2 = deserialize(serialized_data);
    assertEquals(doc2[""], "test");
    assertEquals(doc2["bbbb"], 1);
  });

  /**
   * @ignore
   */
  await step(
    "Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections",
    () => {
      if (Double != null) {
        let doubleValue = new Double(100);
        let doc = { value: doubleValue };

        // Serialize
        let serialized_data = serialize(doc);

        let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
        serializeWithBufferAndIndex(doc, serialized_data2);
        equals(serialized_data, serialized_data2);

        let doc2 = deserialize(serialized_data);
        assertEquals({ value: equal }, doc2);
      }
    },
  );

  /**
   * @ignore
   */
  await step("Should deserialize correctly", () => {
    let doc = {
      _id: new ObjectId("4e886e687ff7ef5e00000162"),
      str: "foreign",
      type: 2,
      timestamp: ISODate("2011-10-02T14:00:08.383Z"),
      links: [
        "http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/",
      ],
    };

    let serialized_data = serialize(doc);
    let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);
    let doc2 = deserialize(serialized_data);

    assert(JSON.stringify(equal), JSON.stringify(doc2));
  });

  /**
   * @ignore
   */
  await step(
    "Should correctly serialize and deserialize MinKey and MaxKey values",
    () => {
      let doc = {
        _id: new ObjectId("4e886e687ff7ef5e00000162"),
        minKey: new MinKey(),
        maxKey: new MaxKey(),
      };

      let serialized_data = serialize(doc);
      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);
      let doc2 = deserialize(serialized_data);

      // Peform equality checks
      assertEquals(JSON.stringify(doc), JSON.stringify(doc2));
      assert(doc._id.equals(doc2._id));
      // process.ex step(0)
      assert(doc2.minKey instanceof MinKey);
      assert(doc2.maxKey instanceof MaxKey);
    },
  );

  /**
   * @ignore
   */
  await step("Should correctly serialize Double value", () => {
    let doc = {
      value: new Double(34343.2222),
    };

    let serialized_data = serialize(doc);
    let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);
    let doc2 = deserialize(serialized_data);

    assert(doc.value.valueOf(), doc2.value);
    assert(doc.value.value, doc2.value);
  });

  /**
   * @ignore
   */
  await step("ObjectId should correctly create objects", () => {
    try {
      ObjectId.createFromHexString("000000000000000000000001");
      ObjectId.createFromHexString("00000000000000000000001");
      assert(false);
    } catch (err) {
      assert(err != null);
    }
  });

  /**
   * @ignore
   */
  await step("ObjectId should correctly retrieve timestamp", () => {
    let testDate = new Date();
    let object1 = new ObjectId();
    assertEquals(
      Math.floor(testDate.getTime() / 1000),
      Math.floor(object1.getTimestamp().getTime() / 1000),
    );
  });

  /**
   * @ignore
   */
  await step(
    "Should Correctly throw error on bsonparser errors",
    () => {
      let data = Buffer.alloc(3);

      assert(() => {
        deserialize(data);
      });

      data = Buffer.alloc(5);
      data[0] = 0xff;
      data[1] = 0xff;
      assert(() => {
        deserialize(data);
      });

      // Finish up
    },
  );

  /**
   * A simple example showing the usage of calculateObjectSize function returning the number of BSON bytes a javascript object needs.
   *
   * @_class bson
   * @_function calculateObjectSize
   * @ignore
   */
  await step(
    "Should correctly calculate the size of a given javascript object",
    () => {
      // Create a simple object
      let doc = { a: 1, func: () => {} };
      // Calculate the size of the object without serializing the function
      let size = calculateObjectSize(doc, {
        serializeFunctions: false,
      });
      assertEquals(12, size);
      // Calculate the size of the object serializing the function
      size = calculateObjectSize(doc, {
        serializeFunctions: true,
      });
      // Validate the correctness
      assertEquals(37, size);
    },
  );

  /**
   * A simple example showing the usage of calculateObjectSize function returning the number of BSON bytes a javascript object needs.
   *
   * @_class bson
   * @_function calculateObjectSize
   * @ignore
   */
  await step(
    "Should correctly calculate the size of a given javascript object using instance method",
    () => {
      // Create a simple object
      let doc = { a: 1, func: () => {} };
      // Calculate the size of the object without serializing the function
      let size = calculateObjectSize(doc, {
        serializeFunctions: false,
      });
      assertEquals(12, size);
      // Calculate the size of the object serializing the function
      size = calculateObjectSize(doc, {
        serializeFunctions: true,
      });
      // Validate the correctness
      assertEquals(37, size);
    },
  );

  /**
   * A simple example showing the usage of serializeWithBufferAndIndex function.
   *
   * @_class bson
   * @_function serializeWithBufferAndIndex
   * @ignore
   */
  await step(
    "Should correctly serializeWithBufferAndIndex a given javascript object",
    () => {
      // Create a simple object
      let doc = { a: 1, func: () => {} };

      // Calculate the size of the document, no function serialization
      let size = calculateObjectSize(doc, { serializeFunctions: false });
      let buffer = Buffer.alloc(size);
      // Serialize the object to the buffer, checking keys and not serializing functions
      let index = serializeWithBufferAndIndex(doc, buffer, {
        serializeFunctions: false,
        index: 0,
      });

      // Validate the correctness
      assertEquals(size, 12);
      assertEquals(index, 11);

      // Serialize with functions
      // Calculate the size of the document, no function serialization
      size = calculateObjectSize(doc, {
        serializeFunctions: true,
      });
      // Allocate a buffer
      buffer = Buffer.alloc(size);
      // Serialize the object to the buffer, checking keys and not serializing functions
      index = serializeWithBufferAndIndex(doc, buffer, {
        serializeFunctions: true,
        index: 0,
      });

      // Validate the correctness
      assertEquals(37, size);
      assertEquals(36, index);
    },
  );

  /**
   * A simple example showing the usage of serializeWithBufferAndIndex function.
   *
   * @_class bson
   * @_function serializeWithBufferAndIndex
   * @ignore
   */
  await step(
    "Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance",
    () => {
      // Create a simple object
      let doc = { a: 1, func: () => {} };

      // Calculate the size of the document, no function serialization
      let size = calculateObjectSize(doc, {
        serializeFunctions: false,
      });
      // Allocate a buffer
      let buffer = Buffer.alloc(size);
      // Serialize the object to the buffer, checking keys and not serializing functions
      let index = serializeWithBufferAndIndex(doc, buffer, {
        serializeFunctions: false,
      });

      assertEquals(size, 12);
      assertEquals(index, 11);

      // Serialize with functions
      // Calculate the size of the document, no function serialization
      size = calculateObjectSize(doc, {
        serializeFunctions: true,
      });
      // Allocate a buffer
      buffer = Buffer.alloc(size);
      // Serialize the object to the buffer, checking keys and not serializing functions
      index = serializeWithBufferAndIndex(doc, buffer, {
        serializeFunctions: true,
      });
      // Validate the correctness
      assertEquals(size, 37);
      assertEquals(index, 36);
    },
  );

  /**
   * A simple example showing the usage of serialize function returning serialized BSON Buffer object.
   *
   * @_class bson
   * @_function serialize
   * @ignore
   */
  await step(
    "Should correctly serialize a given javascript object",
    () => {
      // Create a simple object
      let doc = { a: 1, func: () => {} };

      let buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: false,
      });

      assertEquals(buffer.length, 12);

      // Serialize the object to a buffer, checking keys and serializing functions
      buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: true,
      });
      // Validate the correctness
      assertEquals(buffer.length, 37);
    },
  );

  /**
   * A simple example showing the usage of serialize function returning serialized BSON Buffer object.
   *
   * @_class bson
   * @_function serialize
   * @ignore
   */
  await step(
    "Should correctly serialize a given javascript object using a bson instance",
    () => {
      // Create a simple object
      const doc: Document = { a: 1, func: () => {} };

      // Serialize the object to a buffer, checking keys and not serializing functions
      let buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: false,
      });
      // Validate the correctness
      assertEquals(buffer.length, 12);

      // Serialize the object to a buffer, checking keys and serializing functions
      buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: true,
      });
      // Validate the correctness
      assertEquals(37, buffer.length);
    },
  );

  await step(
    "should properly deserialize multiple documents using deserializeStream",
    () => {
      const docs = [{ foo: "bar" }, { foo: "baz" }, { foo: "quux" }];

      // Serialize the test data
      const serializedDocs = [];
      for (let i = 0; i < docs.length; i++) {
        serializedDocs[i] = serialize(docs[i]);
      }
      const buf = Buffer.concat(serializedDocs);

      const parsedDocs: Document[] = [];
      deserializeStream(buf, 0, docs.length, parsedDocs, 0);

      docs.forEach((doc, i) => equal(doc, parsedDocs[i]));
    },
  );

  /**
   * @ignore
   */
  await step(
    "ObjectId should have a correct cached representation of the hexString",
    () => {
      ObjectId.cacheHexString = true;
      let a = new ObjectId();
      let __id = a.toHexString();
      assertEquals(__id, a.toHexString());

      // hexString
      a = new ObjectId(__id);
      assertEquals(__id, a.toHexString());

      // fromHexString
      a = ObjectId.createFromHexString(__id);
      assertEquals(a.id, a.toHexString());
      assertEquals(__id, a.toHexString());

      // number
      let genTime = a.getTimestamp().getTime();
      a = new ObjectId(genTime);
      __id = a.toHexString();
      assertEquals(__id, a.toHexString());

      // createFromTime
      a = ObjectId.createFromTime(genTime);
      __id = a.toHexString();
      assertEquals(__id, a.toHexString());
      ObjectId.cacheHexString = false;
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should fail to create ObjectId due to illegal hex code",
    () => {
      try {
        new ObjectId("zzzzzzzzzzzzzzzzzzzzzzzz");
        assert(false);
      } catch (err) {
        assert(true);
      }

      assertEquals(false, ObjectId.isValid(null as any));
      assertEquals(false, ObjectId.isValid({} as any));
      assertEquals(false, ObjectId.isValid({ length: 12 } as any));
      assertEquals(false, ObjectId.isValid([] as any));
      assertEquals(false, ObjectId.isValid(true as any));
      assertEquals(true, ObjectId.isValid(0));
      assertEquals(false, ObjectId.isValid("invalid"));
      assertEquals(true, ObjectId.isValid("zzzzzzzzzzzz"));
      assertEquals(false, ObjectId.isValid("zzzzzzzzzzzzzzzzzzzzzzzz"));
      assertEquals(true, ObjectId.isValid("000000000000000000000000"));
      assertEquals(true, ObjectId.isValid(new ObjectId("thisis12char")));
    },
  );

  /**
   * @ignore
   */
  await step("Should correctly serialize the BSONRegExp type", () => {
    const doc: Document = { regexp: new BSONRegExp("test", "i") };
    let doc1: Document = { regexp: /test/i };
    const serialized_data = serialize(doc);
    const serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    equals(serialized_data, serialized_data2);

    doc1 = deserialize(serialized_data);
    const regexp = new RegExp("test", "i");
    equal(regexp, doc1.regexp);
  });

  /**
   * @ignore
   */
  await step(
    "Should correctly deserialize the BSONRegExp type",
    () => {
      let doc = { regexp: new BSONRegExp("test", "i") };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc1 = deserialize(serialized_data, { bsonRegExp: true });
      assert(doc1.regexp instanceof BSONRegExp);
      assertEquals("test", doc1.regexp.pattern);
      assertEquals("i", doc1.regexp.options);
    },
  );

  await step("BSONRegExp", async ({ step }) => {
    await step("Should alphabetize options", () => {
      const b = new BSONRegExp("cba", "mix");
      assertEquals(b.options, "imx");
    });

    await step(
      "should correctly serialize JavaScript Regex with control character",
      () => {
        const regex = /a\x34b/m;
        const aNewLineB = serialize({ regex });
        const { regex: roundTripRegex } = deserialize(aNewLineB);
        assertEquals(regex.source, roundTripRegex.source);
        assertEquals(regex.flags, roundTripRegex.flags);
      },
    );
  });

  /**
   * @ignore
   */
  await step(
    "Should correctly deserialize objects containing __proto__ keys",
    () => {
      let doc = { ["__proto__"]: { a: 42 } };
      let serialized_data = serialize(doc);

      let serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      equals(serialized_data, serialized_data2);

      let doc1 = deserialize(serialized_data);
      assertEquals(
        Object.getOwnPropertyDescriptor(doc1, "__proto__")!.enumerable,
        true,
      );
      assertEquals(doc1.__proto__.a, 42);
    },
  );

  /**
   * @ignore
   */
  await step(
    "Should return boolean for ObjectId equality check",
    () => {
      let id = new ObjectId();
      assertEquals(true, id.equals(new ObjectId(id.toString())));
      assertEquals(true, id.equals(id.toString()));
      assertEquals(false, id.equals("1234567890abcdef12345678"));
      assertEquals(false, id.equals("zzzzzzzzzzzzzzzzzzzzzzzz"));
      assertEquals(false, id.equals("foo"));
    },
  );

  await step(
    "should throw if invalid BSON types are input to BSON serializer",
    () => {
      const oid = new ObjectId("111111111111111111111111");
      const badBsonType = Object.assign({}, oid, { _bsontype: "bogus" });
      const badDoc = { bad: badBsonType };
      const badArray = [oid, badDoc];
      // deno-lint-ignore ban-types
      const badMap = new Map<string, Object>([
        ["a", badBsonType],
        ["b", badDoc],
        ["c", badArray],
      ]);

      assertThrows(() => serialize(badDoc));
      assertThrows(() => serialize(badArray));
      assertThrows(() => serialize(badMap));
    },
  );

  await step("Should support util.inspect for", async ({ step }) => {
    /**
     * @ignore
     */
    await step("Binary", () => {
      const binary = new Binary(
        Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
        4,
      );
      assertEquals(
        Deno.inspect(binary),
        'new Binary(Buffer.from("0123456789abcdef0123456789abcdef", "hex"), 4)',
      );
    });

    /**
     * @ignore
     */
    await step("BSONSymbol", () => {
      const symbol = new BSONSymbol("sym");
      assertEquals(Deno.inspect(symbol), 'new BSONSymbol("sym")');
    });

    /**
     * @ignore
     */
    await step("Code", () => {
      const code = new Code("this.a > i", { i: 1 });
      assertEquals(Deno.inspect(code), 'new Code("this.a > i", {"i":1})');
    });

    /**
     * @ignore
     */
    await step("DBRef", () => {
      const oid = new ObjectId("deadbeefdeadbeefdeadbeef");
      const dbref = new DBRef("namespace", oid, "integration_tests_");
      assertEquals(
        Deno.inspect(dbref),
        'new DBRef("namespace", new ObjectId("deadbeefdeadbeefdeadbeef"), "integration_tests_")',
      );
    });

    /**
     * @ignore
     */
    await step("Decimal128", () => {
      const dec = Decimal128.fromString("1.42");
      assertEquals(Deno.inspect(dec), 'new Decimal128("1.42")');
    });

    /**
     * @ignore
     */
    await step("Double", () => {
      const double = new Double(-42.42);
      assertEquals(Deno.inspect(double), "new Double(-42.42)");
    });

    /**
     * @ignore
     */
    await step("Int32", () => {
      const int = new Int32(42);
      assertEquals(Deno.inspect(int), "new Int32(42)");
    });

    /**
     * @ignore
     */
    await step("Long", () => {
      const long = Long.fromString("42");
      assertEquals(Deno.inspect(long), 'new Long("42")');

      const unsignedLong = Long.fromString("42", true);
      assertEquals(Deno.inspect(unsignedLong), 'new Long("42", true)');
    });

    /**
     * @ignore
     */
    await step("MaxKey", () => {
      const maxKey = new MaxKey();
      assertEquals(Deno.inspect(maxKey), "new MaxKey()");
    });

    /**
     * @ignore
     */
    await step("MinKey", () => {
      const minKey = new MinKey();
      assertEquals(Deno.inspect(minKey), "new MinKey()");
    });

    /**
     * @ignore
     */
    await step("Timestamp", () => {
      const timestamp = new Timestamp({ t: 100, i: 1 });
      assertEquals(Deno.inspect(timestamp), "new Timestamp({ t: 100, i: 1 })");
    });
  });

  /**
   * The BSON spec uses null-terminated strings to represent document field names and
   * regex components (i.e. pattern and flags/options). Drivers MUST assert that null
   * bytes are prohibited in the following contexts when encoding BSON (i.e. creating
   * raw BSON bytes or constructing BSON-specific type classes):
   * - Field name within a root document
   * - Field name within a sub-document
   * - Pattern for a regular expression
   * - Flags/options for a regular expression
   * Depending on how drivers implement BSON encoding, they MAY expect an error when
   * constructing a type class (e.g. BSON Document or Regex class) or when encoding a
   * language representation to BSON (e.g. converting a dictionary, which might allow
   * null bytes in its keys, to raw BSON bytes).
   */
  await step("null byte handling during serializing", async ({ step }) => {
    await step(
      "should throw when null byte in BSON Field name within a root document",
      () => {
        assertThrows(() => serialize({ "a\x00b": 1 }));
      },
    );

    await step(
      "should throw when null byte in BSON Field name within a sub-document",
      () => {
        assertThrows(() => serialize({ a: { "a\x00b": 1 } }));
      },
    );

    await step(
      "should throw when null byte in Pattern for a regular expression",
      () => {
        assertThrows(() => serialize({ a: new RegExp("a\x00b") }));
        assertThrows(() => serialize({ a: new BSONRegExp("a\x00b") }));
      },
    );

    await step(
      "should throw when null byte in Flags/options for a regular expression",
      () => {
        assertThrows(() => serialize({ a: new BSONRegExp("a", "i\x00m") }));
      },
    );
  });
});
