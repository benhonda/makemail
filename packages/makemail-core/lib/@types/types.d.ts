export type Config = {
    _defaultIndexFile: string;
    preview?: string;
    dirs: {
        templates: string;
        assets: string;
        output: string;
    };
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
    locales?: string[];
};
