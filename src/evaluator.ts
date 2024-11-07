import * as ast from './ast'
import EnvironmentImpl, * as env from './environment'
import Object, * as object from './object'
import * as tokenizer from './tokenizer'
import * as builtins from './bultins'

const NULL = new object.NullImpl()
const FALSE = new object.BoolImpl(false)
const TRUE = new object.BoolImpl(true)

export function evaluate(node: ast.Node | ast.Expression | ast.Statement | null, env: EnvironmentImpl): Object {
  switch(true) {
    case node instanceof ast.ProgramImpl:
      return evaluateProgram((node as ast.Program).statements, env)

    case node instanceof ast.ExpressionStmtImpl:
      return evaluate((node as ast.ExpressionStmt)?.expression, env)

    case node instanceof ast.IntegerLiteralImpl: 
      return new object.IntegerImpl((node as ast.IntegerLiteral).value)

    case node instanceof ast.InfixExpressionImpl:
      const infixNode = node as ast.InfixExpression
      const left = evaluate(infixNode.left, env)
      if(isError(left)) {
        return left
      }

      const right = evaluate(infixNode.right, env)
      if(isError(right)) {
        return right
      }

      return evaluateInfixExpression(infixNode.operator, left, right)

    case node instanceof ast.BooleanImpl:
      return nativeBoolToBooleanObject((node as ast.Boolean).value)
    
    case node instanceof ast.PrefixExpressionImpl:
      const prefixNode = node as ast.PrefixExpression
      const rightEval = evaluate(prefixNode.right, env)
      if(isError(rightEval)) {
        return rightEval
      }

      return evaluatePrefixExpression(prefixNode.operator, rightEval)

    case node instanceof ast.BlockStatementImpl:
      return evaluateBlockStatement((node as ast.BlockStatement), env)
    
    case node instanceof ast.IfExpressionImpl:
      return evaluateIfExpression(node as ast.IfExpression, env)

    case node instanceof ast.ReturnStmtImpl:
      const val = evaluate((node as ast.ReturnStmt).returnValue, env)  
      if(isError(val)) {
        return val
      }
      return new object.ReturnValueImpl(val)

    case node instanceof ast.LetStmtImpl:
      const letNode = node as ast.LetStmt
      const value = evaluate(letNode.value, env)
      if(isError(value)) {
        return value 
      }
      env.set(letNode.name.value, value)
      break;

    case node instanceof ast.IdentifierImpl:
      return evalIdentifier(node as ast.Identifier, env)

    case node instanceof ast.FunctionLiteralImpl:
      const funcNode = node as ast.FunctionLiteral
      const params = funcNode.parameters
      const body = funcNode.body

      return new object.FunctionImpl(params, body, env)
    
    case node instanceof ast.CallExpressionImpl:
      const fn = evaluate((node as ast.CallExpression).fn, env)
      if(isError(fn)) {
        return fn
      }
      const args = evaluateExpression((node as ast.CallExpression).arguments, env)
      if(args.length === 1 && isError(args[0])) {
        return args[0]
      }

      return applyFunction(fn, args)

    case node instanceof ast.StringLiteralImpl:
      return new object.StringImpl((node as ast.StringLiteral).value)
  }

  return NULL
}

function nativeBoolToBooleanObject(input: boolean): object.Bool {
  if(!!input) {
    return TRUE
  }

  return FALSE
}

function evaluateProgram(stmts: ast.Statement[], env: EnvironmentImpl): Object {
  let result: Object = NULL

  for(let i = 0; i < stmts.length; i++) {
    result = evaluate(stmts[i], env)

    switch(true) {
      case result.type() === object.RETURN_VALUE_OBJ:
        return (result as object.ReturnValue).value

      case result.type() === object.ERROR_OBJ:
        return result
    }
  }

  return result
}

function evaluateBlockStatement(block: ast.BlockStatement, env: EnvironmentImpl): Object {
  let result = <Object>{}

  for(let i = 0; i < block.statements.length; i++) {
    result = evaluate(block.statements[i], env)

    if(result !== null) {
      const rt = result.type()

      if (rt === object.RETURN_VALUE_OBJ || rt === object.ERROR_OBJ) {
        return result
      }
    }

  }

  return result
}

