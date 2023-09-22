import { RunTimeConfig, Settings } from "../@types/types.js";
export declare function compileSettings(opts: any): Promise<Settings>;
export declare function compileRuntimeConfig(settings: Settings): Promise<RunTimeConfig>;
