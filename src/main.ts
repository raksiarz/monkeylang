import LexerImpl, { Token } from "./tokenizer"
import ParserImpl from "./parser"
import { evaluate } from "./evaluator"
import EnviromentImpl from "./enviroment"
import { Object } from "./object"

declare function require(name: string): any

const readline = require('readline')

const rl = readline.createInterface({
  // @ts-ignore
  input: process.stdin,
  // @ts-ignore
  output: process.stdout
})

const ENV = new EnviromentImpl(new Map<string, Object>)

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

    // for (let i = 0; i < input.length; i++) {
    //   const tok = lexer.nextToken()
    //   tokens.push(tok)
    //   // console.log('token -> ', tok);
    //   if (tok.type === 'EOF') {
    //     break
    //   }
    // }
    getInput()
  })
}

function printParseErrors(errors: string[]) {
  for(let i = 0; i < errors.length; i++) {
    console.log('errors: ', errors[i]);
  }
}

getInput()
