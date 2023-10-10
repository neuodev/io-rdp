import Tokenizer from "./tokenizer";
import {
  Expression,
  LiteralExpression,
  ExpressionType,
  NumericLiteral,
  Program,
  Statement,
  StringLiteral,
  StatementList,
  BlockStatement,
  FunctionStatement,
  ParametersExpression,
  BooleanLiteral,
  BinaryExpression,
  BinaryOperator,
  VariableDeclaration,
  IfStatement,
  ForOfStatement,
  Identifier,
} from "./types/expression";
import {
  BinaryOperatorType,
  BinaryOperatorValue,
  Token,
  TokenType,
} from "./types/token";

// AST ref: https://astexplorer.net/

/**
 * IO Parser: recursive descent parser
 */
export default class Parser {
  private src: string | null;
  private tokenizer: Tokenizer;
  private lookahead: Token | null;

  constructor() {
    this.src = null;
    this.lookahead = null;
    this.tokenizer = new Tokenizer();
  }

  /**
   * Parse string into AST
   */
  parse(src: string) {
    this.src = src;
    this.tokenizer.init(this.src);
    this.lookahead = this.tokenizer.getNextToken();

    return this.program();
  }

  /**
   * ```
   * Program
   *    : StatementList
   *    ;
   * ```
   */
  program(): Program {
    return { type: ExpressionType.Program, value: this.statmentList() };
  }

  /**
   * ```
   * StatementList
   *    : Statement
   *    | StatementList Statement -> Statement Statement Statement ...
   *    ;
   * ```
   */
  statmentList(stopAt?: TokenType): StatementList {
    const statements: StatementList = [this.statement()];

    while (this.lookahead !== null && !this.isNextToken(stopAt)) {
      statements.push(this.statement());
    }

    return statements;
  }

  /**
   * ```
   * Statement
   *    : ExpressionStatement
   *    | BlockStatement
   *    | FunctionStatement
   *    | IfStatemetn
   *    | ForOfStatement
   *    ;
   * ```
   */
  statement(): Statement {
    if (this.isNextToken(TokenType.OpeningBracket))
      return this.blockStatement();

    if (this.isNextToken(TokenType.ForKeyword)) return this.forOfStatement();

    if (this.isNextToken(TokenType.IfKeyword)) return this.ifStatement();

    if (this.isNextToken(TokenType.FunctionKeyword))
      return this.functionStatement();

    return this.expressionStatement();
  }

  /**
   * ```
   * BlockStatement
   *    : '{' StatementList '}'
   *    ;
   * ```
   */

  blockStatement(): BlockStatement {
    this.eat(TokenType.OpeningBracket);
    const statements =
      !this.isNextToken(TokenType.ClosingBracket) && !this.tokenizer.isEof()
        ? this.statmentList(TokenType.ClosingBracket)
        : [];

    this.eat(TokenType.ClosingBracket);
    return { type: ExpressionType.Block, value: statements };
  }

  /**
   * ```
   * ExpressionStatement
   *    : Expression + ';'
   *    ;
   * ```
   */
  expressionStatement(): Expression {
    const expression = this.expression();
    this.eat(TokenType.Semicolon);
    return expression;
  }

  /**
   * ```
   * FunctionStatement
   *    : function name (Parameters) BlockStatement
   * ```
   */
  functionStatement(): FunctionStatement {
    this.eat(TokenType.FunctionKeyword);
    const name = this.eat(TokenType.Identifier);
    const parameters = this.parameters();
    const body = this.blockStatement();
    return {
      type: ExpressionType.Function,
      name: name.value,
      parameters,
      body,
    };
  }

  /**
   * ```
   * ParametersExpression
   *    : '(' param, param, ... ')'
   * ```
   */
  parameters(): ParametersExpression {
    this.eat(TokenType.OpeningParenthesis);
    const parameters: ParametersExpression = [];

    while (!this.isNextToken(TokenType.ClosingParenthesis)) {
      parameters.push(this.identifier());

      if (this.isNextToken(TokenType.CommaFollowedByClosingParenthesis))
        throw new Error(
          `Unexpected token: "${TokenType.Comma}", Expected: "${TokenType.ClosingParenthesis}"`
        );

      if (!this.isNextToken(TokenType.ClosingParenthesis))
        this.eat(TokenType.Comma);
    }

    this.eat(TokenType.ClosingParenthesis);

    return parameters;
  }

  /**
   * ```
   * IfStatement
   *    : 'if' '(' Expression ')' BlockStatement 'else' OptIfStatement
   *    ;
   *
   * ```
   */
  private ifStatement(): IfStatement {
    this.eat(TokenType.IfKeyword);
    this.eat(TokenType.OpeningParenthesis);
    const test = this.expression();
    this.eat(TokenType.ClosingParenthesis);
    const consequent = this.blockStatement();
    let alternate: IfStatement | BlockStatement | null = null;
    if (this.isNextToken(TokenType.ElseKeyword)) {
      this.eat(TokenType.ElseKeyword);

      if (this.isNextToken(TokenType.IfKeyword)) alternate = this.ifStatement();
      else alternate = this.blockStatement();
    }

    return {
      type: ExpressionType.IfStatement,
      test,
      consequent,
      alternate,
    };
  }

