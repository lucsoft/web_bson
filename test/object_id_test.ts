// deno-lint-ignore-file no-explicit-any
import { BSONTypeError, ObjectId } from "../src/bson.ts";
import { assert, assertEquals, assertThrows, hex } from "../deps.ts";

const textEncoder = new TextEncoder();
function decodeHex(hexString: string): Uint8Array {
  return hex.decode(textEncoder.encode(hexString));
}

Deno.test("[ObjectId] should correctly handle objectId timestamps", () => {
  const a = ObjectId.createFromTime(1);
  assertEquals(new Uint8Array([0, 0, 0, 1]), a.id.slice(0, 4));
  assertEquals(1000, a.getTimestamp().getTime());
});

Deno.test("[ObjectId] should correctly create ObjectId from ObjectId", () => {
  const noArgObjID = new ObjectId();
  assertEquals(new ObjectId(noArgObjID).id, noArgObjID.id);
});

const invalidInputs: { input: any; description: string }[] = [
  { input: [], description: "empty array" },
  { input: ["abcdefŽhijkl"], description: "nonempty array" },
  { input: {}, description: "empty object" },
];

for (const { input, description } of invalidInputs) {
  Deno.test(`[ObjectId] should throw error if ${description} is passed in`, () => {
    assertThrows(() => new ObjectId(input), BSONTypeError);
  });
}

Deno.test(
  "[ObjectId] should throw error if object without an id property is passed in",
  () => {
    const noArgObjID = new ObjectId();
    const objectIdLike: any = {
      toHexString: () => {
        return noArgObjID.toHexString();
      },
    };
    assertThrows(() => new ObjectId(objectIdLike), BSONTypeError);
  },
);

Deno.test(
  "[ObjectId] should correctly create ObjectId from object with valid string id",
  () => {
    const objectValidString24Hex: any = {
      id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    };
    const objectValidString12Bytes: any = {
      id: "abcdefghijkl",
    };
    const buf24Hex = decodeHex("aaaaaaaaaaaaaaaaaaaaaaaa");
    const buf12Bytes = new TextEncoder().encode("abcdefghijkl");
    assertEquals(new ObjectId(objectValidString24Hex).id, buf24Hex);
    assertEquals(new ObjectId(objectValidString12Bytes).id, buf12Bytes);
  },
);

Deno.test(
  "[ObjectId] should correctly create ObjectId from object with valid string id and toHexString method",
  () => {
    function new24HexToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const buf24hex = decodeHex("BBBBBBBBBBBBBBBBBBBBBBBB");
    const objectValidString24Hex: any = {
      id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      toHexString: new24HexToHexString,
    };
    const objectValidString12Bytes: any = {
      id: "abcdefghijkl",
      toHexString: new24HexToHexString,
    };
    assertEquals(new ObjectId(objectValidString24Hex).id, buf24hex);
    assertEquals(new ObjectId(objectValidString12Bytes).id, buf24hex);
  },
);

Deno.test(
  "[ObjectId] should correctly create ObjectId from object with valid Buffer id",
  () => {
    const validBuffer24Hex = decodeHex("AAAAAAAAAAAAAAAAAAAAAAAA");
    const validBuffer12Array = new Uint8Array([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ]);
    const objectBufferId: any = {
      id: validBuffer24Hex,
    };
    const objectBufferFromArray: any = {
      id: validBuffer12Array,
    };
    assertEquals(new ObjectId(objectBufferId).id, validBuffer24Hex);
    assertEquals(new ObjectId(objectBufferFromArray).id, validBuffer12Array);
  },
);

Deno.test(
  "[ObjectId] should correctly create ObjectId from object with valid Buffer id and toHexString method",
  () => {
    const validBuffer24Hex = decodeHex("AAAAAAAAAAAAAAAAAAAAAAAA");
    const validBuffer12Array = new Uint8Array([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ]);
    const bufferNew24Hex = decodeHex("BBBBBBBBBBBBBBBBBBBBBBBB");
    function newToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const objectBufferHex: any = {
      id: validBuffer24Hex,
      toHexString: newToHexString,
    };
    const objectBufferArray: any = {
      id: validBuffer12Array,
      toHexString: newToHexString,
    };
    assertEquals(new ObjectId(objectBufferHex).id, bufferNew24Hex);
    assertEquals(new ObjectId(objectBufferArray).id, bufferNew24Hex);
  },
);

