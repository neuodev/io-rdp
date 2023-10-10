import { expect } from "chai";
import Parser from "../src/parser";
import { ExpressionType } from "../src/types/expression";
import { BinaryOperatorType, BinaryOperatorValue } from "../src/types/token";

describe("Parser", () => {
  const parser = new Parser();
  it("should parse string to number", () => {
    const program = "42;";
    const ast = parser.parse(program);
    expect(ast.type).to.be.eq(ExpressionType.Program);
    expect(ast.value).to.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 42,
      },
    ]);
  });

  it("should parse strings wrapped in quotes", () => {
    const expectedNodes = [
      {
        type: ExpressionType.StringLiteral,
        value: "abc",
      },
    ];
    const emptyNodes = [
      {
        type: ExpressionType.StringLiteral,
        value: "",
      },
    ];
    expect(parser.parse(`"abc";`).value).to.deep.eq(expectedNodes);
    expect(parser.parse(`'abc';`).value).to.deep.eq(expectedNodes);
    expect(parser.parse("`abc`;").value).to.deep.eq(expectedNodes);
    expect(parser.parse(`"";`).value).to.deep.eq(emptyNodes);
    expect(parser.parse(`'';`).value).to.deep.eq(emptyNodes);
    expect(parser.parse("``;").value).to.deep.eq(emptyNodes);
  });

  it("should skip whitespaces", () => {
    expect(parser.parse("     2;").value).to.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 2,
      },
    ]);

    expect(parser.parse("     `foo`;    ").value).to.deep.eq([
      {
        type: ExpressionType.StringLiteral,
        value: "foo",
      },
    ]);
  });

  it("should keep whitespaces in string literal", () => {
    expect(parser.parse(`      "   foo   "     ;`).value).to.deep.eq([
      {
        type: ExpressionType.StringLiteral,
        value: "   foo   ",
      },
    ]);
  });

  it("should parse boolean literals", () => {
    expect(
      parser.parse(`
      true;
      false; 
    `).value
    ).to.deep.eq([
      {
        type: ExpressionType.BooleanLiteral,
        value: true,
      },
      {
        type: ExpressionType.BooleanLiteral,
        value: false,
      },
    ]);
  });

  it("should skip single line comments", () => {
    expect(
      parser.parse(`
      // comments
      42; 
      `).value
    ).to.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 42,
      },
    ]);
  });

  it("should skip multiline comments", () => {
    expect(
      parser.parse(`
      /**
       * Comment 
       */
      42;
      `).value
    ).to.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 42,
      },
    ]);

    expect(
      parser.parse(`
      /* Comment */
      42 ;
      `).value
    ).to.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 42,
      },
    ]);

    expect(
      parser.parse(`
      /**/
      42;
      `).value
    ).to.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 42,
      },
    ]);
  });

  it("should parse multiple statments", () => {
    expect(
      parser.parse(`
      24;
      "abc";
      'xyz';
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 24,
      },
      {
        type: ExpressionType.StringLiteral,
        value: "abc",
      },
      {
        type: ExpressionType.StringLiteral,
        value: "xyz",
      },
    ]);
  });

  it("should parse block statments", () => {
    expect(
      parser.parse(`
      24;
      {
        "abc";
      }
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 24,
      },
      {
        type: ExpressionType.Block,
        value: [
          {
            type: ExpressionType.StringLiteral,
            value: "abc",
          },
        ],
      },
    ]);

    expect(
      parser.parse(`
      {
        "xyz";
        "24";
      }
      {
        "abc";
      }
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.Block,
        value: [
          {
            type: ExpressionType.StringLiteral,
            value: "xyz",
          },
          {
            type: ExpressionType.StringLiteral,
            value: "24",
          },
        ],
      },
      {
        type: ExpressionType.Block,
        value: [
          {
            type: ExpressionType.StringLiteral,
            value: "abc",
          },
        ],
      },
    ]);
  });

  it("should parse simple functions with no parameters", () => {
    expect(
      parser.parse(`
      function parse() {
       42;
       "abc";
      }
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.Function,
        name: "parse",
        parameters: [],
        body: {
          type: ExpressionType.Block,
          value: [
            {
              type: ExpressionType.NumericLiteral,
              value: 42,
            },
            {
              type: ExpressionType.StringLiteral,
              value: "abc",
            },
          ],
        },
      },
    ]);
  });

  it("should parse function with parameters", () => {
    expect(
      parser.parse(`
      function parse(first_name, last_name) {
        42;
      }
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.Function,
        name: "parse",
        parameters: [
          {
            type: ExpressionType.Identifier,
            name: "first_name",
          },
          {
            type: ExpressionType.Identifier,
            name: "last_name",
          },
        ],
        body: {
          type: ExpressionType.Block,
          value: [
            {
              type: ExpressionType.NumericLiteral,
              value: 42,
            },
          ],
        },
      },
    ]);
  });

  it("should error if extra comma after the last parameter", () => {
    expect(() =>
      parser.parse(`
      function parse(first_name, last_name,) {
        42;
      }
    `)
    ).to.throws(`Unexpected token: "Comma", Expected: "ClosingParenthesis"`);

    expect(() =>
      parser.parse(`
      function parse(,last_name,) {
        42;
      }
    `)
    ).to.throws(`Unexpected token: "Comma", Expected: "Identifier"`);

    expect(() =>
      parser.parse(`
      function parse(last_name,,) {
        42;
      }
    `)
    ).to.throws(
      `Unexpected token: "CommaFollowedByClosingParenthesis", Expected: "Identifier"`
    );
  });
  it("should throw error for the function has no block", () => {
    expect(() =>
      parser.parse(`
      function parse(last_name) 
    `)
    ).to.throws(`Unexpected end of input, expected: OpeningBracket`);

    expect(() =>
      parser.parse(`
      function parse(last_name) }
    `)
    ).to.throws(
      `Unexpected token: "ClosingBracket", Expected: "OpeningBracket"`
    );

    expect(() =>
      parser.parse(`
      function parse(last_name) {


      
    `)
    ).to.throws(`Unexpected end of input, expected: ClosingBracket`);

    expect(() =>
      parser.parse(`
      function parse(last_name) {

        34;
        "abc";
      
    `)
    ).to.throws(`Unexpected end of input, expected: ClosingBracket`);
  });

  it("should parse binary expressions", () => {
    expect(
      parser.parse(`
      42; 
      "left" && "right";
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.NumericLiteral,
        value: 42,
      },
      {
        type: ExpressionType.BinaryExpression,
        operator: {
          type: ExpressionType.BinaryOperator,
          operatorType: BinaryOperatorType.AndOp,
          operatorValue: BinaryOperatorValue.AndOp,
        },
        left: {
          type: ExpressionType.StringLiteral,
          value: "left",
        },
        right: {
          type: ExpressionType.StringLiteral,
          value: "right",
        },
      },
    ]);

    expect(
      parser.parse(`
      "true" || 42;
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.BinaryExpression,
        operator: {
          type: ExpressionType.BinaryOperator,
          operatorType: BinaryOperatorType.OrOp,
          operatorValue: BinaryOperatorValue.OrOp,
        },
        left: {
          type: ExpressionType.StringLiteral,
          value: "true",
        },
        right: {
          type: ExpressionType.NumericLiteral,
          value: 42,
        },
      },
    ]);

    expect(
      parser.parse(`
      "42" == 42;
      "true" != true;
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.BinaryExpression,
        operator: {
          type: ExpressionType.BinaryOperator,
          operatorType: BinaryOperatorType.EqualOp,
          operatorValue: BinaryOperatorValue.EqualOp,
        },
        left: {
          type: ExpressionType.StringLiteral,
          value: "42",
        },
        right: {
          type: ExpressionType.NumericLiteral,
          value: 42,
        },
      },
      {
        type: ExpressionType.BinaryExpression,
        operator: {
          type: ExpressionType.BinaryOperator,
          operatorType: BinaryOperatorType.NotEqualOp,
          operatorValue: BinaryOperatorValue.NotEqualOp,
        },
        left: {
          type: ExpressionType.StringLiteral,
          value: "true",
        },
        right: {
          type: ExpressionType.BooleanLiteral,
          value: true,
        },
      },
    ]);

    expect(
      parser.parse(`
      "jone" || 42 && true;
    `).value
    ).to.be.deep.eq([
      {
        type: ExpressionType.BinaryExpression,
        operator: {
          type: ExpressionType.BinaryOperator,
          operatorType: BinaryOperatorType.OrOp,
          operatorValue: BinaryOperatorValue.OrOp,
        },
        left: {
          type: ExpressionType.StringLiteral,
          value: "jone",
        },
        right: {
          type: ExpressionType.BinaryExpression,
          operator: {
            type: ExpressionType.BinaryOperator,
            operatorType: BinaryOperatorType.AndOp,
            operatorValue: BinaryOperatorValue.AndOp,
          },
          right: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
          left: {
            type: ExpressionType.NumericLiteral,
            value: 42,
          },
        },
      },
    ]);
  });

  describe("VariableDeclaration", () => {
    it("shold parse simple variable declarations", () => {
      expect(
        parser.parse(
          `
          let firstName = "jone";
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.VariableDeclaration,
          id: { type: ExpressionType.Identifier, name: "firstName" },
          value: {
            type: ExpressionType.StringLiteral,
            value: "jone",
          },
        },
      ]);

      expect(
        parser.parse(
          `
          let isAwesome = true;
          let age = 30;
          let binary = true != false;
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.VariableDeclaration,
          id: { type: ExpressionType.Identifier, name: "isAwesome" },
          value: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
        },
        {
          type: ExpressionType.VariableDeclaration,
          id: { type: ExpressionType.Identifier, name: "age" },
          value: {
            type: ExpressionType.NumericLiteral,
            value: 30,
          },
        },
        {
          type: ExpressionType.VariableDeclaration,
          id: { type: ExpressionType.Identifier, name: "binary" },
          value: {
            type: ExpressionType.BinaryExpression,
            operator: {
              // todo: remove binary operator from the expression type
              type: ExpressionType.BinaryOperator,
              operatorType: BinaryOperatorType.NotEqualOp,
              operatorValue: BinaryOperatorValue.NotEqualOp,
            },
            left: {
              type: ExpressionType.BooleanLiteral,
              value: true,
            },
            right: {
              type: ExpressionType.BooleanLiteral,
              value: false,
            },
          },
        },
      ]);
    });

    it("should throw error for missing qual sign after var name", () => {
      expect(() =>
        parser.parse(
          `
            let name "jone";
          `
        )
      ).to.throw(`Unexpected token: "String", Expected: "AssignmentOperator"`);
    });
  });

  describe("IfStatement", () => {
    it("should parse single if statement with no body", () => {
      expect(
        parser.parse(
          `
          if (true) {}
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.IfStatement,
          test: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
          consequent: {
            type: ExpressionType.Block,
            value: [],
          },
          alternate: null,
        },
      ]);
    });

    it("should parse single if statement with body", () => {
      expect(
        parser.parse(
          `
          if ("true" != true) {
            let bar = "foo";
          }
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.IfStatement,
          test: {
            type: ExpressionType.BinaryExpression,
            operator: {
              type: ExpressionType.BinaryOperator,
              operatorType: BinaryOperatorType.NotEqualOp,
              operatorValue: BinaryOperatorValue.NotEqualOp,
            },
            left: {
              type: ExpressionType.StringLiteral,
              value: "true",
            },
            right: {
              type: ExpressionType.BooleanLiteral,
              value: true,
            },
          },
          consequent: {
            type: ExpressionType.Block,
            value: [
              {
                type: ExpressionType.VariableDeclaration,
                id: {
                  type: ExpressionType.Identifier,
                  name: "bar",
                },
                value: {
                  type: ExpressionType.StringLiteral,
                  value: "foo",
                },
              },
            ],
          },
          alternate: null,
        },
      ]);
    });

    it("should parse if statement with single 'else if' statement", () => {
      expect(
        parser.parse(
          `
          if (true) {}
          else if (false) {}
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.IfStatement,
          test: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
          consequent: {
            type: ExpressionType.Block,
            value: [],
          },
          alternate: {
            type: ExpressionType.IfStatement,
            test: {
              type: ExpressionType.BooleanLiteral,
              value: false,
            },
            consequent: {
              type: ExpressionType.Block,
              value: [],
            },
            alternate: null,
          },
        },
      ]);
    });

    it("should parse if statement with multiple 'else if' statements", () => {
      const elseif = {
        type: ExpressionType.IfStatement,
        test: {
          type: ExpressionType.BooleanLiteral,
          value: false,
        },
        consequent: {
          type: ExpressionType.Block,
          value: [],
        },
        alternate: null,
      };
      expect(
        parser.parse(
          `
          if (true) {}
          else if (false) {}
          else if (false) {}
          else if (false) {}
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.IfStatement,
          test: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
          consequent: {
            type: ExpressionType.Block,
            value: [],
          },
          alternate: {
            ...elseif,
            alternate: { ...elseif, alternate: { ...elseif } },
          },
        },
      ]);
    });

    it("should parse if statement with 'else' statement", () => {
      expect(
        parser.parse(
          `
          if (true) {}
          else {
            24;
          }
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.IfStatement,
          test: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
          consequent: {
            type: ExpressionType.Block,
            value: [],
          },
          alternate: {
            type: ExpressionType.Block,
            value: [
              {
                type: ExpressionType.NumericLiteral,
                value: 24,
              },
            ],
          },
        },
      ]);
    });

    it("should parse if statement with multiple 'else if' statements and single 'else' statemetn", () => {
      const elseif = {
        type: ExpressionType.IfStatement,
        test: {
          type: ExpressionType.BooleanLiteral,
          value: false,
        },
        consequent: {
          type: ExpressionType.Block,
          value: [],
        },
        alternate: null,
      };
      expect(
        parser.parse(
          `
          if (true) {}
          else if (false) {}
          else if (false) {}
          else if (false) {}
          else {}
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.IfStatement,
          test: {
            type: ExpressionType.BooleanLiteral,
            value: true,
          },
          consequent: {
            type: ExpressionType.Block,
            value: [],
          },
          alternate: {
            ...elseif,
            alternate: {
              ...elseif,
              alternate: {
                ...elseif,
                alternate: {
                  type: ExpressionType.Block,
                  value: [],
                },
              },
            },
          },
        },
      ]);
    });
  });

  describe("ForOfStatement", () => {
    it("should parse empty for of loop", () => {
      expect(
        parser.parse(
          `
        for (let name of names) {} 
        `
        ).value
      ).to.be.deep.eq([
        {
          type: ExpressionType.ForOfStatement,
          right: {
            type: ExpressionType.Identifier,
            name: "name",
          },
          left: {
            type: ExpressionType.Identifier,
            name: "names",
          },
          body: {
            type: ExpressionType.Block,
            value: [],
          },
        },
      ]);
    });
  });
});
