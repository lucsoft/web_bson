import {} from "../src/bson.ts";
const M = BSON.Map;

Deno.test("Map", () => {
  /**
   * @ignore
   */
  Deno.test("should correctly exercise the map", () =>
    var m = new M([
      ["a", 1],
      ["b", 2],
    ]);

    assert(m.has("a")).to.be.ok;
    assert(m.has("b")).to.be.ok;
    assert(1).to.equal(m.get("a"));
    assert(2).to.equal(m.get("b"));
    assert(m.set("a", 3) === m).to.be.ok;
    assert(m.has("a")).to.be.ok;
    assert(3).to.equal(m.get("a"));

    // Get the values
    var iterator = m.values();
    assert(3).to.equal(iterator.next().value);
    assert(2).to.equal(iterator.next().value);
    assert(true).to.equal(iterator.next().done);

    // Get the entries
    iterator = m.entries();
    assert(["a", 3]).to.deep.equal(iterator.next().value);
    assert(["b", 2]).to.deep.equal(iterator.next().value);
    assert(true).to.deep.equal(iterator.next().done);

    // Get the keys
    iterator = m.keys();
    assert("a").to.deep.equal(iterator.next().value);
    assert("b").to.deep.equal(iterator.next().value);
    assert(true).to.deep.equal(iterator.next().done);

    // Collect values
    var values = [];
    // Get entries forEach
    m.forEach(function (value, key, map) {
      assert(value != null).to.be.ok;
      assert(key != null).to.be.ok;
      assert(map != null).to.be.ok;
      assert(m === this).to.be.ok;
      values.push([key, value]);
    }, m);

    assert([
      ["a", 3],
      ["b", 2],
    ]).to.deep.equal(values);

    // Modify the state
    assert(true).to.equal(m.delete("a"));
    m.set("c", 5);
    m.set("a", 7);

    // Validate order is preserved
    // Get the keys
    iterator = m.keys();
    assert("b").to.deep.equal(iterator.next().value);
    assert("c").to.deep.equal(iterator.next().value);
    assert("a").to.deep.equal(iterator.next().value);
    assert(true).to.deep.equal(iterator.next().done);

    // Get the entries
    iterator = m.entries();
    assert(["b", 2]).to.deep.equal(iterator.next().value);
    assert(["c", 5]).to.deep.equal(iterator.next().value);
    assert(["a", 7]).to.deep.equal(iterator.next().value);
    assert(true).to.deep.equal(iterator.next().done);

    // Get the values
    iterator = m.values();
    assert(2).to.equal(iterator.next().value);
    assert(5).to.equal(iterator.next().value);
    assert(7).to.equal(iterator.next().value);
    assert(true).to.equal(iterator.next().done);
  });

  /**
   * @ignore
   */
  Deno.test("should serialize a map", () =>
    // Serialize top level map only
    var m = new M([
      ["a", 1],
      ["b", 2],
    ]);
    // Serialize the map
    var data = serialize(m, false, true);
    // Deserialize the data
    var object = deserialize(data);
    assert({ a: 1, b: 2 }).to.deep.equal(object);

    // Serialize nested maps
    var m1 = new M([
      ["a", 1],
      ["b", 2],
    ]);
    m = new M([["c", m1]]);
    // Serialize the map
    data = serialize(m, false, true);
    // Deserialize the data
    object = deserialize(data);
    assert({ c: { a: 1, b: 2 } }).to.deep.equal(object);

    // Serialize top level map only
    m = new M([
      ["1", 1],
      ["0", 2],
    ]);
    // Serialize the map, validating that the order in the resulting BSON is preserved
    data = serialize(m, false, true);
    assert("13000000103100010000001030000200000000").to.equal(
      data.toString("hex"),
    );
  });

  /**
   * @ignore
   */
  Deno.test(
    "should not crash due to object that looks like map",
    () =>
      // Serialize top level map only
      var m = { entries: "test" };
      // Serialize the map
      var data = serialize(m, false, true);
      // Deserialize the data
      var object = deserialize(data);
      assert(m).to.deep.equal(object);
    },
  );
});
