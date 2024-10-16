import LexerImpl from "./src/tokenizer"
import ParserImpl from "./src/parser"
import { evaluate } from "./src/evaluator"
import EnvironmentImpl from "./src/environment"
import { Object } from "./src/object"

const ENV = new EnvironmentImpl(new Map<string, Object>, null)

export function getAST(input: string) {
    const lexer = new LexerImpl(input);
    const parser = new ParserImpl(lexer)
    const program = parser.parseProgram()
    
    if(parser.errors.length !== 0) {
      printParseErrors(parser.errors)
    }

    const evaluated = evaluate(program, ENV)
    if(!!evaluated) {
      console.log(evaluated.inspect())
    }

    return program
}

function printParseErrors(errors: string[]) {
  for(let i = 0; i < errors.length; i++) {
    console.log('errors: ', errors[i]);
  }
}
