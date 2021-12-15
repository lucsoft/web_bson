import { BSONError } from "./error.ts";

function alphabetize(str: string): string {
  return str.split("").sort().join("");
}

/**
 * A class representation of the BSON RegExp type.
 * @public
 */
export class BSONRegExp {
  pattern!: string;
  options!: string;
  /**
   * @param pattern - The regular expression pattern to match
   * @param options - The regular expression options
   */
  constructor(pattern: string, options?: string) {
    this.pattern = pattern;
    this.options = alphabetize(options ?? "");

    if (this.pattern.indexOf("\x00") !== -1) {
      throw new BSONError(
        `BSON Regex patterns cannot contain null bytes, found: ${
          JSON.stringify(this.pattern)
        }`,
      );
    }
    if (this.options.indexOf("\x00") !== -1) {
      throw new BSONError(
        `BSON Regex options cannot contain null bytes, found: ${
          JSON.stringify(this.options)
        }`,
      );
    }

    // Validate options
    for (let i = 0; i < this.options.length; i++) {
      if (
        !(
          this.options[i] === "i" ||
          this.options[i] === "m" ||
          this.options[i] === "x" ||
          this.options[i] === "l" ||
          this.options[i] === "s" ||
          this.options[i] === "u"
        )
      ) {
        throw new BSONError(
          `The regular expression option [${this.options[i]}] is not supported`,
        );
      }
    }
  }

  static parseOptions(options?: string): string {
    return options ? options.split("").sort().join("") : "";
  }

  [Symbol.for("Deno.customInspect")](): string {
    return `new BSONRegExp("${this.pattern}")`;
  }
}
