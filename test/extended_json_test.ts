// deno-lint-ignore-file no-explicit-any
import {
  Binary,
  BSONRegExp,
  BSONSymbol,
  Code,
  DBRef,
  Decimal128,
  Double,
  EJSON,
  Int32,
  Long,
  MaxKey,
  MinKey,
  ObjectId,
  Timestamp,
} from "../src/bson.ts";
import { assert, assertEquals, assertThrows, equal } from "../test_deps.ts";

const getDoc = () => {
  let doc = {};

  const buffer = new Uint8Array(64);
  for (let i = 0; i < buffer.length; i++) buffer[i] = i;
  const date = new Date();
  date.setTime(1488372056737);
  doc = {
    _id: new Int32(100),
    gh: new Int32(1),
    binary: new Binary(buffer),
    date: date,
    code: new Code("function() {}", { a: new Int32(1) }),
    dbRef: new DBRef("tests", new ObjectId(new Int32(1).value), "test"),
    decimal: Decimal128.fromString("100"),
    double: new Double(10.1),
    int32: new Int32(10),
    long: Long.fromNumber(200),
    maxKey: new MaxKey(),
    minKey: new MinKey(),
    objectID: ObjectId.createFromHexString("111111111111111111111111"),
    regexp: new BSONRegExp("hello world", "i"),
    symbol: new BSONSymbol("symbol"),
    timestamp: Timestamp.fromNumber(1000),
    int32Number: 300,
    doubleNumber: 200.2,
    longNumberIntFit: 0x19000000000000,
    doubleNumberIntFit: 19007199250000000.12,
  };
  return doc;
};

Deno.test(
  "[ExtendedJSON] should correctly extend an existing mongodb module",
  () => {
    // Serialize the document
    const json =
      '{"_id":{"$numberInt":"100"},"gh":{"$numberInt":"1"},"binary":{"$binary":{"base64":"AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+Pw==","subType":"00"}},"date":{"$date":{"$numberLong":"1488372056737"}},"code":{"$code":"function() {}","$scope":{"a":{"$numberInt":"1"}}},"dbRef":{"$ref":"tests","$id":{"$numberInt":"1"},"$db":"test"},"decimal":{"$numberDecimal":"100"},"double":{"$numberDouble":"10.1"},"int32":{"$numberInt":"10"},"long":{"$numberLong":"200"},"maxKey":{"$maxKey":1},"minKey":{"$minKey":1},"objectId":{"$oid":"111111111111111111111111"},"objectID":{"$oid":"111111111111111111111111"},"oldObjectID":{"$oid":"111111111111111111111111"},"regexp":{"$regularExpression":{"pattern":"hello world","options":"i"}},"symbol":{"$symbol":"symbol"},"timestamp":{"$timestamp":{"t":0,"i":1000}},"int32Number":{"$numberInt":"300"},"doubleNumber":{"$numberDouble":"200.2"},"longNumberIntFit":{"$numberLong":"7036874417766400"},"doubleNumberIntFit":{"$numberLong":"19007199250000000"}}';

    assertEquals(json, EJSON.stringify(getDoc(), null, 0, { relaxed: false }));
  },
);

Deno.test(
  "[ExtendedJSON] should correctly deserialize using the default relaxed mode",
  () => {
    // Deserialize the document using non strict mode
    let doc1 = EJSON.parse(EJSON.stringify(getDoc(), null, 0)) as any;

    // Validate the values
    assertEquals(300, doc1.int32Number);
    assertEquals(200.2, doc1.doubleNumber);
    assertEquals(0x19000000000000, doc1.longNumberIntFit);
    assertEquals(19007199250000000.12, doc1.doubleNumberIntFit);

    // Deserialize the document using strict mode
    doc1 = EJSON.parse(EJSON.stringify(getDoc(), null, 0), { relaxed: false });

    // Validate the values
    assertEquals(doc1.int32Number._bsontype, "Int32");
    assertEquals(doc1.doubleNumber._bsontype, "Double");
    assertEquals(doc1.longNumberIntFit._bsontype, "Long");
    assertEquals(doc1.doubleNumberIntFit._bsontype, "Long");
  },
);

