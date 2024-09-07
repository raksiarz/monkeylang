import { Node, Statement, Expression, IntegerLiteralImpl, ProgramImpl, ExpressionStmtImpl, ExpressionStmt, Program, IntegerLiteral, InfixExpressionImpl, InfixExpression, BooleanImpl, Boolean, PrefixExpressionImpl, PrefixExpression } from './ast'
import { Object, IntegerImpl, BoolImpl, NullImpl, Bool, INTEGER_OBJ, Integer } from './object'
import { ASTERISK, BANG, EQ, GT, LT, MINUS, NOT_EQ, PLUS, SLASH } from './tokenizer'

const NULL = new NullImpl()
const FALSE = new BoolImpl(false)
const TRUE = new BoolImpl(true)

export function evaluate(node: Node | Expression | Statement | null): Object {
  switch(true) {
    case node instanceof ProgramImpl:
      return evaluateStatements((node as Program).statements)

    case node instanceof ExpressionStmtImpl:
      return evaluate((node as ExpressionStmt)?.expression)

    case node instanceof IntegerLiteralImpl: 
      return new IntegerImpl((node as IntegerLiteral).value)

    case node instanceof InfixExpressionImpl:
      const infixNode = node as InfixExpression
      const left = evaluate(infixNode.left)
      const right = evaluate(infixNode.right)

      return evaluateInfixExpression(infixNode.operator, left, right)

    case node instanceof BooleanImpl:
      return nativeBoolToBooleanObject((node as Boolean).value)
    
    case node instanceof PrefixExpressionImpl:
      const prefixNode = node as PrefixExpression
      const rightEval = evaluate(prefixNode.right)

      return evaluatePrefixExpression(prefixNode.operator, rightEval)
  }

  return NULL
}

function nativeBoolToBooleanObject(input: boolean): Bool {
  if(!!input) {
    return TRUE
  }

  return FALSE
}

function evaluateStatements(stmts: Statement[]): Object {
  let result: Object = NULL

  for(let i = 0; i < stmts.length; i++) {
    result = evaluate(stmts[i])
  }

  return result
}

function evaluatePrefixExpression(operator: string, right: Object | null): Object {
  switch(operator) {
    case BANG:
      return evaluateBangOperatorExpression(right)
    case MINUS:
      return evalueateMinusPrefixOperatorExpression(right)
    default:
      return NULL
  }
}

function evaluateBangOperatorExpression(right: Object | null): Object {
  switch(JSON.stringify(right)) {
    case JSON.stringify(TRUE):
      return FALSE
    case JSON.stringify(FALSE):
      return TRUE
    case JSON.stringify(NULL):
      return TRUE
    default:
      return FALSE
  }
}

function evalueateMinusPrefixOperatorExpression(right: Object | null): Object {
  if(right?.type() !== INTEGER_OBJ) {
    return NULL
  }

  const value = (right as Integer).value
  return new IntegerImpl(-value)
}

function evaluateInfixExpression(operator: string, left: Object, right: Object): Object {
  switch(true) {
    case left.type() === INTEGER_OBJ && right.type() === INTEGER_OBJ:
      return evaluateInfixIntegerExpression(operator, left, right)

    case operator == EQ:
      return new BoolImpl(left == right)
        
    case operator == NOT_EQ:
      return new BoolImpl(left != right)

    default:
      return NULL
  }
}

function evaluateInfixIntegerExpression(operator: string, left: Object, right: Object): Object {
  const leftVal = (left as Integer).value
  const rightVal = (right as Integer).value
  
  switch(operator) {
    case PLUS:
      return new IntegerImpl(leftVal + rightVal)

    case MINUS:
      return new IntegerImpl(leftVal - rightVal)

    case SLASH:
      return new IntegerImpl(leftVal / rightVal)

    case ASTERISK:
      return new IntegerImpl(leftVal * rightVal)

    case NOT_EQ:
      return new BoolImpl(leftVal !== rightVal)

    case EQ:
      return new BoolImpl(leftVal === rightVal)

    case LT:
      return new BoolImpl(leftVal < rightVal)

    case GT:
      return new BoolImpl(leftVal > rightVal)

    default:
      return NULL
  }
}
