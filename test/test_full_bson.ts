import {} from "../src/bson.ts";
import { Buffer } from "buffer";
const BinaryParser = require("../binary_parser").BinaryParser;
const ObjectId = ObjectId;
const Binary = Binary;
const BSONRegExp = BSONRegExp;

Deno.test("Full BSON", () => {
  /**
   * @ignore
   */
  Deno.test("Should Correctly Deserialize object", () =>
    // prettier-ignore
    var bytes = [
      95,
      0,
      0,
      0,
      2,
      110,
      115,
      0,
      42,
      0,
      0,
      0,
      105,
      110,
      116,
      101,
      103,
      114,
      97,
      116,
      105,
      111,
      110,
      95,
      116,
      101,
      115,
      116,
      115,
      95,
      46,
      116,
      101,
      115,
      116,
      95,
      105,
      110,
      100,
      101,
      120,
      95,
      105,
      110,
      102,
      111,
      114,
      109,
      97,
      116,
      105,
      111,
      110,
      0,
      8,
      117,
      110,
      105,
      113,
      117,
      101,
      0,
      0,
      3,
      107,
      101,
      121,
      0,
      12,
      0,
      0,
      0,
      16,
      97,
      0,
      1,
      0,
      0,
      0,
      0,
      2,
      110,
      97,
      109,
      101,
      0,
      4,
      0,
      0,
      0,
      97,
      95,
      49,
      0,
      0,
    ];
    var serialized_data = "";
    // Convert to chars
    for (var i = 0; i < bytes.length; i++) {
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
  Deno.test(
    "Should Correctly Deserialize object with all types",
    () =>
      // prettier-ignore
      var bytes = [
        26,
        1,
        0,
        0,
        7,
        95,
        105,
        100,
        0,
        161,
        190,
        98,
        75,
        118,
        169,
        3,
        0,
        0,
        3,
        0,
        0,
        4,
        97,
        114,
        114,
        97,
        121,
        0,
        26,
        0,
        0,
        0,
        16,
        48,
        0,
        1,
        0,
        0,
        0,
        16,
        49,
        0,
        2,
        0,
        0,
        0,
        16,
        50,
        0,
        3,
        0,
        0,
        0,
        0,
        2,
        115,
        116,
        114,
        105,
        110,
        103,
        0,
        6,
        0,
        0,
        0,
        104,
        101,
        108,
        108,
        111,
        0,
        3,
        104,
        97,
        115,
        104,
        0,
        19,
        0,
        0,
        0,
        16,
        97,
        0,
        1,
        0,
        0,
        0,
        16,
        98,
        0,
        2,
        0,
        0,
        0,
        0,
        9,
        100,
        97,
        116,
        101,
        0,
        161,
        190,
        98,
        75,
        0,
        0,
        0,
        0,
        7,
        111,
        105,
        100,
        0,
        161,
        190,
        98,
        75,
        90,
        217,
        18,
        0,
        0,
        1,
        0,
        0,
        5,
        98,
        105,
        110,
        97,
        114,
        121,
        0,
        7,
        0,
        0,
        0,
        2,
        3,
        0,
        0,
        0,
        49,
        50,
        51,
        16,
        105,
        110,
        116,
        0,
        42,
        0,
        0,
        0,
        1,
        102,
        108,
        111,
        97,
        116,
        0,
        223,
        224,
        11,
        147,
        169,
        170,
        64,
        64,
        11,
        114,
        101,
        103,
        101,
        120,
        112,
        0,
        102,
        111,
        111,
        98,
        97,
        114,
        0,
        105,
        0,
        8,
        98,
        111,
        111,
        108,
        101,
        97,
        110,
        0,
        1,
        15,
        119,
        104,
        101,
        114,
        101,
        0,
        25,
        0,
        0,
        0,
        12,
        0,
        0,
        0,
        116,
        104,
        105,
        115,
        46,
        120,
        32,
        61,
        61,
        32,
        51,
        0,
        5,
        0,
        0,
        0,
        0,
        3,
        100,
        98,
        114,
        101,
        102,
        0,
        37,
        0,
        0,
        0,
        2,
        36,
        114,
        101,
        102,
        0,
        5,
        0,
        0,
        0,
        116,
        101,
        115,
        116,
        0,
        7,
        36,
        105,
        100,
        0,
        161,
        190,
        98,
        75,
        2,
        180,
        1,
        0,
        0,
        2,
        0,
        0,
        0,
        10,
        110,
        117,
        108,
        108,
        0,
        0,
      ];
      var serialized_data = "";
      // Convert to chars
      for (var i = 0; i < bytes.length; i++) {
        serialized_data = serialized_data + BinaryParser.fromByte(bytes[i]);
      }

      var object = deserialize(Buffer.from(serialized_data, "binary"));
      assert("hello").to.equal(object.string);
      assert([1, 2, 3]).to.deep.equal(object.array);
      assert(1).to.equal(object.hash.a);
      assert(2).to.equal(object.hash.b);
      assert(object.date != null).to.be.ok;
      assert(object.oid != null).to.be.ok;
      assert(object.binary != null).to.be.ok;
      assert(42).to.equal(object.int);
      assert(33.3333).to.equal(object.float);
      assert(object.regexp != null).to.be.ok;
      assert(true).to.equal(object.boolean);
      assert(object.where != null).to.be.ok;
      assert(object.dbref != null).to.be.ok;
      assert(object["null"] == null).to.be.ok;
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should Serialize and Deserialize String", () =>
    var test_string = { hello: "world" };
    var serialized_data = serialize(test_string);
    assert(test_string).to.deep.equal(deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Integer 5",
    () =>
      var test_number = { doc: 5 };
      var serialized_data = serialize(test_number);
      assert(test_number).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize null value",
    () =>
      var test_null = { doc: null };
      var serialized_data = serialize(test_null);
      var object = deserialize(serialized_data);
      assert(test_null).to.deep.equal(object);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize undefined value",
    () =>
      var test_undefined = { doc: undefined };
      var serialized_data = serialize(test_undefined);
      var object = deserialize(Buffer.from(serialized_data, "binary"));
      assert(undefined).to.equal(object.doc);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Number 3",
    () =>
      var test_number = { doc: 5.5 };
      var serialized_data = serialize(test_number);
      assert(test_number).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Integers",
    () =>
      var test_int = { doc: 42 };
      var serialized_data = serialize(test_int);
      assert(test_int).to.deep.equal(deserialize(serialized_data));

      test_int = { doc: -5600 };
      serialized_data = serialize(test_int);
      assert(test_int).to.deep.equal(deserialize(serialized_data));

      test_int = { doc: 2147483647 };
      serialized_data = serialize(test_int);
      assert(test_int).to.deep.equal(deserialize(serialized_data));

      test_int = { doc: -2147483648 };
      serialized_data = serialize(test_int);
      assert(test_int).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Object",
    () =>
      var doc = { doc: { age: 42, name: "Spongebob", shoe_size: 9.5 } };
      var serialized_data = serialize(doc);
      assert(doc).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Array",
    () =>
      var doc = { doc: [1, 2, "a", "b"] };
      var serialized_data = serialize(doc);
      assert(doc).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Array with added on functions",
    () =>
      var doc = { doc: [1, 2, "a", "b"] };
      var serialized_data = serialize(doc);
      assert(doc).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize A Boolean",
    () =>
      var doc = { doc: true };
      var serialized_data = serialize(doc);
      assert(doc).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a Date",
    () =>
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
      assert(doc).to.deep.equal(deserialize(serialized_data));
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should Correctly Serialize and Deserialize Oid", () =>
    var doc = { doc: new ObjectId() };
    var serialized_data = serialize(doc);
    assert(doc.doc.toHexString()).to.deep.equal(
      deserialize(serialized_data).doc.toHexString(),
    );
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Buffer",
    () =>
      var doc = { doc: Buffer.from("123451234512345") };
      var serialized_data = serialize(doc);

      assert("123451234512345").to.equal(
        deserialize(serialized_data).doc.buffer.toString("ascii"),
      );
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Buffer with promoteBuffers option",
    () =>
      var doc = { doc: Buffer.from("123451234512345") };
      var serialized_data = serialize(doc);

      var options = { promoteBuffers: true };
      assert("123451234512345").to.equal(
        deserialize(serialized_data, options).doc.toString("ascii"),
      );
    },
  );

  /**
   * @ignore
   */
  Deno.test("Should Correctly encode Empty Hash", () =>
    var test_code = {};
    var serialized_data = serialize(test_code);
    assert(test_code).to.deep.equal(deserialize(serialized_data));
  });

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Ordered Hash",
    () =>
      var doc = { doc: { b: 1, a: 2, c: 3, d: 4 } };
      var serialized_data = serialize(doc);
      var decoded_hash = deserialize(serialized_data).doc;
      var keys = [];
      for (var name in decoded_hash) keys.push(name);
      assert(["b", "a", "c", "d"]).to.deep.equal(keys);
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize Regular Expression",
    () =>
      var doc = { doc: /foobar/im };
      var serialized_data = serialize(doc);
      var doc2 = deserialize(serialized_data);
      assert(doc.doc.toString()).to.equal(doc2.doc.toString());
    },
  );

  /**
   * @ignore
   */
  Deno.test(
    "Should Correctly Serialize and Deserialize a Binary object",
    () =>
      var bin = new Binary();
      var string = "binstring";
      for (var index = 0; index < string.length; index++) {
        bin.put(string.charAt(index));
      }
      var doc = { doc: bin };
      var serialized_data = serialize(doc);
      var deserialized_data = deserialize(serialized_data);
      assert(doc.doc.value()).to.equal(deserialized_data.doc.value());
    },
  );

  Deno.test("Should Correctly Serialize and Deserialize a ArrayBuffer object", () => {
    const arrayBuffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer;
    const doc = { arrayBuffer };
    const serialized_data = serialize(doc);
    const deserialized_data = deserialize(serialized_data);

    assert(deserialized_data.arrayBuffer).to.be.empty;
  });

  Deno.test("Should Correctly Serialize and Deserialize a Float64Array object", () => {
    const floats = new Float64Array([12.34]);
    const doc = { floats };
    const serialized_data = serialize(doc);
    const deserialized_data = deserialize(serialized_data);

    assert(deserialized_data).to.have.property("floats");
    assert(deserialized_data.floats).to.have.property("0", 12.34);
  });

  Deno.test(
    "Should Correctly fail due to attempting serialization of illegal key values",
    () =>
      var k = Buffer.alloc(15);
      for (var i = 0; i < 15; i++) k[i] = 0;

      k.write("hello");
      k[6] = 0x06;
      k.write("world", 10);

      var v = Buffer.alloc(65801);
      for (i = 0; i < 65801; i++) v[i] = 1;
      v[0] = 0x0a;
      var doc = {};
      doc[k.toString()] = v.toString();

      // Should throw due to null character
      try {
        serialize(doc, {
          checkKeys: true,
        });
        assert(false).to.be.ok;
      } catch (err) {
        assert(true).to.be.ok;
      }
    },
  );

  Deno.test(
    "Should correctly fail to serialize regexp with null bytes",
    () =>
      var doc = {};
      doc.test = new RegExp("a\0b"); // eslint-disable-line no-control-regex

      try {
        serialize(doc, {
          checkKeys: true,
        });
        assert(false).to.be.ok;
      } catch (err) {
        assert(true).to.be.ok;
      }
    },
  );

  Deno.test(
    "Should correctly fail to serialize BSONRegExp with null bytes",
    () =>
      var doc = {};

      try {
        doc.test = new BSONRegExp("a\0b");
        serialize(doc, {
          checkKeys: true,
        });
        assert(false).to.be.ok;
      } catch (err) {
        assert(true).to.be.ok;
      }
    },
  );
});
