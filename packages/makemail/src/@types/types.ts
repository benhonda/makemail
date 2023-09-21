export type CLIConfig = {
  emailUrlTagName: string;
  defaultFileName: string;
  files: string[];
  _defaultIndexFile: string;
  preview?: string; // preview file path
  dirs: {
    templates: string;
    assets: string;
    output: string;
  };
  overwriteOutputDir?: boolean;
  read: string[];
  watch: string[];
  // watchDirs: (keyof Config["dirs"])[]; // watchDirs can be empty or the name of Config.dirs
  browserSync?: {
    open: boolean;
    // TODO: add more options
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
