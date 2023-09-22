import browserSync from "browser-sync";
export type RunTimeFile = {
    inputPath: string;
    outputPath: string;
    inputType: "html" | "mjml" | string;
    outputType: "html";
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
    files: {
        [key: string]: RunTimeFile[];
    };
};
export type Settings = {
    inputFiles?: string | string[];
    srcDir: string;
    outDir: string;
    watch?: boolean;
    locales?: string[];
    ignoreFiles?: string[];
    options?: {
        deleteOutDir?: boolean;
        omitDefaultLocaleFromFileName?: boolean;
    };
    browserSync?: browserSync.Options;
    handlebars?: {
        context?: {
            [key: string]: any;
        };
        options?: {
            [key: string]: any;
        };
    };
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
