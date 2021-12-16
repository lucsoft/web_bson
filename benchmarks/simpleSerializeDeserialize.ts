// deno-lint-ignore-file no-explicit-any
// deno-lint-ignore-file
const deno_bson = await import(
  "https://raw.githubusercontent.com/lucsoft/deno_bson/master/mod.ts"
);
const jsBson = await import(
  "https://cdn.skypack.dev/pin/bson@v4.5.4-F38JF4sWndM08oQ5WCDI/mode=imports/optimized/bson.js"
);
const localBson = await import("../mod.ts");
import {
  bench,
  BenchmarkTimer,
  prettyBenchmarkProgress,
  runBenchmarks,
} from "../test_deps.ts";
const runs = 2000;

function BenchCode(timer: BenchmarkTimer, Bson: any) {
  timer.start();
  const d = {
    _id: new Bson.ObjectId(),
    name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    a: Math.random(),
    foo: [] as any[],
  };

  /// 1k times
  for (let j = 0; j < 300; j++) {
    d.foo.push({
      bar: new Bson.ObjectId(),
      name: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      title: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
      a: [1, 45, , 78, 45, 78, 23, 13, 545, 3, 45],
    });
  }

  const b = Bson.serialize(d);
  Bson.deserialize(b);
  timer.stop();
}

bench({ runs, name: "master", func: (b) => BenchCode(b, deno_bson) });
bench({ runs, name: "js-bson", func: (b) => BenchCode(b, jsBson) });
bench({ runs, name: "local", func: (b) => BenchCode(b, localBson) });
runBenchmarks({ silent: true, skip: /_long/ }, prettyBenchmarkProgress());
