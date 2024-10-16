"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tokenizer_1 = __importDefault(require("./src/tokenizer"));
const parser_1 = __importDefault(require("./src/parser"));
const evaluator_1 = require("./src/evaluator");
const environment_1 = __importDefault(require("./src/environment"));
const readline = require('readline');
const rl = readline.createInterface({
    // @ts-ignore
    input: process.stdin,
    // @ts-ignore
    output: process.stdout
});
const ENV = new environment_1.default(new Map, null);
exports.REPL = function () {
    rl.question('>> ', function (input) {
        if (input === ':q') {
            // @ts-ignore
            process.exit(0);
        }
        const lexer = new tokenizer_1.default(input);
        const parser = new parser_1.default(lexer);
        const program = parser.parseProgram();
        if (parser.errors.length !== 0) {
            printParseErrors(parser.errors);
        }
        const evaluated = (0, evaluator_1.evaluate)(program, ENV);
        if (!!evaluated) {
            console.log(evaluated.inspect());
        }
        // for (let i = 0; i < input.length; i++) {
        //   const tok = lexer.nextToken()
        //   tokens.push(tok)
        //   // console.log('token -> ', tok);
        //   if (tok.type === 'EOF') {
        //     break
        //   }
        // }
        getInput();
    });
};
function printParseErrors(errors) {
    for (let i = 0; i < errors.length; i++) {
        console.log('errors: ', errors[i]);
    }
}
