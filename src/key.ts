/**
 * A class representation of the BSON MaxKey type.
 * @public
 */
export class MaxKey {
  [Symbol.for("Deno.customInspect")](): string {
    return "MaxKey()";
  }
}

/**
 * A class representation of the BSON MinKey type.
 * @public
 */
export class MinKey {
  [Symbol.for("Deno.customInspect")](): string {
    return "MinKey()";
  }
}
