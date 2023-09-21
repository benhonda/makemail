import { CLIConfig } from "../@types/types.js";
export declare function parseFrontMatter(contents: string): Promise<{
    [key: string]: any;
}>;
export declare function parseFrontMatterFromFile(inputFile: string): Promise<{
    [key: string]: any;
}>;
export declare function setLocalesInFrontmatterToConfig(config: CLIConfig, file: string): Promise<any[]>;
export declare function parseLocaleFileName(config: CLIConfig, file: string, locale: string): string;
