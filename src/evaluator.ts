import { Node, Statement, Expression, IntegerLiteralImpl, ProgramImpl, ExpressionStmtImpl, ExpressionStmt, IfExpression, Program, IntegerLiteral, InfixExpressionImpl, InfixExpression, BooleanImpl, Boolean, PrefixExpressionImpl, PrefixExpression, BlockStatementImpl, BlockStatement, IfExpressionImpl, ReturnStmtImpl, ReturnStmt, LetStmtImpl } from './ast'
import { Object, IntegerImpl, BoolImpl, NullImpl, Bool, INTEGER_OBJ, Integer, ReturnValueImpl, ReturnValue, RETURN_VALUE_OBJ, ErrorImpl, ERROR_OBJ } from './object'
import { ASTERISK, BANG, EQ, GT, LT, MINUS, NOT_EQ, PLUS, SLASH } from './tokenizer'

const NULL = new NullImpl()
const FALSE = new BoolImpl(false)
const TRUE = new BoolImpl(true)

export function evaluate(node: Node | Expression | Statement | null): Object {
  switch(true) {
    case node instanceof ProgramImpl:
      return evaluateProgram((node as Program).statements)

    case node instanceof ExpressionStmtImpl:
      return evaluate((node as ExpressionStmt)?.expression)

    case node instanceof IntegerLiteralImpl: 
      return new IntegerImpl((node as IntegerLiteral).value)

    case node instanceof InfixExpressionImpl:
      const infixNode = node as InfixExpression
      const left = evaluate(infixNode.left)
      if(isError(left)) {
        return left
      }

      const right = evaluate(infixNode.right)
      if(isError(right)) {
        return right
      }

      return evaluateInfixExpression(infixNode.operator, left, right)

    case node instanceof BooleanImpl:
      return nativeBoolToBooleanObject((node as Boolean).value)
    
    case node instanceof PrefixExpressionImpl:
      const prefixNode = node as PrefixExpression
      const rightEval = evaluate(prefixNode.right)
      if(isError(rightEval)) {
        return rightEval
      }

      return evaluatePrefixExpression(prefixNode.operator, rightEval)

    case node instanceof BlockStatementImpl:
      return evaluateBlockStatement((node as BlockStatement))
    
    case node instanceof IfExpressionImpl:
      return evaluateIfExpression(node as IfExpression)

    case node instanceof ReturnStmtImpl:
      const val = evaluate((node as ReturnStmt).returnValue)  
      if(isError(val)) {
        return val
      }
      return new ReturnValueImpl(val)

    case node instanceof LetStmtImpl:
      const value = evaluate(node.value)
      if(isError(value)) {
        return value 
      }
  }

  return NULL
}

function nativeBoolToBooleanObject(input: boolean): Bool {
  if(!!input) {
    return TRUE
  }

  return FALSE
}

function evaluateProgram(stmts: Statement[]): Object {
  let result: Object = NULL

  for(let i = 0; i < stmts.length; i++) {
    result = evaluate(stmts[i])

    switch(true) {
      case result.type() === RETURN_VALUE_OBJ:
        return (result as ReturnValue).value

      case result.type() === ERROR_OBJ:
        return result
    }
  }

  return result
}

function evaluateBlockStatement(block: BlockStatement): Object {
  let result = <Object>{}

  for(let i = 0; i < block.statements.length; i++) {
    result = evaluate(block.statements[i])

    if(result !== null) {
      const rt = result.type()

      if (rt === RETURN_VALUE_OBJ || rt === ERROR_OBJ) {
        return result
      }
    }

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
      return newError('unknown operator:', operator, right?.type()) 
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

    case left.type() !== right.type(): 
      return newError('type mismatch:', left.type(), operator, right.type())

    default:
      return newError('unknown operator:', left.type(), operator, right.type())
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
      return newError('unknown operator:', left.type(), operator, right.type())
  }
}

function evaluateIfExpression(ie: IfExpression): Object {
  const condition = evaluate(ie.condition)
  if(isError(condition)) {
    return condition
  }

  if(isTruthy(condition)) {
    return evaluate(ie.consequence)
  } else if(ie.alternative !== null) {
    return evaluate(ie.alternative)
  } else {
    return NULL
  }
}

function isTruthy(obj: Object): boolean {
  switch(obj) {
    case NULL:
      return false
    
    case TRUE:
      return true

    case FALSE: 
      return false

    default:
      return true
  }
}

function newError(format: string, ...args: any[]): ErrorImpl {
  let msg = ''
  for(let i = 0; i < args.length; i++) {
    msg += ' ' + args[i]
  }
  return new ErrorImpl(format + msg)
}

function isError(obj: Object): boolean {
  if(obj !== null) {
    return obj.type() === ERROR_OBJ
  }

  return false
}
