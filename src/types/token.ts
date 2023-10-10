export enum BinaryOperatorType {
  AndOp = "AndOp",
  OrOp = "OrOp",
  EqualOp = "EqualOp",
  NotEqualOp = "NotEqualOp",
}

export enum BinaryOperatorValue {
  AndOp = "&&",
  OrOp = "||",
  EqualOp = "==",
  NotEqualOp = "!=",
}

export enum TokenType {
  Number = "Number",
  String = "String",
  Boolean = "Boolean",
  Semicolon = "Semicolon",
  OpeningBracket = "OpeningBracket",
  ClosingBracket = "ClosingBracket",
  FunctionKeyword = "FunctionKeyword",
  FunctionName = "FunctionName",
  OpeningParenthesis = "OpeningParenthesis",
  ClosingParenthesis = "ClosingParenthesis",
  Identifier = "Identifier",
  Comma = "Comma",

  BinaryOperator = "BinaryOperator",
  LetKeyword = "LetKeyword",
  AssignmentOperator = "AssignmentOperator",
  IfKeyword = "Ifkeyword",
  ElseKeyword = "ElseKeyword",
  OfKeyword = "OfKeyword",
  ForKeyword = "ForKeyword",

  //! TEMP
  CommaFollowedByClosingParenthesis = "CommaFollowedByClosingParenthesis",
}

export type Token = {
  type: TokenType;
  value: string;
};

export enum Quote {
  Double = `"`,
  Single = `'`,
  Backticks = "`",
}
