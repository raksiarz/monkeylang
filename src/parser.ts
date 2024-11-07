import LexerImpl, * as tokenizer from "./tokenizer"
import * as ast from "./ast"
import * as constants from './parser_constants'

interface Parser {
  l: LexerImpl
  currToken: tokenizer.Token
  peekToken: tokenizer.Token
  errors: string[]
  prefixParseFns: Map<tokenizer.TokenType, PrefixParseFn>
  infixParseFns: Map<tokenizer.TokenType, InfixParseFn>
}

type PrefixParseFn = () => ast.Expression | null
type InfixParseFn = (expr: ast.Expression | null) => ast.Expression

const PRECEDENCES = new Map([
  ["==", constants.EQUALS],
  ["!=", constants.EQUALS],
  ["<", constants.LESSGREATER],
  [">", constants.LESSGREATER],
  ["+", constants.SUM],
  ["-", constants.SUM],
  ["/", constants.PRODUCT],
  ["*", constants.PRODUCT],
  ["(", constants.CALL],
])

class ParserImpl implements Parser {
  l: LexerImpl
  currToken: tokenizer.Token
  peekToken: tokenizer.Token
  program: ast.ProgramImpl
  errors: string[]
  prefixParseFns: Map<string, PrefixParseFn>
  infixParseFns: Map<string, InfixParseFn>

  constructor(l: LexerImpl) {
    this.l = l
    this.errors = []

    this.nextToken()
    this.nextToken()

    this.prefixParseFns = new Map<string, PrefixParseFn>()
    this.registerPrefix(tokenizer.IDENT, this.parseIdentifier.bind(this))
    this.registerPrefix(tokenizer.INT, this.parseIntegerLiteral.bind(this))
    this.registerPrefix(tokenizer.BANG, this.parsePrefixExpression.bind(this))
    this.registerPrefix(tokenizer.MINUS, this.parsePrefixExpression.bind(this))
    this.registerPrefix(tokenizer.TRUE, this.parseBoolean.bind(this))
    this.registerPrefix(tokenizer.FALSE, this.parseBoolean.bind(this))
    this.registerPrefix(tokenizer.LPAREN, this.parseGroupedExpression.bind(this))
    this.registerPrefix(tokenizer.IF, this.parseIfExpression.bind(this))
    this.registerPrefix(tokenizer.FUNCTION, this.parseFunctionLiteral.bind(this))
    this.registerPrefix(tokenizer.STRING, this.parseStringLiteral.bind(this))

    this.infixParseFns = new Map<string, InfixParseFn>()
    this.registerInfix(tokenizer.PLUS, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.MINUS, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.SLASH, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.ASTERISK, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.NOT_EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.LT, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.GT, this.parseInfixExpression.bind(this))
    this.registerInfix(tokenizer.LPAREN, this.parseCallExpression.bind(this))
  }

  nextToken() {
    this.currToken = this.peekToken
    this.peekToken = this.l.nextToken()
  }

  parseProgram(): ast.ProgramImpl {
    this.program = new ast.ProgramImpl()

    while(this.currToken.type !== tokenizer.EOF) {
      const stmt = this.parseStatement()

      if(stmt !== null) {
        this.program.statements.push(stmt as unknown as ast.Statement)
      }

      this.nextToken()
    }
    
    return this.program
  }

  parseStatement() {
    switch(this.currToken.type) {
      case tokenizer.LET: 
        return this.parseLetStatement()
      case tokenizer.RETURN:
        return this.parseReturnStatement()
      default:
        return this.parseExpressionStatement() 
    }
  }

