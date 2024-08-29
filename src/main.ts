import LexerImpl, { Token } from "./tokenizer"
import ParserImpl from "./parser"
import { evaluate } from "./evaluator"

declare function require(name: string): any

const readline = require('readline')

const rl = readline.createInterface({
  // @ts-ignore
  input: process.stdin,
  // @ts-ignore
  output: process.stdout
})


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

    console.log('program: ', typeof(program))
    const evaluated = evaluate(program)
    console.log('eval: ', evaluated)

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
