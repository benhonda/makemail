import { CommanderOptionValues, CompiledSettings, RunTimeConfig } from "../@types/types.js";
export declare function compileSettings(opts: CommanderOptionValues, env: "dev" | "prod"): Promise<CompiledSettings>;
export declare function compileRuntimeConfig(settings: CompiledSettings, env: "dev" | "prod"): Promise<RunTimeConfig>;
