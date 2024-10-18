import LexerImpl from "./src/tokenizer"
import ParserImpl from "./src/parser"
import { evaluate } from "./src/evaluator"
import EnvironmentImpl from "./src/environment"

const ENV = new EnvironmentImpl(new Map(), null)

export function getAST(input) {
    const lexer = new LexerImpl(input);
    const parser = new ParserImpl(lexer)
    const program = parser.parseProgram()
    
    if(parser.errors.length !== 0) {
      printParseErrors(parser.errors)
    }

    return program
}

export function getEvaluated(input) {
    const lexer = new LexerImpl(input);
    const parser = new ParserImpl(lexer)
    const program = parser.parseProgram()
    
    if(parser.errors.length !== 0) {
      printParseErrors(parser.errors)
    }

    const evaluated = evaluate(program, ENV)
    if(!!evaluated) {
      return evaluated.inspect()
    }
}

function printParseErrors(errors) {
  for(let i = 0; i < errors.length; i++) {
    console.log('errors: ', errors[i]);
  }
}
