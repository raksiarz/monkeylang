import { Token } from "./tokenizer"

interface Node {
  tokenLiteral(): string
  string(): string
}

export interface Statement extends Node {
  statementNode(): any
}

export interface Expression extends Node {
  expressionNode(): any 
}

interface Program {
  statements: Statement[]
}

interface LetStmt {
  token: Token 
  name: Identifier
  value: Expression
}

interface ReturnStmt {
  token: Token
  returnValue: Expression
}

interface ExpressionStmt {
  token: Token
  expression: Expression | null
}

interface Identifier {
  token: Token
  value: string
}

interface IntegerLiteral {
  token: Token
  value: number
}

interface PrefixExpression {
  token: Token
  operator: string
  right: Expression | null
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
  value: Expression

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
  returnValue: Expression

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