  /**
   * ```
   * ForOfStatement
   *    : 'for' '(' 'let' Identifier 'of' Identifier ')' BlockStatement
   * ```
   */
  forOfStatement(): ForOfStatement {
    this.eat(TokenType.ForKeyword);
    this.eat(TokenType.OpeningParenthesis);
    this.eat(TokenType.LetKeyword);
    const right = this.identifier();
    this.eat(TokenType.OfKeyword);
    const left = this.identifier();
    this.eat(TokenType.ClosingParenthesis);
    const body = this.blockStatement();

    return {
      type: ExpressionType.ForOfStatement,
      right,
      left,
      body,
    };
  }

  /**
   * ```
   * Expression
   *    : LiteralExpression
   *    | BinaryExpression
   *    | VariableDeclarationExpression
   *    ;
   * ```
   */
  expression(): Expression {
    if (this.isNextToken(TokenType.LetKeyword))
      return this.variableDeclaration();

    const literal = this.literal();

    if (this.isNextToken(TokenType.BinaryOperator))
      return this.binaryExpression(literal);

    return literal;
  }

  /**
   * VariableDeclarationExpression
   *    : 'let' Identifier '=' Expression
   *    ;
   */
  variableDeclaration(): VariableDeclaration {
    this.eat(TokenType.LetKeyword);
    const id = this.identifier();
    this.eat(TokenType.AssignmentOperator);
    const expression = this.expression();
    return {
      type: ExpressionType.VariableDeclaration,
      id,
      value: expression,
    };
  }

  /**
   * ```
   * BinaryExpression
   *    : Expression (BinaryOperator) Expression
   *    ;
   * ```
   */
  binaryExpression(left: LiteralExpression): BinaryExpression {
    const operator = this.binaryOperator();
    const right = this.expression();

    return {
      type: ExpressionType.BinaryExpression,
      operator,
      right,
      left,
    };
  }

  binaryOperator(): BinaryOperator {
    const token = this.eat(TokenType.BinaryOperator);

    let type: BinaryOperatorType | null = null;
    let value: BinaryOperatorValue | null = null;

    if (token.value === BinaryOperatorValue.AndOp) {
      type = BinaryOperatorType.AndOp;
      value = BinaryOperatorValue.AndOp;
    }

    if (token.value === BinaryOperatorValue.OrOp) {
      type = BinaryOperatorType.OrOp;
      value = BinaryOperatorValue.OrOp;
    }

    if (token.value === BinaryOperatorValue.EqualOp) {
      type = BinaryOperatorType.EqualOp;
      value = BinaryOperatorValue.EqualOp;
    }

    if (token.value === BinaryOperatorValue.NotEqualOp) {
      type = BinaryOperatorType.NotEqualOp;
      value = BinaryOperatorValue.NotEqualOp;
    }

    if (!type || !value) {
      throw new Error(`Unexpected operator: ${token.value}`);
    }

    return {
      type: ExpressionType.BinaryOperator,
      operatorType: type,
      operatorValue: value,
    };
  }

  /**
   * ```
   * Literal
   *    : NumericLiteral
   *    | StringLiteral
   *    | BooleanLiteral
   *    | Identifier
   *    ;
   * ```
   */
  literal(): LiteralExpression {
    if (this.isNextToken(TokenType.Number)) return this.numericLiteral();
    if (this.isNextToken(TokenType.String)) return this.stringLiteral();
    if (this.isNextToken(TokenType.Boolean)) return this.booleanLiteral();
    if (this.isNextToken(TokenType.Identifier)) return this.identifier();

    console.log(this.lookahead);
    throw new Error("Literal: unexpected literal production");
  }

  /**
   * ```
   * NumericLiteral
   *    : Number (from the tokenizer)
   *    ;
   * ```
   */
  numericLiteral(): NumericLiteral {
    const token = this.eat(TokenType.Number);
    return {
      type: ExpressionType.NumericLiteral,
      value: Number(token.value),
    };
  }
  /**
   * ```
   * StringLiteral
   *    : Sring
   *    ;
   * ```
   */
  stringLiteral(): StringLiteral {
    const token = this.eat(TokenType.String);
    return {
      type: ExpressionType.StringLiteral,
      value: token.value.slice(1, -1),
    };
  }

  /**
   * ```
   * BooleanLiteral
   *    : "true"
   *    | "false"
   *    ;
   * ```
   */
  booleanLiteral(): BooleanLiteral {
    const token = this.eat(TokenType.Boolean);
    return {
      type: ExpressionType.BooleanLiteral,
      value: token.value === "true",
    };
  }

  /**
   * ```
   *  Identifier
   *    : TokenType.Identifier
   *    ;
   * ```
   */
  identifier(): Identifier {
    const token = this.eat(TokenType.Identifier);
    return {
      type: ExpressionType.Identifier,
      name: token.value,
    };
  }

  private eat(tokenType: TokenType): Token {
    const token = this.lookahead;
    if (!token)
      throw new Error(`Unexpected end of input, expected: ${tokenType}`);

    // todo: add multiple error types "new SyntaxError"
    if (token.type !== tokenType)
      throw new Error(
        `Unexpected token: "${token.type}", Expected: "${tokenType}"`
      );

    // Advance to the next token
    this.lookahead = this.tokenizer.getNextToken();

    return token;
  }

  private isNextToken(tokenType?: TokenType): boolean {
    return this.lookahead?.type === tokenType;
  }

  private isLiteral(): boolean {
    return (
      this.isNextToken(TokenType.String) ||
      this.isNextToken(TokenType.Number) ||
      this.isNextToken(TokenType.Boolean)
    );
  }
}
