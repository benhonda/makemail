export type Config = {
    _defaultIndexFile: string;
    dirs: {
        templates: string;
        assets: string;
        output: string;
    };
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
};
