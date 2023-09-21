export type CLIConfig = {
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
