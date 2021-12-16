import {
  validate as uuidStringValidate,
} from "https://deno.land/std@0.117.0/uuid/v4.ts";
import { assert, assertEquals, assertThrows } from "../deps.ts";
import { Binary, BinarySizes, BSONTypeError, UUID } from "../src/bson.ts";
import { decodeHexString } from "../utils.ts";

// const UUIDv4 =
//   /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

// Test values
const UPPERCASE_DASH_SEPARATED_UUID_STRING =
  "AAAAAAAA-AAAA-4AAA-AAAA-AAAAAAAAAAAA";
const UPPERCASE_VALUES_ONLY_UUID_STRING = "AAAAAAAAAAAA4AAAAAAAAAAAAAAAAAAA";
const LOWERCASE_DASH_SEPARATED_UUID_STRING =
  "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const LOWERCASE_VALUES_ONLY_UUID_STRING = "aaaaaaaaaaaa4aaaaaaaaaaaaaaaaaaa";

function uuidStringVersion(uuid: string) {
  if (!uuidStringValidate(uuid)) {
    throw TypeError("Invalid UUID");
  }

  return parseInt(uuid.substr(14, 1), 16);
}

Deno.test("[UUID] should correctly generate a valid UUID v4 from empty constructor", () => {
  const uuid = new UUID();
  const uuidHexStr = uuid.toHexString();
  assert(uuidStringValidate(uuidHexStr));
  assertEquals(uuidStringVersion(uuidHexStr), BinarySizes.SUBTYPE_UUID);
});

Deno.test("[UUID] should correctly create UUIDs from UPPERCASE & lowercase 36 char dash-separated hex string", () => {
  const uuid1 = new UUID(UPPERCASE_DASH_SEPARATED_UUID_STRING);
  assert(uuid1.equals(UPPERCASE_DASH_SEPARATED_UUID_STRING));
  assertEquals(uuid1.toString(), LOWERCASE_DASH_SEPARATED_UUID_STRING);

  const uuid2 = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  assert(uuid2.equals(LOWERCASE_DASH_SEPARATED_UUID_STRING));
  assertEquals(uuid2.toString(), LOWERCASE_DASH_SEPARATED_UUID_STRING);
});

Deno.test("[UUID] should correctly create UUIDs from UPPERCASE & lowercase 32 char hex string (no dash separators)", () => {
  const uuid1 = new UUID(UPPERCASE_VALUES_ONLY_UUID_STRING);
  assert(uuid1.equals(UPPERCASE_VALUES_ONLY_UUID_STRING));
  assertEquals(uuid1.toHexString(false), LOWERCASE_VALUES_ONLY_UUID_STRING);

  const uuid2 = new UUID(LOWERCASE_VALUES_ONLY_UUID_STRING);
  assert(uuid2.equals(LOWERCASE_VALUES_ONLY_UUID_STRING));
  assertEquals(uuid2.toHexString(false), LOWERCASE_VALUES_ONLY_UUID_STRING);
});

Deno.test("[UUID] should correctly create UUID from Buffer", () => {
  const uuid1 = new UUID(
    decodeHexString(UPPERCASE_VALUES_ONLY_UUID_STRING),
  );
  assert(uuid1.equals(UPPERCASE_DASH_SEPARATED_UUID_STRING));
  assertEquals(uuid1.toString(), LOWERCASE_DASH_SEPARATED_UUID_STRING);

  const uuid2 = new UUID(
    decodeHexString(LOWERCASE_VALUES_ONLY_UUID_STRING),
  );
  assert(uuid2.equals(LOWERCASE_DASH_SEPARATED_UUID_STRING));
  assertEquals(uuid2.toString(), LOWERCASE_DASH_SEPARATED_UUID_STRING);
});

// ignored by upstream
Deno.test("[UUID] should correctly create UUID from UUID (copying existing buffer)", () => {
  const org = new UUID();
  const copy = new UUID(org);
  // assertNotEquals(org.id, copy.id);
  assertEquals(org.id, copy.id);
});

Deno.test("[UUID] should throw if passed invalid 36-char uuid hex string", () => {
  new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  assertThrows(
    () => new UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    BSONTypeError,
  );
  // Note: The version is missing here ^
});

Deno.test("[UUID] should throw if passed unsupported argument", () => {
  new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  assertThrows(() => new UUID({} as UUID), BSONTypeError);
});

Deno.test("[UUID] should correctly check if a buffer isValid", () => {
  const validBuffer = decodeHexString(UPPERCASE_VALUES_ONLY_UUID_STRING);
  const invalidBuffer1 = decodeHexString("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  const invalidBuffer2 = new Uint8Array(16);

  assertEquals(validBuffer.length, invalidBuffer1.length);
  assertEquals(validBuffer.length, invalidBuffer2.length);
  assert(!UUID.isValid(invalidBuffer1));
  assert(!UUID.isValid(invalidBuffer2));
  assert(UUID.isValid(validBuffer));
});

Deno.test("[UUID] should correctly convert to and from a Binary instance", () => {
  const uuid = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  assert(UUID.isValid(uuid));

  const bin = uuid.toBinary();
  assert(bin instanceof Binary);

  const uuid2 = bin.toUUID();
  assertEquals(uuid2.toHexString(), LOWERCASE_DASH_SEPARATED_UUID_STRING);
});

Deno.test("[UUID] should correctly convert to and from a Binary instance", () => {
  const uuid = new UUID(LOWERCASE_DASH_SEPARATED_UUID_STRING);
  assert(UUID.isValid(uuid));

  const bin = uuid.toBinary();
  assert(bin instanceof Binary);

  const uuid2 = bin.toUUID();
  assert(uuid.equals(uuid2));
});

Deno.test("[UUID] should throw when converted from an incompatible Binary instance", () => {
  const validRandomBuffer = new TextEncoder().encode("Hello World!");
  const binRand = new Binary(validRandomBuffer);

  assertThrows(() => binRand.toUUID());

  const validUuidV4String = "bd2d74fe-bad8-430c-aeac-b01d073a1eb6";
  const validUuidV4Buffer = decodeHexString(
    validUuidV4String.replace(/-/g, ""),
  );
  const binV4 = new Binary(validUuidV4Buffer, BinarySizes.SUBTYPE_UUID);
  binV4.toUUID();
});

Deno.test("[UUID] should correctly allow for node.js inspect to work with UUID", () => {
  const uuid = new UUID(UPPERCASE_DASH_SEPARATED_UUID_STRING);
  assertEquals(
    Deno.inspect(uuid),
    `new UUID("${LOWERCASE_DASH_SEPARATED_UUID_STRING}")`,
  );
});
