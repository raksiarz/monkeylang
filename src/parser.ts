import LexerImpl, { Token, TokenType } from "./tokenizer"
import { IdentifierImpl, LetStmtImpl, ProgramImpl, ReturnStmtImpl, Statement, Expression, ExpressionStmtImpl, IntegerLiteralImpl, PrefixExpressionImpl } from "./ast"
import { LOWEST, EQUALS, LESSGREATER, SUM, PRODUCT, PREFIX, CALL } from './parser_constants'

interface Parser {
  l: LexerImpl
  currToken: Token
  peekToken: Token
  errors: string[]
  prefixParseFns: Map<TokenType, PrefixParseFn>
  infixParseFns: Map<TokenType, InfixParseFn>
}

type PrefixParseFn = () => Expression | null
type InfixParseFn = (expr: Expression) => Expression

class ParserImpl implements Parser {
  l: LexerImpl
  currToken: Token
  peekToken: Token
  program: ProgramImpl
  errors: string[]
  prefixParseFns: Map<string, PrefixParseFn>
  infixParseFns: Map<string, InfixParseFn>

  constructor(l: LexerImpl) {
    this.l = l
    this.errors = []

    this.nextToken()
    this.nextToken()

    this.prefixParseFns = new Map<string, PrefixParseFn>()
    this.registerPrefix("", this.parseIdentifier.bind(this))
    this.registerPrefix("INT", this.parseIntegerLiteral.bind(this))

    this.infixParseFns = new Map<string, InfixParseFn>()
    this.registerPrefix("!", this.parsePrefixExpression.bind(this))
    this.registerPrefix("-", this.parsePrefixExpression.bind(this))
  }

  nextToken() {
    this.currToken = this.peekToken
    this.peekToken = this.l.nextToken()
  }

  parseProgram(): ProgramImpl {
    this.program = new ProgramImpl()

    while(this.currToken.type !== "EOF") {
      const stmt = this.parseStatement()

      if(stmt !== null) {
        this.program.statements.push(stmt as unknown as Statement)
      }

      this.nextToken()
    }
    
    return this.program
  }

  parseStatement() {
    switch(this.currToken.type) {
      case "LET": 
        return this.parseLetStatement()
      case "RETURN":
        return this.parseReturnStatement()
      default:
        return this.parseExpressionStatement() 
    }
  }

  parseLetStatement() {
    const stmt = new LetStmtImpl(this.currToken)

    if(!this.expectPeek("")) {
      return null
    }

    stmt.name = new IdentifierImpl(this.currToken, this.currToken.literal)

    if(!this.expectPeek("=")) {
      return null
    }

    while(!this.currTokenIs(";")) {
      this.nextToken()
    }

    return stmt
  }

  parseReturnStatement() {
    const stmt = new ReturnStmtImpl(this.currToken)

    this.nextToken()

    while(!this.currTokenIs(";")) {
      this.nextToken()
    }

    return stmt
  }

  parseExpressionStatement() {
    const stmt = new ExpressionStmtImpl(this.currToken)

    stmt.expression = this.parseExpression(LOWEST)

    if(this.peekTokenIs(";")) {
      this.nextToken()
    }

    return stmt
  }

  parseExpression(precedence: number): Expression | null {
    const prefix = this.prefixParseFns.get(this.currToken.type)

    if(!prefix) {
      this.noPrefixParseFnError(this.currToken.type)
      return null 
    }

    const leftExp = prefix()

    return leftExp
  }

  parseIntegerLiteral(): Expression | null {
    console.log('parse literal: ', this.currToken);
    const lit = new IntegerLiteralImpl(this.currToken)

    const value = parseInt(this.currToken.literal)

    if(isNaN(value)) {
      const msg = `could not parse ${this.currToken.literal} as integer`
      this.errors.push(msg)
      return null
    }

    lit.value = value

    return lit
  }

  parseIdentifier(): Expression {
    return new IdentifierImpl(this.currToken, this.currToken.literal)
  }

  parsePrefixExpression(): Expression {
    const expression = new PrefixExpressionImpl(this.currToken, this.currToken.literal)

    this.nextToken()

    expression.right = this.parseExpression(PREFIX)

    return expression
  }

  currTokenIs(t: TokenType): boolean {
    return this.currToken.type === t
  }

  peekTokenIs(t: TokenType): boolean {
    return this.peekToken.type === t
  }

  expectPeek(t: TokenType): boolean {
    if(this.peekTokenIs(t)) {
      this.nextToken()
      return true
    } else {
      this.peekError(t)
      return false
    }
  }

  peekError(t: TokenType) {
    const msg = `expected next token to be ${t}, got ${this.peekToken.type} instead`
    this.errors.push(msg)
  }

  registerPrefix(tokenType: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns.set(tokenType, fn)
  }
  
  registerInfix(tokenType: TokenType, fn: InfixParseFn) {
    this.infixParseFns.set(tokenType, fn)
  }

  noPrefixParseFnError(t: TokenType) {
    const msg = `no prefix parse fundtion for ${t} found`
    this.errors.push(msg)
  }
}

export default ParserImpl