Deno.test(
  "[ExtendedJSON] should correctly serialize, and deserialize using built-in BSON",
  () => {
    // Create a doc
    const doc1 = {
      int32: new Int32(10),
    };

    // Serialize the document
    const text = EJSON.stringify(doc1, null, 0, { relaxed: false });
    assertEquals(text, '{"int32":{"$numberInt":"10"}}');

    // Deserialize the json in strict and non strict mode
    let doc2 = EJSON.parse(text, { relaxed: false }) as any;
    assertEquals(doc2.int32._bsontype, "Int32");
    doc2 = EJSON.parse(text);
    assertEquals(doc2.int32, 10);
  },
);

Deno.test(
  "[ExtendedJSON] should correctly serialize bson types when they are values",
  () => {
    let serialized = EJSON.stringify(
      new ObjectId("591801a468f9e7024b6235ea"),
      { relaxed: false },
    );
    assertEquals(serialized, '{"$oid":"591801a468f9e7024b6235ea"}');
    serialized = EJSON.stringify(new ObjectId("591801a468f9e7024b6235ea"), {
      relaxed: false,
    });
    assertEquals(serialized, '{"$oid":"591801a468f9e7024b6235ea"}');
    serialized = EJSON.stringify(
      new ObjectId("591801a468f9e7024b6235ea"),
      { relaxed: false },
    );
    assertEquals(serialized, '{"$oid":"591801a468f9e7024b6235ea"}');

    serialized = EJSON.stringify(new Int32(42), { relaxed: false });
    assertEquals(serialized, '{"$numberInt":"42"}');
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectId("591801a468f9e7024b6235ea")] },
      },
      { relaxed: false },
    );
    assertEquals(
      serialized,
      '{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}',
    );
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectId("591801a468f9e7024b6235ea")] },
      },
      { relaxed: false },
    );
    assertEquals(
      serialized,
      '{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}',
    );
    serialized = EJSON.stringify(
      {
        _id: { $nin: [new ObjectId("591801a468f9e7024b6235ea")] },
      },
      { relaxed: false },
    );
    assertEquals(
      serialized,
      '{"_id":{"$nin":[{"$oid":"591801a468f9e7024b6235ea"}]}}',
    );

    serialized = EJSON.stringify(
      new Binary(new Uint8Array([1, 2, 3, 4, 5])),
      { relaxed: false },
    );
    assertEquals(
      serialized,
      '{"$binary":{"base64":"AQIDBAU=","subType":"00"}}',
    );
  },
);

Deno.test("[ExtendedJSON] should correctly serialize strings", () => {
  const serialized = EJSON.stringify("new string");
  assertEquals(serialized, '"new string"');
});

Deno.test("[ExtendedJSON] should correctly serialize numbers", () => {
  const serialized = EJSON.stringify(42);
  assertEquals(serialized, "42");
});

Deno.test(
  "[ExtendedJSON] should correctly serialize non-finite numbers",
  () => {
    const numbers = { neginf: -Infinity, posinf: Infinity, nan: NaN };
    const serialized = EJSON.stringify(numbers);
    assertEquals(
      serialized,
      '{"neginf":{"$numberDouble":"-Infinity"},"posinf":{"$numberDouble":"Infinity"},"nan":{"$numberDouble":"NaN"}}',
    );
    assert(equal(EJSON.parse(serialized), numbers));
  },
);

Deno.test("[ExtendedJSON] should correctly parse null values", () => {
  assertEquals(!EJSON.parse("null"), null);
  assertEquals((EJSON.parse("[null]") as null[])[0], null);

  const input =
    '{"result":[{"_id":{"$oid":"591801a468f9e7024b623939"},"emptyField":null}]}';
  const parsed = EJSON.parse(input);

  assert(equal(parsed, {
    result: [{
      _id: new ObjectId("591801a468f9e7024b623939"),
      emptyField: null,
    }],
  }));
});

Deno.test(
  "[ExtendedJSON] should correctly throw when passed a non-string to parse",
  () => {
    assertThrows(() => EJSON.parse({} as string));
  },
);

Deno.test("[ExtendedJSON] should allow relaxed parsing by default", () => {
  const dt = new Date(1452124800000);
  const inputObject = {
    int: { $numberInt: "500" },
    long: { $numberLong: "42" },
    double: { $numberDouble: "24" },
    date: { $date: { $numberLong: "1452124800000" } },
  };

  const parsed = EJSON.parse(JSON.stringify(inputObject));
  assertEquals(parsed, {
    int: 500,
    long: 42,
    double: 24,
    date: dt,
  });
});

