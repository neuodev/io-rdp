import { BinaryOperatorType, BinaryOperatorValue } from "./token";

export type MakeExpr<T extends ExpressionType, V = string> = {
  type: T;
  value: V;
};

export enum ExpressionType {
  Program = "Program",
  NumericLiteral = "NumericLiteral",
  StringLiteral = "StringLiteral",
  Function = "Function",
  Block = "Block",
  BooleanLiteral = "BooleanLiteral",
  BinaryExpression = "BinaryExpression",
  BinaryOperator = "BinaryOperator",
  VariableDeclaration = "VariableDeclaration",
  IfStatement = "IfStatement",
  ForOfStatement = "ForOfStatement",
  Identifier = "Identifier",
}

export type Program = MakeExpr<ExpressionType.Program, StatementList>;
export type LiteralExpression =
  | NumericLiteral
  | StringLiteral
  | BooleanLiteral
  | Identifier;
export type NumericLiteral = MakeExpr<ExpressionType.NumericLiteral, number>;
export type StringLiteral = MakeExpr<ExpressionType.StringLiteral, string>;
export type BooleanLiteral = MakeExpr<ExpressionType.BooleanLiteral, boolean>;
export type ParametersExpression = Identifier[];
export type BlockStatement = MakeExpr<ExpressionType.Block, StatementList>;
export type BinaryOperator = {
  type: ExpressionType.BinaryOperator;
  operatorType: BinaryOperatorType;
  operatorValue: BinaryOperatorValue;
};
export type BinaryExpression = {
  type: ExpressionType.BinaryExpression;
  operator: BinaryOperator;
  right: Expression;
  left: Expression;
};
export type VariableDeclaration = {
  type: ExpressionType.VariableDeclaration;
  id: Identifier;
  value: Expression;
};
export type Expression =
  | LiteralExpression
  | BinaryExpression
  | VariableDeclaration;

export type IfStatement = {
  type: ExpressionType.IfStatement;
  test: Expression;
  consequent: BlockStatement;
  alternate: IfStatement | BlockStatement | null;
};

export type Identifier = {
  type: ExpressionType.Identifier;
  name: string;
};

export type ForOfStatement = {
  type: ExpressionType.ForOfStatement;
  right: Identifier;
  left: Identifier;
  body: BlockStatement;
};

export type ExpressionStatement = Expression;
export type FunctionStatement = {
  type: ExpressionType.Function;
  name: string;
  parameters: ParametersExpression;
  body: BlockStatement;
};
export type Statement =
  | ExpressionStatement
  | BlockStatement
  | FunctionStatement
  | IfStatement
  | ForOfStatement;
export type StatementList = Statement[];
