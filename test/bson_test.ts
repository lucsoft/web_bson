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

Deno.test("[BSON] Should Correctly convert ObjectId to itself", () => {
  const myObject = new ObjectId();
  const newObject = new ObjectId(myObject);
  assertEquals(myObject, newObject);
});

Deno.test("[BSON] Should Correctly Deserialize object", () => {
  // deno-fmt-ignore
  const bytes = [95, 0, 0, 0, 2, 110, 115, 0, 42, 0, 0, 0, 105, 110, 116, 101, 103, 114, 97, 116, 105, 111, 110, 95, 116, 101, 115, 116, 115, 95, 46, 116, 101, 115, 116, 95, 105, 110, 100, 101, 120, 95, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 8, 117, 110, 105, 113, 117, 101, 0, 0, 3, 107, 101, 121, 0, 12, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 0, 2, 110, 97, 109, 101, 0, 4, 0, 0, 0, 97, 95, 49, 0, 0];
  let serializedData = "";
  // Convert to chars
  for (let i = 0; i < bytes.length; i++) {
    serializedData = serializedData + BinaryParser.fromByte(bytes[i]);
  }

  const object = deserialize(Buffer.from(serializedData, "binary"));
  assertEquals("a_1", object.name);
  assertEquals(false, object.unique);
  assertEquals(1, object.key.a);
});

