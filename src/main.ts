import LexerImpl, { Token } from "./tokenizer"
import ParserImpl from "./parser"
import { ProgramImpl } from "./ast"

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
    console.log('parser: ', parser);
    console.log('program: ', program)
    console.log('program statements: ', program.statements)
    const tokens: Token[] = []

    for (let i = 0; i < input.length; i++) {
      const tok = lexer.nextToken()
      tokens.push(tok)
      // console.log('token -> ', tok);
      if (tok.type === 'EOF') {
        break
      }
    }
    getInput()
  })
}

getInput()