Deno.test(
  "[ObjectId] should throw error if object with non-Buffer non-string id is passed in",
  () => {
    const objectNumId: any = {
      id: 5,
    };
    const objectNullId: any = {
      id: null,
    };
    assertThrows(() => new ObjectId(objectNumId), BSONTypeError);
    assertThrows(() => new ObjectId(objectNullId), BSONTypeError);
  },
);

Deno.test(
  "[ObjectId] should throw an error if object with invalid string id is passed in",
  () => {
    const objectInvalid24HexStr: any = {
      id: "FFFFFFFFFFFFFFFFFFFFFFFG",
    };
    assertThrows(() => new ObjectId(objectInvalid24HexStr), BSONTypeError);
  },
);

Deno.test(
  "[ObjectId] should correctly create ObjectId from object with invalid string id and toHexString method",
  () => {
    function newToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }

    const objectInvalid24HexStr: any = {
      id: "FFFFFFFFFFFFFFFFFFFFFFFG",
      toHexString: newToHexString,
    };
    const bufferNew24Hex = decodeHex("BBBBBBBBBBBBBBBBBBBBBBBB");
    assertEquals(new ObjectId(objectInvalid24HexStr).id, bufferNew24Hex);
  },
);

Deno.test(
  "[ObjectId] should throw an error if object with invalid Buffer id is passed in",
  () => {
    const objectInvalidBuffer: any = {
      id: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
    };
    assertThrows(() => new ObjectId(objectInvalidBuffer), BSONTypeError);
  },
);

Deno.test(
  "[ObjectId] should correctly create ObjectId from object with invalid Buffer id and toHexString method",
  () => {
    function newToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const objectInvalidBuffer: any = {
      id: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
      toHexString: newToHexString,
    };
    const bufferNew24Hex = decodeHex("BBBBBBBBBBBBBBBBBBBBBBBB");
    assertEquals(new ObjectId(objectInvalidBuffer).id, bufferNew24Hex);
  },
);

const numericIO = [
  { input: 42, output: 42, description: "42" },
  { input: 0x2a, output: 0x2a, description: "0x2a" },
  { input: 4.2, output: 4, description: "4.2" },
  { input: NaN, output: 0, description: "NaN" },
];

for (const { input, output } of numericIO) {
  Deno.test(
    `should correctly create ObjectId from ${input} and result in ${output}`,
    () => {
      const objId = new ObjectId(input);
      assert("id" in objId);
      assert(objId.id instanceof Uint8Array);
      assertEquals(new DataView(objId.id.buffer).getUint32(0), output);
    },
  );
}

Deno.test("[ObjectId] should correctly create ObjectId undefined or null", () => {
  const objNull = new ObjectId(null as any);
  const objNoArg = new ObjectId();
  const objUndef = new ObjectId(undefined);
  assert(objNull.id instanceof Uint8Array);
  assert(objNoArg.id instanceof Uint8Array);
  assert(objUndef.id instanceof Uint8Array);
});

Deno.test(
  "[ObjectId] should throw error if non-12 byte non-24 hex string passed in",
  () => {
    assertThrows(
      () => new ObjectId("FFFFFFFFFFFFFFFFFFFFFFFG"),
      BSONTypeError,
    );
    assertThrows(
      () => new ObjectId("thisstringisdefinitelytoolong"),
      BSONTypeError,
    );
    assertThrows(() => new ObjectId("tooshort"), BSONTypeError);
    assertThrows(() => new ObjectId("101010"), BSONTypeError);
    assertThrows(() => new ObjectId(""), BSONTypeError);
  },
);

