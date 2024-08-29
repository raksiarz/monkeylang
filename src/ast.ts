import { Token } from "./tokenizer"

export interface Node {
  tokenLiteral(): string
  string(): string
}

export interface Statement extends Node {
  statementNode(): any
}

export interface Expression extends Node {
  expressionNode(): any 
}

interface Program extends Node {
  statements: Statement[]
}

export interface LetStmt extends Statement {
  token: Token 
  name: Identifier
  value: Expression | null
}

interface ReturnStmt extends Statement {
  token: Token
  returnValue: Expression | null
}

interface ExpressionStmt extends Statement {
  token: Token
  expression: Expression | null
}

export interface Identifier extends Expression {
  token: Token
  value: string
}

export interface IntegerLiteral extends Expression {
  token: Token
  value: number
}

interface PrefixExpression extends Expression {
  token: Token
  operator: string
  right: Expression | null
}

interface InfixExpression extends Expression {
  token: Token
  left: Expression | null
  operator: string
  right: Expression | null
}

interface Boolean extends Expression {
  token: Token
  value: boolean
}

interface IfExpression extends Expression {
  token: Token
  condition: Expression | null
  consequence: BlockStatement
  alternative: BlockStatement
}

export interface BlockStatement extends Statement {
  token: Token
  statements: Statement[]
}

interface FunctionLiteral extends Expression{
  token: Token
  parameters: Identifier[]
  body: BlockStatement
}

interface CallExpression extends Expression {
  token: Token
  fn: Expression | null
  arguments: Expression[]
}

export class ProgramImpl implements Program {
  statements: Statement[]

  constructor(statements: Statement[] = []) {
    this.statements = statements
  }

  tokenLiteral = (): string => {
    if(this.statements.length > 0) {
      return this.statements[0].tokenLiteral()
    } else {
      return ""
    }
  }

  string(): string {
    let out = ''

    this.statements.forEach(stmt => {
      out += String(stmt)
    })

    return out
  }
}

export class LetStmtImpl implements LetStmt {
  token: Token 
  name: Identifier
  value: Expression | null

  constructor(token: Token) {
    this.token = token
  }

  statementNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out = `${this.tokenLiteral()} ${String(this.name)} = `

    if(this.value !== null) {
      out += String(this.value)
    }

    out += ';'

    return out
  }
}

export class ReturnStmtImpl implements ReturnStmt {
  token: Token 
  returnValue: Expression | null

  constructor(token: Token) {
    this.token = token
  }

  statementNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out = `${this.tokenLiteral()} `

    if(this.returnValue !== null) {
      out += String(this.returnValue)
    }

    out += ';'

    return out 
  } 
}

export class ExpressionStmtImpl implements ExpressionStmt {
  token: Token 
  expression: Expression | null

  constructor(token: Token) {
    this.token = token
  }

  statementNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    if(this.expression !== null) {
      return String(this.expression)
    }

    return ''
  }
}

export class IdentifierImpl implements Identifier {
  token: Token
  value: string

  constructor(token: Token, value: string = '') {
    this.token = token
    this.value = value
  }

  expressionNode() {}
  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    return this.value
  }
}

export class IntegerLiteralImpl implements IntegerLiteral {
  token: Token
  value: number

  constructor(token: Token) {
    this.token = token
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    return this.token.literal
  }
}

export class PrefixExpressionImpl implements PrefixExpression {
  token: Token
  operator: string
  right: Expression | null

  constructor(token: Token, operator: string) {
    this.token = token
    this.operator = operator
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out: string = ''

    out += '('
    out += String(this.operator)
    out += String(this.right?.string())
    out += ')'

    return out
  }
}

export class InfixExpressionImpl implements InfixExpression {
  token: Token
  left: Expression | null
  operator: string
  right: Expression | null

  constructor(token: Token, operator: string, left: Expression | null) {
    this.token = token
    this.operator = operator
    this.left = left
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    return `(${this.left?.string()} ${this.operator} ${this.right?.string()})`
  }
}

export class BooleanImpl implements Boolean {
  token: Token
  value: boolean

  constructor(token: Token, value: boolean) {
    this.token = token
    this.value = value
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    return this.token.literal
  }
}

export class IfExpressionImpl implements IfExpression {
  token: Token
  condition: Expression | null
  consequence: BlockStatement
  alternative: BlockStatement

  constructor(token: Token) {
    this.token = token
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out = `if ${String(this.condition)} ${String(this.consequence)}`

    if(this.alternative) {
      out += `else ${String(this.alternative)}`
    }

    return out
  }
}

export class BlockStatementImpl implements BlockStatement {
  token: Token
  statements: Statement[]

  constructor(token: Token) {
    this.token = token
  }

  statementNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out: string = ''

    for(let i = 0; i < this.statements.length; i++) {
      out += String(this.statements[i])
    }

    return out
  }
}

export class FunctionLiteralImpl implements FunctionLiteral {
  token: Token
  parameters: Identifier[]
  body: BlockStatement

  constructor(token: Token) {
    this.token = token
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out: string = ''

    const params: string[] = []

    for(let i = 0; i < this.parameters.length; i++) {
      params.push(String(this.parameters[i]))
    }

    out += `${this.tokenLiteral()}(${params.join(', ')}) ${String(this.body)}`

    return out
  }
}

export class CallExpressionImpl implements CallExpression {
  token: Token
  fn: Expression | null
  arguments: Expression[]

  constructor(token: Token, fn: Expression | null) {
    this.token = token
    this.fn = fn 
  }

  expressionNode() {}

  tokenLiteral(): string {
    return this.token.literal
  }

  string(): string {
    let out: string = ''

    const args: string[] = []

    for(let i = 0; i < this.arguments.length; i++) {
      args.push(String(this.arguments[i]))
    }

    out += `${String(this.fn)}(${this.arguments.join(', ')})`

    return out
  }
}