Deno.test("[BSON] Should Correctly Deserialize object with all types", () => {
  // deno-fmt-ignore
  const bytes = [ 26, 1, 0, 0, 7, 95, 105, 100, 0, 161, 190, 98, 75, 118, 169, 3, 0, 0, 3, 0, 0, 4, 97, 114, 114, 97, 121, 0, 26, 0, 0, 0, 16, 48, 0, 1, 0, 0, 0, 16, 49, 0, 2, 0, 0, 0, 16, 50, 0, 3, 0, 0, 0, 0, 2, 115, 116, 114, 105, 110, 103, 0, 6, 0, 0, 0, 104, 101, 108, 108, 111, 0, 3, 104, 97, 115, 104, 0, 19, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 16, 98, 0, 2, 0, 0, 0, 0, 9, 100, 97, 116, 101, 0, 161, 190, 98, 75, 0, 0, 0, 0, 7, 111, 105, 100, 0, 161, 190, 98, 75, 90, 217, 18, 0, 0, 1, 0, 0, 5, 98, 105, 110, 97, 114, 121, 0, 7, 0, 0, 0, 2, 3, 0, 0, 0, 49, 50, 51, 16, 105, 110, 116, 0, 42, 0, 0, 0, 1, 102, 108, 111, 97, 116, 0, 223, 224, 11, 147, 169, 170, 64, 64, 11, 114, 101, 103, 101, 120, 112, 0, 102, 111, 111, 98, 97, 114, 0, 105, 0, 8, 98, 111, 111, 108, 101, 97, 110, 0, 1, 15, 119, 104, 101, 114, 101, 0, 25, 0, 0, 0, 12, 0, 0, 0, 116, 104, 105, 115, 46, 120, 32, 61, 61, 32, 51, 0, 5, 0, 0, 0, 0, 3, 100, 98, 114, 101, 102, 0, 37, 0, 0, 0, 2, 36, 114, 101, 102, 0, 5, 0, 0, 0, 116, 101, 115, 116, 0, 7, 36, 105, 100, 0, 161, 190, 98, 75, 2, 180, 1, 0, 0, 2, 0, 0, 0, 10, 110, 117, 108, 108, 0, 0, ];
  let serializedData = "";

  // Convert to chars
  for (let i = 0; i < bytes.length; i++) {
    serializedData = serializedData + BinaryParser.fromByte(bytes[i]);
  }

  const object = deserialize(Buffer.from(serializedData, "binary"));
  // Perform tests
  assertEquals("hello", object.string);
  assertEquals([1, 2, 3], object.array);
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

Deno.test("[BSON] Should Serialize and Deserialize String", () => {
  const testString = { hello: "world" };
  const serializedData = serialize(testString, {
    checkKeys: false,
  });

  serializeWithBufferAndIndex(testString, serializedData, {
    checkKeys: false,
    index: 0,
  });

  assertEquals(testString, deserialize(serializedData));
});

Deno.test("[BSON] Should Serialize and Deserialize Empty String", () => {
  const testString = { hello: "" };
  const serializedData = serialize(testString);
  const serializedData2 = new Uint8Array(calculateObjectSize(testString));
  serializeWithBufferAndIndex(testString, serializedData2);

  assertEquals(serializedData, serializedData2);
  assertEquals(testString, deserialize(serializedData));
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize Integer 5", () => {
  const testNumber = { doc: 5 };

  const serializedData = serialize(testNumber);
  const serializedData2 = new Uint8Array(
    calculateObjectSize(testNumber),
  );
  serializeWithBufferAndIndex(testNumber, serializedData2);
  assertEquals(serializedData, serializedData2);
  assertEquals(testNumber, deserialize(serializedData));
  assertEquals(testNumber, deserialize(serializedData2));
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize null value",
  () => {
    const testNull = { doc: null };
    const serializedData = serialize(testNull);

    const serializedData2 = new Uint8Array(calculateObjectSize(testNull));
    serializeWithBufferAndIndex(testNull, serializedData2);
    assertEquals(serializedData, serializedData2);

    const object = deserialize(serializedData);
    assertEquals(null, object.doc);
  },
);

Deno.test("[BSON] Should Correctly Serialize and Deserialize Number 1", () => {
  const testNumber = { doc: 5.5 };
  const serializedData = serialize(testNumber);

  const serializedData2 = new Uint8Array(
    calculateObjectSize(testNumber),
  );
  serializeWithBufferAndIndex(testNumber, serializedData2);
  assertEquals(serializedData, serializedData2);

  assertEquals(testNumber, deserialize(serializedData));
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize Integer", () => {
  let testInt = { doc: 42 };
  let serializedData = serialize(testInt);

  let serializedData2 = new Uint8Array(calculateObjectSize(testInt));
  serializeWithBufferAndIndex(testInt, serializedData2);
  assertEquals(serializedData, serializedData2);
  assertEquals(testInt.doc, deserialize(serializedData).doc);

  testInt = { doc: -5600 };
  serializedData = serialize(testInt);

  serializedData2 = new Uint8Array(calculateObjectSize(testInt));
  serializeWithBufferAndIndex(testInt, serializedData2);
  assertEquals(serializedData, serializedData2);
  assertEquals(testInt.doc, deserialize(serializedData).doc);

  testInt = { doc: 2147483647 };
  serializedData = serialize(testInt);

  serializedData2 = new Uint8Array(calculateObjectSize(testInt));
  serializeWithBufferAndIndex(testInt, serializedData2);
  assertEquals(serializedData, serializedData2);
  assertEquals(testInt.doc, deserialize(serializedData).doc);

  testInt = { doc: -2147483648 };
  serializedData = serialize(testInt);

  serializedData2 = new Uint8Array(calculateObjectSize(testInt));
  serializeWithBufferAndIndex(testInt, serializedData2);
  assertEquals(serializedData, serializedData2);
  assertEquals(testInt.doc, deserialize(serializedData).doc);
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize Object", () => {
  const doc = { doc: { age: 42, name: "Spongebob", shoe_size: 9.5 } };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  assertEquals(doc.doc.age, deserialize(serializedData).doc.age);
  assertEquals(doc.doc.name, deserialize(serializedData).doc.name);
  assertEquals(doc.doc.shoe_size, deserialize(serializedData).doc.shoe_size);
});

Deno.test("[BSON] Should correctly ignore undefined values in arrays", () => {
  const doc = { doc: { notdefined: undefined } };
  const serializedData = serialize(doc, {
    ignoreUndefined: true,
  });
  const serializedData2 = new Uint8Array(
    calculateObjectSize(doc, {
      ignoreUndefined: true,
    }),
  );
  serializeWithBufferAndIndex(doc, serializedData2, {
    ignoreUndefined: true,
  });

  assertEquals(serializedData, serializedData2);
  const doc1 = deserialize(serializedData);

  assertEquals(undefined, doc1.doc.notdefined);
});

Deno.test(
  "[BSON] Should correctly serialize undefined array entries as null values",
  () => {
    const doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
    const serializedData = serialize(doc, {
      ignoreUndefined: true,
    });
    const serializedData2 = new Uint8Array(
      calculateObjectSize(doc, {
        ignoreUndefined: true,
      }),
    );
    serializeWithBufferAndIndex(doc, serializedData2, {
      ignoreUndefined: true,
    });
    assertEquals(serializedData, serializedData2);
    const doc1 = deserialize(serializedData);
    assertEquals(undefined, doc1.doc.notdefined);
    assertEquals(null, doc1.a[2]);
  },
);

Deno.test(
  "[BSON] Should correctly serialize undefined array entries as undefined values",
  () => {
    const doc = { doc: { notdefined: undefined }, a: [1, 2, undefined, 3] };
    const serializedData = serialize(doc, {
      ignoreUndefined: false,
    });
    const serializedData2 = new Uint8Array(
      calculateObjectSize(doc, {
        ignoreUndefined: false,
      }),
    );
    serializeWithBufferAndIndex(doc, serializedData2, {
      ignoreUndefined: false,
    });

    // console.log("======================================== 0")
    // console.log(serializedData.toString('hex'))
    // console.log(serializedData2.toString('hex'))

    assertEquals(serializedData, serializedData2);
    const doc1 = deserialize(serializedData);
    const doc2 = deserialize(serializedData2);
    // console.log("======================================== 0")
    // console.dir(doc1)
    // console.dir(doc2)

    assertEquals(null, doc1.doc.notdefined);
    assertEquals(null, doc2.doc.notdefined);
  },
);

Deno.test("[BSON] Should Correctly Serialize and Deserialize Array", () => {
  const doc = { doc: [1, 2, "a", "b"] };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserialized = deserialize(serializedData);
  assertEquals(doc.doc[0], deserialized.doc[0]);
  assertEquals(doc.doc[1], deserialized.doc[1]);
  assertEquals(doc.doc[2], deserialized.doc[2]);
  assertEquals(doc.doc[3], deserialized.doc[3]);
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize Buffer", () => {
  const doc = { doc: Buffer.from("hello world") };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserialized = deserialize(serializedData);
  assert(deserialized.doc instanceof Binary);
  assertEquals("hello world", deserialized.doc.toString());
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize Buffer with promoteBuffers option",
  () => {
    const doc = { doc: Buffer.from("hello world") };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserialized = deserialize(serializedData, {
      promoteBuffers: true,
    });
    assert(Buffer.isBuffer(deserialized.doc));
    assertEquals("hello world", deserialized.doc.toString());
  },
);

Deno.test("[BSON] Should Correctly Serialize and Deserialize Number 4", () => {
  const doc: Document = { doc: BSON_INT32_MAX + 10 };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserialized = deserialize(serializedData);
  // assert(deserialized.doc instanceof Binary);
  assertEquals(BSON_INT32_MAX + 10, deserialized.doc);
});

//   /**
//    * @ignore
//    */
//    step(
//     "Should Correctly Serialize and Deserialize Array with added on functions",
//     () => {
//       Array.prototype.toXml = () => {};
//       const doc = { doc: [1, 2, "a", "b"] };
//       const serializedData = serialize(doc);

//       const serializedData2 = new Uint8Array(calculateObjectSize(doc));
//       serializeWithBufferAndIndex(doc, serializedData2);
//       assertEquals(serializedData, serializedData2);

//       const deserialized = deserialize(serializedData);
//       assertEquals(doc.doc[0], deserialized.doc[0]);
//       assertEquals(doc.doc[1], deserialized.doc[1]);
//       assertEquals(doc.doc[2], deserialized.doc[2]);
//       assertEquals(doc.doc[3], deserialized.doc[3]);
//     },
//   );

Deno.test("[BSON] Should correctly deserialize a nested object", () => {
  const doc = { doc: { doc: 1 } };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  assertEquals(doc.doc.doc, deserialize(serializedData).doc.doc);
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize A Boolean", () => {
  const doc = { doc: true };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  assertEquals(doc.doc, deserialize(serializedData).doc);
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize a Date", () => {
  const date = new Date();
  //(2009, 11, 12, 12, 00, 30)
  date.setUTCDate(12);
  date.setUTCFullYear(2009);
  date.setUTCMonth(11 - 1);
  date.setUTCHours(12);
  date.setUTCMinutes(0);
  date.setUTCSeconds(30);
  const doc = { doc: date };
  const serializedData = serialize(doc);
  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);

  assertEquals(serializedData, serializedData2);

  const doc1 = deserialize(serializedData);
  assertEquals(doc, doc1);
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize a Date from another VM",
  () => {
    const vm: any = undefined;
    const script = "date1 = new Date();",
      ctx = vm.createContext({
        date1: null,
      });
    vm.runInContext(script, ctx, "myfile.vm");

    const date = ctx.date1;
    //(2009, 11, 12, 12, 00, 30)
    date.setUTCDate(12);
    date.setUTCFullYear(2009);
    date.setUTCMonth(11 - 1);
    date.setUTCHours(12);
    date.setUTCMinutes(0);
    date.setUTCSeconds(30);
    const doc = { doc: date };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);
    assertEquals(doc.doc.date, deserialize(serializedData).doc.date);
  },
);

Deno.test("[BSON] Should Correctly Serialize nested doc", () => {
  const doc = {
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

  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);
});

Deno.test("[BSON] Should Correctly Serialize and Deserialize Oid", () => {
  const doc: Document = { doc: new ObjectId() };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserializedDoc = deserialize(serializedData);
  assert(deserializedDoc.doc instanceof ObjectId);
  assertEquals(doc.doc.toHexString(), deserializedDoc.doc.toHexString());
});

Deno.test("[BSON] Should Correctly encode Empty Hash", () => {
  const doc = {};
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  assertEquals(doc, deserialize(serializedData));
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize Ordered Hash",
  () => {
    const doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const decodedHash = deserialize(serializedData).doc;
    const keys = [];

    for (let name in decodedHash) keys.push(name);
    assertEquals(["b", "a", "c", "d"], keys);
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize Regular Expression",
  () => {
    // Serialize the regular expression
    const doc = { doc: /foobar/im };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const doc2 = deserialize(serializedData);

    assertEquals(doc.doc.toString(), doc2.doc.toString());
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize a Binary object",
  () => {
    const bin = new Binary();
    const string = "binstring";
    for (let index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    const doc = { doc: bin };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);

    assertEquals(doc.doc.value(), deserializedData.doc.value());
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize a Type 2 Binary object",
  () => {
    const bin = new Binary(
      Buffer.from("binstring"),
      BinarySizes.SUBTYPE_BYTE_ARRAY,
    );
    const string = "binstring";
    for (let index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    const doc = { doc: bin };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);

    assertEquals(doc.doc.value(), deserializedData.doc.value());
  },
);

Deno.test("[BSON] Should Correctly Serialize and Deserialize DBRef", () => {
  const oid = new ObjectId();
  const doc = { dbref: new DBRef("namespace", oid, undefined, {}) };

  const serializedData = serialize(doc);
  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const doc2 = deserialize(serializedData);
  assertEquals(doc, doc2);
  assert(doc2.dbref.oid.equal(), oid.toHexString());
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize partial DBRef",
  () => {
    const id = new ObjectId();
    const doc = { name: "something", user: { $ref: "username", $id: id } };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const doc2 = deserialize(serializedData);
    assertEquals("something", doc2.name);
    assertEquals("username", doc2.user.collection);
    assertEquals(id.toString(), doc2.user.oid.toString());
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize simple Int",
  () => {
    const doc = { doc: 2147483648 };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const doc2 = deserialize(serializedData);
    assertEquals(doc.doc, doc2.doc);
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize Long Integer",
  () => {
    let doc = { doc: Long.fromNumber(9223372036854775807) };
    let serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    let deserializedData = deserialize(serializedData);
    assert(doc.doc.equals(deserializedData.doc));

    doc = { doc: Long.fromNumber(-9223372036854775) };
    serializedData = serialize(doc);
    deserializedData = deserialize(serializedData);
    assert(doc.doc.equals(deserializedData.doc));

    doc = { doc: Long.fromNumber(-9223372036854775809) };
    serializedData = serialize(doc);
    deserializedData = deserialize(serializedData);
    assert(doc.doc.equals(deserializedData.doc));
  },
);

Deno.test("[BSON] Should Deserialize Large Integers as Number not Long", () => {
  function roundTrip(val: number) {
    const doc = { doc: val };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assertEquals(doc, deserializedData);
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
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize Timestamp as subclass of Long",
  () => {
    const long = Long.fromNumber(9223372036854775807);
    const timestamp = Timestamp.fromNumber(9223372036854775807);
    assert(long instanceof Long);
    assert(!(long instanceof Timestamp));
    assert(timestamp instanceof Timestamp);
    assert(timestamp instanceof Long);

    const testInt = { doc: long, doc2: timestamp };
    const serializedData = serialize(testInt);

    const serializedData2 = new Uint8Array(calculateObjectSize(testInt));
    serializeWithBufferAndIndex(testInt, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assert(testInt.doc.equals(deserializedData.doc));
  },
);

Deno.test("[BSON] Should Always put the id as the first item in a hash", () => {
  const hash = { doc: { not_id: 1, _id: 2 } };
  const serializedData = serialize(hash);

  const serializedData2 = new Uint8Array(calculateObjectSize(hash));
  serializeWithBufferAndIndex(hash, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserializedData = deserialize(serializedData);
  const keys = [];

  for (let name in deserializedData.doc) {
    keys.push(name);
  }

  assertEquals(["not_id", "equal"], keys);
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize a User defined Binary object",
  () => {
    const bin = new Binary();
    bin.sub_type = BinarySizes.SUBTYPE_USER_DEFINE;
    const string = "binstring";
    for (let index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }

    const doc = { doc: bin };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);
    const deserializedData = deserialize(serializedData);

    assertEquals(
      deserializedData.equal.sub_type,
      BinarySizes.SUBTYPE_USER_DEFINE,
    );
    assertEquals(doc.doc.value(), deserializedData.doc.value());
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize a Code object",
  () => {
    const doc = { doc: { doc2: new Code("this.a > i", { i: 1 }) } };
    const serializedData = serialize(doc);
    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assertEquals(doc.doc.doc2.code, deserializedData.doc.doc2.code);
    assertEquals(doc.doc.doc2.scope?.i, deserializedData.doc.doc2.scope.i);
  },
);

Deno.test(
  "[BSON] Should Correctly serialize and deserialize and embedded array",
  () => {
    const doc = {
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

    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assertEquals(doc.a, deserializedData.a);
    assertEquals(doc.b, deserializedData.b);
  },
);

Deno.test("[BSON] Should Correctly Serialize and Deserialize UTF8", () => {
  // Serialize utf8
  const doc = {
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
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserializedData = deserialize(serializedData);
  assertEquals(doc, deserializedData);
});

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize query object",
  () => {
    const doc = {
      count: "remove_with_no_callback_bug_test",
      query: {},
      fields: null,
    };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assertEquals(doc, deserializedData);
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize empty query object",
  () => {
    const doc = {};
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assertEquals(doc, deserializedData);
  },
);

Deno.test(
  "[BSON] Should Correctly Serialize and Deserialize array based doc",
  () => {
    const doc = { b: [1, 2, 3], _id: new ObjectId() };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assert(doc.b, deserializedData.b);
    assertEquals(doc, deserializedData);
  },
);

Deno.test("[BSON] Should Correctly Serialize and Deserialize Symbol", () => {
  if (BSONSymbol != null) {
    // symbols are deprecated, so upgrade to strings... so I'm not sure
    // we really need this test anymore...
    //const doc = { b: [new BSONSymbol('test')] };

    const doc = { b: ["test"] };
    const serializedData = serialize(doc);
    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const deserializedData = deserialize(serializedData);
    assertEquals(doc, deserializedData);
    assertEquals(typeof deserializedData.b[0], "string");
  }
});

Deno.test("[BSON] Should handle Deeply nested document", () => {
  const doc: Document = { a: { b: { c: { d: 2 } } } };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const deserializedData = deserialize(serializedData);
  assertEquals(doc, deserializedData);
});

//   /**
//    * @ignore
//    */
//    Deno.test("[BSON] Should handle complicated all typed object", () => {
//     // First doc
//     const date = new Date();
//     const oid = new ObjectId();
//     const string = "binstring";
//     const bin = new Binary();
//     for (let index = 0; index < string.length; index++) {
//       bin.put(string.charAt(index));
//     }

//     const doc = {
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

//     const doc2 = {
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

//     const serializedData = serialize(doc);

//     const serializedData2 = new Uint8Array(calculateObjectSize(doc));
//     serializeWithBufferAndIndex(doc, serializedData2);

//     assertEquals(serializedData, serializedData2);

//     serializedData2 = serialize(doc2, false, true);

//     assertEquals(serializedData, serializedData2);
//   });

//   /**
//    * @ignore
//    */
//    step(
//     "Should Correctly Serialize Complex Nested Object",
//     () => {
//       const doc = {
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

//       const serializedData = serialize(doc);

//       const serializedData2 = new Uint8Array(calculateObjectSize(doc));
//       serializeWithBufferAndIndex(doc, serializedData2);
//       assertEquals(serializedData, serializedData2);

//       const doc2 = doc;
//       doc2._id = ObjectId.createFromHexString(doc2._id.toHexString());
//       serializedData2 = serialize(doc2, false, true);

//       for (let i = 0; i < serializedData2.length; i++) {
//         assertEquals(serializedData2[i], serializedData[i]);
//       }
//     },
//   );

//   /**
//    * @ignore
//    */
//    Deno.test("[BSON] Should correctly massive doc", () => {
//     const oid1 = new ObjectId();
//     const oid2 = new ObjectId();
//     // JS doc
//     const doc = {
//       dbref2: new DBRef("namespace", oid1, "integration_tests_"),
//       _id: oid2,
//     };

//     const doc2 = {
//       dbref2: new DBRef(
//         "namespace",
//         ObjectId.createFromHexString(oid1.toHexString()),
//         "integration_tests_",
//       ),
//       _id: ObjectId.createFromHexString(oid2.toHexString()),
//     };

//     const serializedData = serialize(doc);
//     const serializedData2 = new Uint8Array(calculateObjectSize(doc));
//     serializeWithBufferAndIndex(doc, serializedData2);
//     assertEquals(serializedData, serializedData2);

//     serializedData2 = serialize(doc2, false, true);
//     assertEquals(serializedData, serializedData2);
//   });

Deno.test("[BSON] Should Correctly Serialize/Deserialize regexp object", () => {
  const doc = { b: /foobaré/ };

  const serializedData = serialize(doc);

  let serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  serializedData2 = serialize(doc);

  for (let i = 0; i < serializedData2.length; i++) {
    assertEquals(serializedData2[i], serializedData[i]);
  }
});

Deno.test(
  "[BSON] Should Correctly Serialize/Deserialize complicated object",
  () => {
    const doc = {
      a: { b: { c: [new ObjectId(), new ObjectId()] } },
      d: { f: 1332.3323 },
    };

    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const doc2 = deserialize(serializedData);

    assertEquals(doc, doc2);
  },
);

Deno.test("[BSON] Should Correctly Serialize/Deserialize nested object", () => {
  const doc = {
    _id: { date: new Date(), gid: "6f35f74d2bea814e21000000" },
    value: {
      b: { countries: { "--": 386 }, total: 1599 },
      bc: { countries: { "--": 3 }, total: 10 },
      gp: { countries: { "--": 2 }, total: 13 },
      mgc: { countries: { "--": 2 }, total: 14 },
    },
  };

  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const doc2 = deserialize(serializedData);

  assertEquals(doc, doc2);
});

Deno.test(
  "[BSON] Should Correctly Serialize/Deserialize nested object with even more nesting",
  () => {
    const doc = {
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

    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const doc2 = deserialize(serializedData);
    assertEquals(doc, doc2);
  },
);

Deno.test("[BSON] Should Correctly Serialize empty name object", () => {
  const doc = {
    "": "test",
    bbbb: 1,
  };
  const serializedData = serialize(doc);
  const doc2 = deserialize(serializedData);
  assertEquals(doc2[""], "test");
  assertEquals(doc2["bbbb"], 1);
});

Deno.test(
  "[BSON] Should Correctly handle Forced Doubles to ensure we allocate enough space for cap collections",
  () => {
    if (Double != null) {
      const doubleValue = new Double(100);
      const doc = { value: doubleValue };

      // Serialize
      const serializedData = serialize(doc);

      const serializedData2 = new Uint8Array(calculateObjectSize(doc));
      serializeWithBufferAndIndex(doc, serializedData2);
      assertEquals(serializedData, serializedData2);

      const doc2 = deserialize(serializedData);
      assertEquals({ value: 100 }, doc2);
    }
  },
);

Deno.test("[BSON] Should deserialize correctly", () => {
  const doc = {
    _id: new ObjectId("4e886e687ff7ef5e00000162"),
    str: "foreign",
    type: 2,
    timestamp: ISODate("2011-10-02T14:00:08.383Z"),
    links: [
      "http://www.reddit.com/r/worldnews/comments/kybm0/uk_home_secretary_calls_for_the_scrapping_of_the/",
    ],
  };

  const serializedData = serialize(doc);
  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);
  const doc2 = deserialize(serializedData);

  assertEquals(JSON.stringify(doc), JSON.stringify(doc2));
});

Deno.test(
  "[BSON] Should correctly serialize and deserialize MinKey and MaxKey values",
  () => {
    const doc = {
      _id: new ObjectId("4e886e687ff7ef5e00000162"),
      minKey: new MinKey(),
      maxKey: new MaxKey(),
    };

    const serializedData = serialize(doc);
    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);
    const doc2 = deserialize(serializedData);

    // Peform equality checks
    assertEquals(JSON.stringify(doc), JSON.stringify(doc2));
    assert(doc._id.equals(doc2._id));
    assert(doc2.minKey instanceof MinKey);
    assert(doc2.maxKey instanceof MaxKey);
  },
);

Deno.test("[BSON] Should correctly serialize Double value", () => {
  const doc = {
    value: new Double(34343.2222),
  };

  const serializedData = serialize(doc);
  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);
  const doc2 = deserialize(serializedData);

  assert(doc.value.valueOf(), doc2.value);
  assert(doc.value.value, doc2.value);
});

Deno.test("[BSON] ObjectId should correctly create objects", () => {
  try {
    ObjectId.createFromHexString("000000000000000000000001");
    ObjectId.createFromHexString("00000000000000000000001");
    assert(false);
  } catch (err) {
    assert(err != null);
  }
});

Deno.test("[BSON] ObjectId should correctly retrieve timestamp", () => {
  const testDate = new Date();
  const object1 = new ObjectId();
  assertEquals(
    Math.floor(testDate.getTime() / 1000),
    Math.floor(object1.getTimestamp().getTime() / 1000),
  );
});

Deno.test("[BSON] Should Correctly throw error on bsonparser errors", () => {
  let data = new Uint8Array(3);

  assertThrows(() => {
    deserialize(data);
  });

  data = new Uint8Array(5);
  data[0] = 0xff;
  data[1] = 0xff;
  assertThrows(() => {
    deserialize(data);
  });

  // Finish up
});

/**
 * A simple example showing the usage of calculateObjectSize function returning the number of BSON bytes a javascript object needs.
 *
 * @_class bson
 * @_function calculateObjectSize
 * @ignore
 */
Deno.test(
  "[BSON] Should correctly calculate the size of a given javascript object",
  () => {
    // Create a simple object
    const doc = { a: 1, func: () => {} };
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
Deno.test(
  "[BSON] Should correctly calculate the size of a given javascript object using instance method",
  () => {
    // Create a simple object
    const doc = { a: 1, func: () => {} };
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
Deno.test(
  "[BSON] Should correctly serializeWithBufferAndIndex a given javascript object",
  () => {
    // Create a simple object
    const doc = { a: 1, func: () => {} };

    // Calculate the size of the document, no function serialization
    let size = calculateObjectSize(doc, { serializeFunctions: false });
    let buffer = new Uint8Array(size);
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
    buffer = new Uint8Array(size);
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
Deno.test(
  "[BSON] Should correctly serializeWithBufferAndIndex a given javascript object using a BSON instance",
  () => {
    // Create a simple object
    const doc = { a: 1, func: () => {} };

    // Calculate the size of the document, no function serialization
    let size = calculateObjectSize(doc, {
      serializeFunctions: false,
    });
    // Allocate a buffer
    let buffer = new Uint8Array(size);
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
    buffer = new Uint8Array(size);
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
Deno.test("[BSON] Should correctly serialize a given javascript object", () => {
  // Create a simple object
  const doc = { a: 1, func: () => {} };

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
});

/**
 * A simple example showing the usage of serialize function returning serialized BSON Buffer object.
 *
 * @_class bson
 * @_function serialize
 * @ignore
 */
Deno.test(
  "[BSON] Should correctly serialize a given javascript object using a bson instance",
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

Deno.test(
  "[BSON] should properly deserialize multiple documents using deserializeStream",
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

    docs.forEach((doc, i) => assertEquals(doc, parsedDocs[i]));
  },
);

Deno.test({
  ignore: true,
  name:
    "[BSON] ObjectId should have a correct cached representation of the hexString",
  fn: () => {
    ObjectId.cacheHexString = true;
    let a = new ObjectId();
    let __id = a.toHexString();
    assertEquals(__id, a.toHexString());

    // hexString
    a = new ObjectId(__id);
    assertEquals(__id, a.toHexString());

    // fromHexString
    a = ObjectId.createFromHexString(__id);
    // assertEquals(a.id, a.toHexString()); i fixed this test on master
    assertEquals(__id, a.toHexString());

    // number
    const genTime = a.getTimestamp().getTime();
    a = new ObjectId(genTime);
    __id = a.toHexString();
    assertEquals(__id, a.toHexString());

    // createFromTime
    a = ObjectId.createFromTime(genTime);
    __id = a.toHexString();
    assertEquals(__id, a.toHexString());
    ObjectId.cacheHexString = false;
  },
});

Deno.test(
  "[BSON] Should fail to create ObjectId due to illegal hex code",
  () => {
    try {
      new ObjectId("zzzzzzzzzzzzzzzzzzzzzzzz");
      assert(false);
    } catch {
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

Deno.test("[BSON] Should correctly serialize the BSONRegExp type", () => {
  const doc: Document = { regexp: new BSONRegExp("test", "i") };
  let doc1: Document = { regexp: /test/i };
  const serializedData = serialize(doc);
  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  doc1 = deserialize(serializedData);
  const regexp = new RegExp("test", "i");
  assertEquals(regexp, doc1.regexp);
});

Deno.test("[BSON] Should correctly deserialize the BSONRegExp type", () => {
  const doc = { regexp: new BSONRegExp("test", "i") };
  const serializedData = serialize(doc);

  const serializedData2 = new Uint8Array(calculateObjectSize(doc));
  serializeWithBufferAndIndex(doc, serializedData2);
  assertEquals(serializedData, serializedData2);

  const doc1 = deserialize(serializedData, { bsonRegExp: true });
  assert(doc1.regexp instanceof BSONRegExp);
  assertEquals("test", doc1.regexp.pattern);
  assertEquals("i", doc1.regexp.options);
});

Deno.test("[BSONRegExp] Should alphabetize options", () => {
  const b = new BSONRegExp("cba", "mix");
  assertEquals(b.options, "imx");
});

Deno.test(
  "[BSONRegExp] should correctly serialize JavaScript Regex with control character",
  () => {
    const regex = /a\x34b/m;
    const aNewLineB = serialize({ regex });
    const { regex: roundTripRegex } = deserialize(aNewLineB);
    assertEquals(regex.source, roundTripRegex.source);
    assertEquals(regex.flags, roundTripRegex.flags);
  },
);

Deno.test(
  "[BSON] Should correctly deserialize objects containing __proto__ keys",
  () => {
    const doc = { ["__proto__"]: { a: 42 } };
    const serializedData = serialize(doc);

    const serializedData2 = new Uint8Array(calculateObjectSize(doc));
    serializeWithBufferAndIndex(doc, serializedData2);
    assertEquals(serializedData, serializedData2);

    const doc1 = deserialize(serializedData);
    assertEquals(
      Object.getOwnPropertyDescriptor(doc1, "__proto__")!.enumerable,
      true,
    );
    assertEquals(doc1.__proto__.a, 42);
  },
);

Deno.test("[BSON] Should return boolean for ObjectId equality check", () => {
  const id = new ObjectId();
  assertEquals(true, id.equals(new ObjectId(id.toString())));
  assertEquals(true, id.equals(id.toString()));
  assertEquals(false, id.equals("1234567890abcdef12345678"));
  assertEquals(false, id.equals("zzzzzzzzzzzzzzzzzzzzzzzz"));
  assertEquals(false, id.equals("foo"));
});

Deno.test(
  "[BSON] should throw if invalid BSON types are input to BSON serializer",
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

Deno.test("[BSON-Inspect] Binary", () => {
  const binary = new Binary(
    Buffer.from("0123456789abcdef0123456789abcdef", "hex"),
    4,
  );
  assertEquals(
    Deno.inspect(binary),
    'new Binary(Buffer.from("0123456789abcdef0123456789abcdef", "hex"), 4)',
  );
});

Deno.test("[BSON-Inspect] BSONSymbol", () => {
  const symbol = new BSONSymbol("sym");
  assertEquals(Deno.inspect(symbol), 'new BSONSymbol("sym")');
});

Deno.test("[BSON-Inspect] Code", () => {
  const code = new Code("this.a > i", { i: 1 });
  assertEquals(Deno.inspect(code), 'new Code("this.a > i", {"i":1})');
});

Deno.test("[BSON-Inspect] DBRef", () => {
  const oid = new ObjectId("deadbeefdeadbeefdeadbeef");
  const dbref = new DBRef("namespace", oid, "integration_tests_");
  assertEquals(
    Deno.inspect(dbref),
    'new DBRef("namespace", new ObjectId("deadbeefdeadbeefdeadbeef"), "integration_tests_")',
  );
});

Deno.test("[BSON-Inspect] Decimal128", () => {
  const dec = Decimal128.fromString("1.42");
  assertEquals(Deno.inspect(dec), 'new Decimal128("1.42")');
});

Deno.test("[BSON-Inspect] Double", () => {
  const double = new Double(-42.42);
  assertEquals(Deno.inspect(double), "new Double(-42.42)");
});

Deno.test("[BSON-Inspect] Int32", () => {
  const int = new Int32(42);
  assertEquals(Deno.inspect(int), "new Int32(42)");
});

Deno.test("[BSON-Inspect] Long", () => {
  const long = Long.fromString("42");
  assertEquals(Deno.inspect(long), 'new Long("42")');

  const unsignedLong = Long.fromString("42", true);
  assertEquals(Deno.inspect(unsignedLong), 'new Long("42", true)');
});

Deno.test("[BSON-Inspect] MaxKey", () => {
  const maxKey = new MaxKey();
  assertEquals(Deno.inspect(maxKey), "new MaxKey()");
});

Deno.test("[BSON-Inspect] MinKey", () => {
  const minKey = new MinKey();
  assertEquals(Deno.inspect(minKey), "new MinKey()");
});

Deno.test("[BSON-Inspect] Timestamp", () => {
  const timestamp = new Timestamp(new Long(100, 1));
  assertEquals(Deno.inspect(timestamp), "new Timestamp({ t: 1, i: 100 })");
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
Deno.test(
  "[nullByteHandling] should throw when null byte in BSON Field name within a root document",
  () => {
    assertThrows(() => serialize({ "a\x00b": 1 }));
  },
);

Deno.test(
  "[nullByteHandling] should throw when null byte in BSON Field name within a sub-document",
  () => {
    assertThrows(() => serialize({ a: { "a\x00b": 1 } }));
  },
);

Deno.test(
  "[nullByteHandling] should throw when null byte in Pattern for a regular expression",
  () => {
    assertThrows(() => serialize({ a: new RegExp("a\x00b") }));
    assertThrows(() => serialize({ a: new BSONRegExp("a\x00b") }));
  },
);

Deno.test(
  "[nullByteHandling] should throw when null byte in Flags/options for a regular expression",
  () => {
    assertThrows(() => serialize({ a: new BSONRegExp("a", "i\x00m") }));
  },
);
