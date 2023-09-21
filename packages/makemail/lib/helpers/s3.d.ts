import { CLIConfig } from "../@types/types.js";
export declare function uploadToS3(filename: string, filepath: string, bucket: string, region?: string): Promise<string>;
export declare function uploadAndReplaceAssetsInFile(config: CLIConfig, file: string, html: string): Promise<string>;
