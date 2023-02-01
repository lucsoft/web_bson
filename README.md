# web_bson

web_bson builds opon [js-bson](https://github.com/mongodb/js-bson/). Bson is
short for "Binary JSON" and is the binary-encoded serialization of JSON-like
documents. You can learn more about it in
[the specification](http://bsonspec.org).

### Deno & Web

A simple example of how to use web_bson:

```js
import { deserialize, Long, serialize } from "https://deno.land/x/web_bson";

// Serialize a document
const doc = { long: Long.fromNumber(100) };
const data = serialize(doc);
console.log("data:", data);

// Deserialize the resulting Buffer
const doc_2 = deserialize(data);
console.log("doc_2:", doc_2);
```

## Documentation

The Documentation can be found under
[doc.deno.land](https://doc.deno.land/https://deno.land/x/web_bson/mod.ts)
