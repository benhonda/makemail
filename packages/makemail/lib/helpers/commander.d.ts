import { CommanderOptionValues, CompiledSettings, RunTimeConfig, RunTimeFile } from "../@types/types.js";
export declare function compileSettings(opts: CommanderOptionValues, env: "dev" | "prod", workspace?: string): Promise<CompiledSettings>;
export declare function compileRuntimeConfig(settings: CompiledSettings, env: "dev" | "prod"): Promise<RunTimeConfig>;
export declare function recompileFrontMatterForFile(runtime: RunTimeConfig, file: RunTimeFile): Promise<void>;
