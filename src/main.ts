import LexerImpl, { Token } from "./tokenizer"
import ParserImpl from "./parser"
import { evaluate } from "./evaluator"
import EnvironmentImpl from "./environment"
import { Object } from "./object"

declare function require(name: string): any

const readline = require('readline')

const rl = readline.createInterface({
  // @ts-ignore
  input: process.stdin,
  // @ts-ignore
  output: process.stdout
})

const ENV = new EnvironmentImpl(new Map<string, Object>, null)

const getInput = function () {
  rl.question('>> ', function (input: string) {
    if (input === ':q') {
      // @ts-ignore
      process.exit(0)
    }

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

    getInput()
  })
}

function printParseErrors(errors: string[]) {
  for(let i = 0; i < errors.length; i++) {
    console.log('errors: ', errors[i]);
  }
}

getInput()
