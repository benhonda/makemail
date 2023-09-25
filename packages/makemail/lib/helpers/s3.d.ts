import { CompiledSettings } from "../@types/types.js";
export declare function getS3Url(settings: CompiledSettings, filePath: string): string;
export declare function uploadToS3(settings: CompiledSettings, filePath: string): Promise<string | undefined>;
export declare function existsInS3(settings: CompiledSettings, filePath: string): Promise<boolean>;