Deno.test("[ExtendedJSON] should allow regexp", () => {
  const parsedRegExp = EJSON.stringify({ test: /some-regex/i });
  const parsedBSONRegExp = EJSON.stringify(
    { test: new BSONRegExp("some-regex", "i") },
    { relaxed: true },
  );
  assertEquals(parsedRegExp, parsedBSONRegExp);
});

Deno.test(
  "[ExtendedJSON] should serialize from BSON object to EJSON object",
  () => {
    const doc = {
      binary: new Binary("" as unknown as Uint8Array),
      code: new Code("function() {}"),
      dbRef: new DBRef("tests", new Int32(1) as unknown as ObjectId, "test"),
      decimal128: new Decimal128(128 as unknown as string),
      double: new Double(10.1),
      int32: new Int32(10),
      long: new Long(234),
      maxKey: new MaxKey(),
      minKey: new MinKey(),
      objectId: ObjectId.createFromHexString("111111111111111111111111"),
      bsonRegExp: new BSONRegExp("hello world", "i"),
      symbol: new BSONSymbol("symbol"),
      timestamp: new Timestamp(),
      //   foreignRegExp: vm.runInNewContext("/abc/"),
      //   foreignDate: vm.runInNewContext("new Date(0)"),
    };

    const result = EJSON.serialize(doc, { relaxed: false });
    assert(equal(result, {
      binary: { $binary: { base64: "", subType: "00" } },
      code: { $code: "function() {}" },
      dbRef: { $ref: "tests", $id: { $numberInt: "1" }, $db: "test" },
      decimal128: { $numberDecimal: "0E-6176" },
      double: { $numberDouble: "10.1" },
      int32: { $numberInt: "10" },
      long: { $numberLong: "234" },
      maxKey: { $maxKey: 1 },
      minKey: { $minKey: 1 },
      objectId: { $oid: "111111111111111111111111" },
      objectID: { $oid: "111111111111111111111111" },
      oldObjectID: { $oid: "111111111111111111111111" },
      bsonRegExp: {
        $regularExpression: { pattern: "hello world", options: "i" },
      },
      symbol: { $symbol: "symbol" },
      timestamp: { $timestamp: { t: 0, i: 0 } },
      foreignDate: { $date: { $numberLong: "0" } },
      foreignRegExp: { $regularExpression: { pattern: "abc", options: "" } },
    }));
  },
);

Deno.test(
  "[ExtendedJSON] should deserialize from EJSON object to BSON object",
  () => {
    const doc = {
      binary: { $binary: { base64: "", subType: "00" } },
      code: { $code: "function() {}" },
      dbRef: { $ref: "tests", $id: { $numberInt: "1" }, $db: "test" },
      decimal128: { $numberDecimal: "0E-6176" },
      double: { $numberDouble: "10.1" },
      int32: { $numberInt: "10" },
      long: { $numberLong: "234" },
      maxKey: { $maxKey: 1 },
      minKey: { $minKey: 1 },
      objectId: { $oid: "111111111111111111111111" },
      objectID: { $oid: "111111111111111111111111" },
      oldObjectID: { $oid: "111111111111111111111111" },
      bsonRegExp: {
        $regularExpression: { pattern: "hello world", options: "i" },
      },
      symbol: { $symbol: "symbol" },
      timestamp: { $timestamp: { t: 0, i: 0 } },
    };

    const result = EJSON.deserialize(doc, { relaxed: false }) as any;

    // binary
    assert(result?.binary instanceof Binary);
    // code
    assert(result.code instanceof Code);
    assertEquals(result.code.code, "function() {}");
    // dbRef
    assert(result.dbRef instanceof DBRef);
    assertEquals(result.dbRef.collection, "tests");
    assertEquals(result.dbRef.db, "test");
    // decimal128
    assert(result.decimal128 instanceof Decimal128);
    // double
    assert(result.double instanceof Double);
    assertEquals(result.double.value, 10.1);
    // int32
    assert(result.int32 instanceof Int32);
    assertEquals(result.int32.value, 10);
    //long
    assert(result.long instanceof Long);
    // maxKey
    assert(result.maxKey instanceof MaxKey);
    // minKey
    assert(result.minKey instanceof MinKey);
    // objectID
    assertEquals(result.objectId.toString(), "111111111111111111111111");
    assertEquals(result.objectID.toString(), "111111111111111111111111");
    assertEquals(result.oldObjectID.toString(), "111111111111111111111111");
    //bsonRegExp
    assert(result.bsonRegExp instanceof BSONRegExp);
    assertEquals(result.bsonRegExp.pattern, "hello world");
    assertEquals(result.bsonRegExp.options, "i");
    // symbol
    assertEquals(result.symbol.toString(), "symbol");
    // timestamp
    assert(result.timestamp instanceof Timestamp);
  },
);

