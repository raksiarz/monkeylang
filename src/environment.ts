import { Object } from "./object"

export interface Environment {
    store: Map<string, Object>
    outer: EnvironmentImpl | null
}

export function newEnclosedEnvironment(outer: EnvironmentImpl): EnvironmentImpl {
    const env = newEnviroment()
    env.outer = outer

    return env
}

function newEnviroment(): EnvironmentImpl {
    return new EnvironmentImpl(new Map<string, Object>, null)
}

class EnvironmentImpl implements Environment {
    store: Map<string, Object>
    outer: EnvironmentImpl | null

    constructor(store: Map<string, Object>, outer: EnvironmentImpl | null) {
        this.store = store
        this.outer = outer
    }

    get(name: string): Object | null {
        let obj: Object | null = this.store.get(name) ?? null

        if(!obj && this.outer !== null) {
            obj = this.outer.get(name)
        }

        return obj
    }

    set(name: string, val: Object): Object {
        this.store.set(name, val)

        return val
    }
}

export default EnvironmentImpl
