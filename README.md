## Monkey lang
Monkey lang is simple langue implemented in TS following "Writing an interpreter in GO" by Thorsten Ball.

### Features
- tokenizer
- parser
- evaluator (WiP)
- simple REPL

### Getting started
To run the REPL first in command line run `npm run build` and after that run `npm run start`

### Language overview

## Binding values to name
`let age = 1;`
`let name = "Monkey";`
`let result = 10 * (10 / 2);`

Let statement can be also used to bind functions

`let add = fn(a, b) { return a + b };`

## Arrays
`let arr = [1, 2, 3, 4];`

## Hash
`let obj = { "name": "Ben", "age": 32 };`

## Accessing elements
`arr[0] // => 1`
`obj["name"] // => "Ben"`

## Function calls
`add(1, 2);`



