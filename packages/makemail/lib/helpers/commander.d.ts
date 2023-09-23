import { RunTimeConfig, Settings } from "../@types/types.js";
export declare function compileSettings(opts: any, env: "dev" | "prod"): Promise<Settings>;
export declare function compileRuntimeConfig(settings: Settings): Promise<RunTimeConfig>;
