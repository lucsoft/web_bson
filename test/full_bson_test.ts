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
import { Document } from "../src/bson.ts";

Deno.test("[Full BSON] Should Correctly Deserialize object", () => {
  // deno-fmt-ignore
  const bytes = [ 95, 0, 0, 0, 2, 110, 115, 0, 42, 0, 0, 0, 105, 110, 116, 101, 103, 114, 97, 116, 105, 111, 110, 95, 116, 101, 115, 116, 115, 95, 46, 116, 101, 115, 116, 95, 105, 110, 100, 101, 120, 95, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110, 0, 8, 117, 110, 105, 113, 117, 101, 0, 0, 3, 107, 101, 121, 0, 12, 0, 0, 0, 16, 97, 0, 1, 0, 0, 0, 0, 2, 110, 97, 109, 101, 0, 4, 0, 0, 0, 97, 95, 49, 0, 0,
    ];
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

Deno.test(
  "[Full BSON] Should Correctly Deserialize object with all types",
  () => {
    // deno-fmt-ignore
    const bytes = [ 26,  1,  0,  0,  7, 95,105,100,  0,161,190, 98, 75,118,169,  3,  0,  0,  3,  0,  0,  4, 97,114,114, 97,121,  0, 26,  0,  0,  0, 16, 48,  0,  1,  0,  0,  0, 16, 49,  0,  2,  0,  0,  0, 16, 50,  0,  3,  0,  0,  0,  0,  2,115,116,114,105,110,103,  0,  6,  0,  0,  0,104,101,108,108,111,  0,  3,104, 97,115,104,  0, 19,  0,  0,  0, 16, 97,  0,  1,  0,  0,  0, 16, 98,  0,  2,  0,  0,  0,  0,  9,100, 97,116,101,  0,161,190, 98, 75,  0,  0,  0,  0,  7,111,105,100,  0,161,190, 98, 75, 90,217, 18,  0,  0,  1,  0,  0,  5, 98,105,110, 97,114,121,  0,  7,  0,  0,  0,  2,  3,  0,  0,  0, 49, 50, 51, 16,105,110,116,  0, 42,  0,  0,  0,  1,102,108,111, 97,116,  0,223,224, 11,147,169,170, 64, 64, 11,114,101,103,101,120,112,  0,102,111,111, 98, 97,114,  0,105,  0,  8, 98,111,111,108,101, 97,110,  0,  1, 15,119,104,101,114,101,  0, 25,  0,  0,  0, 12,  0,  0,  0,116,104,105,115, 46,120, 32, 61, 61, 32, 51,  0,  5,  0,  0,  0,  0,  3,100, 98,114,101,102,  0, 37,  0,  0,  0,  2, 36,114,101,102,  0,  5,  0,  0,  0,116,101,115,116,  0,  7, 36,105,100,  0,161,190, 98, 75,  2,180,  1,  0,  0,  2,  0,  0,  0, 10,110,117,108,108,  0,  0, ];
    let serializedData = "";
    // Convert to chars
    for (let i = 0; i < bytes.length; i++) {
      serializedData = serializedData + BinaryParser.fromByte(bytes[i]);
    }

    const object = deserialize(Buffer.from(serializedData, "binary"));
    assertEquals("hello", object.string);
    assertEquals([1, 2, 3], object.array);
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

Deno.test("[Full BSON] Should Serialize and Deserialize String", () => {
  const testString = { hello: "world" };
  const serializedData = serialize(testString);
  assertEquals(testString, deserialize(serializedData));
});

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Integer 5",
  () => {
    const testNumber = { doc: 5 };
    const serializedData = serialize(testNumber);
    assertEquals(testNumber, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize null value",
  () => {
    const testNull = { doc: null };
    const serializedData = serialize(testNull);
    const object = deserialize(serializedData);
    assertEquals(testNull, object);
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize undefined value",
  () => {
    const testUndefined = { doc: undefined };
    const serializedData = serialize(testUndefined);
    const object = deserialize(serializedData);
    assertEquals(undefined, object.doc);
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Number 3",
  () => {
    const testNumber = { doc: 5.5 };
    const serializedData = serialize(testNumber);
    assertEquals(testNumber, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Integers",
  () => {
    let testInt = { doc: 42 };
    let serializedData = serialize(testInt);
    assertEquals(testInt, deserialize(serializedData));

    testInt = { doc: -5600 };
    serializedData = serialize(testInt);
    assertEquals(testInt, deserialize(serializedData));

    testInt = { doc: 2147483647 };
    serializedData = serialize(testInt);
    assertEquals(testInt, deserialize(serializedData));

    testInt = { doc: -2147483648 };
    serializedData = serialize(testInt);
    assertEquals(testInt, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Object",
  () => {
    const doc = { doc: { age: 42, name: "Spongebob", shoe_size: 9.5 } };
    const serializedData = serialize(doc);
    assertEquals(doc, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Array",
  () => {
    const doc = { doc: [1, 2, "a", "b"] };
    const serializedData = serialize(doc);
    assertEquals(doc, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Array with added on functions",
  () => {
    const doc = { doc: [1, 2, "a", "b"] };
    const serializedData = serialize(doc);
    assertEquals(doc, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize A Boolean",
  () => {
    const doc = { doc: true };
    const serializedData = serialize(doc);
    assertEquals(doc, deserialize(serializedData));
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize a Date",
  () => {
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
    assertEquals(doc, deserialize(serializedData));
  },
);

Deno.test("[Full BSON] Should Correctly Serialize and Deserialize Oid", () => {
  const doc: Document = { doc: new ObjectId() };
  const serializedData = serialize(doc);
  assertEquals(
    doc.doc.toHexString(),
    deserialize(serializedData).doc.toHexString(),
  );
});

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Buffer",
  () => {
    const doc = { doc: Buffer.from("123451234512345") };
    const serializedData = serialize(doc);

    assertEquals(
      "123451234512345",
      deserialize(serializedData).doc.buffer.toString("ascii"),
    );
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Buffer with promoteBuffers option",
  () => {
    const doc = { doc: Buffer.from("123451234512345") };
    const serializedData = serialize(doc);

    const options = { promoteBuffers: true };
    assertEquals(
      "123451234512345",
      deserialize(serializedData, options).doc.toString("ascii"),
    );
  },
);

Deno.test("[Full BSON] Should Correctly encode Empty Hash", () => {
  const testCode = {};
  const serializedData = serialize(testCode);
  assertEquals(testCode, deserialize(serializedData));
});

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Ordered Hash",
  () => {
    const doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
    const serializedData = serialize(doc);
    const decodedHash = deserialize(serializedData).doc;
    const keys = [];
    for (const name in decodedHash) keys.push(name);
    assertEquals(["b", "a", "c", "d"], keys);
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize Regular Expression",
  () => {
    const doc = { doc: /foobar/im };
    const serializedData = serialize(doc);
    const doc2 = deserialize(serializedData);
    assertEquals(doc.doc.toString(), doc2.doc.toString());
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize a Binary object",
  () => {
    const bin = new Binary();
    const string = "binstring";
    for (let index = 0; index < string.length; index++) {
      bin.put(string.charAt(index));
    }
    const doc = { doc: bin };
    const serializedData = serialize(doc);
    const deserializedData = deserialize(serializedData);
    assertEquals(doc.doc.value(), deserializedData.doc.value());
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize a ArrayBuffer object",
  () => {
    const arrayBuffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    const doc = { arrayBuffer };
    const serializedData = serialize(doc);
    const deserializedData = deserialize(serializedData);

    assert((deserializedData.arrayBuffer as Uint8Array).byteLength != 0);
  },
);

Deno.test(
  "[Full BSON] Should Correctly Serialize and Deserialize a Float64Array object",
  () => {
    const floats = new Float64Array([12.34]);
    const doc = { floats };
    const serializedData = serialize(doc);
    const deserializedData = deserialize(serializedData);

    assert(deserializedData.floats != null);
    assertEquals(deserializedData.floats["0"], 12.34);
  },
);

Deno.test(
  "[Full BSON] Should Correctly fail due to attempting serialization of illegal key values",
  () => {
    const k = Buffer.alloc(15);
    for (let i = 0; i < 15; i++) k[i] = 0;

    k.write("hello");
    k[6] = 0x06;
    k.write("world", 10);

    const v = Buffer.alloc(65801);
    for (let i = 0; i < 65801; i++) v[i] = 1;
    v[0] = 0x0a;
    const doc: Document = {};
    doc[k.toString()] = v.toString();

    // Should throw due to null character
    assertThrows(() =>
      serialize(doc, {
        checkKeys: true,
      })
    );
  },
);

Deno.test(
  "[Full BSON] Should correctly fail to serialize regexp with null bytes",
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

Deno.test(
  "[Full BSON] Should correctly fail to serialize BSONRegExp with null bytes",
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
