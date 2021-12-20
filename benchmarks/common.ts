import * as stable from "https://deno.land/x/web_bson/mod.ts";
import * as upstream from "https://cdn.skypack.dev/bson";
import * as local from "../mod.ts";
export {
  bench,
  type BenchmarkTimer,
  prettyBenchmarkProgress,
  runBenchmarks,
} from "../test_deps.ts";

export type BsonModule = typeof stable | typeof upstream | typeof local;

export { local, stable, upstream };
