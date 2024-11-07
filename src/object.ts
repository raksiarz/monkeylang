import { BlockStatement, Identifier } from "./ast"
import EnvironmentImpl from "./environment"

type ObjectType = string

export const INTEGER_OBJ = 'INTEGER' as const
export const BOOLEAN_OBJ = 'BOOLEAN' as const
export const NULL_OBJ = 'NULL' as const
export const RETURN_VALUE_OBJ = 'RETURN_VALUE' as const
export const ERROR_OBJ = 'ERROR' as const
export const FUNCTION_OBJ = 'FUNCTION' as const
export const STRING_OBJ = 'STRING' as const
export const BUILTIN_OBJ = 'BUILTIN' as const

export default interface Object {
  type(): ObjectType
  inspect(): string
}

export interface Integer extends Object {
  value: number
}

export interface Bool extends Object {
  value: boolean
}

interface Null extends Object {}

export interface ReturnValue extends Object {
  value: Object
}

export interface Error extends Object {
  message: string
}

export interface Function extends Object {
  parameters: Identifier[]
  body: BlockStatement
  env: EnvironmentImpl
}

export interface String extends Object {
  value: string
}

type BuiltinFunction = (...args: Object[]) => Object

export interface Builtin extends Object {
  fn: BuiltinFunction
}

export class IntegerImpl implements Integer {
  value: number

  constructor(value: number) {
    this.value = value
  }

  type(): ObjectType {
    return INTEGER_OBJ
  }

  inspect(): string {
    return String(this.value)
  }
}

export class BoolImpl implements Bool {
  value: boolean 

  constructor(value: boolean) {
    this.value = value
  }

  type(): ObjectType {
    return BOOLEAN_OBJ 
  }

  inspect(): string {
    return String(this.value)
  }
}

export class NullImpl implements Null {
  constructor() {}

  type(): ObjectType {
    return NULL_OBJ
  }

  inspect(): string {
    return 'null'
  }
}

export class ReturnValueImpl implements ReturnValue {
  value: Object

  constructor(value: Object) {
    this.value = value
  }

  type(): ObjectType {
    return RETURN_VALUE_OBJ
  }

  inspect(): string {
    return this.value.inspect()
  }
}

export class ErrorImpl implements Error {
  message: string

  constructor(message: string) {
    this.message = message
  }

  type(): ObjectType {
    return ERROR_OBJ
  }

  inspect(): string {
    return "ERROR: " + this.message
  }
}

export class FunctionImpl implements Function {
  parameters: Identifier[]
  body: BlockStatement
  env: EnvironmentImpl

  constructor(parameters: Identifier[], body: BlockStatement, env: EnvironmentImpl) {
    this.parameters = parameters
    this.body = body
    this.env = env
  }

  type(): ObjectType {
    return FUNCTION_OBJ
  } 

  inspect(): string {
    let out = ''

    const params: string[] = []

    for(let i = 0; i < this.parameters.length; i++) {
      params.push(String(this.parameters[i]))
    }

    out += `fn (${params.join(', ')}) { \n${String(this.body)}\n}`

    return out
  }
}

export class StringImpl implements String {
  value: string

  constructor(value: string) {
    this.value = value
  }

  type(): ObjectType {
    return STRING_OBJ
  }

  inspect(): string {
    return this.value
  }
}

export class BulitinImpl implements Builtin {
  fn: BuiltinFunction
  
  constructor(fn: BuiltinFunction) {
    this.fn = fn
  }

  type(): ObjectType {
    return BUILTIN_OBJ
  }

  inspect(): string {
    return 'builtin function'
  }
}
