import { S3Client } from "@aws-sdk/client-s3";
import browserSync from "browser-sync";
export type EnvBool = "dev" | "prod" | boolean;
export type RunTimeFile = {
    inputPath: string;
    outputPath: string;
    inputType: "html" | "mjml" | string;
    outputType: "html" | string;
    locale?: string;
    locales?: string[];
    handlebars?: {
        context?: {
            [key: string]: any;
        };
        options?: {
            [key: string]: any;
        };
    };
};
export type RunTimeConfig = {
    env: "dev" | "prod";
    files: {
        [key: string]: RunTimeFile[];
    };
};
export interface CompiledSettings {
    verbose: boolean;
    inputFiles?: string | string[];
    baseDir: string;
    srcDir: string;
    outDir: string;
    watch: boolean;
    locales: string[];
    ignoreFiles?: string[];
    uploadFilesAndAssets: boolean;
    forceUploadFilesAndAssets: boolean;
    options: {
        deleteOutDir: boolean;
        omitDefaultLocaleFromFileName: boolean;
        viewInBrowserTag: string;
    };
    browserSync: boolean;
    browserSyncOptions: browserSync.Options;
    handlebars?: {
        context?: {
            [key: string]: any;
        };
        options?: {
            [key: string]: any;
        };
    };
    s3?: {
        client?: S3Client;
        bucket: string;
        region: string;
    };
}
export type UserSettings = {
    [K in keyof CompiledSettings]: CompiledSettings[K] extends boolean ? EnvBool : CompiledSettings[K] extends {
        [key: string]: any;
    } ? {
        [K2 in keyof CompiledSettings[K]]: CompiledSettings[K][K2] extends boolean ? EnvBool : CompiledSettings[K][K2];
    } : CompiledSettings[K];
};
export interface CommanderOptionValues {
    verbose: any;
    watch: any;
    settings: any;
    src: any;
    files: any;
    input: any;
    output: any;
    locales: any;
    deleteOutDir: any;
    browserSync: any;
    browserSyncOptions: any;
    upload: any;
    forceUpload: any;
    bucket: any;
    region: any;
    omitDefaultLocaleFromFileName: any;
    envPath: any;
    noOpen: any;
    port: any;
    startPath: any;
}
type CommanderOption = {
    flag: string;
    description?: string;
    default?: any;
};
export type ArgvConfig<T = CommanderOptionValues> = {
    [K in keyof T]: CommanderOption;
};
export type _Settings = {
    emailUrlTagName: string;
    defaultFileName: string;
    files: string[];
    _defaultIndexFile: string;
    preview?: string;
    dirs: {
        templates: string;
        assets: string;
        output: string;
    };
    overwriteOutputDir?: boolean;
    read: string[];
    watch: string[];
    browserSync?: {
        open: boolean;
    };
    handlebars?: {
        context: {
            [key: string]: any;
        };
        options: {
            [key: string]: any;
        };
    };
    s3?: {
        bucket: string;
        region?: string;
    };
    locales: string[];
    ignoreDefaultLocale?: boolean;
};
export {};
