import { ProgramImpl } from "./src/ast";

declare namespace monkeylang {
    const getAST: (input: string) => ProgramImpl 
    const getEvaluated: (input: string) => string | null
}

export = monkeylang 
