import { Quote, Token, TokenType } from "./types/token";

/**
 * Tokenizer Spec.
 */

const TokenizerSpec: Array<[RegExp, TokenType | null]> = [
  // Whitespaces
  [/^\s+/, null],
  // Single line comments
  [/^\/\/.*\n/, null],
  // Muliline comments
  [/^\/\*[^\/]*\*\//, null],
  // Semicolon ';'
  [/^;/, TokenType.Semicolon],
  // Opening bracket '{'
  [/^{/, TokenType.OpeningBracket],
  // Closing bracket '}'
  [/^}/, TokenType.ClosingBracket],
  //! TEMP
  [/^\,\)/, TokenType.CommaFollowedByClosingParenthesis],
  // Comma ','
  [/^\,/, TokenType.Comma],
  // Opening parenthesis '('
  [/^\(/, TokenType.OpeningParenthesis],
  // Closing parenthesis '('
  [/^\)/, TokenType.ClosingParenthesis],
  // Binary operator (&&, ||, ==, !=)
  [/^(&&|\|\||==|\!=)/, TokenType.BinaryOperator],
  // Assignment operator (=)
  [/^=/, TokenType.AssignmentOperator],
  // Function keyword
  [/^function/, TokenType.FunctionKeyword],
  // Boolean literal
  [/^(true|false)/, TokenType.Boolean],
  // Let keyword
  [/^let/, TokenType.LetKeyword],
  // If keyword
  [/^if/, TokenType.IfKeyword],
  // Else keyword
  [/^else/, TokenType.ElseKeyword],
  // Of Keyword
  [/^of/, TokenType.OfKeyword],
  // For keyword
  [/^for/, TokenType.ForKeyword],
  // Numbers
  [/^\d+/, TokenType.Number],
  // Strings: Double, Single, and backticks
  [/^("[^"]*")|('[^']*')|(`[^`]*`)/, TokenType.String],
  // Identifier (functions, vars, parameters)
  [/^[^(\d|\n`)]\w+/, TokenType.Identifier],
];

export default class Tokenizer {
  private cursor: number = 0;
  private src: string = "";

  init(src: string) {
    this.src = src;
    this.cursor = 0;
  }

  hasMoreTokens(): boolean {
    return this.cursor < this.src.length;
  }

  isEof() {
    return this.cursor === this.src.length;
  }

  getNextToken(): Token | null {
    if (!this.hasMoreTokens()) return null;

    const src = this.src.slice(this.cursor);

    for (let [expr, tokenType] of TokenizerSpec) {
      const matched = expr.exec(src);
      if (matched !== null) {
        const value = matched[0];
        this.cursor += value.length;

        console.debug({ expr, tokenType, value });
        // Should skip token, e.g. whitespaces
        if (tokenType === null) return this.getNextToken();

        return {
          type: tokenType,
          value,
        };
      }
    }

    throw new Error(`Unexpected token: ${src[0]}`);
  }

  isStartOfString(src: string): [boolean, Quote | null] {
    let start = src[0];
    const qoutes = [Quote.Double, Quote.Single, Quote.Backticks];

    for (let quote of qoutes) {
      if (start === quote) return [true, quote];
    }

    return [false, null];
  }
}
