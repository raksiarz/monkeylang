type ObjectType = string

export const INTEGER_OBJ = 'INTEGER' as const
export const BOOLEAN_OBJ = 'BOOLEAN' as const
export const NULL_OBJ = 'NULL' as const
export const RETURN_VALUE_OBJ = 'RETURN_VALUE' as const

export interface Object {
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