Deno.test("[ObjectId] should correctly create ObjectId from 24 hex string", () => {
  const validStr24Hex = "FFFFFFFFFFFFFFFFFFFFFFFF";
  assertEquals(new ObjectId(validStr24Hex).id, decodeHex(validStr24Hex));
});

Deno.test("[ObjectId] should correctly create ObjectId from 12 byte sequence", () => {
  const byteSequence12 = "111111111111";
  assertEquals(
    new ObjectId(byteSequence12).id,
    new TextEncoder().encode(byteSequence12),
  );
});

Deno.test(
  "[ObjectId] should correctly create ObjectId from uppercase hexstring",
  () => {
    let a = "AAAAAAAAAAAAAAAAAAAAAAAA";
    let b = new ObjectId(a);
    assert(b.equals(a));

    a = "aaaaaaaaaaaaaaaaaaaaaaaa";
    b = new ObjectId(a);
    assert(b.equals(a));
    assert(a, b.toString());
  },
);

Deno.test("[ObjectId] should correctly create ObjectId from valid Buffer", () => {
  let a = "AAAAAAAAAAAAAAAAAAAAAAAA";
  let b = new ObjectId(decodeHex(a));
  assert(b.equals(a));

  a = "aaaaaaaaaaaaaaaaaaaaaaaa";
  b = new ObjectId(decodeHex(a));
  assert(a, b.toString());
  assert(b.equals(a));
});

Deno.test("[ObjectId] should throw an error if invalid Buffer passed in", () => {
  const a = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  assertThrows(() => new ObjectId(a), BSONTypeError);
});

Deno.test(
  "[ObjectId] should correctly allow for node.js inspect to work with ObjectId",
  () => {
    const a = "AAAAAAAAAAAAAAAAAAAAAAAA";
    const b = new ObjectId(a);
    assertEquals(Deno.inspect(b), 'new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa")');
  },
);

Deno.test("[ObjectId] should isValid check input Buffer length", () => {
  const buffTooShort = new Uint8Array([]);
  const buffTooLong = new Uint8Array([
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
  ]);
  const buff12Bytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  assert(!ObjectId.isValid(buffTooShort));
  assert(!ObjectId.isValid(buffTooLong));
  assert(ObjectId.isValid(buff12Bytes));
});

Deno.test(
  "[ObjectId] should throw if a 12-char length but non-12 byte string is passed in",
  () => {
    const characterCodesLargerThan256 = "abcdefŽhijkl";
    const length12Not12Bytes = "🐶🐶🐶🐶🐶🐶";
    assertThrows(
      () => new ObjectId(characterCodesLargerThan256).toHexString(),
      BSONTypeError,
      "Argument passed in must be a string of 12 bytes",
    );
    assertThrows(
      () => new ObjectId(length12Not12Bytes).id,
      BSONTypeError,
      "Argument passed in must be a string of 12 bytes",
    );
  },
);

Deno.test(
  "[ObjectId] should have isValid be true for 12-char length and 12-byte length string",
  () => {
    const plainASCIIstr = "aaaaaaaaaaaa";
    assert(ObjectId.isValid(plainASCIIstr));
  },
);

Deno.test(
  "[ObjectId] should have isValid be false for 12-char length but non-12-byte length string",
  () => {
    const characterCodesLargerThan256 = "abcdefŽhijkl";
    const length12Not12Bytest1 = "🐶🐶🐶🐶🐶🐶";
    const length12Not12Bytest2 = "value with é";
    assert(!ObjectId.isValid(characterCodesLargerThan256));
    assert(!ObjectId.isValid(length12Not12Bytest1));
    assert(!ObjectId.isValid(length12Not12Bytest2));
  },
);

Deno.test("[ObjectId] should correctly interpret timestamps beyond 2038", () => {
  const farFuture = new Date("2040-01-01T00:00:00.000Z").getTime();
  assertEquals(
    new ObjectId(ObjectId.generate(farFuture / 1000)).getTimestamp()
      .getTime(),
    farFuture,
  );
});
