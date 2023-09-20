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
};