  parseLetStatement() {
    const stmt = new ast.LetStmtImpl(this.currToken)

    if(!this.expectPeek("")) {
      return null
    }

    stmt.name = new ast.IdentifierImpl(this.currToken, this.currToken.literal)

    if(!this.expectPeek(tokenizer.ASSIGN)) {
      return null
    }

    this.nextToken()

    stmt.value = this.parseExpression(constants.LOWEST)

    while(!this.currTokenIs(tokenizer.SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  parseReturnStatement() {
    const stmt = new ast.ReturnStmtImpl(this.currToken)

    this.nextToken()

    stmt.returnValue = this.parseExpression(constants.LOWEST)

    while(!this.currTokenIs(tokenizer.SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  parseExpressionStatement() {
    const stmt = new ast.ExpressionStmtImpl(this.currToken)

    stmt.expression = this.parseExpression(constants.LOWEST)

    if(this.peekTokenIs(tokenizer.SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  parseExpression(precedence: number): ast.Expression | null {
    const prefix = this.prefixParseFns.get(this.currToken.type)

    if(!prefix) {
      this.noPrefixParseFnError(this.currToken.type)
      return null 
    }

    let leftExp = prefix()

    while(!this.peekTokenIs(tokenizer.SEMICOLON) && precedence < this.peekPrecedence()) {
      const infix = this.infixParseFns.get(this.peekToken.type) 

      if(!infix) {
        return leftExp
      }

      this.nextToken()

      leftExp = infix(leftExp)
    } 

    return leftExp
  }

  parseIntegerLiteral(): ast.Expression | null {
    const lit = new ast.IntegerLiteralImpl(this.currToken)

    const value = parseInt(this.currToken.literal)

    if(isNaN(value)) {
      const msg = `could not parse ${this.currToken.literal} as integer`
      this.errors.push(msg)
      return null
    }

    lit.value = value

    return lit
  }

  parseIdentifier(): ast.Expression {
    return new ast.IdentifierImpl(this.currToken, this.currToken.literal)
  }

  parsePrefixExpression(): ast.Expression {
    const expression = new ast.PrefixExpressionImpl(this.currToken, this.currToken.literal)

    this.nextToken()

    expression.right = this.parseExpression(constants.PREFIX)

    return expression
  }

  parseInfixExpression(left: ast.Expression | null): ast.Expression {
    const expression = new ast.InfixExpressionImpl(this.currToken, this.currToken.literal, left)

    const precedence = this.currPrecedence()
    this.nextToken()
    expression.right = this.parseExpression(precedence)

    return expression
  }

  parseBoolean(): ast.Expression {
    return new ast.BooleanImpl(this.currToken, this.currTokenIs(tokenizer.TRUE))
  }

  parseGroupedExpression(): ast.Expression | null{
    this.nextToken()

    const exp = this.parseExpression(constants.LOWEST)

    if(!this.expectPeek(tokenizer.RPAREN)) {
      return null
    }

    return exp
  }

  parseIfExpression(): ast.Expression | null {
    const expression = new ast.IfExpressionImpl(this.currToken) 

    if(!this.expectPeek(tokenizer.LPAREN)) {
      return null
    }

    this.nextToken()
    expression.condition = this.parseExpression(constants.LOWEST)

    if(!this.expectPeek(tokenizer.RPAREN)) {
      return null
    }

    if(!this.expectPeek(tokenizer.LBRACE)) {
      return null
    }

    expression.consequence = this.parseBlockStatement()

    if(this.peekTokenIs(tokenizer.ELSE)) {
      this.nextToken() 

      if(!this.expectPeek(tokenizer.LBRACE)) {
        return null
      }

      expression.alternative = this.parseBlockStatement()
    }

    return expression
  }

  parseBlockStatement(): ast.BlockStatement {
    const block = new ast.BlockStatementImpl(this.currToken)
    block.statements = []

    this.nextToken()

    while(!this.currTokenIs(tokenizer.RBRACE) && !this.currTokenIs(tokenizer.EOF)) {
      const stmt = this.parseStatement()
      if(stmt !== null) {
        block.statements.push(stmt)
      }

      this.nextToken()
    }

    return block
  }

  parseFunctionLiteral(): ast.Expression | null {
    const lit = new ast.FunctionLiteralImpl(this.currToken)

    if(!this.expectPeek(tokenizer.LPAREN)) {
      return null
    }

    lit.parameters = this.parseFunctionParameters()

    if(!this.expectPeek(tokenizer.LBRACE)) {
      return null
    }

    lit.body = this.parseBlockStatement()

    return lit
  }

  parseStringLiteral(): ast.Expression {
    return new ast.StringLiteralImpl(this.currToken, this.currToken.literal)
  }

  parseFunctionParameters(): ast.Identifier[] {
    const identifiers: ast.Identifier[] = []

    if(this.peekTokenIs(tokenizer.RPAREN)) {
      this.nextToken()
      return identifiers
    }

    this.nextToken()

    const ident = new ast.IdentifierImpl(this.currToken, this.currToken.literal)
    identifiers.push(ident)

    while (this.peekTokenIs(tokenizer.COMMA)) {
      this.nextToken()
      this.nextToken()

      const ident = new ast.IdentifierImpl(this.currToken, this.currToken.literal)
      identifiers.push(ident)
    }

    if(!this.expectPeek(tokenizer.RPAREN)) {
      return []
    }

    return identifiers
  }

  parseCallExpression(fn: ast.Expression | null): ast.Expression {
    const exp = new ast.CallExpressionImpl(this.currToken, fn)
    exp.arguments = this.parseCallArguments()

    return exp
  }

  parseCallArguments(): ast.Expression[] {
    const args: ast.Expression[] = []

    if(this.peekTokenIs(tokenizer.RPAREN)) {
      this.nextToken()
      return args
    }

    this.nextToken()
    const arg = this.parseExpression(constants.LOWEST)
    if(arg) {
      args.push(arg)
    }

    while(this.peekTokenIs(tokenizer.COMMA)) {
      this.nextToken()
      this.nextToken()
      const arg = this.parseExpression(constants.LOWEST)
      if (arg) {
        args.push(arg)
      }
    }

    if(!this.expectPeek(tokenizer.RPAREN)) {
      return []
    }

    return args
  }

  currTokenIs(t: tokenizer.TokenType): boolean {
    return this.currToken.type === t
  }

  peekTokenIs(t: tokenizer.TokenType): boolean {
    return this.peekToken.type === t
  }

  expectPeek(t: tokenizer.TokenType): boolean {
    if(this.peekTokenIs(t)) {
      this.nextToken()
      return true
    } else {
      this.peekError(t)
      return false
    }
  }

  peekError(t: tokenizer.TokenType) {
    const msg = `expected next token to be ${t}, got ${this.peekToken.type} instead`
    this.errors.push(msg)
  }

  peekPrecedence(): number {
    return PRECEDENCES.get(this.peekToken.type) ?? constants.LOWEST
  }

  currPrecedence(): number {
    return PRECEDENCES.get(this.currToken.type) ?? constants.LOWEST
  }

  registerPrefix(tokenType: tokenizer.TokenType, fn: PrefixParseFn) {
    this.prefixParseFns.set(tokenType, fn)
  }
  
  registerInfix(tokenType: tokenizer.TokenType, fn: InfixParseFn) {
    this.infixParseFns.set(tokenType, fn)
  }

  noPrefixParseFnError(t: tokenizer.TokenType) {
    const msg = `no prefix parse function for ${t} found`
    this.errors.push(msg)
  }
}

export default ParserImpl
