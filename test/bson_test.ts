import { Buffer } from "buffer";
import {
  Binary,
  BSONError,
  BSONRegExp,
  BSONSymbol,
  calculateObjectSize,
  Code,
  DBRef,
  Decimal128,
  deserialize,
  Double,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  serialize,
  serializeWithBufferAndIndex,
  Timestamp,
  UUID,
} from "../src/bson.ts";
import {
  assert,
  assertEquals,
  equal,
} from "https://deno.land/std@0.117.0/testing/asserts.ts";
import { BinaryParser } from "./tools/binary_parser.ts";
import { assertBuffersEqual } from "./tools/utils.ts";

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
    var h = Number(match[16]) || 0,
      m = Number(match[17]) || 0;

    h *= 3600000;
    m *= 60000;

    var offset = h + m;
    if (match[15] === "+") offset = -offset;

    date = new Date(date.valueOf() + offset);
  }

  return date;
};

Deno.test("BSON", () => {
  /**
   * @ignore
   */
  Deno.test("Should Correctly convert ObjectId to itself", () => {
    var myObject, newObject;
    var selfConversion = () => {
      myObject = new ObjectId();
      newObject = new ObjectId(myObject);
    };

    assert(selfConversion).to.not.throw;
    assert(myObject).to.equal(newObject);
  });

  /**
   * @ignore
   */
  Deno.test("Should Correctly get BSON types from require", () => {
    var _mongodb = require("../register-bson");
    assert(_mongodb.ObjectId === ObjectId);
    assert(_mongodb.UUID === UUID);
    assert(_mongodb.Binary === Binary);
    assert(_mongodb.Long === Long);
    assert(_mongodb.Timestamp === Timestamp);
    assert(_mongodb.Code === Code);
    assert(_mongodb.DBRef === DBRef);
    assert(_mongodb.BSONSymbol === BSONSymbol);
    assert(_mongodb.MinKey === MinKey);
    assert(_mongodb.MaxKey === MaxKey);
    assert(_mongodb.Double === Double);
    assert(_mongodb.Decimal128 === Decimal128);
    assert(_mongodb.Int32 === Int32);
    assert(_mongodb.BSONRegExp === BSONRegExp);
  });

  /**
   * @ignore
   */
  Deno.test("Should Correctly Deserialize object", () => {
    // deno-fmt-ignore
    const bytes = [95, 0, 0, 0, 2, 110, 115, 0, 42, 0, 0, 0, 105, 110, 116, 101, 103, 114, 97, 116, 105, 111, 110, 95, 116, 101, 115, 116, 115, 95, 46, 116, 101, 115, 116, 95, 105, 110, 100, 101, 120, 95, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 8, 117, 110, 105, 113, 117, 101, 0, 0, 3, 107, 101, 121, 0, 12, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 0, 2, 110, 97, 109, 101, 0, 4, 0, 0, 0, 97, 95, 49, 0, 0];
    let serialized_data = "";
    // Convert to chars
    for (let i = 0; i < bytes.length; i++) {
      serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
    }

    var object = deserialize(Buffer.from(serialized_data, "binary"));
    assert("a_1").to.equal(object.name);
    assert(false).to.equal(object.unique);
    assert(1).to.equal(object.key.a);
  });

  /**
   * @ignore
   */
  Deno.test("Should Correctly Deserialize object with all types", () => {
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
    assert(object[null] == null);
  });

  /**
   * @ignore
   */
  Deno.test("Should Serialize and Deserialize String", () => {
    var test_string = { hello: "world" };
    var serialized_data = serialize(test_string, {
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
  Deno.test("Should Serialize and Deserialize Empty String", () => {
    var test_string = { hello: "" };
    var serialized_data = serialize(test_string);
    var serialized_data2 = Buffer.alloc(calculateObjectSize(test_string));
    serializeWithBufferAndIndex(test_string, serialized_data2);

    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    equal(test_string, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Integer 5",
    () => {
      var test_number = { doc: 5 };

      var serialized_data = serialize(test_number);
      var serialized_data2 = Buffer.alloc(
        calculateObjectSize(test_number),
      );
      serializeWithBufferAndIndex(test_number, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      equal(test_number, deserialize(serialized_data));
      equal(test_number, deserialize(serialized_data2));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize null value",
    () => {
      var test_null = { doc: null };
      var serialized_data = serialize(test_null);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(test_null));
      serializeWithBufferAndIndex(test_null, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var object = deserialize(serialized_data);
      assert(null).to.equal(object.doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Number 1",
    () => {
      var test_number = { doc: 5.5 };
      var serialized_data = serialize(test_number);

      var serialized_data2 = Buffer.alloc(
        calculateObjectSize(test_number),
      );
      serializeWithBufferAndIndex(test_number, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      equal(test_number, deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Integer",
    () => {
      var test_int = { doc: 42 };
      var serialized_data = serialize(test_int);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      assert(equal.doc, deserialize(serialized_data).doc);

      test_int = { doc: -5600 };
      serialized_data = serialize(test_int);

      serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      assert(equal.doc, deserialize(serialized_data).doc);

      test_int = { doc: 2147483647 };
      serialized_data = serialize(test_int);

      serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      assert(equal.doc, deserialize(serialized_data).doc);

      test_int = { doc: -2147483648 };
      serialized_data = serialize(test_int);

      serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      assert(equal.doc, deserialize(serialized_data).doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Object",
    () => {
      var doc = { doc: { age: 42, name: "Spongebob", shoe_size: 9.5 } };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      assert(doc.equal.age, deserialize(serialized_data).doc.age);
      assert(doc.equal.name, deserialize(serialized_data).doc.name);
      assert(doc.equal.shoe_size, deserialize(serialized_data).doc.shoe_size);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should correctly ignore undefined values in arrays",
    () => {
      var doc = { doc: { notdefined: undefined } };
      var serialized_data = serialize(doc, {
        ignoreUndefined: true,
      });
      var serialized_data2 = Buffer.alloc(
        calculateObjectSize(doc, {
          ignoreUndefined: true,
        }),
      );
      serializeWithBufferAndIndex(doc, serialized_data2, {
        ignoreUndefined: true,
      });

      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      var doc1 = deserialize(serialized_data);

      equal(undefined, doc1.doc.notdefined);
    },
  );

  Deno.test(
    "Should correctly serialize undefined array entries as null values",
    () => {
      var doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
      var serialized_data = serialize(doc, {
        ignoreUndefined: true,
      });
      var serialized_data2 = Buffer.alloc(
        calculateObjectSize(doc, {
          ignoreUndefined: true,
        }),
      );
      serializeWithBufferAndIndex(doc, serialized_data2, {
        ignoreUndefined: true,
      });
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      var doc1 = deserialize(serialized_data);
      equal(undefined, doc1.doc.notdefined);
      assert(null).to.equal(doc1.a[2]);
    },
  );

  Deno.test(
    "Should correctly serialize undefined array entries as undefined values",
    () => {
      var doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
      var serialized_data = serialize(doc, {
        ignoreUndefined: false,
      });
      var serialized_data2 = Buffer.alloc(
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

      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      var doc1 = deserialize(serialized_data);
      var doc2 = deserialize(serialized_data2);
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
  Deno.test(
    "Should Correctly Serialize and Deserialize Array",
    () => {
      var doc = { doc: [1, 2, "a", "b"] };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized = deserialize(serialized_data);
      assert(doc.doc[0]).to.equal(deserialized.doc[0]);
      assert(doc.doc[1]).to.equal(deserialized.doc[1]);
      assert(doc.doc[2]).to.equal(deserialized.doc[2]);
      assert(doc.doc[3]).to.equal(deserialized.doc[3]);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Buffer",
    () => {
      var doc = { doc: Buffer.from("hello world") };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized = deserialize(serialized_data);
      assert(deserialized.doc instanceof Binary).to.be.ok;
      assert("hello world").to.equal(deserialized.doc.toString());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Buffer with promoteBuffers option",
    () => {
      var doc = { doc: Buffer.from("hello world") };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized = deserialize(serialized_data, {
        promoteBuffers: true,
      });
      assert(Buffer.isBuffer(deserialized.doc)).to.be.ok;
      assert("hello world").to.equal(deserialized.doc.toString());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Number 4",
    () => {
      var doc = { doc: BSON_INT32_MAX + 10 };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized = deserialize(serialized_data);
      // assert(deserialized.doc instanceof Binary).to.be.ok;
      assert(BSON_INT32_MAX + 10).to.equal(deserialized.doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Array with added on functions",
    () => {
      Array.prototype.toXml = () => {};
      var doc = { doc: [1, 2, "a", "b"] };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized = deserialize(serialized_data);
      assert(doc.doc[0]).to.equal(deserialized.doc[0]);
      assert(doc.doc[1]).to.equal(deserialized.doc[1]);
      assert(doc.doc[2]).to.equal(deserialized.doc[2]);
      assert(doc.doc[3]).to.equal(deserialized.doc[3]);
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should correctly deserialize a nested object", () => {
    var doc = { doc: { doc: 1 } };
    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    assert(doc.equal.doc, deserialize(serialized_data).doc.doc);
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize A Boolean",
    () => {
      var doc = { doc: true };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      assert(doc.doc).to.equal(deserialize(serialized_data).doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
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
      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);

      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc1 = deserialize(serialized_data);
      equal(doc, doc1);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a Date from another VM",
    () => {
      var script = "date1 = new Date();",
        ctx = vm.createContext({
          date1: null,
        });
      vm.runInContext(script, ctx, "myfile.vm");

      var date = ctx.date1;
      //(2009, 11, 12, 12, 00, 30)
      date.setUTCDate(12);
      date.setUTCFullYear(2009);
      date.setUTCMonth(11 - 1);
      date.setUTCHours(12);
      date.setUTCMinutes(0);
      date.setUTCSeconds(30);
      var doc = { doc: date };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      assert(doc.date).to.equal(deserialize(serialized_data).doc.date);
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should Correctly Serialize nested doc", () => {
    var doc = {
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

    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
  });

  /**
   * @ignore
   */
  Deno.test("Should Correctly Serialize and Deserialize Oid", () => {
    var doc = { doc: new ObjectId() };
    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    const deserializedDoc = deserialize(serialized_data);
    assert(deserializedDoc.doc).instanceof(ObjectId);
    assert(doc.doc.toString("hex")).to.equal(
      deserializedDoc.doc.toString("hex"),
    );
  });

  /**
   * @ignore
   */
  Deno.test("Should Correctly encode Empty Hash", () => {
    var doc = {};
    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    equal(doc, deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Ordered Hash",
    () => {
      var doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var decoded_hash = deserialize(serialized_data).doc;
      var keys = [];

      for (var name in decoded_hash) keys.push(name);
      assert(["b", "a", "c", "equal"], keys);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Regular Expression",
    () => {
      // Serialize the regular expression
      var doc = { doc: /foobar/im };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = deserialize(serialized_data);

      assert(doc.doc.equal(), doc2.doc.toString());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a Binary object",
    () => {
      var bin = new Binary();
      var string = "binstring";
      for (var index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }

      var doc = { doc: bin };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);

      assert(doc.doc.equal(), deserialized_data.doc.value());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a Type 2 Binary object",
    () => {
      var bin = new Binary(Buffer.from("binstring"), Binary.SUBTYPE_BYTE_ARRAY);
      var string = "binstring";
      for (var index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }

      var doc = { doc: bin };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);

      assert(doc.doc.equal(), deserialized_data.doc.value());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize DBRef",
    () => {
      var oid = new ObjectId();
      var doc = { dbref: new DBRef("namespace", oid, undefined, {}) };
      var b = BSON;

      var serialized_data = b.serialize(doc);
      var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
      b.serializeWithBufferAndIndex(doc, serialized_data2);
      equal(serialized_data, serialized_data2);

      var doc2 = b.deserialize(serialized_data);
      equal(doc, doc2);
      assert(doc2.dbref.oid.equal(), oid.toHexString());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize partial DBRef",
    () => {
      var id = new ObjectId();
      var doc = { name: "something", user: { $ref: "username", $id: id } };
      var b = BSON;
      var serialized_data = b.serialize(doc);

      var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
      b.serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = b.deserialize(serialized_data);
      assert("something").to.equal(doc2.name);
      assert("username").to.equal(doc2.user.collection);
      assert(id.toString()).to.equal(doc2.user.oid.toString());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize simple Int",
    () => {
      var doc = { doc: 2147483648 };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = deserialize(serialized_data);
      assert(equal.doc, doc2.doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Long Integer",
    () => {
      var doc = { doc: Long.fromNumber(9223372036854775807) };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equals(deserialized_data.doc)).to.be.true;

      doc = { doc: Long.fromNumber(-9223372036854775) };
      serialized_data = serialize(doc);
      deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equals(deserialized_data.doc)).to.be.true;

      doc = { doc: Long.fromNumber(-9223372036854775809) };
      serialized_data = serialize(doc);
      deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equals(deserialized_data.doc)).to.be.true;
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Deserialize Large Integers as Number not Long",
    () => {
      function roundTrip(val) {
        var doc = { doc: val };
        var serialized_data = serialize(doc);

        var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
        serializeWithBufferAndIndex(doc, serialized_data2);
        assertBuffersEqual(done, serialized_data, serialized_data2, 0);

        var deserialized_data = deserialize(serialized_data);
        assert(equal.doc, deserialized_data.doc);
      }

      roundTrip(Math.pow(2, 52));
      roundTrip(Math.pow(2, 53) - 1);
      roundTrip(Math.pow(2, 53));
      roundTrip(-Math.pow(2, 52));
      roundTrip(-Math.pow(2, 53) + 1);
      roundTrip(-Math.pow(2, 53));
      roundTrip(Math.pow(2, 65)); // Too big for Long.
      roundTrip(-Math.pow(2, 65));
      roundTrip(9223372036854775807);
      roundTrip(1234567890123456800); // Bigger than 2^53, stays a double.
      roundTrip(-1234567890123456800);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Timestamp as subclass of Long",
    () => {
      var long = Long.fromNumber(9223372036854775807);
      var timestamp = Timestamp.fromNumber(9223372036854775807);
      assert(long instanceof Long).to.be.ok;
      assert(!(long instanceof Timestamp)).to.be.ok;
      assert(timestamp instanceof Timestamp).to.be.ok;
      assert(timestamp instanceof Long).to.be.ok;

      var test_int = { doc: long, doc2: timestamp };
      var serialized_data = serialize(test_int);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(test_int));
      serializeWithBufferAndIndex(test_int, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      assert(test_int.doc.equals(deserialized_data.doc)).to.be.true;
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Always put the id as the first item in a hash",
    () => {
      var hash = { doc: { not_id: 1, _id: 2 } };
      var serialized_data = serialize(hash);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(hash));
      serializeWithBufferAndIndex(hash, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      var keys = [];

      for (var name in deserialized_data.doc) {
        keys.push(name);
      }

      assert(["not_id", "equal"], keys);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a User defined Binary object",
    () => {
      var bin = new Binary();
      bin.sub_type = BSON_BINARY_SUBTYPE_USER_DEFINED;
      var string = "binstring";
      for (var index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }

      var doc = { doc: bin };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      var deserialized_data = deserialize(serialized_data);

      assert(
        deserialized_data.equal.sub_type,
        BSON_BINARY_SUBTYPE_USER_DEFINED,
      );
      assert(doc.doc.equal(), deserialized_data.doc.value());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a Code object",
    () => {
      var doc = { doc: { doc2: new Code("this.a > i", { i: 1 }) } };
      var serialized_data = serialize(doc);
      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      assert(doc.doc.equal.code, deserialized_data.doc.doc2.code);
      assert(doc.doc.doc2.equal.i, deserialized_data.doc.doc2.scope.i);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly serialize and deserialize and embedded array",
    () => {
      var doc = {
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

      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      assert(equal.a, deserialized_data.a);
      assert(equal.b, deserialized_data.b);
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should Correctly Serialize and Deserialize UTF8", () => {
    // Serialize utf8
    var doc = {
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
    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = deserialize(serialized_data);
    equal(doc, deserialized_data);
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize query object",
    () => {
      var doc = {
        count: "remove_with_no_callback_bug_test",
        query: {},
        fields: null,
      };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      equal(doc, deserialized_data);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize empty query object",
    () => {
      var doc = {};
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      equal(doc, deserialized_data);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize array based doc",
    () => {
      var doc = { b: [1, 2, 3], _id: new ObjectId() };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var deserialized_data = deserialize(serialized_data);
      assert(equal.b, deserialized_data.b);
      equal(doc, deserialized_data);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Symbol",
    () => {
      if (BSONSymbol != null) {
        // symbols are deprecated, so upgrade to strings... so I'm not sure
        // we really need this test anymore...
        //var doc = { b: [new BSONSymbol('test')] };

        var doc = { b: ["test"] };
        var serialized_data = serialize(doc);
        var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
        serializeWithBufferAndIndex(doc, serialized_data2);
        assertBuffersEqual(done, serialized_data, serialized_data2, 0);

        var deserialized_data = deserialize(serialized_data);
        equal(doc, deserialized_data);
        assert(typeof deserialized_data.b[0]).to.equal("string");
      }
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should handle Deeply nested document", () => {
    var doc = { a: { b: { c: { d: 2 } } } };
    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    var deserialized_data = deserialize(serialized_data);
    equal(doc, deserialized_data);
  });

  /**
   * @ignore
   */
  Deno.test("Should handle complicated all typed object", () => {
    // First doc
    var date = new Date();
    var oid = new ObjectId();
    var string = "binstring";
    var bin = new Binary();
    for (var index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc = {
      string: "hello",
      array: [1, 2, 3],
      hash: { a: 1, b: 2 },
      date: date,
      oid: oid,
      binary: bin,
      int: 42,
      float: 33.3333,
      regexp: /regexp/,
      boolean: true,
      long: date.getTime(),
      where: new Code("this.a > i", { i: 1 }),
      dbref: new DBRef("namespace", oid, "integration_tests_"),
    };

    // Second doc
    oid = ObjectId.createFromHexString(oid.toHexString());
    string = "binstring";
    bin = new Binary();
    for (index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    var doc2 = {
      string: "hello",
      array: [1, 2, 3],
      hash: { a: 1, b: 2 },
      date: date,
      oid: oid,
      binary: bin,
      int: 42,
      float: 33.3333,
      regexp: /regexp/,
      boolean: true,
      long: date.getTime(),
      where: new Code("this.a > i", { i: 1 }),
      dbref: new DBRef("namespace", oid, "integration_tests_"),
    };

    var serialized_data = serialize(doc);

    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);

    equal(serialized_data, serialized_data2);

    serialized_data2 = serialize(doc2, false, true);

    equal(serialized_data, serialized_data2);
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize Complex Nested Object",
    () => {
      var doc = {
        email: "email@email.com",
        encrypted_password: "password",
        friends: ["4db96b973d01205364000006", "4dc77b24c5ba38be14000002"],
        location: [72.4930088, 23.0431957],
        name: "Amit Kumar",
        password_salt: "salty",
        profile_fields: [],
        username: "amit",
        _id: new ObjectId(),
      };

      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = doc;
      doc2._id = ObjectId.createFromHexString(doc2._id.toHexString());
      serialized_data2 = serialize(doc2, false, true);

      for (var i = 0; i < serialized_data2.length; i++) {
        assert(serialized_data2[i]).to.equal(serialized_data[i]);
      }
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should correctly massive doc", () => {
    var oid1 = new ObjectId();
    var oid2 = new ObjectId();

    var b = BSON;

    // JS doc
    var doc = {
      dbref2: new DBRef("namespace", oid1, "integration_tests_"),
      _id: oid2,
    };

    var doc2 = {
      dbref2: new DBRef(
        "namespace",
        ObjectId.createFromHexString(oid1.toHexString()),
        "integration_tests_",
      ),
      _id: ObjectId.createFromHexString(oid2.toHexString()),
    };

    var serialized_data = b.serialize(doc);
    var serialized_data2 = Buffer.alloc(b.calculateObjectSize(doc));
    b.serializeWithBufferAndIndex(doc, serialized_data2);
    equal(serialized_data, serialized_data2);

    serialized_data2 = b.serialize(doc2, false, true);
    equal(serialized_data, serialized_data2);
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize/Deserialize regexp object",
    () => {
      var doc = { b: /foobaré/ };

      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      serialized_data2 = serialize(doc);

      for (var i = 0; i < serialized_data2.length; i++) {
        assert(serialized_data2[i]).to.equal(serialized_data[i]);
      }
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize/Deserialize complicated object",
    () => {
      var doc = {
        a: { b: { c: [new ObjectId(), new ObjectId()] } },
        d: { f: 1332.3323 },
      };

      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = deserialize(serialized_data);

      equal(doc, doc2);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize/Deserialize nested object",
    () => {
      var doc = {
        _id: { date: new Date(), gid: "6f35f74d2bea814e21000000" },
        value: {
          b: { countries: { "--": 386 }, total: 1599 },
          bc: { countries: { "--": 3 }, total: 10 },
          gp: { countries: { "--": 2 }, total: 13 },
          mgc: { countries: { "--": 2 }, total: 14 },
        },
      };

      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = deserialize(serialized_data);

      equal(doc, doc2);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize/Deserialize nested object with even more nesting",
    () => {
      var doc = {
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

      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc2 = deserialize(serialized_data);
      equal(doc, doc2);
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should Correctly Serialize empty name object", () => {
    var doc = {
      "": "test",
      bbbb: 1,
    };
    var serialized_data = serialize(doc);
    var doc2 = deserialize(serialized_data);
    assert(doc2[""]).to.equal("test");
    assert(doc2["bbbb"]).to.equal(1);
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections",
    () => {
      if (Double != null) {
        var doubleValue = new Double(100);
        var doc = { value: doubleValue };

        // Serialize
        var serialized_data = serialize(doc);

        var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
        serializeWithBufferAndIndex(doc, serialized_data2);
        assertBuffersEqual(done, serialized_data, serialized_data2, 0);

        var doc2 = deserialize(serialized_data);
        assert({ value: equal }, doc2);
      }
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should deserialize correctly", () => {
    var doc = {
      _id: new ObjectId("4e886e687ff7ef5e00000162"),
      str: "foreign",
      type: 2,
      timestamp: ISODate("2011-10-02T14:00:08.383Z"),
      links: [
        "http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/",
      ],
    };

    var serialized_data = serialize(doc);
    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = deserialize(serialized_data);

    assert(JSON.stringify(equal), JSON.stringify(doc2));
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should correctly serialize and deserialize MinKey and MaxKey values",
    () => {
      var doc = {
        _id: new ObjectId("4e886e687ff7ef5e00000162"),
        minKey: new MinKey(),
        maxKey: new MaxKey(),
      };

      var serialized_data = serialize(doc);
      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);
      var doc2 = deserialize(serialized_data);

      // Peform equality checks
      assert(JSON.stringify(doc)).to.equal(JSON.stringify(doc2));
      assert(doc._id.equals(doc2._id)).to.be.ok;
      // process.exDeno.test(0)
      assert(doc2.minKey instanceof MinKey).to.be.ok;
      assert(doc2.maxKey instanceof MaxKey).to.be.ok;
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should correctly serialize Double value", () => {
    var doc = {
      value: new Double(34343.2222),
    };

    var serialized_data = serialize(doc);
    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);
    var doc2 = deserialize(serialized_data);

    assert(doc.value.valueOf(), doc2.value).to.be.ok;
    assert(doc.value.value, doc2.value).to.be.ok;
  });

  /**
   * @ignore
   */
  Deno.test("ObjectId should correctly create objects", () => {
    try {
      ObjectId.createFromHexString("000000000000000000000001");
      ObjectId.createFromHexString("00000000000000000000001");
      assert(false).to.be.ok;
    } catch (err) {
      assert(err != null).to.be.ok;
    }
  });

  /**
   * @ignore
   */
  Deno.test("ObjectId should correctly retrieve timestamp", () => {
    var testDate = new Date();
    var object1 = new ObjectId();
    assert(Math.floor(testDate.getTime() / 1000)).to.equal(
      Math.floor(object1.getTimestamp().getTime() / 1000),
    );
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly throw error on bsonparser errors",
    () => {
      var data = Buffer.alloc(3);
      var parser = BSON;

      assert(() => {
        parser.deserialize(data);
      }).to.throw();

      data = Buffer.alloc(5);
      data[0] = 0xff;
      data[1] = 0xff;
      assert(() => {
        parser.deserialize(data);
      }).to.throw();

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
  Deno.test(
    "Should correctly calculate the size of a given javascript object",
    () => {
      // Create a simple object
      var doc = { a: 1, func: () => {} };
      var bson = BSON;
      // Calculate the size of the object without serializing the function
      var size = calculateObjectSize(doc, {
        serializeFunctions: false,
      });
      assert(12).to.equal(size);
      // Calculate the size of the object serializing the function
      size = calculateObjectSize(doc, {
        serializeFunctions: true,
      });
      // Validate the correctness
      assert(37).to.equal(size);
    },
  );

  /**
   * A simple example showing the usage of calculateObjectSize function returning the number of BSON bytes a javascript object needs.
   *
   * @_class bson
   * @_function calculateObjectSize
   * @ignore
   */
  Deno.test(
    "Should correctly calculate the size of a given javascript object using instance method",
    () => {
      // Create a simple object
      var doc = { a: 1, func: () => {} };
      // Create a BSON parser instance
      var bson = BSON;
      // Calculate the size of the object without serializing the function
      var size = calculateObjectSize(doc, {
        serializeFunctions: false,
      });
      assert(12).to.equal(size);
      // Calculate the size of the object serializing the function
      size = calculateObjectSize(doc, {
        serializeFunctions: true,
      });
      // Validate the correctness
      assert(37).to.equal(size);
    },
  );

  /**
   * A simple example showing the usage of serializeWithBufferAndIndex function.
   *
   * @_class bson
   * @_function serializeWithBufferAndIndex
   * @ignore
   */
  Deno.test(
    "Should correctly serializeWithBufferAndIndex a given javascript object",
    () => {
      // Create a simple object
      var doc = { a: 1, func: () => {} };
      var bson = BSON;

      // Calculate the size of the document, no function serialization
      var size = calculateObjectSize(doc, { serializeFunctions: false });
      var buffer = Buffer.alloc(size);
      // Serialize the object to the buffer, checking keys and not serializing functions
      var index = serializeWithBufferAndIndex(doc, buffer, {
        serializeFunctions: false,
        index: 0,
      });

      // Validate the correctness
      assert(size).to.equal(12);
      assert(index).to.equal(11);

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
      assert(37).to.equal(size);
      assert(36).to.equal(index);
    },
  );

  /**
   * A simple example showing the usage of serializeWithBufferAndIndex function.
   *
   * @_class bson
   * @_function serializeWithBufferAndIndex
   * @ignore
   */
  Deno.test(
    "Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance",
    () => {
      // Create a simple object
      var doc = { a: 1, func: () => {} };
      // Create a BSON parser instance
      var bson = BSON;
      // Calculate the size of the document, no function serialization
      var size = calculateObjectSize(doc, {
        serializeFunctions: false,
      });
      // Allocate a buffer
      var buffer = Buffer.alloc(size);
      // Serialize the object to the buffer, checking keys and not serializing functions
      var index = serializeWithBufferAndIndex(doc, buffer, {
        serializeFunctions: false,
      });

      assert(size).to.equal(12);
      assert(index).to.equal(11);

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
      assert(size).to.equal(37);
      assert(index).to.equal(36);
    },
  );

  /**
   * A simple example showing the usage of serialize function returning serialized BSON Buffer object.
   *
   * @_class bson
   * @_function serialize
   * @ignore
   */
  Deno.test(
    "Should correctly serialize a given javascript object",
    () => {
      // Create a simple object
      var doc = { a: 1, func: () => {} };
      // Create a BSON parser instance
      var bson = BSON;

      var buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: false,
      });

      assert(buffer.length).to.equal(12);

      // Serialize the object to a buffer, checking keys and serializing functions
      buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: true,
      });
      // Validate the correctness
      assert(buffer.length).to.equal(37);
    },
  );

  /**
   * A simple example showing the usage of serialize function returning serialized BSON Buffer object.
   *
   * @_class bson
   * @_function serialize
   * @ignore
   */
  Deno.test(
    "Should correctly serialize a given javascript object using a bson instance",
    () => {
      // Create a simple object
      var doc = { a: 1, func: () => {} };
      // Create a BSON parser instance
      var bson = BSON;

      // Serialize the object to a buffer, checking keys and not serializing functions
      var buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: false,
      });
      // Validate the correctness
      assert(buffer.length).to.equal(12);

      // Serialize the object to a buffer, checking keys and serializing functions
      buffer = serialize(doc, {
        checkKeys: true,
        serializeFunctions: true,
      });
      // Validate the correctness
      assert(37).to.equal(buffer.length);
    },
  );

  Deno.test("should properly deserialize multiple documents using deserializeStream", () => {
    const bson = BSON;
    const docs = [{ foo: "bar" }, { foo: "baz" }, { foo: "quux" }];

    // Serialize the test data
    const serializedDocs = [];
    for (let i = 0; i < docs.length; i++) {
      serializedDocs[i] = serialize(docs[i]);
    }
    const buf = Buffer.concat(serializedDocs);

    const parsedDocs = [];
    deserializeStream(buf, 0, docs.length, parsedDocs, 0);

    docs.forEach((doc, i) => equal(doc, parsedDocs[i]));
  });

  /**
   * @ignore
   */
  Deno.test(
    "ObjectId should have a correct cached representation of the hexString",
    () => {
      ObjectId.cacheHexString = true;
      var a = new ObjectId();
      var __id = a.__id;
      assert(__id).to.equal(a.toHexString());

      // hexString
      a = new ObjectId(__id);
      assert(__id).to.equal(a.toHexString());

      // fromHexString
      a = ObjectId.createFromHexString(__id);
      assert(a.__id).to.equal(a.toHexString());
      assert(__id).to.equal(a.toHexString());

      // number
      var genTime = a.generationTime;
      a = new ObjectId(genTime);
      __id = a.__id;
      assert(__id).to.equal(a.toHexString());

      // generationTime
      delete a.__id;
      a.generationTime = genTime;
      assert(__id).to.equal(a.toHexString());

      // createFromTime
      a = ObjectId.createFromTime(genTime);
      __id = a.__id;
      assert(__id).to.equal(a.toHexString());
      ObjectId.cacheHexString = false;
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should fail to create ObjectId due to illegal hex code",
    () => {
      try {
        new ObjectId("zzzzzzzzzzzzzzzzzzzzzzzz");
        assert(false).to.be.ok;
      } catch (err) {
        assert(true).to.be.ok;
      }

      assert(false).to.equal(ObjectId.isValid(null));
      assert(false).to.equal(ObjectId.isValid({}));
      assert(false).to.equal(ObjectId.isValid({ length: 12 }));
      assert(false).to.equal(ObjectId.isValid([]));
      assert(false).to.equal(ObjectId.isValid(true));
      assert(true).to.equal(ObjectId.isValid(0));
      assert(false).to.equal(ObjectId.isValid("invalid"));
      assert(true).to.equal(ObjectId.isValid("zzzzzzzzzzzz"));
      assert(false).to.equal(ObjectId.isValid("zzzzzzzzzzzzzzzzzzzzzzzz"));
      assert(true).to.equal(ObjectId.isValid("000000000000000000000000"));
      assert(true).to.equal(ObjectId.isValid(new ObjectId("thisis12char")));

      var tmp = new ObjectId();
      // Cloning tmp so that instanceof fails to fake import from different version/instance of the same npm package
      var objectIdLike = {
        id: tmp.id,
        toHexString: () => {
          return tmp.toHexString();
        },
      };

      assert(true).to.equal(tmp.equals(objectIdLike));
      assert(true).to.equal(tmp.equals(new ObjectId(objectIdLike)));
      assert(true).to.equal(ObjectId.isValid(objectIdLike));
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should correctly serialize the BSONRegExp type", () => {
    var doc = { regexp: new BSONRegExp("test", "i") };
    var doc1 = { regexp: /test/i };
    var serialized_data = serialize(doc);
    var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serialized_data2);
    assertBuffersEqual(done, serialized_data, serialized_data2, 0);

    doc1 = deserialize(serialized_data);
    var regexp = new RegExp("test", "i");
    equal(regexp, doc1.regexp);
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should correctly deserialize the BSONRegExp type",
    () => {
      var doc = { regexp: new BSONRegExp("test", "i") };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc1 = deserialize(serialized_data, { bsonRegExp: true });
      assert(doc1.regexp instanceof BSONRegExp).to.be.ok;
      assert("test").to.equal(doc1.regexp.pattern);
      assert("i").to.equal(doc1.regexp.options);
    },
  );

  Deno.test("BSONRegExp", () => {
    Deno.test("Should alphabetize options", () => {
      const b = new BSONRegExp("cba", "mix");
      assert(b.options).to.equal("imx");
    });

    Deno.test("should correctly serialize JavaScript Regex with control character", () => {
      const regex = /a\x34b/m;
      const aNewLineB = serialize({ regex });
      const { regex: roundTripRegex } = deserialize(aNewLineB);
      assert(regex.source).to.equal(roundTripRegex.source);
      assert(regex.flags).to.equal(roundTripRegex.flags);
    });
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should correctly deserialize objects containing __proto__ keys",
    () => {
      var doc = { ["__proto__"]: { a: 42 } };
      var serialized_data = serialize(doc);

      var serialized_data2 = Buffer.alloc(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serialized_data2);
      assertBuffersEqual(done, serialized_data, serialized_data2, 0);

      var doc1 = deserialize(serialized_data);
      assert(Object.getOwnPropertyDescriptor(doc1, "__proto__").enumerable).to
        .equal(true);
      assert(doc1.__proto__.a).to.equal(42);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should return boolean for ObjectId equality check",
    () => {
      var id = new ObjectId();
      assert(true).to.equal(id.equals(new ObjectId(id.toString())));
      assert(true).to.equal(id.equals(id.toString()));
      assert(false).to.equal(id.equals("1234567890abcdef12345678"));
      assert(false).to.equal(id.equals("zzzzzzzzzzzzzzzzzzzzzzzz"));
      assert(false).to.equal(id.equals("foo"));
      assert(false).to.equal(id.equals(null));
      assert(false).to.equal(id.equals(undefined));
    },
  );

  Deno.test("should serialize ObjectIds from old bson versions", () => {
    // In versions 4.0.0 and 4.0.1, we used _bsontype="ObjectId" which broke
    // backwards compatibility with mongodb-core and other code. It was reverted
    // back to "ObjectID" (capital D) in later library versions.
    // The test below ensures that all three versions of Object ID work OK:
    // 1. The current version's class
    // 2. A simulation of the class from library 4.0.0
    // 3. The class currently in use by mongodb (not tested in browser where mongodb is unavailable)

    // test the old ObjectID class (in mongodb-core 3.1) because MongoDB drivers still return it
    function getOldBSON() {
      try {
        // do a dynamic resolve to avoid exception when running browser tests
        const file = require.resolve("mongodb-core");
        const oldModule = require(file).BSON;
        const funcs = new oldModule.BSON();
        oldModule.serialize = funcs.serialize;
        oldModule.deserialize = funcs.deserialize;
        return oldModule;
      } catch (e) {
        return BSON; // if mongo is unavailable, e.g. browser tests, just re-use new BSON
      }
    }

    const OldBSON = getOldBSON();
    const OldObjectID = OldBSON === BSON ? ObjectId : OldObjectId;

    // create a wrapper simulating the old ObjectId class from v4.0.0
    class ObjectIdv400 {
      constructor() {
        this.oid = new ObjectId();
      }
      get id() {
        return this.oid.id;
      }
      toString() {
        return this.oid.toString();
      }
    }
    Object.defineProperty(ObjectIdv400.prototype, "_bsontype", {
      value: "ObjectId",
    });

    // Array
    const array = [new ObjectIdv400(), new OldObjectID(), new ObjectId()];
    const deserializedArrayAsMap = deserialize(serialize(array));
    const deserializedArray = Object.keys(deserializedArrayAsMap).map(
      (x) => deserializedArrayAsMap[x],
    );
    assert(deserializedArray.map((x) => x.toString())).to.eql(
      array.map((x) => x.toString()),
    );

    // Map
    const map = new Map();
    map.set("oldBsonType", new ObjectIdv400());
    map.set("reallyOldBsonType", new OldObjectID());
    map.set("newBsonType", new ObjectId());
    const deserializedMapAsObject = deserialize(serialize(map), {
      relaxed: false,
    });
    const deserializedMap = new Map(
      Object.keys(deserializedMapAsObject).map(
        (k) => [k, deserializedMapAsObject[k]],
      ),
    );

    map.forEach((value, key) => {
      assert(deserializedMap.has(key)).to.be.true;
      const deserializedMapValue = deserializedMap.get(key);
      assert(deserializedMapValue.toString()).to.equal(value.toString());
    });

    // Object
    const record = {
      oldBsonType: new ObjectIdv400(),
      reallyOldBsonType: new OldObjectID(),
      newBsonType: new ObjectId(),
    };
    const deserializedObject = deserialize(serialize(record));
    assert(deserializedObject).to.have.keys([
      "oldBsonType",
      "reallyOldBsonType",
      "newBsonType",
    ]);
    assert(record.oldBsonType.toString()).to.equal(
      deserializedObject.oldBsonType.toString(),
    );
    assert(record.newBsonType.toString()).to.equal(
      deserializedObject.newBsonType.toString(),
    );
  });

  Deno.test("should throw if invalid BSON types are input to BSON serializer", () => {
    const oid = new ObjectId("111111111111111111111111");
    const badBsonType = Object.assign({}, oid, { _bsontype: "bogus" });
    const badDoc = { bad: badBsonType };
    const badArray = [oid, badDoc];
    const badMap = new Map([
      ["a", badBsonType],
      ["b", badDoc],
      ["c", badArray],
    ]);

    assert(() => serialize(badDoc)).to.throw();
    assert(() => serialize(badArray)).to.throw();
    assert(() => serialize(badMap)).to.throw();
  });

  Deno.test("Should support util.inspect for", () => {
    /**
     * @ignore
     */
    Deno.test("Binary", () => {
      const binary = new Binary(
        Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
        4,
      );
      assert(inspect(binary)).to.equal(
        'new Binary(Buffer.from("0123456789abcdef0123456789abcdef", "hex"), 4)',
      );
    });

    /**
     * @ignore
     */
    Deno.test("BSONSymbol", () => {
      const symbol = new BSONSymbol("sym");
      assert(inspect(symbol)).to.equal('new BSONSymbol("sym")');
    });

    /**
     * @ignore
     */
    Deno.test("Code", () => {
      const code = new Code("this.a > i", { i: 1 });
      assert(inspect(code)).to.equal('new Code("this.a > i", {"i":1})');
    });

    /**
     * @ignore
     */
    Deno.test("DBRef", () => {
      const oid = new ObjectId("deadbeefdeadbeefdeadbeef");
      const dbref = new DBRef("namespace", oid, "integration_tests_");
      assert(inspect(dbref)).to.equal(
        'new DBRef("namespace", new ObjectId("deadbeefdeadbeefdeadbeef"), "integration_tests_")',
      );
    });

    /**
     * @ignore
     */
    Deno.test("Decimal128", () => {
      const dec = Decimal128.fromString("1.42");
      assert(inspect(dec)).to.equal('new Decimal128("1.42")');
    });

    /**
     * @ignore
     */
    Deno.test("Double", () => {
      const double = new Double(-42.42);
      assert(inspect(double)).to.equal("new Double(-42.42)");
    });

    /**
     * @ignore
     */
    Deno.test("Int32", () => {
      const int = new Int32(42);
      assert(inspect(int)).to.equal("new Int32(42)");
    });

    /**
     * @ignore
     */
    Deno.test("Long", () => {
      const long = Long.fromString("42");
      assert(inspect(long)).to.equal('new Long("42")');

      const unsignedLong = Long.fromString("42", true);
      assert(inspect(unsignedLong)).to.equal('new Long("42", true)');
    });

    /**
     * @ignore
     */
    Deno.test("MaxKey", () => {
      const maxKey = new MaxKey();
      assert(inspect(maxKey)).to.equal("new MaxKey()");
    });

    /**
     * @ignore
     */
    Deno.test("MinKey", () => {
      const minKey = new MinKey();
      assert(inspect(minKey)).to.equal("new MinKey()");
    });

    /**
     * @ignore
     */
    Deno.test("Timestamp", () => {
      const timestamp = new Timestamp({ t: 100, i: 1 });
      assert(inspect(timestamp)).to.equal("new Timestamp({ t: 100, i: 1 })");
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
  Deno.test("null byte handling during serializing", () => {
    Deno.test("should throw when null byte in BSON Field name within a root document", () => {
      assert(() => serialize({ "a\x00b": 1 })).to.throw(/null bytes/);
    });

    Deno.test("should throw when null byte in BSON Field name within a sub-document", () => {
      assert(() => serialize({ a: { "a\x00b": 1 } })).to.throw(
        /null bytes/,
      );
    });

    Deno.test("should throw when null byte in Pattern for a regular expression", () => {
      // eslint-disable-next-line no-control-regex
      assert(() => serialize({ a: new RegExp("a\x00b") })).to.throw(
        /null bytes/,
      );
      assert(() => serialize({ a: new BSONRegExp("a\x00b") })).to.throw(
        /null bytes/,
      );
    });

    Deno.test("should throw when null byte in Flags/options for a regular expression", () => {
      assert(() => serialize({ a: new BSONRegExp("a", "i\x00m") })).to
        .throw(/null bytes/);
    });
  });
});