function evaluatePrefixExpression(operator: string, right: Object | null): Object {
  switch(operator) {
    case tokenizer.BANG:
      return evaluateBangOperatorExpression(right)
    case tokenizer.MINUS:
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
  if(right?.type() !== object.INTEGER_OBJ) {
    return NULL
  }

  const value = (right as object.Integer).value
  return new object.IntegerImpl(-value)
}

function evaluateInfixExpression(operator: string, left: Object, right: Object): Object {
  switch(true) {
    case left.type() === object.INTEGER_OBJ && right.type() === object.INTEGER_OBJ:
      return evaluateInfixIntegerExpression(operator, left, right)

    case operator == tokenizer.EQ:
      return new object.BoolImpl(left == right)
        
    case operator == tokenizer.NOT_EQ:
      return new object.BoolImpl(left != right)

    case left.type() !== right.type(): 
      return newError('type mismatch:', left.type(), operator, right.type())

    case left.type() === object.STRING_OBJ && right.type() === object.STRING_OBJ:
      return evaluateStringInfixExpression(operator, left, right)

    default:
      return newError('unknown operator:', left.type(), operator, right.type())
  }
}

function evaluateInfixIntegerExpression(operator: string, left: Object, right: Object): Object {
  const leftVal = (left as object.Integer).value
  const rightVal = (right as object.Integer).value
  
  switch(operator) {
    case tokenizer.PLUS:
      return new object.IntegerImpl(leftVal + rightVal)

    case tokenizer.MINUS:
      return new object.IntegerImpl(leftVal - rightVal)

    case tokenizer.SLASH:
      return new object.IntegerImpl(leftVal / rightVal)

    case tokenizer.ASTERISK:
      return new object.IntegerImpl(leftVal * rightVal)

    case tokenizer.NOT_EQ:
      return new object.BoolImpl(leftVal !== rightVal)

    case tokenizer.EQ:
      return new object.BoolImpl(leftVal === rightVal)

    case tokenizer.LT:
      return new object.BoolImpl(leftVal < rightVal)

    case tokenizer.GT:
      return new object.BoolImpl(leftVal > rightVal)

    default:
      return newError('unknown operator:', left.type(), operator, right.type())
  }
}

function evaluateStringInfixExpression(operator: string, left: Object, right: Object): Object {
  const leftVal = (left as object.String).value
  const rightVal = (right as object.String).value

  if(operator === tokenizer.PLUS) {
    return new object.StringImpl(leftVal + rightVal)
  }

  return newError('unknown operator: ', left.type(), operator, right.type())
}

function evaluateIfExpression(ie: ast.IfExpression, env: EnvironmentImpl): Object {
  const condition = evaluate(ie.condition, env)
  if(isError(condition)) {
    return condition
  }

  if(isTruthy(condition)) {
    return evaluate(ie.consequence, env)
  } else if(ie.alternative !== null) {
    return evaluate(ie.alternative, env)
  } else {
    return NULL
  }
}

function evalIdentifier(node: ast.IdentifierImpl, env: EnvironmentImpl): Object {
  const val = env.get(node.value)
  if(!!val) {
    return val
  }

  const bultin = builtins.builtins.get(node.value)
  if(bultin) {
    return bultin
  }

  return newError("identifier not found " + node.value)
}

function evaluateExpression(exps: ast.Expression[], env: EnvironmentImpl): Object[] {
  const result: Object[] = []

  for(let i = 0; i < exps.length; i++) {
    const evaluated = evaluate(exps[i], env)
    if(isError(evaluated)) {
      return [evaluated as Object]
    }

    result.push(evaluated)
  }

  return result
}

function applyFunction(fn: Object, args: Object[]): Object {
  const func = fn as object.Function

  switch (func.type()) {
    case object.FUNCTION_OBJ:
      const extendedEnv = extendFunctionEnv(func, args)
      const evaluated = evaluate(func.body, extendedEnv)

      return unwrapReturnValue(evaluated)

    case object.BUILTIN_OBJ:
      return (fn as object.BulitinImpl).fn(...args)

    default:
      return newError('not a function ' + fn.type())
  }
}

function extendFunctionEnv(fn: object.Function, args: Object[]): EnvironmentImpl {
  const e = env.newEnclosedEnvironment(fn.env)

  for(let i = 0; i < fn.parameters.length; i++) {
    e.set(fn.parameters[i].value, args[i])
  }
  
  return e
}

function unwrapReturnValue(obj: Object): Object {
  const returnValue = obj as object.ReturnValue
  if(!!returnValue) {
    return returnValue
  }

  return obj
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

export function newError(format: string, ...args: any[]): object.ErrorImpl {
  let msg = ''
  for(let i = 0; i < args.length; i++) {
    msg += ' ' + args[i]
  }
  return new object.ErrorImpl(format + msg)
}

function isError(obj: Object): boolean {
  if(obj !== null) {
    return obj.type() === object.ERROR_OBJ
  }

  return false
}
