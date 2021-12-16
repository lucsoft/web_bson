import { prettyBenchmarkResult } from "https://deno.land/x/pretty_benching@v0.3.3/mod.ts";
import {
  bench,
  runBenchmarks,
} from "https://deno.land/std@0.118.0/testing/bench.ts";

import * as JS_BSON from "https://cdn.skypack.dev/bson";
import * as LOCAL from "../deno_bson.js";
import * as LOCAL_TS from "../mod.ts";

const runs = 200;

const d = {
  name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  a: Math.random(),
  foo: [],
};

// 200 times
for (let i = 0; i < 200; i++) {
  d.foo.push({
    name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    title: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    a: [1, 45, 78, 45, 78, 23, 13, 545, 3, 45],
  });
}

bench({
  runs,
  name: "JS_BSON",
  func(b) {
    b.start();
    run(JS_BSON);
    b.stop();
  },
});

bench({
  runs,
  name: "LOCAL",
  func(b) {
    b.start();
    run(LOCAL);
    b.stop();
  },
});

bench({
  runs,
  name: "LOCAL_TS",
  func(b) {
    b.start();
    run(LOCAL_TS);
    b.stop();
  },
});

function run(Bson) {
  return (b) => {
    b.start();
    Bson.deserialize(Bson.serialize(d));
    b.stop();
  };
}

await runBenchmarks({ silent: true }).then(prettyBenchmarkResult());
