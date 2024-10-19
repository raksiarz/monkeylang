import { ProgramImpl } from "./src/ast";

declare namespace monkeylang {
    const getAST: (input: string) => ProgramImpl | string[]
    const getEvaluated: (input: string) => string | string[] | null
}

export = monkeylang 