Deno.test(
  "[ExtendedJSON] should return a native number for a double in relaxed mode",
  () => {
    const result = EJSON.deserialize({ test: 34.12 }, { relaxed: true }) as any;
    assertEquals(result.test, 34.12);
    assertEquals(typeof result.test, "number");
  },
);

Deno.test(
  "[ExtendedJSON] should work for function-valued and array-valued replacer parameters",
  () => {
    const doc = { a: new Int32(10), b: new Int32(10) };

    const replacerArray = ["a", "$numberInt"];
    let serialized = EJSON.stringify(doc, replacerArray, 0, {
      relaxed: false,
    });
    assertEquals(serialized, '{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerArray);
    assertEquals(serialized, '{"a":10}');

    const replacerFunc = function (key: any, value: any) {
      return key === "b" ? undefined : value;
    };
    serialized = EJSON.stringify(doc, replacerFunc, 0, { relaxed: false });
    assertEquals(serialized, '{"a":{"$numberInt":"10"}}');

    serialized = EJSON.stringify(doc, replacerFunc);
    assertEquals(serialized, '{"a":10}');
  },
);

Deno.test(
  "[ExtendedJSON] should throw if invalid BSON types are input to EJSON serializer",
  () => {
    const oid = new ObjectId("111111111111111111111111");
    const badBsonType = Object.assign({}, oid, { _bsontype: "bogus" });
    const badDoc = { bad: badBsonType };
    const badArray = [oid, badDoc];
    // const badMap = new Map([['a', badBsonType], ['b', badDoc], ['c', badArray]]);
    assertThrows(() => EJSON.serialize(badDoc));
    assertThrows(() => EJSON.serialize(badArray));
    // expect(() => EJSON.serialize(badMap)).to.throw(); // uncomment when EJSON supports ES6 Map
  },
);

Deno.test(
  "[ExtendedJSON] should throw a helpful error message for input with circular references",
  () => {
    const obj = {
      some: {
        property: {
          array: [],
        },
      },
    } as any;
    obj.some.property.array.push(obj.some);
    assertThrows(() => EJSON.serialize(obj));
    //     expect(() => EJSON.serialize(obj)).to.throw(`\
    // Converting circular structure to EJSON:
    //     (root) -> some -> property -> array -> index 0
    //                 \\-----------------------------/`);
  },
);

Deno.test(
  "[ExtendedJSON] should throw a helpful error message for input with circular references, one-level nested",
  () => {
    const obj = {} as any;
    obj.obj = obj;
    assertThrows(() => EJSON.serialize(obj));
    //     expect(() => EJSON.serialize(obj)).to.throw(`\
    // Converting circular structure to EJSON:
    //     (root) -> obj
    //        \\-------/`);
  },
);

Deno.test(
  "[ExtendedJSON] should throw a helpful error message for input with circular references, one-level nested inside base object",
  () => {
    const obj = {} as any;
    obj.obj = obj;
    assertThrows(() => EJSON.serialize({ foo: obj }));
    //     expect(() => EJSON.serialize({ foo: obj })).to.throw(`\
    // Converting circular structure to EJSON:
    //     (root) -> foo -> obj
    //                \\------/`);
  },
);

Deno.test(
  "[ExtendedJSON] should throw a helpful error message for input with circular references, pointing back to base object",
  () => {
    const obj = { foo: {} } as any;
    obj.foo.obj = obj;
    assertThrows(() => EJSON.serialize(obj));
    //     expect(() => EJSON.serialize(obj)).to.throw(`\
    // Converting circular structure to EJSON:
    //     (root) -> foo -> obj
    //        \\--------------/`);
  },
);
