import LexerImpl, { ASSIGN, ASTERISK, BANG, COMMA, ELSE, EOF, EQ, FALSE, FUNCTION, GT, IDENT, IF, INT, LBRACE, LET, LPAREN, LT, MINUS, NOT_EQ, PLUS, RBRACE, RETURN, RPAREN, SEMICOLON, SLASH, STRING, Token, TokenType, TRUE } from "./tokenizer"
import { 
  IdentifierImpl, 
  LetStmtImpl, 
  ProgramImpl, 
  ReturnStmtImpl, 
  Statement, 
  Expression, 
  BlockStatement, 
  ExpressionStmtImpl, 
  IntegerLiteralImpl, 
  PrefixExpressionImpl, 
  InfixExpressionImpl, 
  BooleanImpl, 
  IfExpressionImpl, 
  BlockStatementImpl, 
  FunctionLiteralImpl,
  Identifier,
  CallExpressionImpl,
  StringLiteralImpl
} from "./ast"
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
type InfixParseFn = (expr: Expression | null) => Expression

const PRECEDENCES = new Map([
  ["==", EQUALS],
  ["!=", EQUALS],
  ["<", LESSGREATER],
  [">", LESSGREATER],
  ["+", SUM],
  ["-", SUM],
  ["/", PRODUCT],
  ["*", PRODUCT],
  ["(", CALL],
])

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
    this.registerPrefix(IDENT, this.parseIdentifier.bind(this))
    this.registerPrefix(INT, this.parseIntegerLiteral.bind(this))
    this.registerPrefix(BANG, this.parsePrefixExpression.bind(this))
    this.registerPrefix(MINUS, this.parsePrefixExpression.bind(this))
    this.registerPrefix(TRUE, this.parseBoolean.bind(this))
    this.registerPrefix(FALSE, this.parseBoolean.bind(this))
    this.registerPrefix(LPAREN, this.parseGroupedExpression.bind(this))
    this.registerPrefix(IF, this.parseIfExpression.bind(this))
    this.registerPrefix(FUNCTION, this.parseFunctionLiteral.bind(this))
    this.registerPrefix(STRING, this.parseStringLiteral.bind(this))

    this.infixParseFns = new Map<string, InfixParseFn>()
    this.registerInfix(PLUS, this.parseInfixExpression.bind(this))
    this.registerInfix(MINUS, this.parseInfixExpression.bind(this))
    this.registerInfix(SLASH, this.parseInfixExpression.bind(this))
    this.registerInfix(ASTERISK, this.parseInfixExpression.bind(this))
    this.registerInfix(EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(NOT_EQ, this.parseInfixExpression.bind(this))
    this.registerInfix(LT, this.parseInfixExpression.bind(this))
    this.registerInfix(GT, this.parseInfixExpression.bind(this))
    this.registerInfix(LPAREN, this.parseCallExpression.bind(this))
  }

  nextToken() {
    this.currToken = this.peekToken
    this.peekToken = this.l.nextToken()
  }

  parseProgram(): ProgramImpl {
    this.program = new ProgramImpl()

    while(this.currToken.type !== EOF) {
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
      case LET: 
        return this.parseLetStatement()
      case RETURN:
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

    if(!this.expectPeek(ASSIGN)) {
      return null
    }

    this.nextToken()

    stmt.value = this.parseExpression(LOWEST)

    while(!this.currTokenIs(SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  parseReturnStatement() {
    const stmt = new ReturnStmtImpl(this.currToken)

    this.nextToken()

    stmt.returnValue = this.parseExpression(LOWEST)

    while(!this.currTokenIs(SEMICOLON)) {
      this.nextToken()
    }

    return stmt
  }

  parseExpressionStatement() {
    const stmt = new ExpressionStmtImpl(this.currToken)

    stmt.expression = this.parseExpression(LOWEST)

    if(this.peekTokenIs(SEMICOLON)) {
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

    let leftExp = prefix()

    while(!this.peekTokenIs(SEMICOLON) && precedence < this.peekPrecedence()) {
      const infix = this.infixParseFns.get(this.peekToken.type) 

      if(!infix) {
        return leftExp
      }

      this.nextToken()

      leftExp = infix(leftExp)
    } 

    return leftExp
  }

  parseIntegerLiteral(): Expression | null {
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

  parseInfixExpression(left: Expression | null): Expression {
    const expression = new InfixExpressionImpl(this.currToken, this.currToken.literal, left)

    const precedence = this.currPrecedence()
    this.nextToken()
    expression.right = this.parseExpression(precedence)

    return expression
  }

  parseBoolean(): Expression {
    return new BooleanImpl(this.currToken, this.currTokenIs(TRUE))
  }

  parseGroupedExpression(): Expression | null{
    this.nextToken()

    const exp = this.parseExpression(LOWEST)

    if(!this.expectPeek(RPAREN)) {
      return null
    }

    return exp
  }

  parseIfExpression(): Expression | null {
    const expression = new IfExpressionImpl(this.currToken) 

    if(!this.expectPeek(LPAREN)) {
      return null
    }

    this.nextToken()
    expression.condition = this.parseExpression(LOWEST)

    if(!this.expectPeek(RPAREN)) {
      return null
    }

    if(!this.expectPeek(LBRACE)) {
      return null
    }

    expression.consequence = this.parseBlockStatement()

    if(this.peekTokenIs(ELSE)) {
      this.nextToken() 

      if(!this.expectPeek(LBRACE)) {
        return null
      }

      expression.alternative = this.parseBlockStatement()
    }

    return expression
  }

  parseBlockStatement(): BlockStatement {
    const block = new BlockStatementImpl(this.currToken)
    block.statements = []

    this.nextToken()

    while(!this.currTokenIs(RBRACE) && !this.currTokenIs(EOF)) {
      const stmt = this.parseStatement()
      if(stmt !== null) {
        block.statements.push(stmt)
      }

      this.nextToken()
    }

    return block
  }

  parseFunctionLiteral(): Expression | null {
    const lit = new FunctionLiteralImpl(this.currToken)

    if(!this.expectPeek(LPAREN)) {
      return null
    }

    lit.parameters = this.parseFunctionParameters()

    if(!this.expectPeek(LBRACE)) {
      return null
    }

    lit.body = this.parseBlockStatement()

    return lit
  }

  parseStringLiteral(): Expression {
    return new StringLiteralImpl(this.currToken, this.currToken.literal)
  }

  parseFunctionParameters(): Identifier[] {
    const identifiers: Identifier[] = []

    if(this.peekTokenIs(RPAREN)) {
      this.nextToken()
      return identifiers
    }

    this.nextToken()

    const ident = new IdentifierImpl(this.currToken, this.currToken.literal)
    identifiers.push(ident)

    while (this.peekTokenIs(COMMA)) {
      this.nextToken()
      this.nextToken()

      const ident = new IdentifierImpl(this.currToken, this.currToken.literal)
      identifiers.push(ident)
    }

    if(!this.expectPeek(RPAREN)) {
      return []
    }

    return identifiers
  }

  parseCallExpression(fn: Expression | null): Expression {
    const exp = new CallExpressionImpl(this.currToken, fn)
    exp.arguments = this.parseCallArguments()

    return exp
  }

  parseCallArguments(): Expression[] {
    const args: Expression[] = []

    if(this.peekTokenIs(RPAREN)) {
      this.nextToken()
      return args
    }

    this.nextToken()
    const arg = this.parseExpression(LOWEST)
    if(arg) {
      args.push(arg)
    }

    while(this.peekTokenIs(COMMA)) {
      this.nextToken()
      this.nextToken()
      const arg = this.parseExpression(LOWEST)
      if (arg) {
        args.push(arg)
      }
    }

    if(!this.expectPeek(RPAREN)) {
      return []
    }

    return args
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

  peekPrecedence(): number {
    return PRECEDENCES.get(this.peekToken.type) ?? LOWEST
  }

  currPrecedence(): number {
    return PRECEDENCES.get(this.currToken.type) ?? LOWEST
  }

  registerPrefix(tokenType: TokenType, fn: PrefixParseFn) {
    this.prefixParseFns.set(tokenType, fn)
  }
  
  registerInfix(tokenType: TokenType, fn: InfixParseFn) {
    this.infixParseFns.set(tokenType, fn)
  }

  noPrefixParseFnError(t: TokenType) {
    const msg = `no prefix parse function for ${t} found`
    this.errors.push(msg)
  }
}

export default ParserImpl
