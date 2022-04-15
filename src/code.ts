// deno-lint-ignore-file ban-types
import type { Document } from "./bson.ts";
export interface CodeExtended {
  $code: string | Function;
  $scope?: Document;
}

/**
 * A class representation of the BSON Code type.
 * @public
 */
export class Code {
  code!: string | Function;
  scope?: Document;
  /**
   * @param code - a string or function.
   * @param scope - an optional scope for the function.
   */
  constructor(code: string | Function, scope?: Document) {
    this.code = code;
    this.scope = scope;
  }

  toJSON(): { code: string | Function; scope?: Document } {
    return { code: this.code, scope: this.scope };
  }

  /** @deprecated */
  toExtendedJSON(): CodeExtended {
    if (this.scope) {
      return { $code: this.code, $scope: this.scope };
    }

    return { $code: this.code };
  }

  /** @deprecated */
  static fromExtendedJSON(doc: CodeExtended): Code {
    return new Code(doc.$code, doc.$scope);
  }

  [Symbol.for("Deno.customInspect")](): string {
    const codeJson = this.toJSON();
    return `new Code("${codeJson.code}"${
      codeJson.scope ? `, ${JSON.stringify(codeJson.scope)}` : ""
    })`;
  }
}
