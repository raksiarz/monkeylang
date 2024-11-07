import Object, * as object from "./object";
import * as evaluator from "./evaluator"

function len(...args: Object[]): Object {
    if(args.length !== 1) {
        return evaluator.newError(`wrong number of arguments, got ${args.length}, want 1`)
    }

    if(args[0].type() !== object.STRING_OBJ) {
        return evaluator.newError(`argument to 'len' not supported, got ${args[0].type()}`)
    }

    return new object.IntegerImpl((args[0] as object.StringImpl).value.length)
}

export const builtins = new Map<string, object.BulitinImpl>([
    ["len", new object.BulitinImpl(len)]
])
