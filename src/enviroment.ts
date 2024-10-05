import { Object } from "./object"

export interface Enviroment {
    store: Map<string, Object>
}

class EnviromentImpl implements Enviroment {
    store: Map<string, Object>

    constructor(store: Map<string, Object>) {
        this.store = store
    }

    get(name: string): Object | null {
        const obj = this.store.get(name)
        
        return !!obj ? obj : null
    }

    set(name: string, val: Object): Object {
        this.store.set(name, val)

        return val
    }
}

export default EnviromentImpl
