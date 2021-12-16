/** @internal */
export const BSON_INT32_MAX = 0x7fffffff;
/** @internal */
export const BSON_INT32_MIN = -0x80000000;

/**
 * Any integer up to 2^53 can be precisely represented by a double.
 * @internal
 */
export const JS_INT_MAX = 2 ** 53;

/**
 * Any integer down to -2^53 can be precisely represented by a double.
 * @internal
 */
export const JS_INT_MIN = -(2 ** 53);

export const enum BSONData {
  NUMBER = 1,
  STRING = 2,
  OBJECT = 3,
  ARRAY = 4,
  BINARY = 5,
  UNDEFINED = 6,
  OID = 7,
  BOOLEAN = 8,
  DATE = 9,
  NULL = 10,
  REGEXP = 11,
  DBPOINTER = 12,
  CODE = 13,
  SYMBOL = 14,
  CODE_W_SCOPE = 15,
  INT = 16,
  TIMESTAMP = 17,
  LONG = 18,
  DECIMAL128 = 19,
  MIN_KEY = 0xff,
  MAX_KEY = 0x7f,
}

/** Binary Default Type @internal */
export const BSON_BINARY_SUBTYPE_DEFAULT = 0;
