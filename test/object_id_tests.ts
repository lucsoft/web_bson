import { Buffer } from "buffer";
import {} from "../src/bson.ts";
const BSONTypeError = BSON.BSONTypeError;
const util = require("util");
const ObjectId = ObjectId;

Deno.test("ObjectId", () => {
  Deno.test("should correctly handle objectId timestamps", () =>
    const a = ObjectId.createFromTime(1);
    assert(Buffer.from([0, 0, 0, 1])).to.deep.equal(a.id.slice(0, 4));
    assert(1000).to.equal(a.getTimestamp().getTime());

    const b = new ObjectId();
    b.generationTime = 1;
    assert(Buffer.from([0, 0, 0, 1])).to.deep.equal(b.id.slice(0, 4));
    assert(1).to.equal(b.generationTime);
    assert(1000).to.equal(b.getTimestamp().getTime());
  });

  Deno.test("should correctly create ObjectId from ObjectId", () => {
    const noArgObjID = new ObjectId();
    assert(new ObjectId(noArgObjID).id).to.deep.equal(
      Buffer.from(noArgObjID.id, "hex"),
    );
  });

  const invalidInputs = [
    { input: [], description: "empty array" },
    { input: ["abcdefŽhijkl"], description: "nonempty array" },
    { input: {}, description: "empty object" },
  ];

  for (const { input, description } of invalidInputs) {
    Deno.test(`should throw error if ${description} is passed in`, () => {
      assert(() => {new ObjectId(input)).to.throw(BSONTypeError);
    });
  }

  Deno.test("should throw error if object without an id property is passed in", () => {
    const noArgObjID = new ObjectId();
    const objectIdLike = {
      toHexString: () => {
        return noArgObjID.toHexString();
      },
    };
    assert(() => {new ObjectId(objectIdLike)).to.throw(BSONTypeError);
  });

  Deno.test("should correctly create ObjectId from object with valid string id", () => {
    const objectValidString24Hex = {
      id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    };
    const objectValidString12Bytes = {
      id: "abcdefghijkl",
    };
    const buf24Hex = Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaa", "hex");
    const buf12Bytes = Buffer.from("abcdefghijkl");
    assert(new ObjectId(objectValidString24Hex).id).to.deep.equal(buf24Hex);
    assert(new ObjectId(objectValidString12Bytes).id).to.deep.equal(buf12Bytes);
  });

  Deno.test("should correctly create ObjectId from object with valid string id and toHexString method", () => {
    function new24HexToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const buf24hex = Buffer.from("BBBBBBBBBBBBBBBBBBBBBBBB", "hex");
    const objectValidString24Hex = {
      id: "aaaaaaaaaaaaaaaaaaaaaaaa",
      toHexString: new24HexToHexString,
    };
    const objectValidString12Bytes = {
      id: "abcdefghijkl",
      toHexString: new24HexToHexString,
    };
    assert(new ObjectId(objectValidString24Hex).id).to.deep.equal(buf24hex);
    assert(new ObjectId(objectValidString12Bytes).id).to.deep.equal(buf24hex);
  });

  Deno.test("should correctly create ObjectId from object with valid Buffer id", () => {
    const validBuffer24Hex = Buffer.from("AAAAAAAAAAAAAAAAAAAAAAAA", "hex");
    const validBuffer12Array = Buffer.from([
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
    const objectBufferId = {
      id: validBuffer24Hex,
    };
    const objectBufferFromArray = {
      id: validBuffer12Array,
    };
    assert(new ObjectId(objectBufferId).id).to.deep.equals(validBuffer24Hex);
    assert(new ObjectId(objectBufferFromArray).id).to.deep.equals(
      validBuffer12Array,
    );
  });

  Deno.test("should correctly create ObjectId from object with valid Buffer id and toHexString method", () => {
    const validBuffer24Hex = Buffer.from("AAAAAAAAAAAAAAAAAAAAAAAA", "hex");
    const validBuffer12Array = Buffer.from([
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
    const bufferNew24Hex = Buffer.from("BBBBBBBBBBBBBBBBBBBBBBBB", "hex");
    function newToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const objectBufferHex = {
      id: validBuffer24Hex,
      toHexString: newToHexString,
    };
    const objectBufferArray = {
      id: validBuffer12Array,
      toHexString: newToHexString,
    };
    assert(new ObjectId(objectBufferHex).id).to.deep.equal(bufferNew24Hex);
    assert(new ObjectId(objectBufferArray).id).to.deep.equal(bufferNew24Hex);
  });

  Deno.test("should throw error if object with non-Buffer non-string id is passed in", () => {
    const objectNumId = {
      id: 5,
    };
    const objectNullId = {
      id: null,
    };
    assert(() => {new ObjectId(objectNumId)).to.throw(BSONTypeError);
    assert(() => {new ObjectId(objectNullId)).to.throw(BSONTypeError);
  });

  Deno.test("should throw an error if object with invalid string id is passed in", () => {
    const objectInvalid24HexStr = {
      id: "FFFFFFFFFFFFFFFFFFFFFFFG",
    };
    assert(() => {new ObjectId(objectInvalid24HexStr)).to.throw(BSONTypeError);
  });

  Deno.test("should correctly create ObjectId from object with invalid string id and toHexString method", () => {
    function newToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const objectInvalid24HexStr = {
      id: "FFFFFFFFFFFFFFFFFFFFFFFG",
      toHexString: newToHexString,
    };
    const bufferNew24Hex = Buffer.from("BBBBBBBBBBBBBBBBBBBBBBBB", "hex");
    assert(new ObjectId(objectInvalid24HexStr).id).to.deep.equal(
      bufferNew24Hex,
    );
  });

  Deno.test("should throw an error if object with invalid Buffer id is passed in", () => {
    const objectInvalidBuffer = {
      id: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
    };
    assert(() => {new ObjectId(objectInvalidBuffer)).to.throw(BSONTypeError);
  });

  Deno.test("should correctly create ObjectId from object with invalid Buffer id and toHexString method", () => {
    function newToHexString() {
      return "BBBBBBBBBBBBBBBBBBBBBBBB";
    }
    const objectInvalidBuffer = {
      id: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]),
      toHexString: newToHexString,
    };
    const bufferNew24Hex = Buffer.from("BBBBBBBBBBBBBBBBBBBBBBBB", "hex");
    assert(new ObjectId(objectInvalidBuffer).id).to.deep.equal(bufferNew24Hex);
  });

  const numericIO = [
    { input: 42, output: 42, description: "42" },
    { input: 0x2a, output: 0x2a, description: "0x2a" },
    { input: 4.2, output: 4, description: "4.2" },
    { input: NaN, output: 0, description: "NaN" },
  ];

  for (const { input, output } of numericIO) {
    Deno.test(`should correctly create ObjectId from ${input} and result in ${output}`, () => {
      const objId = new ObjectId(input);
      assert(objId).to.have.property("id");
      assert(objId.id).to.be.instanceOf(Buffer);
      assert(objId.id.readUInt32BE(0)).to.equal(output);
    });
  }

  Deno.test("should correctly create ObjectId undefined or null", () => {
    const objNull = new ObjectId(null);
    const objNoArg = new ObjectId();
    const objUndef = new ObjectId(undefined);
    assert(objNull.id).to.be.instanceOf(Buffer);
    assert(objNoArg.id).to.be.instanceOf(Buffer);
    assert(objUndef.id).to.be.instanceOf(Buffer);
  });

  Deno.test("should throw error if non-12 byte non-24 hex string passed in", () => {
    assert(() => {new ObjectId("FFFFFFFFFFFFFFFFFFFFFFFG")).to.throw(
      BSONTypeError,
    );
    assert(() => {new ObjectId("thisstringisdefinitelytoolong")).to.throw(
      BSONTypeError,
    );
    assert(() => {new ObjectId("tooshort")).to.throw(BSONTypeError);
    assert(() => {new ObjectId("101010")).to.throw(BSONTypeError);
    assert(() => {new ObjectId("")).to.throw(BSONTypeError);
  });

  Deno.test("should correctly create ObjectId from 24 hex string", () => {
    const validStr24Hex = "FFFFFFFFFFFFFFFFFFFFFFFF";
    assert(new ObjectId(validStr24Hex).id).to.deep.equal(
      Buffer.from(validStr24Hex, "hex"),
    );
  });

  Deno.test("should correctly create ObjectId from 12 byte sequence", () => {
    const byteSequence12 = "111111111111";
    assert(new ObjectId(byteSequence12).id).to.deep.equal(
      Buffer.from(byteSequence12, "latin1"),
    );
  });

  Deno.test(
    "should correctly create ObjectId from uppercase hexstring",
    () =>
      let a = "AAAAAAAAAAAAAAAAAAAAAAAA";
      let b = new ObjectId(a);
      let c = b.equals(a); // => false
      assert(true).to.equal(c);

      a = "aaaaaaaaaaaaaaaaaaaaaaaa";
      b = new ObjectId(a);
      c = b.equals(a); // => true
      assert(true).to.equal(c);
      assert(a).to.equal(b.toString());
    },
  );

  Deno.test(
    "should correctly create ObjectId from valid Buffer",
    () =>
      if (!Buffer.from) return;
      let a = "AAAAAAAAAAAAAAAAAAAAAAAA";
      let b = new ObjectId(Buffer.from(a, "hex"));
      let c = b.equals(a); // => false
      assert(true).to.equal(c);

      a = "aaaaaaaaaaaaaaaaaaaaaaaa";
      b = new ObjectId(Buffer.from(a, "hex"));
      c = b.equals(a); // => true
      assert(a).to.equal(b.toString());
      assert(true).to.equal(c);
    },
  );

  Deno.test("should throw an error if invalid Buffer passed in", () => {
    const a = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    assert(() => {new ObjectId(a)).to.throw(BSONTypeError);
  });

  Deno.test(
    "should correctly allow for node.js inspect to work with ObjectId",
    () =>
      const a = "AAAAAAAAAAAAAAAAAAAAAAAA";
      const b = new ObjectId(a);
      assert(util.inspect(b)).to.equal(
        'new ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa")',
      );
    },
  );

  Deno.test("should isValid check input Buffer length", () =>
    const buffTooShort = Buffer.from([]);
    const buffTooLong = Buffer.from([
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
    const buff12Bytes = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    assert(ObjectId.isValid(buffTooShort)).to.be.false;
    assert(ObjectId.isValid(buffTooLong)).to.be.false;
    assert(ObjectId.isValid(buff12Bytes)).to.be.true;
  });

  Deno.test("should throw if a 12-char length but non-12 byte string is passed in", () => {
    const characterCodesLargerThan256 = "abcdefŽhijkl";
    const length12Not12Bytes = "🐶🐶🐶🐶🐶🐶";
    assert(() => {new ObjectId(characterCodesLargerThan256).toHexString()).to
      .throw(
        BSONTypeError,
        "Argument passed in must be a string of 12 bytes",
      );
    assert(() => {new ObjectId(length12Not12Bytes).id).to.throw(
      BSONTypeError,
      "Argument passed in must be a string of 12 bytes",
    );
  });

  Deno.test("should have isValid be true for 12-char length and 12-byte length string", () => {
    const plainASCIIstr = "aaaaaaaaaaaa";
    assert(ObjectId.isValid(plainASCIIstr)).to.be.true;
  });

  Deno.test("should have isValid be false for 12-char length but non-12-byte length string", () => {
    const characterCodesLargerThan256 = "abcdefŽhijkl";
    const length12Not12Bytest1 = "🐶🐶🐶🐶🐶🐶";
    const length12Not12Bytest2 = "value with é";
    assert(ObjectId.isValid(characterCodesLargerThan256)).to.be.false;
    assert(ObjectId.isValid(length12Not12Bytest1)).to.be.false;
    assert(ObjectId.isValid(length12Not12Bytest2)).to.be.false;
  });

  Deno.test("should correctly interpret timestamps beyond 2038", () => {
    const farFuture = new Date("2040-01-01T00:00:00.000Z").getTime();
    assert(
      new ObjectId(ObjectId.generate(farFuture / 1000)).getTimestamp()
        .getTime(),
    ).to.equal(farFuture);
  });
});
