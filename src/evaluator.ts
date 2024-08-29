import { Node, Statement, Expression, IntegerLiteralImpl, ProgramImpl, ExpressionStmtImpl } from './ast'
import { Object, IntegerImpl } from './object'

export function evaluate(node: Node | Expression | Statement): Object | null {
  console.log('node: ', typeof(node));
  switch(node) {
    // @ts-ignore
    case ProgramImpl:
      console.log('program impl')
        // @ts-ignore
      return evaluateStatements(node.statements)
    // @ts-ignore
    case ExpressionStmtImpl:
        // @ts-ignore
      return evaluate(node.expression)
    // @ts-ignore
    case IntegerLiteralImpl: 
        // @ts-ignore
      return new IntegerImpl(node.value)
  }

  return null
}

function evaluateStatements(stmts: Statement[]): Object | null {
  let result: Object | null = null

  for(let i = 0; i < stmts.length; i++) {
    result = evaluate(stmts[i])
  }

  return result
}
